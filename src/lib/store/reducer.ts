import { DAY } from "../clock";
import { earnedBadgeIds } from "../badges";
import { areaById, categoryById, getLocation, locationById, paymentLabel, paymentMethods } from "../data/taxonomy";
import { formatMoney, slugify } from "../format";
import { levelFor, POINTS_BY_KIND } from "../levels";
import { mockMatchingService, otherItemId } from "../matching";
import type {
  AppNotification,
  AreaId,
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
  PaymentMethod,
  PetDetails,
  PointsKind,
  ReportStatus,
  ReportTarget,
  User,
} from "../types";
import { bountyOnOffer, buildWorld, type State, type World } from "../world";
import type { AppEvent } from "./events";

/**
 * Every change a member can make, as pure functions of (state, arguments).
 *
 * The API (worker/) runs these against the database copy and is the authority: it decides who the
 * acting member is and rejects anything these functions throw on. The browser runs the very same
 * functions on its own copy first, so the screen updates instantly, then adopts the server's answer.
 * Keep them deterministic — time and new ids come from `ctx`, never from the clock or Math.random.
 */

export type ActionErrorCode = "unauthorized" | "forbidden" | "invalid" | "not_found" | "conflict";

/** A refusal the member should see. `message` is written for them. */
export class ActionError extends Error {
  constructor(
    public code: ActionErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function fail(code: ActionErrorCode, message: string): never {
  throw new ActionError(code, message);
}

export interface Ctx {
  nowMs: number;
  nowIso: string;
  /** Celebrations for the acting member: points, badges, levels. */
  events: AppEvent[];
  /** A new unique id. The same nonce yields the same ids in the browser and on the server. */
  id(prefix: string): string;
  /** A short random-looking suffix, stable for this action. */
  token: string;
  /** True on the server: photos must already be uploaded, not inline data. */
  strict: boolean;
}

type Draft = State;

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

export interface ProfilePatch {
  name?: string;
  handle?: string;
  homeArea?: User["homeArea"];
  bio?: string;
  hue?: number;
  avatarSrc?: string;
}

/** The signed-in account, as the accounts API (worker/auth.ts) reports it. */
export interface AuthAccount {
  id: string;
  name: string;
  emailVerified: boolean;
  admin: boolean;
}

export type MessageInput = { kind: MessageKind; text?: string; photo?: ItemImage; locationId?: string };

/* ── Reading arguments ────────────────────────────────────── */

/** Where uploaded photos are served from (see worker/uploads.ts). */
export const UPLOAD_SRC = /^\/api\/img\/[a-z0-9]{16,40}\.(?:jpg|png|webp)$/;

const MAX_POSTS_PER_DAY = 10;
const MAX_BOUNTY = 10_000;

function record(v: unknown, field: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) fail("invalid", `${field} is missing.`);
  return v as Record<string, unknown>;
}

function text(v: unknown, field: string, max: number, min = 1): string {
  if (typeof v !== "string") fail("invalid", `${field} is missing.`);
  const s = v.trim();
  if (s.length < min) fail("invalid", `${field} is missing.`);
  if (s.length > max) fail("invalid", `${field} is too long.`);
  return s;
}

const optText = (v: unknown, field: string, max: number): string | undefined => (v == null || v === "" ? undefined : text(v, field, max, 0) || undefined);

function oneOf<T extends string>(v: unknown, allowed: readonly T[], field: string): T {
  if (typeof v !== "string" || !allowed.includes(v as T)) fail("invalid", `${field} isn't valid.`);
  return v as T;
}

function list(v: unknown, field: string, max: number): unknown[] {
  if (!Array.isArray(v)) fail("invalid", `${field} is missing.`);
  if (v.length > max) fail("invalid", `Too many ${field.toLowerCase()}.`);
  return v;
}

function photoSrc(v: unknown, ctx: Ctx): string {
  if (typeof v === "string" && (UPLOAD_SRC.test(v) || (!ctx.strict && v.startsWith("data:image/")))) return v;
  return fail("invalid", "That photo couldn't be used.");
}

function image(v: unknown, ctx: Ctx): ItemImage {
  const o = record(v, "Photo");
  return {
    file: text(o.file ?? "upload", "Photo", 120),
    label: text(o.label ?? "Photo", "Photo", 160),
    ...(o.src != null && { src: photoSrc(o.src, ctx) }),
  };
}

const PAYMENT_IDS = paymentMethods.map((m) => m.id);
const optPayment = (v: unknown): PaymentMethod | undefined => (v == null ? undefined : oneOf(v, PAYMENT_IDS, "Payment method"));

/* ── Shared helpers ───────────────────────────────────────── */

function requireMe(d: Draft): User {
  const me = d.sessionUserId ? d.users[d.sessionUserId] : undefined;
  if (!me) fail("unauthorized", "Log in to do that.");
  if (me.suspended) fail("forbidden", "Your account has been suspended.");
  return me;
}

function requireAdmin(d: Draft): User {
  const me = requireMe(d);
  if (me.role !== "admin") fail("forbidden", "Only moderators can do that.");
  return me;
}

function need<T>(v: T | undefined, what: string): T {
  if (v === undefined) fail("not_found", `We couldn't find that ${what}.`);
  return v;
}

function pushNote(d: Draft, ctx: Ctx, n: { userId: string; type: NotificationType; title: string; body?: string; href: string; itemId?: string }) {
  const id = ctx.id("ntf");
  const note: AppNotification = { id, at: ctx.nowIso, read: false, ...n };
  d.notifications[id] = note;
}

function addMessage(d: Draft, ctx: Ctx, conv: Conversation, senderId: string, m: MessageInput) {
  const msg: Message = { id: ctx.id("msg"), conversationId: conv.id, senderId, at: ctx.nowIso, ...m };
  conv.messages.push(msg);
  conv.readAt[senderId] = msg.at;
  return msg;
}

function ensureConversation(d: Draft, ctx: Ctx, itemId: string, me: string, owner: string): Conversation {
  const existing = Object.values(d.conversations).find((c) => c.itemId === itemId && c.participantIds.includes(me) && c.participantIds.includes(owner));
  if (existing) return existing;
  const conv: Conversation = { id: ctx.id("conv"), itemId, participantIds: [owner, me], messages: [], readAt: {} };
  d.conversations[conv.id] = conv;
  return conv;
}

function awardPoints(d: Draft, ctx: Ctx, userId: string, kind: PointsKind, label: string, itemId?: string) {
  const u = d.users[userId];
  if (!u) return 0;
  const pts = POINTS_BY_KIND[kind];
  u.points.allTime += pts;
  u.points.season += pts;
  u.points.month += pts;
  d.points.push({ id: ctx.id("pt"), userId, kind, points: pts, label, at: ctx.nowIso, itemId });
  if (userId === d.sessionUserId) ctx.events.push({ type: "points", points: pts, label, total: u.points.allTime });
  return pts;
}

const shortTitle = (item: Item) => item.title.split("—")[0].trim();

/** Close a listing as reunited: settle any bounty, reward the finder, tell both sides. */
function resolve(d: Draft, ctx: Ctx, item: Item, finderId: string | undefined, seekerId: string | undefined, paidVia: PaymentMethod | undefined, actorId: string) {
  if (item.status === "resolved") return;
  item.status = "resolved";
  item.resolvedAt = ctx.nowIso;
  item.resolvedWithUserId = item.type === "lost" ? finderId : seekerId;

  const offered = item.bountyId ? d.bounties[item.bountyId] : undefined;
  // No finder, nobody to pay — the offer simply lapses.
  const bounty = finderId && bountyOnOffer(offered) ? offered : undefined;
  if (offered && !bounty && bountyOnOffer(offered)) offered.status = "cancelled";
  if (bounty) {
    bounty.status = "paid";
    bounty.paidVia = paidVia;
    for (const c of Object.values(d.claims)) if (c.itemId === item.id && c.claimantId === finderId) c.status = "received";
  }

  const finder = finderId ? d.users[finderId] : undefined;
  if (finder) {
    const area = getLocation(item.locationId).area;
    const isNewArea = !finder.areaPoints[area];
    finder.stats.itemsReturned += 1;
    finder.stats.helpedThisMonth += 1;
    if (bounty) finder.stats.bountyReturns += 1;
    if (item.category === "electronics") finder.stats.electronicsReturned += 1;
    if (isNewArea) finder.stats.areasHelped += 1;
    const kind: PointsKind = bounty ? "bounty_return" : "return";
    const label = `Returned ${item.title}${bounty ? ` · ${formatMoney(bounty.amount)} bounty` : ""}`;
    const pts = awardPoints(d, ctx, finder.id, kind, label, item.id);
    finder.areaPoints[area] = (finder.areaPoints[area] ?? 0) + pts;
    pushNote(d, ctx, {
      userId: finder.id,
      type: "update",
      title: bounty ? `💰 ${formatMoney(bounty.amount)} bounty paid${paidVia ? ` via ${paymentLabel(paidVia)}` : ""}` : "🎉 Your item has been marked as returned",
      body: `${item.title} found its way home. +${pts} points`,
      href: `/item/${item.slug}`,
      itemId: item.id,
    });
  }
  const seeker = seekerId ? d.users[seekerId] : undefined;
  if (seeker && !seeker.badges.includes("helpful-poster")) seeker.badges.push("helpful-poster");

  const counterpartId = actorId === finderId ? seekerId : finderId;
  const conv = Object.values(d.conversations).find((c) => c.itemId === item.id && (!counterpartId || c.participantIds.includes(counterpartId)));
  if (conv) {
    conv.returned = true;
    addMessage(d, ctx, conv, actorId, { kind: "system", text: "Item returned 🎉" });
  }
}

/** The parts of a listing its owner writes, checked. Shared by posting and editing. */
function listingFields(input: Record<string, unknown>, ctx: Ctx) {
  const title = text(input.title, "Title", 90, 3);
  const locationId = text(input.locationId, "Location", 60);
  if (!locationById[locationId]) fail("invalid", "Pick a location from the list.");
  const occurredMs = Date.parse(text(input.occurredAt, "Date", 40));
  if (Number.isNaN(occurredMs) || occurredMs > ctx.nowMs + DAY) fail("invalid", "That date isn't valid.");

  const details: IdentifyingDetail[] = list(input.details ?? [], "Details", 12).map((v) => {
    const o = record(v, "Detail");
    return { label: text(o.label, "Detail", 40), value: text(o.value, "Detail", 160), ...(o.hidden === true && { hidden: true }) };
  });
  let pet: PetDetails | undefined;
  if (input.pet != null) {
    const p = record(input.pet, "Pet details");
    pet = {
      species: oneOf(p.species, ["dog", "cat", "other"] as const, "Species"),
      name: optText(p.name, "Pet name", 40),
      breed: text(p.breed, "Breed", 60, 0),
      colour: text(p.colour, "Colour", 60, 0),
      age: optText(p.age, "Age", 40),
      collar: optText(p.collar, "Collar", 80),
      microchip: optText(p.microchip, "Microchip", 40),
      contactNote: optText(p.contactNote, "Contact note", 160),
    };
  }
  return {
    title,
    description: text(input.description, "Description", 2000, 0),
    category: oneOf(input.category, Object.keys(categoryById) as CategoryId[], "Category"),
    images: list(input.images ?? [], "Photos", 8).map((v) => image(v, ctx)),
    locationId,
    locationNote: optText(input.locationNote, "Location note", 160),
    occurredAt: new Date(occurredMs).toISOString(),
    timeLabel: text(input.timeLabel, "Time", 40, 0),
    details,
    pet,
  };
}

/** The bounty a listing asks for, in whole dollars. 0 means none. */
function bountyAmount(input: Record<string, unknown>): number {
  const amount = input.bountyAmount == null ? 0 : Number(input.bountyAmount);
  if (!Number.isFinite(amount) || amount > MAX_BOUNTY) fail("invalid", `Bounties can be up to ${formatMoney(MAX_BOUNTY)}.`);
  return amount > 0 ? Math.round(amount) : 0;
}

function newBounty(ctx: Ctx, id: string, itemId: string, amount: number): Bounty {
  return { id, itemId, amount, currency: "SGD", status: "open", createdAt: ctx.nowIso, expiresAt: new Date(ctx.nowMs + 30 * DAY).toISOString() };
}

function newProfile(d: Draft, w: World, ctx: Ctx, account: AuthAccount): User {
  const name = account.name.trim() || "Member";
  const first = slugify(name.split(" ")[0]) || "member";
  let handle = first;
  let n = 2;
  while (w.userByHandle.has(handle) || d.users[`u_${handle}`]) handle = `${first}${n++}`;
  const parts = name.split(/\s+/);
  const display = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
  let hue = 0;
  for (const ch of name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
  const user: User = {
    id: `u_${handle}`,
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
    role: account.admin ? "admin" : "member",
  };
  d.users[user.id] = user;
  return user;
}

/* ── Actions ──────────────────────────────────────────────── */

type Recipe<A, R> = (d: Draft, w: World, ctx: Ctx, args: A) => R;

const recipes = {
  /**
   * Server-only: give a signed-in account its profile, and keep the facts the accounts API owns
   * (verified email, moderator role) in step. Sets the acting member.
   */
  ensureProfile: ((d, w, ctx, account) => {
    const existing = Object.values(d.users).find((u) => u.authId === account.id);
    const user = existing ?? newProfile(d, w, ctx, account);
    user.verified = account.emailVerified;
    user.role = account.admin ? "admin" : "member";
    d.sessionUserId = user.id;
    return user.id;
  }) satisfies Recipe<AuthAccount, string>,

  updateProfile: ((d, w, ctx, patch) => {
    const me = requireMe(d);
    const p = record(patch, "Profile");
    if (p.name != null) me.name = text(p.name, "Name", 40, 2);
    if (p.handle != null) {
      const handle = slugify(text(p.handle, "Username", 24, 2));
      if (!handle) fail("invalid", "That username isn't valid.");
      const taken = w.userByHandle.get(handle);
      if (taken && taken.id !== me.id) fail("conflict", "That username is taken.");
      me.handle = handle;
    }
    if (p.homeArea != null) me.homeArea = oneOf(p.homeArea, Object.keys(areaById) as AreaId[], "Area");
    if (p.bio != null) me.bio = text(p.bio, "Bio", 280, 0);
    if (p.hue != null) {
      if (typeof p.hue !== "number" || !(p.hue >= 0 && p.hue <= 360)) fail("invalid", "That colour isn't valid.");
      me.hue = Math.round(p.hue);
    }
    if (p.avatarSrc != null && p.avatarSrc !== "") me.avatarSrc = photoSrc(p.avatarSrc, ctx);
    if (!me.profileComplete && me.name && me.bio) {
      me.profileComplete = true;
      awardPoints(d, ctx, me.id, "profile_complete", "Completed your profile");
    }
  }) satisfies Recipe<ProfilePatch, void>,

  createItem: ((d, w, ctx, raw) => {
    const me = requireMe(d);
    const input = record(raw, "Listing");
    const type = oneOf(input.type, ["lost", "found"] as const, "Listing type");
    const fields = listingFields(input, ctx);
    const recent = w.items.filter((i) => i.ownerId === me.id && Date.parse(i.postedAt) > ctx.nowMs - DAY).length;
    if (recent >= MAX_POSTS_PER_DAY) fail("forbidden", "You've posted a lot today. Please try again tomorrow.");

    const base = slugify(`${fields.title} ${locationById[fields.locationId].name}`) || "listing";
    let slug = base;
    while (w.itemBySlug.has(slug)) slug = `${slug}-${ctx.token}`;
    const id = `itm_${slug.replace(/-/g, "_")}`;

    let bountyId: string | undefined;
    const amount = bountyAmount(input);
    if (type === "lost" && amount > 0) {
      bountyId = `bty_${slug.replace(/-/g, "_")}`;
      d.bounties[bountyId] = newBounty(ctx, bountyId, id, amount);
    }

    const item: Item = {
      id,
      slug,
      type,
      status: "active",
      moderation: "ok",
      ...fields,
      postedAt: ctx.nowIso,
      ownerId: me.id,
      bountyId,
      likes: 0,
      comments: 0,
      views: 0,
    };
    d.items[id] = item;

    if (type === "found") {
      me.stats.itemsFound += 1;
      awardPoints(d, ctx, me.id, "post_found", `Posted a found item · ${item.title}`, id);
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
        title: `🎯 New potential match for your ${other.type} ${shortTitle(other)}`,
        body: `${item.title} near ${getLocation(item.locationId).name} · ${m.score}% match.`,
        href: `/item/${slug}`,
        itemId: id,
      });
    }
    return item;
  }) satisfies Recipe<NewItemInput, Item>,

