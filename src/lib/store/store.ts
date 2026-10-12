import type { Claim, Item, ItemImage, KudosTone, ClaimStatus, ModerationState, PaymentMethod, ReportStatus, ReportTarget } from "../types";
import { MEMBER_KEY } from "../member-hint";
import { DEFAULT_NEAR_LOCATION, EMPTY_STATE, buildWorld, type State, type World } from "../world";
import { emit, toast } from "./events";
import { ActionError, applyAction, type ActionArgs, type ActionName, type ActionResult, type MessageInput, type NewItemInput, type ProfilePatch } from "./reducer";

export type { NewItemInput, ProfilePatch } from "./reducer";

/**
 * The browser's copy of the world.
 *
 * The API (worker/) owns the data. This module keeps the slice the signed-in member may see, refreshes
 * it in the background, and applies the member's own actions to it straight away — the same functions
 * the server runs (reducer.ts) — so screens never wait on the network. Each action is then sent to the
 * API; its answer replaces the local copy, and anything it refuses is undone with a message.
 */

interface Pending {
  name: ActionName;
  args: unknown;
  nonce: string;
}

const CACHE_KEY = "wwfi:world:v1";
const PENDING_KEY = "wwfi:pending:v1";
const NEAR_KEY = "wwfi:near";

/** The last copy the API sent, and its revision. */
let confirmed: State = EMPTY_STATE;
let rev = -1;
/** Actions applied here that the API hasn't answered yet, oldest first. */
let pending: Pending[] = [];
/** `confirmed` with `pending` applied on top — what screens read. */
let state: State = EMPTY_STATE;

let loaded = false;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): State {
  ensureLoaded();
  return state;
}

export function getServerState(): State {
  return EMPTY_STATE;
}

export function getWorld(): World {
  return buildWorld(getState());
}

/* ── Local copy ───────────────────────────────────────────── */

function nearLocation(): string {
  try {
    return window.localStorage.getItem(NEAR_KEY) || DEFAULT_NEAR_LOCATION;
  } catch {
    return DEFAULT_NEAR_LOCATION;
  }
}

/** Start from the copy saved by the last visit, so pages paint with content while the API is asked. */
function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const saved = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "null") as { rev: number; view: State } | null;
    if (saved && typeof saved.rev === "number") {
      rev = saved.rev;
      confirmed = { ...EMPTY_STATE, ...saved.view, ready: true };
    }
    // Actions a page change interrupted before the API answered. They are replayed here and sent again;
    // the API recognises one it already carried out, so nothing happens twice.
    const unsent = JSON.parse(window.sessionStorage.getItem(PENDING_KEY) ?? "[]") as Pending[];
    if (Array.isArray(unsent)) pending = unsent;
  } catch {
    /* private mode or an unreadable copy — the API will fill it in */
  }
  rebase();
  if (pending.length) void flush();
}

/** Opening a listing or a conversation is a full page load, so unanswered actions must outlive the page. */
function savePending() {
  try {
    if (pending.length) window.sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
    else window.sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* too large to keep (photos) or storage unavailable — they are still sent from this page */
  }
}

function saveCopy() {
  try {
    // First, and on its own: it is what the next visit reads before anything is drawn (see member-hint).
    if (confirmed.sessionUserId) window.localStorage.setItem(MEMBER_KEY, "1");
    else window.localStorage.removeItem(MEMBER_KEY);
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({ rev, view: confirmed }));
  } catch {
    /* storage full or unavailable — the copy is only a head start */
  }
}

/** Rebuild what screens read: the confirmed copy with every unanswered action replayed on top. */
function rebase() {
  let next: State = { ...confirmed, nearLocationId: nearLocation() };
  for (const p of pending) {
    try {
      next = applyAction(next, p.name, p.args as never, { nowMs: Date.now(), nonce: p.nonce, strict: false }).state;
    } catch {
      /* no longer applies to the newer copy — the API's answer will settle it */
    }
  }
  state = next;
  notify();
}

function adopt(next: { rev: number; view?: Omit<State, "ready" | "nearLocationId"> }) {
  rev = next.rev;
  if (next.view) confirmed = { ...EMPTY_STATE, ...next.view, ready: true };
  saveCopy();
  rebase();
}

