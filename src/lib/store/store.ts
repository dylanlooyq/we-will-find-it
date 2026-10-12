import { DAY, DEMO_NOW } from "../clock";
import { earnedBadgeIds } from "../badges";
import { getLocation } from "../data/taxonomy";
import { slugify, formatMoney } from "../format";
import { levelFor, POINTS_BY_KIND } from "../levels";
import { mockMatchingService, otherItemId } from "../matching";
import type {
  AppNotification,
  Bounty,
  CategoryId,
  Claim,
  ClaimStatus,
  Conversation,
  IdentifyingDetail,
  Item,
  ItemImage,
  ItemType,
  KudosTone,
  Message,
  MessageKind,
  ModerationState,
  NotificationType,
  PetDetails,
  PointsKind,
  Report,
  ReportStatus,
  ReportTarget,
  User,
} from "../types";
import { EMPTY_OVERLAY, buildWorld, type Overlay, type World } from "../world";
import { emit, toast, type AppEvent } from "./events";
import { pickReply } from "./reply-bot";

/**
 * Demo state store.
 *
 * Holds the *overlay* of local changes on top of the seed world and persists
 * it to localStorage. Every mutation goes through `commit()`, which clones
 * the overlay, applies a recipe, then diffs the session user's points,
 * level and badges so celebratory UI fires automatically.
 *
 * Swap this file for API calls when a backend exists — the hook signatures
 * in `hooks.ts` and the action names below are the contract.
 */

const STORAGE_KEY = "wwfi:demo:v1";

let state: Overlay = EMPTY_OVERLAY;
let loaded = false;
const listeners = new Set<() => void>();

/* ── Persistence ──────────────────────────────────────────── */

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Overlay;
      if (parsed?.version === 1) state = { ...EMPTY_OVERLAY, ...parsed };
    }
  } catch {
    /* private mode / corrupt data — start fresh */
  }
  if (state.clockStart == null) state = { ...state, clockStart: Date.now() };
}

let persistTimer: ReturnType<typeof setTimeout> | undefined;
let persistPending = false;

function writeState() {
  persistPending = false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota exceeded (large uploaded photos). Retry without inline images.
    try {
      const slim = JSON.parse(JSON.stringify(state), (k, v) => (k === "src" && typeof v === "string" && v.length > 2000 ? undefined : v));
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {
      /* give up silently — the session still works in memory */
    }
  }
}

function persist() {
  if (typeof window === "undefined") return;
  clearTimeout(persistTimer);
  persistPending = true;
  persistTimer = setTimeout(writeState, 250);
}

// A full page load can start inside the debounce window (e.g. on a static host, pages created during the
// session are served by the 404 fallback), so write any pending change on the way out.
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (!persistPending) return;
    clearTimeout(persistTimer);
    writeState();
  });
}