  /**
   * The owner corrects a listing that is already live. Its address, its type (lost or found) and
   * everything people have done with it stay as they are. A bounty can be added, changed or withdrawn
   * only until a finder has claimed it.
   */
  updateItem: ((d, _w, ctx, { itemId, input: raw }) => {
    const me = requireMe(d);
    const item = need(d.items[itemId], "listing");
    if (item.ownerId !== me.id) fail("forbidden", "Only the person who posted this can edit it.");
    if (item.status === "resolved") fail("invalid", "This listing has already been reunited.");
    const input = record(raw, "Listing");
    Object.assign(item, listingFields(input, ctx));

    if (item.type === "lost") {
      const amount = bountyAmount(input);
      const bounty = item.bountyId ? d.bounties[item.bountyId] : undefined;
      if (bounty && (bounty.status === "claimed" || bounty.status === "approved")) {
        if (amount !== bounty.amount) fail("conflict", "A finder has claimed this bounty, so it can't be changed now.");
      } else if (bounty && bountyOnOffer(bounty)) {
        if (amount > 0) bounty.amount = amount;
        else bounty.status = "cancelled";
      } else if (amount > 0) {
        // None yet, or one that was withdrawn: a fresh 30-day offer.
        const id = item.bountyId ?? `bty_${item.slug.replace(/-/g, "_")}`;
        d.bounties[id] = newBounty(ctx, id, item.id, amount);
        item.bountyId = id;
      }
    }
    return item;
  }) satisfies Recipe<{ itemId: string; input: NewItemInput }, Item>,