/* ── Talking to the API ───────────────────────────────────── */

let refreshing: Promise<void> | null = null;

async function fetchWorld(full: boolean) {
  try {
    // "I hold revision N, as member M" — the API then only sends a copy if either has changed.
    const have = !full && rev >= 0 ? `?have=${rev}&as=${confirmed.sessionUserId ?? ""}` : "";
    const res = await fetch(`/api/world${have}`, { credentials: "same-origin" });
    if (!res.ok) throw new Error(`world ${res.status}`);
    const body = (await res.json()) as { rev: number; view?: State };
    // An answer that raced with one of our own actions is older than what that action will return.
    if (!pending.length || full) adopt(body);
  } catch {
    // Unreachable API: show what we have (nothing, on a first visit) rather than a spinner forever.
    if (!confirmed.ready) {
      confirmed = { ...confirmed, ready: true };
      rebase();
    }
  }
}

/**
 * Ask the API for the current copy. `full` re-reads everything even if nothing changed — needed when
 * the signed-in member changes, since each member sees a different slice.
 */
export function refreshWorld(full = false): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  ensureLoaded();
  if (refreshing && !full) return refreshing;
  const job = fetchWorld(full).finally(() => {
    if (refreshing === job) refreshing = null;
  });
  refreshing = job;
  return job;
}

/** Forget this browser's copy — on log-out, so the next person on this device starts clean. */
export function forgetWorld() {
  for (const p of pending) answer(p, false);
  pending = [];
  savePending();
  rev = -1;
  confirmed = { ...EMPTY_STATE, ready: confirmed.ready };
  try {
    window.localStorage.removeItem(CACHE_KEY);
    window.localStorage.removeItem(MEMBER_KEY);
  } catch {
    /* nothing to forget */
  }
  rebase();
}

let syncing = false;

/** Keep the copy fresh while the tab is in view. Conversations refresh faster than the rest. */
export function startSync() {
  if (syncing || typeof window === "undefined") return;
  syncing = true;
  void refreshWorld();
  let last = Date.now();
  setInterval(() => {
    if (document.visibilityState !== "visible" || pending.length) return;
    const every = window.location.pathname.startsWith("/messages") ? 4_000 : 20_000;
    if (Date.now() - last < every) return;
    last = Date.now();
    void refreshWorld();
  }, 2_000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") void refreshWorld();
  });
}

const uploaded = new Map<string, Promise<string>>();

/** Photos are picked as inline data; the API stores only uploaded ones. */
function upload(dataUrl: string): Promise<string> {
  let job = uploaded.get(dataUrl);
  if (!job) {
    job = (async () => {
      const blob = await (await fetch(dataUrl)).blob();
      const res = await fetch("/api/upload", { method: "POST", credentials: "same-origin", headers: { "Content-Type": blob.type }, body: blob });
      const body = (await res.json().catch(() => ({}))) as { src?: string; message?: string };
      if (!res.ok || !body.src) throw new ActionError("invalid", body.message ?? "That photo couldn't be uploaded.");
      return body.src;
    })();
    uploaded.set(dataUrl, job);
    job.catch(() => uploaded.delete(dataUrl));
  }
  return job;
}

async function withUploads(value: unknown): Promise<unknown> {
  if (typeof value === "string") return value.startsWith("data:image/") ? upload(value) : value;
  if (Array.isArray(value)) return Promise.all(value.map(withUploads));
  if (value && typeof value === "object") {
    const entries = await Promise.all(Object.entries(value).map(async ([k, v]) => [k, await withUploads(v)] as const));
    return Object.fromEntries(entries);
  }
  return value;
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function send(p: Pending): Promise<void> {
  const body = JSON.stringify({ name: p.name, args: await withUploads(p.args), nonce: p.nonce });
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      // keepalive lets a request that is already on its way finish even if the page is left (browsers cap its size).
      res = await fetch("/api/action", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body, keepalive: body.length < 60_000 });
    } catch (err) {
      // Offline or a dropped connection: the action may not have arrived, so it is safe to repeat.
      if (attempt >= 3) throw err;
      await wait(800 * 2 ** attempt);
      continue;
    }
    // 503: the API was too busy to take it. Nothing was saved, so it is safe to repeat.
    if (res.status === 503 && attempt < 3) {
      await wait(800 * 2 ** attempt);
      continue;
    }
    const answer = (await res.json().catch(() => ({}))) as { rev?: number; view?: State; code?: ActionError["code"]; message?: string };
    if (!res.ok || typeof answer.rev !== "number") throw new ActionError(answer.code ?? "invalid", answer.message ?? "That didn't go through. Please try again.");
    pending = pending.filter((x) => x !== p);
    savePending();
    adopt({ rev: answer.rev, view: answer.view });
    return;
  }
}