function notify() {
  for (const fn of listeners) fn();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState(): Overlay {
  ensureLoaded();
  return state;
}

export function getServerState(): Overlay {
  return EMPTY_OVERLAY;
}

export function getWorld(): World {
  return buildWorld(getState());
}

/** The demo clock: DEMO_NOW plus real time elapsed since the demo started. */
export function demoNowMs(): number {
  ensureLoaded();
  return state.clockStart == null ? DEMO_NOW : DEMO_NOW + (Date.now() - state.clockStart);
}

/* ── Helpers ──────────────────────────────────────────────── */

const uid = (prefix: string) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

interface Ctx {
  nowMs: number;
  nowIso: string;
  events: AppEvent[];
}

type Draft = Overlay;

function userDraft(d: Draft, w: World, id: string): User | undefined {
  if (!d.users[id]) {
    const u = w.userById.get(id);
    if (!u) return undefined;
    d.users[id] = structuredClone(u);
  }
  return d.users[id];
}

function itemDraft(d: Draft, w: World, id: string): Item | undefined {
  if (!d.items[id]) {
    const it = w.itemById.get(id);
    if (!it) return undefined;
    d.items[id] = structuredClone(it);
  }
  return d.items[id];
}

function bountyDraft(d: Draft, w: World, id: string): Bounty | undefined {
  if (!d.bounties[id]) {
    const b = w.bountyById.get(id);
    if (!b) return undefined;
    d.bounties[id] = structuredClone(b);
  }
  return d.bounties[id];
}

function claimDraft(d: Draft, w: World, id: string): Claim | undefined {
  if (!d.claims[id]) {
    const c = w.claimById.get(id);
    if (!c) return undefined;
    d.claims[id] = structuredClone(c);
  }
  return d.claims[id];
}

function convDraft(d: Draft, w: World, id: string): Conversation | undefined {
  if (!d.conversations[id]) {
    const c = w.conversationById.get(id);
    if (!c) return undefined;
    d.conversations[id] = structuredClone(c);
  }
  return d.conversations[id];
}

function reportDraft(d: Draft, w: World, id: string): Report | undefined {
  if (!d.reports[id]) {
    const r = w.reports.find((x) => x.id === id);
    if (!r) return undefined;
    d.reports[id] = structuredClone(r);
  }
  return d.reports[id];
}

function pushNote(
  d: Draft,
  ctx: Ctx,
  n: { userId: string; type: NotificationType; title: string; body?: string; href: string; itemId?: string },
) {
  const id = uid("ntf");
  const note: AppNotification = { id, at: ctx.nowIso, read: false, ...n };
  d.notifications[id] = note;
}

function addMessage(
  d: Draft,
  ctx: Ctx,
  conv: Conversation,
  senderId: string,
  m: { kind: MessageKind; text?: string; photo?: ItemImage; locationId?: string },
  atMs = ctx.nowMs,
) {
  const msg: Message = { id: uid("msg"), conversationId: conv.id, senderId, at: new Date(atMs).toISOString(), ...m };
  conv.messages.push(msg);
  if (senderId === d.sessionUserId) conv.readAt[senderId] = msg.at;
  return msg;
}

function findConversation(w: World, itemId: string, a: string, b: string): Conversation | undefined {
  return w.conversations.find((c) => c.itemId === itemId && c.participantIds.includes(a) && c.participantIds.includes(b));
}

function ensureConversation(d: Draft, w: World, itemId: string, a: string, b: string): Conversation {
  const existing = findConversation(w, itemId, a, b);
  if (existing) return convDraft(d, w, existing.id)!;
  const conv: Conversation = { id: uid("conv"), itemId, participantIds: [b, a], messages: [], readAt: {} };
  d.conversations[conv.id] = conv;
  return conv;
}

function uniqueSlug(w: World, base: string): string {
  let slug = base || "listing";
  let n = 2;
  while (w.itemBySlug.has(slug)) slug = `${base}-${n++}`;
  return slug;
}

function awardPoints(d: Draft, w: World, ctx: Ctx, userId: string, kind: PointsKind, label: string, itemId?: string) {
  const u = userDraft(d, w, userId);
  if (!u) return 0;
  const pts = POINTS_BY_KIND[kind];
  u.points.allTime += pts;
  u.points.season += pts;
  u.points.month += pts;
  d.points.push({ id: uid("pt"), userId, kind, points: pts, label, at: ctx.nowIso, itemId });
  if (userId === d.sessionUserId) ctx.events.push({ type: "points", points: pts, label, total: u.points.allTime });
  return pts;
}

function rewardSnapshot(w: World, userId: string | null) {
  const u = userId ? w.userById.get(userId) : undefined;
  if (!u) return null;
  return { badges: new Set(earnedBadgeIds(u)), level: levelFor(u.points.allTime).level };
}

/** Apply a recipe to a cloned overlay, commit it, then fire reward events. */
function commit(recipe: (d: Draft, w: World, ctx: Ctx) => void) {
  const w = getWorld();
  const before = rewardSnapshot(w, state.sessionUserId);
  const d: Draft = structuredClone(state);
  const nowMs = demoNowMs();
  const ctx: Ctx = { nowMs, nowIso: new Date(nowMs).toISOString(), events: [] };
  recipe(d, w, ctx);
  state = d;
  persist();
  notify();

  const after = rewardSnapshot(getWorld(), state.sessionUserId);
  if (before && after) {
    for (const id of after.badges) if (!before.badges.has(id)) ctx.events.push({ type: "badge", badgeId: id });
    if (after.level > before.level) ctx.events.push({ type: "level", level: levelFor(getWorld().currentUser?.points.allTime ?? 0) });
  }
  for (const e of ctx.events) emit(e);
}

/* ── Timers (simulated counterparties) ────────────────────── */

const replyTimers = new Map<string, ReturnType<typeof setTimeout>>();
const typingListeners = new Set<() => void>();
const NO_TYPING: ReadonlySet<string> = new Set<string>();
let typing: ReadonlySet<string> = NO_TYPING;

function setTyping(convId: string, on: boolean) {
  const next = new Set(typing);
  if (on) next.add(convId);
  else next.delete(convId);
  typing = next;
  for (const fn of typingListeners) fn();
}
export const typingStore = {
  subscribe(fn: () => void) {
    typingListeners.add(fn);
    return () => typingListeners.delete(fn);
  },
  get: () => typing,
  getServer: (): ReadonlySet<string> => NO_TYPING,
};

function scheduleReply(convId: string) {
  clearTimeout(replyTimers.get(convId));
  const w = getWorld();
  const conv = w.conversationById.get(convId);
  const me = state.sessionUserId;
  if (!conv || !me) return;
  const otherId = conv.participantIds.find((p) => p !== me);
  const item = w.itemById.get(conv.itemId);
  if (!otherId || !item || item.status === "resolved") return;

  const startTyping = setTimeout(() => setTyping(convId, true), 700);
  const t = setTimeout(
    () => {
      clearTimeout(startTyping);
      const w2 = getWorld();
      const c2 = w2.conversationById.get(convId);
      const last = c2?.messages[c2.messages.length - 1];
      setTyping(convId, false);
      if (!c2 || !last || last.senderId !== me) return;
      const reply = pickReply(c2, last, item.type === "lost");
      if (!reply) return;
      commit((d, w3, ctx) => {
        const conv3 = convDraft(d, w3, convId);
        if (conv3) addMessage(d, ctx, conv3, otherId, { kind: "text", text: reply });
      });
    },
    2000 + (convId.length % 5) * 250,
  );
  replyTimers.set(convId, t);
}

/* ── Public actions ───────────────────────────────────────── */

export interface NewItemInput {
  type: ItemType;
  title: string;
  description: string;
  category: CategoryId;
  images: ItemImage[];
  locationId: string;
  locationNote?: string;
  occurredAt: string;
  timeLabel: string;
  details: IdentifyingDetail[];
  pet?: PetDetails;
  bountyAmount?: number;
}

/** The signed-in account, as the accounts API (worker/auth.ts) reports it. */
export interface AuthAccount {
  id: string;
  name: string;
  emailVerified: boolean;
}

export interface ProfilePatch {
  name?: string;
  handle?: string;
  homeArea?: User["homeArea"];
  bio?: string;
  hue?: number;
  avatarSrc?: string;
}

export const actions = {
  /* Session */
  login(userId: string) {
    const w = getWorld();
    const u = w.userById.get(userId);
    if (!u) return;
    commit((d) => {
      d.sessionUserId = userId;
    });
    toast(`Welcome back, ${u.name.split(" ")[0]}`, { tone: "info" });
  },

  logout() {
    commit((d) => {
      d.sessionUserId = null;
    });
    toast("You've been logged out", { tone: "info" });
  },

  /**
   * Make the signed-in account the session user, creating its profile the first time it is seen in
   * this browser. `null` means nobody is really signed in: a profile that belongs to an account is
   * signed out, while a demo persona is left alone.
   */
  syncAuth(account: AuthAccount | null) {
    const w = getWorld();
    const current = w.currentUser;
    if (!account) {
      if (current?.authId) {
        commit((d) => {
          d.sessionUserId = null;
        });
      }
      return;
    }
    if (current?.authId === account.id && current.verified === account.emailVerified) return;
    const existing = w.users.find((u) => u.authId === account.id);
    commit((d, w, ctx) => {
      if (existing) {
        const me = userDraft(d, w, existing.id);
        if (me) me.verified = account.emailVerified;
        d.sessionUserId = existing.id;
        return;
      }
      const { name } = account;
      const first = slugify(name.split(" ")[0]) || "member";
      let handle = first;
      let n = 2;
      while (w.userByHandle.has(handle) || Object.values(d.users).some((u) => u.handle === handle)) handle = `${first}${n++}`;
      const parts = name.trim().split(/\s+/);
      const display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0] || "Member";
      const newId = `u_${handle}`;
      let hue = 0;
      for (const ch of name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
      d.users[newId] = {
        id: newId,
        authId: account.id,
        handle,
        name: display,
        hue,
        bio: "",
        homeArea: "city",
        memberSince: ctx.nowIso,
        verified: account.emailVerified,
        profileComplete: false,
        rating: 0,
        reviews: 0,
        stats: { itemsFound: 0, itemsLost: 0, itemsReturned: 0, bountyReturns: 0, areasHelped: 0, helpedThisMonth: 0, electronicsReturned: 0, responseMinutes: 999 },
        points: { allTime: 0, season: 0, month: 0 },
        badges: [],
        areaPoints: {},
        role: "member",
      };
      d.sessionUserId = newId;
    });
  },

  updateProfile(patch: ProfilePatch) {
    commit((d, w, ctx) => {
      const me = d.sessionUserId && userDraft(d, w, d.sessionUserId);
      if (!me) return;
      if (patch.name) me.name = patch.name;
      if (patch.handle) me.handle = slugify(patch.handle) || me.handle;
      if (patch.homeArea) me.homeArea = patch.homeArea;
      if (patch.bio !== undefined) me.bio = patch.bio;
      if (patch.hue !== undefined) me.hue = patch.hue;
      if (patch.avatarSrc) me.avatarSrc = patch.avatarSrc;
      if (!me.profileComplete && me.name && me.bio) {
        me.profileComplete = true;
        awardPoints(d, w, ctx, me.id, "profile_complete", "Completed your profile");
      }
    });
  },

  setNearLocation(locationId: string) {
    commit((d) => {
      d.nearLocationId = locationId;
    });
  },

  /* Listings */
  createItem(input: NewItemInput): Item | null {
    let created: Item | null = null;
    commit((d, w, ctx) => {
      const me = d.sessionUserId && userDraft(d, w, d.sessionUserId);
      if (!me) return;
      const slug = uniqueSlug(w, slugify(`${input.title} ${getLocation(input.locationId).name}`));
      const id = `itm_${slug.replace(/-/g, "_")}`;
      let bountyId: string | undefined;
      if (input.bountyAmount && input.bountyAmount > 0) {
        bountyId = `bty_${slug.replace(/-/g, "_")}`;
        d.bounties[bountyId] = {
          id: bountyId,
          itemId: id,
          amount: Math.round(input.bountyAmount),
          currency: "SGD",
          status: "open",
          createdAt: ctx.nowIso,
          expiresAt: new Date(ctx.nowMs + 30 * DAY).toISOString(),
        };
      }
      const item: Item = {
        id,
        slug,
        type: input.type,
        status: "active",
        moderation: "ok",
        title: input.title.trim(),
        description: input.description.trim(),
        category: input.category,
        images: input.images,
        locationId: input.locationId,
        locationNote: input.locationNote?.trim() || undefined,
        occurredAt: input.occurredAt,
        timeLabel: input.timeLabel,
        postedAt: ctx.nowIso,
        ownerId: me.id,
        bountyId,
        details: input.details,
        pet: input.pet,
        likes: 0,
        comments: 0,
        views: 0,
      };
      d.items[id] = item;
      created = item;

      if (input.type === "found") {
        me.stats.itemsFound += 1;
        awardPoints(d, w, ctx, me.id, "post_found", `Posted a found item · ${item.title}`, id);
      } else {
        me.stats.itemsLost += 1;
      }

      // Tell the owners of strongly-matching listings
      for (const m of mockMatchingService.getMatches(item, w.items)) {
        if (m.score < 70) continue;
        const other = w.itemById.get(otherItemId(m, item));
        if (!other || other.ownerId === me.id) continue;
        pushNote(d, ctx, {
          userId: other.ownerId,
          type: "match",
          title: `🎯 New potential match for your ${other.type} ${other.title.split("—")[0].trim()}`,
          body: `${item.title} near ${getLocation(item.locationId).name} · ${m.score}% match.`,
          href: `/item/${slug}`,
          itemId: id,
        });
      }
    });
    return created;
  },

  toggleLike(itemId: string) {
    const me = state.sessionUserId;
    if (!me) return false;
    commit((d, w) => {
      const list = (d.likes[me] ??= []);
      const i = list.indexOf(itemId);
      const it = itemDraft(d, w, itemId);
      if (i >= 0) {
        list.splice(i, 1);
        if (it) it.likes = Math.max(0, it.likes - 1);
      } else {
        list.push(itemId);
        if (it) it.likes += 1;
      }
    });
    return true;
  },

  toggleSave(itemId: string) {
    const me = state.sessionUserId;
    if (!me) return false;
    let saved = false;
    commit((d) => {
      const list = (d.saves[me] ??= []);
      const i = list.indexOf(itemId);
      if (i >= 0) list.splice(i, 1);
      else {
        list.push(itemId);
        saved = true;
      }
    });
    toast(saved ? "Saved to your list" : "Removed from saved", { tone: "info" });
    return true;
  },

  toggleFollow(userId: string) {
    const me = state.sessionUserId;
    if (!me || me === userId) return;
    let following = false;
    commit((d) => {
      const list = (d.follows[me] ??= []);
      const i = list.indexOf(userId);
      if (i >= 0) list.splice(i, 1);
      else {
        list.push(userId);
        following = true;
      }
    });
    toast(following ? "Following" : "Unfollowed", { tone: "info" });
  },

  blockUser(userId: string) {
    const me = state.sessionUserId;
    if (!me) return;
    commit((d) => {
      const list = (d.blocked[me] ??= []);
      if (!list.includes(userId)) list.push(userId);
    });
    toast("User blocked", { body: "They can no longer message you.", tone: "info" });
  },

  addComment(itemId: string) {
    commit((d, w) => {
      const it = itemDraft(d, w, itemId);
      if (it) it.comments += 1;
    });
  },

  /** Mark a listing reunited. `counterpartId` is the other party (finder for lost items, loser for found ones). */
  resolveItem(itemId: string, counterpartId?: string) {
    commit((d, w, ctx) => {
      const item = itemDraft(d, w, itemId);
      if (!item || item.status === "resolved") return;
      item.status = "resolved";
      item.resolvedAt = ctx.nowIso;

      const finderId = item.type === "lost" ? counterpartId : item.ownerId;
      const loserId = item.type === "lost" ? item.ownerId : counterpartId;
      item.resolvedWithUserId = item.type === "lost" ? finderId : loserId;

      const bounty = item.bountyId ? bountyDraft(d, w, item.bountyId) : undefined;
      if (bounty) {
        bounty.status = "released";
        for (const c of w.claims.filter((c) => c.itemId === item.id && c.claimantId === finderId)) {
          const cd = claimDraft(d, w, c.id);
          if (cd) cd.status = "received";
        }
      }

      if (finderId) {
        const f = userDraft(d, w, finderId);
        if (f) {
          const area = getLocation(item.locationId).area;
          const isNewArea = !f.areaPoints[area];
          f.stats.itemsReturned += 1;
          f.stats.helpedThisMonth += 1;
          if (bounty) f.stats.bountyReturns += 1;
          if (item.category === "electronics") f.stats.electronicsReturned += 1;
          if (isNewArea) f.stats.areasHelped += 1;
          const kind: PointsKind = bounty ? "bounty_return" : "return";
          const label = `Returned ${item.title}${bounty ? ` · ${formatMoney(bounty.amount)} bounty` : ""}`;
          const pts = awardPoints(d, w, ctx, f.id, kind, label, item.id);
          f.areaPoints[area] = (f.areaPoints[area] ?? 0) + pts;
          pushNote(d, ctx, {
            userId: f.id,
            type: "update",
            title: bounty ? `💰 ${formatMoney(bounty.amount)} bounty released` : "🎉 Your item has been marked as returned",
            body: `${item.title} found its way home. +${pts} points`,
            href: `/item/${item.slug}`,
            itemId: item.id,
          });
        }
      }
      if (loserId) {
        const l = userDraft(d, w, loserId);
        if (l && !l.badges.includes("helpful-loser")) l.badges.push("helpful-loser");
      }

      const conv = w.conversations.find(
        (c) => c.itemId === item.id && (!counterpartId || c.participantIds.includes(counterpartId)),
      );
      if (conv) {
        const cd = convDraft(d, w, conv.id);
        if (cd) {
          cd.returned = true;
          addMessage(d, ctx, cd, d.sessionUserId ?? item.ownerId, { kind: "system", text: "Item returned 🎉" });
        }
      }
    });
  },

  /* Moderation / admin */
  setModeration(itemId: string, moderation: ModerationState) {
    commit((d, w) => {
      const it = itemDraft(d, w, itemId);
      if (it) it.moderation = moderation;
    });
  },

  setSuspended(userId: string, suspended: boolean) {
    commit((d, w) => {
      const u = userDraft(d, w, userId);
      if (u) u.suspended = suspended;
    });
  },

  setReportStatus(reportId: string, status: ReportStatus) {
    commit((d, w) => {
      const r = reportDraft(d, w, reportId);
      if (r) r.status = status;
    });
  },

  /** Moderator override on a bounty claim (flag as suspicious, reject, or reopen the bounty). */
  setClaimStatus(claimId: string, status: ClaimStatus, note?: string) {
    commit((d, w, ctx) => {
      const c = claimDraft(d, w, claimId);
      if (!c) return;
      c.status = status;
      if (note) c.ownerNote = note;
      const b = bountyDraft(d, w, c.bountyId);
      if (b && (status === "flagged" || status === "rejected") && b.status === "claimed") {
        const others = w.claims.some((x) => x.bountyId === b.id && x.id !== c.id && (x.status === "submitted" || x.status === "more_info" || x.status === "approved"));
        if (!others) b.status = "open";
      }
      if (status === "flagged") {
        pushNote(d, ctx, {
          userId: c.claimantId,
          type: "update",
          title: "🛡️ Your claim was flagged",
          body: "A moderator is reviewing it. Never ask owners for payment before returning an item.",
          href: `/item/${w.itemById.get(c.itemId)?.slug ?? ""}`,
        });
      }
    });
  },

  submitReport(input: { targetType: ReportTarget; targetId: string; reason: string; detail?: string }) {
    const me = state.sessionUserId;
    commit((d, _w, ctx) => {
      const id = uid("rep");
      d.reports[id] = { id, reporterId: me ?? "anonymous", status: "open", at: ctx.nowIso, ...input };
    });
    toast("Report sent", { body: "Thanks — our moderators will review it shortly.", tone: "info" });
  },

  /* Bounty claims */
  submitClaim(input: { itemId: string; message: string; proof: ItemImage[] }): Claim | null {
    let claim: Claim | null = null;
    commit((d, w, ctx) => {
      const me = d.sessionUserId;
      const item = w.itemById.get(input.itemId);
      if (!me || !item || !item.bountyId) return;
      const bounty = bountyDraft(d, w, item.bountyId);
      if (!bounty) return;
      const conv = ensureConversation(d, w, item.id, me, item.ownerId);
      const c: Claim = {
        id: uid("clm"),
        bountyId: bounty.id,
        itemId: item.id,
        claimantId: me,
        status: "submitted",
        proof: input.proof,
        message: input.message,
        createdAt: ctx.nowIso,
        conversationId: conv.id,
      };
      d.claims[c.id] = c;
      claim = c;
      conv.claimId = c.id;
      if (bounty.status === "open") bounty.status = "claimed";
      addMessage(d, ctx, conv, me, { kind: "text", text: input.message });
      for (const p of input.proof) addMessage(d, ctx, conv, me, { kind: "photo", photo: p });
      pushNote(d, ctx, {
        userId: item.ownerId,
        type: "bounty",
        title: `💰 ${formatMoney(bounty.amount)} bounty claim received`,
        body: `${w.userById.get(me)?.name ?? "Someone"} says they found your ${item.title.split("—")[0].trim()}.`,
        href: `/messages/${conv.id}`,
        itemId: item.id,
      });
    });
    if (claim) {
      const c = claim as Claim;
      const owner = getWorld().itemById.get(c.itemId)?.ownerId;
      if (owner && owner !== state.sessionUserId) simulateOwnerReview(c.id, 6500);
    }
    return claim;
  },

  respondClaim(claimId: string, decision: "approve" | "reject" | "more_info", note?: string) {
    commit((d, w, ctx) => {
      const claim = claimDraft(d, w, claimId);
      if (!claim) return;
      const item = w.itemById.get(claim.itemId);
      const bounty = bountyDraft(d, w, claim.bountyId);
      if (!item || !bounty) return;
      const conv = claim.conversationId ? convDraft(d, w, claim.conversationId) : undefined;
      const me = d.sessionUserId ?? item.ownerId;
      if (decision === "approve") {
        claim.status = "approved";
        bounty.status = "approved";
        bounty.winningClaimId = claim.id;
        if (conv) addMessage(d, ctx, conv, me, { kind: "system", text: "Claim approved — arrange the return in a public place." });
        pushNote(d, ctx, {
          userId: claim.claimantId,
          type: "bounty",
          title: "💰 Your claim was approved",
          body: "The owner verified your claim. Arrange the return.",
          href: `/messages/${claim.conversationId ?? ""}`,
          itemId: item.id,
        });
      } else if (decision === "reject") {
        claim.status = "rejected";
        claim.ownerNote = note;
        if (bounty.status === "claimed" && !w.claims.some((c) => c.bountyId === bounty.id && c.id !== claim.id && (c.status === "submitted" || c.status === "more_info"))) bounty.status = "open";
        if (conv) addMessage(d, ctx, conv, me, { kind: "system", text: "Claim declined." });
        pushNote(d, ctx, {
          userId: claim.claimantId,
          type: "bounty",
          title: "Your claim wasn't approved",
          body: note ?? "The owner couldn't verify the details.",
          href: `/messages/${claim.conversationId ?? ""}`,
          itemId: item.id,
        });
      } else {
        claim.status = "more_info";
        claim.ownerNote = note;
        if (conv) addMessage(d, ctx, conv, me, { kind: "text", text: note ?? "Could you share more details to help me verify?" });
      }
    });
  },

  /* Chat */
  startConversation(itemId: string): string | null {
    const me = state.sessionUserId;
    const item = getWorld().itemById.get(itemId);
    if (!me || !item || item.ownerId === me) return null;
    let id = "";
    commit((d, w) => {
      id = ensureConversation(d, w, itemId, me, item.ownerId).id;
    });
    return id;
  },

  sendMessage(convId: string, m: { kind: MessageKind; text?: string; photo?: ItemImage; locationId?: string }) {
    const me = state.sessionUserId;
    if (!me) return;
    commit((d, w, ctx) => {
      const conv = convDraft(d, w, convId);
      if (conv) addMessage(d, ctx, conv, me, m);
    });
    scheduleReply(convId);
  },

  markConversationRead(convId: string) {
    const me = state.sessionUserId;
    const conv = getWorld().conversationById.get(convId);
    if (!me || !conv) return;
    const last = conv.messages[conv.messages.length - 1];
    if (!last || (conv.readAt[me] && Date.parse(conv.readAt[me]) >= Date.parse(last.at))) return;
    commit((d, w) => {
      const c = convDraft(d, w, convId);
      if (c) c.readAt[me] = last.at;
    });
  },

  /** "Item returned" quick action from inside a conversation. */
  markReturned(convId: string) {
    const w = getWorld();
    const me = state.sessionUserId;
    const conv = w.conversationById.get(convId);
    const item = conv && w.itemById.get(conv.itemId);
    if (!me || !conv || !item) return;
    const other = conv.participantIds.find((p) => p !== me);
    if (!other) return;
    const iAmFinderOnLost = item.type === "lost" && item.ownerId !== me;
    if (iAmFinderOnLost) {
      commit((d, w2, ctx) => {
        const c = convDraft(d, w2, convId);
        if (c) addMessage(d, ctx, c, me, { kind: "quick", text: "Item returned" });
      });
      toast("Waiting for the owner to confirm", { body: "They'll tap “Mark as received” once they have it.", tone: "info" });
      setTimeout(() => actions.resolveItem(item.id, me), 3500);
    } else {
      actions.resolveItem(item.id, other);
    }
  },

  /** The owner of a lost item confirms a found listing matches. Rewards the finder. */
  confirmMatch(lostItemId: string, foundItemId: string): string | null {
    const w = getWorld();
    const me = state.sessionUserId;
    const found = w.itemById.get(foundItemId);
    const lost = w.itemById.get(lostItemId);
    if (!me || !found || !lost || found.ownerId === me) return null;
    const already = w.points.some((p) => p.kind === "confirm_match" && p.userId === found.ownerId && p.itemId === foundItemId);
    let convId = "";
    commit((d, w2, ctx) => {
      if (!already) {
        awardPoints(d, w2, ctx, found.ownerId, "confirm_match", `Helped confirm a match · ${found.title}`, foundItemId);
        pushNote(d, ctx, {
          userId: found.ownerId,
          type: "match",
          title: "🎯 Your found item was confirmed as a match",
          body: `${w2.userById.get(me)?.name ?? "The owner"} says your ${found.title.split("—")[0].trim()} is theirs. +10 points`,
          href: `/item/${found.slug}`,
          itemId: found.id,
        });
      }
      convId = ensureConversation(d, w2, foundItemId, me, found.ownerId).id;
    });
    toast("Match confirmed 🎯", { body: `${w.userById.get(found.ownerId)?.name.split(" ")[0] ?? "The finder"} has been notified.`, tone: "celebrate" });
    return convId;
  },

  /* Kudos */
  sendKudos(input: { toUserId: string; tone: KudosTone; message: string; itemId?: string }) {
    commit((d, w, ctx) => {
      const me = d.sessionUserId;
      if (!me) return;
      d.kudos.push({ id: uid("k"), fromUserId: me, at: ctx.nowIso, ...input });
      const recipient = userDraft(d, w, input.toUserId);
      if (recipient) {
        awardPoints(d, w, ctx, recipient.id, "thank_you", `Received thank you from ${w.userById.get(me)?.name ?? "a member"}`, input.itemId);
        pushNote(d, ctx, {
          userId: recipient.id,
          type: "kudos",
          title: `❤️ ${w.userById.get(me)?.name ?? "Someone"} thanked you`,
          body: `“${input.message}” · +20 points`,
          href: `/user/${recipient.handle}`,
        });
      }
    });
    toast("Thank you sent ❤️", { body: "Your kudos will appear on their profile.", tone: "celebrate" });
  },

  /* Notifications */
  markNotificationRead(id: string) {
    const n = getWorld().notifications.find((x) => x.id === id);
    if (!n || n.read) return;
    commit((d) => {
      d.notifications[id] = { ...n, read: true };
    });
  },

  markAllNotificationsRead() {
    const me = state.sessionUserId;
    if (!me) return;
    const unread = getWorld().notifications.filter((n) => n.userId === me && !n.read);
    if (!unread.length) return;
    commit((d) => {
      for (const n of unread) d.notifications[n.id] = { ...n, read: true };
    });
  },

  /* Demo utilities */
  resetDemo() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    state = { ...EMPTY_OVERLAY, clockStart: Date.now() };
    persist();
    notify();
    toast("Demo data reset", { tone: "info" });
  },
};