  toggleLike: ((d, _w, _ctx, { itemId }) => {
    const me = requireMe(d);
    const item = need(d.items[itemId], "listing");
    const mine = (d.likes[me.id] ??= []);
    const i = mine.indexOf(itemId);
    if (i >= 0) {
      mine.splice(i, 1);
      item.likes = Math.max(0, item.likes - 1);
    } else {
      mine.push(itemId);
      item.likes += 1;
    }
  }) satisfies Recipe<{ itemId: string }, void>,

  toggleSave: ((d, _w, _ctx, { itemId }) => {
    const me = requireMe(d);
    need(d.items[itemId], "listing");
    const mine = (d.saves[me.id] ??= []);
    const i = mine.indexOf(itemId);
    if (i >= 0) mine.splice(i, 1);
    else mine.push(itemId);
    return i < 0;
  }) satisfies Recipe<{ itemId: string }, boolean>,

  toggleFollow: ((d, _w, _ctx, { userId }) => {
    const me = requireMe(d);
    need(d.users[userId], "member");
    if (userId === me.id) fail("invalid", "You can't follow yourself.");
    const mine = (d.follows[me.id] ??= []);
    const i = mine.indexOf(userId);
    if (i >= 0) mine.splice(i, 1);
    else mine.push(userId);
    return i < 0;
  }) satisfies Recipe<{ userId: string }, boolean>,