let flushing = false;

/** Screens waiting to hear whether the API took an action, by nonce (see `run`). */
const waiting = new Map<string, (saved: boolean) => void>();

function answer(p: Pending, saved: boolean) {
  waiting.get(p.nonce)?.(saved);
  waiting.delete(p.nonce);
}

/** Send unanswered actions one at a time, in the order they were made. */
async function flush() {
  if (flushing) return;
  flushing = true;
  try {
    while (pending.length) {
      const p = pending[0];
      try {
        await send(p);
        answer(p, true);
      } catch (err) {
        // Refused or undeliverable: undo it here, and whatever was built on top of it.
        pending = pending.filter((x) => x !== p);
        savePending();
        rebase();
        toast(err instanceof ActionError ? err.message : "We couldn't save that. Check your connection and try again.", { tone: "error" });
        if (!(err instanceof ActionError)) void refreshWorld(true);
        answer(p, false);
      }
    }
  } finally {
    flushing = false;
  }
}

const nonce = () => Array.from(crypto.getRandomValues(new Uint8Array(10)), (b) => (b % 36).toString(36)).join("");

/**
 * Do something as the signed-in member: apply it here now, send it to the API in the background.
 * Returns the action's result, or `null` (after telling the member why) if it isn't allowed.
 * `saved` is for the few screens that leave right afterwards: it settles once the API has answered.
 */
function run<N extends ActionName>(name: N, args: ActionArgs<N>): { result: ActionResult<N>; saved: Promise<boolean> } | null {
  ensureLoaded();
  const p: Pending = { name, args, nonce: nonce() };
  try {
    const applied = applyAction(state, name, args, { nowMs: Date.now(), nonce: p.nonce, strict: false });
    pending.push(p);
    savePending();
    state = applied.state;
    notify();
    for (const e of applied.events) emit(e);
    const saved = new Promise<boolean>((resolve) => waiting.set(p.nonce, resolve));
    void flush();
    return { result: applied.result, saved };
  } catch (err) {
    if (!(err instanceof ActionError)) throw err;
    toast(err.message, err.code === "unauthorized" ? { tone: "info", href: "/login" } : { tone: "error" });
    return null;
  }
}

/* ── Public actions ───────────────────────────────────────── */