/** Simulated owner reviewing a claim after a short delay. */
function simulateOwnerReview(claimId: string, delay: number) {
  setTimeout(() => {
    const w = getWorld();
    const claim = w.claimById.get(claimId);
    if (!claim || claim.status !== "submitted") return;
    const item = w.itemById.get(claim.itemId);
    const owner = item && w.userById.get(item.ownerId);
    if (!item || !owner || owner.id === state.sessionUserId) return;
    commit((d, w2, ctx) => {
      const c = claimDraft(d, w2, claimId);
      const b = bountyDraft(d, w2, claim.bountyId);
      const conv = claim.conversationId ? convDraft(d, w2, claim.conversationId) : undefined;
      if (!c || !b) return;
      c.status = "approved";
      b.status = "approved";
      b.winningClaimId = c.id;
      if (conv) {
        addMessage(d, ctx, conv, owner.id, { kind: "text", text: "Yes, that's mine!! The sticker and scratch match. Thank you so much 🙏 Can we meet at the station's customer service counter?" });
        addMessage(d, ctx, conv, owner.id, { kind: "system", text: "Claim approved — arrange the return in a public place." });
      }
      pushNote(d, ctx, {
        userId: claim.claimantId,
        type: "bounty",
        title: "💰 Your claim was approved",
        body: `${owner.name} verified your claim. Arrange the return.`,
        href: `/messages/${claim.conversationId ?? ""}`,
        itemId: item.id,
      });
    });
    toast("Claim approved 🎉", { body: `${owner.name} verified your proof. Arrange the return.`, tone: "celebrate", href: claim.conversationId ? `/messages/${claim.conversationId}` : undefined });
  }, delay);
}

/** Called once on app mount: resume any simulation that a reload interrupted. */
export function resumeSimulations() {
  const me = state.sessionUserId;
  if (!me) return;
  for (const c of getWorld().claims) {
    if (c.claimantId === me && c.status === "submitted") simulateOwnerReview(c.id, 4000);
  }
}