  blockUser: ((d, _w, _ctx, { userId }) => {
    const me = requireMe(d);
    need(d.users[userId], "member");
    const mine = (d.blocked[me.id] ??= []);
    if (userId !== me.id && !mine.includes(userId)) mine.push(userId);
  }) satisfies Recipe<{ userId: string }, void>,

  /**
   * The owner closes their listing as reunited. `counterpartId` is who they dealt with: the finder
   * for a lost item, the person who lost it for a found one. `paidVia` is how any bounty was paid.
   */
  resolveItem: ((d, _w, ctx, { itemId, counterpartId, paidVia }) => {
    const me = requireMe(d);
    const item = need(d.items[itemId], "listing");
    if (item.ownerId !== me.id && me.role !== "admin") fail("forbidden", "Only the person who posted this can close it.");
    if (counterpartId != null) {
      // Points go to the counterpart, so it has to be someone who actually got in touch about this listing.
      const dealtWith = Object.values(d.conversations).some((c) => c.itemId === item.id && c.participantIds.includes(counterpartId) && c.messages.length > 0);
      if (counterpartId === item.ownerId || !dealtWith) fail("invalid", "Pick someone who messaged you about this listing.");
    }
    const other = counterpartId ?? undefined;
    if (item.type === "lost") resolve(d, ctx, item, other, item.ownerId, optPayment(paidVia), me.id);
    else resolve(d, ctx, item, item.ownerId, other, undefined, me.id);
  }) satisfies Recipe<{ itemId: string; counterpartId?: string; paidVia?: PaymentMethod }, void>,