export const actions = {
  updateProfile(patch: ProfilePatch) {
    run("updateProfile", patch);
  },

  /** A preference of this browser — it isn't sent to the API. */
  setNearLocation(locationId: string) {
    try {
      window.localStorage.setItem(NEAR_KEY, locationId);
    } catch {
      /* it still applies for this visit */
    }
    state = { ...state, nearLocationId: locationId };
    notify();
  },

  /* Listings */
  createItem(input: NewItemInput): Item | null {
    return run("createItem", input)?.result ?? null;
  },

  /** Save changes to your own live listing. Settles once the API has answered: `true` if it took them. */
  updateItem(itemId: string, input: NewItemInput): Promise<boolean> {
    return run("updateItem", { itemId, input })?.saved ?? Promise.resolve(false);
  },

  toggleLike(itemId: string) {
    if (!getState().sessionUserId) return false;
    run("toggleLike", { itemId });
    return true;
  },

  toggleSave(itemId: string) {
    const done = run("toggleSave", { itemId });
    if (done) toast(done.result ? "Saved to your list" : "Removed from saved", { tone: "info" });
  },

  toggleFollow(userId: string) {
    const done = run("toggleFollow", { userId });
    if (done) toast(done.result ? "Following" : "Unfollowed", { tone: "info" });
  },

  blockUser(userId: string) {
    if (run("blockUser", { userId })) toast("User blocked", { body: "They can no longer message you.", tone: "info" });
  },

  /**
   * Mark your listing reunited. `counterpartId` is the other party (finder for lost items, the person who lost it for found ones).
   * Any bounty is settled directly between the two of you; `paidVia` records how you paid it.
   */
  resolveItem(itemId: string, counterpartId?: string, paidVia?: PaymentMethod) {
    run("resolveItem", { itemId, counterpartId, paidVia });
  },

  /* Moderation */
  setModeration(itemId: string, moderation: ModerationState) {
    run("setModeration", { itemId, moderation });
  },

  setSuspended(userId: string, suspended: boolean) {
    run("setSuspended", { userId, suspended });
  },

  setReportStatus(reportId: string, status: ReportStatus) {
    run("setReportStatus", { reportId, status });
  },

  /** Moderator override on a bounty claim (flag as suspicious, reject, or reopen the bounty). */
  setClaimStatus(claimId: string, status: ClaimStatus, note?: string) {
    run("setClaimStatus", { claimId, status, note });
  },

  submitReport(input: { targetType: ReportTarget; targetId: string; reason: string; detail?: string }) {
    if (run("submitReport", input)) toast("Report sent", { body: "Thanks — our moderators will review it shortly.", tone: "info" });
  },

  /* Bounty claims */
  submitClaim(input: { itemId: string; message: string; proof: ItemImage[] }): Claim | null {
    return run("submitClaim", input)?.result ?? null;
  },

  respondClaim(claimId: string, decision: "approve" | "reject" | "more_info", note?: string) {
    run("respondClaim", { claimId, decision, note });
  },

  /* Chat */
  startConversation(itemId: string): string | null {
    return run("startConversation", { itemId })?.result ?? null;
  },

  sendMessage(convId: string, message: MessageInput) {
    run("sendMessage", { convId, message });
  },

  markConversationRead(convId: string) {
    const s = getState();
    const conv = s.conversations[convId];
    const me = s.sessionUserId;
    const last = conv?.messages[conv.messages.length - 1];
    if (!me || !conv || !last || (conv.readAt[me] && Date.parse(conv.readAt[me]) >= Date.parse(last.at))) return;
    run("markConversationRead", { convId });
  },

  /** "Item returned" quick action from inside a conversation. `paidVia` is how the owner paid any bounty. */
  markReturned(convId: string, paidVia?: PaymentMethod) {
    const done = run("markReturned", { convId, paidVia });
    if (done && !done.result) toast("Waiting for the owner to confirm", { body: "They'll tap “Mark as received” once they have it.", tone: "info" });
  },

  /** The owner of a lost item confirms a found listing matches. Rewards the finder. */
  confirmMatch(lostItemId: string, foundItemId: string): string | null {
    const s = getState();
    const finder = s.users[s.items[foundItemId]?.ownerId ?? ""];
    const done = run("confirmMatch", { lostItemId, foundItemId });
    if (!done) return null;
    toast("Match confirmed 🎯", { body: `${finder?.name.split(" ")[0] ?? "The finder"} has been notified.`, tone: "celebrate" });
    return done.result;
  },

  /* Kudos */
  sendKudos(input: { toUserId: string; tone: KudosTone; message: string; itemId?: string }) {
    if (run("sendKudos", input)) toast("Thank you sent ❤️", { body: "Your kudos will appear on their profile.", tone: "celebrate" });
  },

  /* Notifications */
  markNotificationRead(id: string) {
    const n = getState().notifications[id];
    if (!n || n.read) return;
    run("markNotificationRead", { id });
  },

  markAllNotificationsRead() {
    const s = getState();
    if (!Object.values(s.notifications).some((n) => n.userId === s.sessionUserId && !n.read)) return;
    run("markAllNotificationsRead", undefined);
  },
};