  /* Moderation */
  setModeration: ((d, _w, _ctx, { itemId, moderation }) => {
    requireAdmin(d);
    need(d.items[itemId], "listing").moderation = oneOf(moderation, ["ok", "hidden", "removed", "fraud"] as const, "Status");
  }) satisfies Recipe<{ itemId: string; moderation: ModerationState }, void>,

  setSuspended: ((d, _w, _ctx, { userId, suspended }) => {
    const me = requireAdmin(d);
    if (userId === me.id) fail("invalid", "You can't suspend yourself.");
    need(d.users[userId], "member").suspended = suspended === true;
  }) satisfies Recipe<{ userId: string; suspended: boolean }, void>,

  setReportStatus: ((d, _w, _ctx, { reportId, status }) => {
    requireAdmin(d);
    need(d.reports[reportId], "report").status = oneOf(status, ["open", "reviewing", "actioned", "dismissed"] as const, "Status");
  }) satisfies Recipe<{ reportId: string; status: ReportStatus }, void>,

  /** Moderator override on a bounty claim (flag as suspicious, reject, or reopen the bounty). */
  setClaimStatus: ((d, _w, ctx, { claimId, status, note }) => {
    requireAdmin(d);
    const c = need(d.claims[claimId], "claim");
    c.status = oneOf(status, ["submitted", "more_info", "approved", "rejected", "received", "flagged"] as const, "Status");
    const ownerNote = optText(note, "Note", 400);
    if (ownerNote) c.ownerNote = ownerNote;
    const b = d.bounties[c.bountyId];
    if (b && (status === "flagged" || status === "rejected") && b.status === "claimed") {
      const others = Object.values(d.claims).some((x) => x.bountyId === b.id && x.id !== c.id && (x.status === "submitted" || x.status === "more_info" || x.status === "approved"));
      if (!others) b.status = "open";
    }
    if (status === "flagged") {
      pushNote(d, ctx, {
        userId: c.claimantId,
        type: "update",
        title: "🛡️ Your claim was flagged",
        body: "A moderator is reviewing it. Never ask owners for payment before returning an item.",
        href: `/item/${d.items[c.itemId]?.slug ?? ""}`,
      });
    }
  }) satisfies Recipe<{ claimId: string; status: ClaimStatus; note?: string }, void>,

  submitReport: ((d, _w, ctx, input) => {
    const me = requireMe(d);
    const targetType = oneOf(input.targetType, ["item", "user", "claim"] as const, "Report");
    const targetId = text(input.targetId, "Report", 120);
    const target = targetType === "item" ? d.items[targetId] : targetType === "user" ? d.users[targetId] : d.claims[targetId];
    need(target, "thing to report");
    const id = ctx.id("rep");
    d.reports[id] = { id, targetType, targetId, reporterId: me.id, reason: text(input.reason, "Reason", 120), detail: optText(input.detail, "Details", 1000), status: "open", at: ctx.nowIso };
  }) satisfies Recipe<{ targetType: ReportTarget; targetId: string; reason: string; detail?: string }, void>,

  /* Bounty claims */
  submitClaim: ((d, w, ctx, input) => {
    const me = requireMe(d);
    const item = need(d.items[input.itemId], "listing");
    const bounty = item.bountyId ? d.bounties[item.bountyId] : undefined;
    if (!bountyOnOffer(bounty)) fail("invalid", "This bounty is no longer on offer.");
    if (item.status === "resolved") fail("invalid", "This listing has already been reunited.");
    if (item.ownerId === me.id) fail("invalid", "You can't claim your own bounty.");
    if ((d.blocked[item.ownerId] ?? []).includes(me.id)) fail("forbidden", "You can't contact this member.");
    if (w.claims.some((c) => c.bountyId === bounty.id && c.claimantId === me.id && c.status !== "rejected")) fail("conflict", "You've already claimed this bounty.");
    const message = text(input.message, "Message", 1000);
    const proof = list(input.proof ?? [], "Photos", 6).map((v) => image(v, ctx));
    const conv = ensureConversation(d, ctx, item.id, me.id, item.ownerId);
    const claim: Claim = {
      id: ctx.id("clm"),
      bountyId: bounty.id,
      itemId: item.id,
      claimantId: me.id,
      status: "submitted",
      proof,
      message,
      createdAt: ctx.nowIso,
      conversationId: conv.id,
    };
    d.claims[claim.id] = claim;
    conv.claimId = claim.id;
    if (bounty.status === "open") bounty.status = "claimed";
    addMessage(d, ctx, conv, me.id, { kind: "text", text: message });
    for (const p of proof) addMessage(d, ctx, conv, me.id, { kind: "photo", photo: p });
    pushNote(d, ctx, {
      userId: item.ownerId,
      type: "bounty",
      title: `💰 ${formatMoney(bounty.amount)} bounty claim received`,
      body: `${me.name} says they found your ${shortTitle(item)}.`,
      href: `/messages/${conv.id}`,
      itemId: item.id,
    });
    return claim;
  }) satisfies Recipe<{ itemId: string; message: string; proof: ItemImage[] }, Claim>,

  respondClaim: ((d, _w, ctx, { claimId, decision, note }) => {
    const me = requireMe(d);
    const claim = need(d.claims[claimId], "claim");
    const item = need(d.items[claim.itemId], "listing");
    const bounty = need<Bounty>(d.bounties[claim.bountyId], "bounty");
    if (item.ownerId !== me.id) fail("forbidden", "Only the owner can respond to this claim.");
    if (claim.status !== "submitted" && claim.status !== "more_info") fail("conflict", "This claim has already been dealt with.");
    oneOf(decision, ["approve", "reject", "more_info"] as const, "Decision");
    const ownerNote = optText(note, "Note", 400);
    const conv = claim.conversationId ? d.conversations[claim.conversationId] : undefined;
    if (decision === "approve") {
      claim.status = "approved";
      bounty.status = "approved";
      bounty.winningClaimId = claim.id;
      if (conv) addMessage(d, ctx, conv, me.id, { kind: "system", text: "Claim approved — arrange the return in a public place." });
      pushNote(d, ctx, {
        userId: claim.claimantId,
        type: "bounty",
        title: "💰 Your claim was approved",
        body: `${me.name} verified your claim. Arrange the return.`,
        href: `/messages/${claim.conversationId ?? ""}`,
        itemId: item.id,
      });
    } else if (decision === "reject") {
      claim.status = "rejected";
      claim.ownerNote = ownerNote;
      const open = Object.values(d.claims).some((c) => c.bountyId === bounty.id && c.id !== claim.id && (c.status === "submitted" || c.status === "more_info"));
      if (bounty.status === "claimed" && !open) bounty.status = "open";
      if (conv) addMessage(d, ctx, conv, me.id, { kind: "system", text: "Claim declined." });
      pushNote(d, ctx, {
        userId: claim.claimantId,
        type: "bounty",
        title: "Your claim wasn't approved",
        body: ownerNote ?? "The owner couldn't verify the details.",
        href: `/messages/${claim.conversationId ?? ""}`,
        itemId: item.id,
      });
    } else {
      claim.status = "more_info";
      claim.ownerNote = ownerNote;
      if (conv) addMessage(d, ctx, conv, me.id, { kind: "text", text: ownerNote ?? "Could you share more details to help me verify?" });
    }
  }) satisfies Recipe<{ claimId: string; decision: "approve" | "reject" | "more_info"; note?: string }, void>,

  /* Chat */
  startConversation: ((d, _w, ctx, { itemId }) => {
    const me = requireMe(d);
    const item = need(d.items[itemId], "listing");
    if (item.ownerId === me.id) fail("invalid", "This is your own listing.");
    if ((d.blocked[item.ownerId] ?? []).includes(me.id)) fail("forbidden", "You can't contact this member.");
    return ensureConversation(d, ctx, itemId, me.id, item.ownerId).id;
  }) satisfies Recipe<{ itemId: string }, string>,

  sendMessage: ((d, _w, ctx, { convId, message }) => {
    const me = requireMe(d);
    const conv = need(d.conversations[convId], "conversation");
    if (!conv.participantIds.includes(me.id)) fail("forbidden", "This isn't your conversation.");
    const other = conv.participantIds.find((p) => p !== me.id);
    if (other && (d.blocked[other] ?? []).includes(me.id)) fail("forbidden", "You can't message this member.");
    const m = record(message, "Message");
    const kind = oneOf(m.kind, ["text", "photo", "location", "quick"] as const, "Message");
    const body = optText(m.text, "Message", 2000);
    if ((kind === "text" || kind === "quick") && !body) fail("invalid", "Write a message first.");
    const locationId = m.locationId == null ? undefined : text(m.locationId, "Location", 60);
    if (kind === "location" && !(locationId && locationById[locationId])) fail("invalid", "Pick a location from the list.");
    addMessage(d, ctx, conv, me.id, {
      kind,
      ...(body && { text: body }),
      ...(kind === "photo" && { photo: image(m.photo, ctx) }),
      ...(locationId && { locationId }),
    });
  }) satisfies Recipe<{ convId: string; message: MessageInput }, void>,

  markConversationRead: ((d, _w, _ctx, { convId }) => {
    const me = requireMe(d);
    const conv = need(d.conversations[convId], "conversation");
    if (!conv.participantIds.includes(me.id)) fail("forbidden", "This isn't your conversation.");
    const last = conv.messages[conv.messages.length - 1];
    if (last) conv.readAt[me.id] = last.at;
  }) satisfies Recipe<{ convId: string }, void>,

  /**
   * "Item returned" from inside a conversation. The person who has the item back closes the listing;
   * a finder returning someone's lost item can only say so and wait for the owner to confirm.
   */
  markReturned: ((d, _w, ctx, { convId, paidVia }) => {
    const me = requireMe(d);
    const conv = need(d.conversations[convId], "conversation");
    if (!conv.participantIds.includes(me.id)) fail("forbidden", "This isn't your conversation.");
    const item = need(d.items[conv.itemId], "listing");
    const other = need(conv.participantIds.find((p) => p !== me.id), "member");
    const iAmOwner = item.ownerId === me.id;
    if (item.type === "lost") {
      if (iAmOwner) resolve(d, ctx, item, other, me.id, optPayment(paidVia), me.id);
      else addMessage(d, ctx, conv, me.id, { kind: "quick", text: "Item returned" });
      return iAmOwner;
    }
    resolve(d, ctx, item, item.ownerId, iAmOwner ? other : me.id, undefined, me.id);
    return true;
  }) satisfies Recipe<{ convId: string; paidVia?: PaymentMethod }, boolean>,

  /** The owner of a lost item confirms a found listing matches. Rewards the finder. */
  confirmMatch: ((d, w, ctx, { lostItemId, foundItemId }) => {
    const me = requireMe(d);
    const lost = need(d.items[lostItemId], "listing");
    const found = need(d.items[foundItemId], "listing");
    if (lost.ownerId !== me.id || lost.type !== "lost" || found.type !== "found" || found.ownerId === me.id) fail("invalid", "That match can't be confirmed.");
    if ((d.blocked[found.ownerId] ?? []).includes(me.id)) fail("forbidden", "You can't contact this member.");
    const already = w.points.some((p) => p.kind === "confirm_match" && p.userId === found.ownerId && p.itemId === foundItemId);
    if (!already) {
      awardPoints(d, ctx, found.ownerId, "confirm_match", `Helped confirm a match · ${found.title}`, foundItemId);
      pushNote(d, ctx, {
        userId: found.ownerId,
        type: "match",
        title: "🎯 Your found item was confirmed as a match",
        body: `${me.name} says your ${shortTitle(found)} is theirs. +10 points`,
        href: `/item/${found.slug}`,
        itemId: found.id,
      });
    }
    return ensureConversation(d, ctx, foundItemId, me.id, found.ownerId).id;
  }) satisfies Recipe<{ lostItemId: string; foundItemId: string }, string>,

  /** Thank the person on the other side of a reunited listing. Once per listing, since it carries points. */
  sendKudos: ((d, w, ctx, input) => {
    const me = requireMe(d);
    const recipient = need(d.users[input.toUserId], "member");
    const item = need(input.itemId ? d.items[input.itemId] : undefined, "listing");
    const parties = [item.ownerId, item.resolvedWithUserId];
    if (item.status !== "resolved" || recipient.id === me.id || !parties.includes(me.id) || !parties.includes(recipient.id)) fail("invalid", "You can thank someone once your item is back with you.");
    if (w.kudos.some((k) => k.fromUserId === me.id && k.itemId === item.id)) fail("conflict", "You've already said thanks for this one.");
    const message = text(input.message, "Message", 280, 0);
    d.kudos.push({ id: ctx.id("k"), fromUserId: me.id, toUserId: recipient.id, itemId: item.id, tone: oneOf(input.tone, ["heart", "thumb", "star"] as const, "Reaction"), message, at: ctx.nowIso });
    awardPoints(d, ctx, recipient.id, "thank_you", `Received thank you from ${me.name}`, item.id);
    pushNote(d, ctx, {
      userId: recipient.id,
      type: "kudos",
      title: `❤️ ${me.name} thanked you`,
      body: `${message ? `“${message}” · ` : ""}+20 points`,
      href: `/user/${recipient.handle}`,
    });
  }) satisfies Recipe<{ toUserId: string; tone: KudosTone; message: string; itemId?: string }, void>,

  /* Notifications */
  markNotificationRead: ((d, _w, _ctx, { id }) => {
    const me = requireMe(d);
    const n = need(d.notifications[id], "notification");
    if (n.userId !== me.id) fail("forbidden", "That isn't your notification.");
    n.read = true;
  }) satisfies Recipe<{ id: string }, void>,

  markAllNotificationsRead: ((d) => {
    const me = requireMe(d);
    for (const n of Object.values(d.notifications)) if (n.userId === me.id) n.read = true;
  }) satisfies Recipe<void, void>,
};

export type ActionName = keyof typeof recipes;
export type ActionArgs<N extends ActionName> = Parameters<(typeof recipes)[N]>[3];
export type ActionResult<N extends ActionName> = ReturnType<(typeof recipes)[N]>;

/** What members may ask the API to do. `ensureProfile` is the server's own. */
export const isMemberAction = (name: string): name is ActionName => name !== "ensureProfile" && Object.hasOwn(recipes, name);

function rewardSnapshot(state: State) {
  const u = state.sessionUserId ? state.users[state.sessionUserId] : undefined;
  return u ? { badges: new Set(earnedBadgeIds(u)), points: u.points.allTime } : null;
}

export interface Applied<N extends ActionName> {
  state: State;
  result: ActionResult<N>;
  events: AppEvent[];
}

/**
 * Run one action against a copy of `state`. Throws `ActionError` when it isn't allowed; `state` is
 * never modified. `taken` (server only) reports ids already in use, so a nonce can't collide.
 */
export function applyAction<N extends ActionName>(
  state: State,
  name: N,
  args: ActionArgs<N>,
  opts: { nowMs: number; nonce: string; strict: boolean; taken?: (id: string) => boolean },
): Applied<N> {
  const d = structuredClone(state);
  let n = 0;
  const ctx: Ctx = {
    nowMs: opts.nowMs,
    nowIso: new Date(opts.nowMs).toISOString(),
    events: [],
    token: opts.nonce.slice(0, 4),
    strict: opts.strict,
    id(prefix) {
      const id = `${prefix}_${opts.nonce}${(n++).toString(36)}`;
      if (opts.taken?.(id)) fail("conflict", "Please try that again.");
      return id;
    },
  };
  const before = rewardSnapshot(state);
  const recipe = recipes[name] as Recipe<ActionArgs<N>, ActionResult<N>>;
  const result = recipe(d, buildWorld(state), ctx, args);

  const after = rewardSnapshot(d);
  if (before && after && d.sessionUserId === state.sessionUserId) {
    for (const id of after.badges) if (!before.badges.has(id)) ctx.events.push({ type: "badge", badgeId: id });
    if (levelFor(after.points).level > levelFor(before.points).level) ctx.events.push({ type: "level", level: levelFor(after.points) });
  }
  return { state: d, result, events: ctx.events };
}
