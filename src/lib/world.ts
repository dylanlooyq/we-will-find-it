import { users as seedUsers, DEFAULT_USER_ID } from "./data/users";
import { items as seedItems, seedBounties } from "./data/items";
import {
  seedClaims,
  seedConversations,
  seedKudos,
  seedNotifications,
  seedPoints,
  seedReports,
} from "./data/social";
import type {
  AppNotification,
  Bounty,
  Claim,
  Conversation,
  Item,
  Kudos,
  PointsTransaction,
  Report,
  User,
} from "./types";

/**
 * The "world" is what every screen reads: seed data merged with a small
 * overlay of local changes (new posts, claims, messages, points…).
 *
 * Server components read the seed world directly (great for SEO and static
 * rendering). Client components read `useWorld()`, which layers the demo
 * session's changes on top. When a backend arrives, `buildWorld` is the one
 * function whose inputs change — components never need to know.
 */

export interface Overlay {
  version: 1;
  sessionUserId: string | null;
  nearLocationId: string;
  items: Record<string, Item>;
  bounties: Record<string, Bounty>;
  claims: Record<string, Claim>;
  conversations: Record<string, Conversation>;
  notifications: Record<string, AppNotification>;
  users: Record<string, User>;
  reports: Record<string, Report>;
  points: PointsTransaction[];
  kudos: Kudos[];
  likes: Record<string, string[]>;
  saves: Record<string, string[]>;
  follows: Record<string, string[]>;
  blocked: Record<string, string[]>;
  /** Real timestamp at which the demo clock started ticking from DEMO_NOW */
  clockStart: number | null;
}

export const EMPTY_OVERLAY: Overlay = {
  version: 1,
  sessionUserId: DEFAULT_USER_ID,
  nearLocationId: "orchard-mrt",
  items: {},
  bounties: {},
  claims: {},
  conversations: {},
  notifications: {},
  users: {},
  reports: {},
  points: [],
  kudos: [],
  likes: {},
  saves: {},
  follows: { u_dylan: ["u_jasmine", "u_marcus"] },
  blocked: {},
  clockStart: null,
};

export interface World {
  items: Item[];
  itemById: Map<string, Item>;
  itemBySlug: Map<string, Item>;
  users: User[];
  userById: Map<string, User>;
  userByHandle: Map<string, User>;
  bounties: Bounty[];
  bountyById: Map<string, Bounty>;
  claims: Claim[];
  claimById: Map<string, Claim>;
  conversations: Conversation[];
  conversationById: Map<string, Conversation>;
  notifications: AppNotification[];
  points: PointsTransaction[];
  kudos: Kudos[];
  reports: Report[];
  currentUser: User | null;
  nearLocationId: string;
  likes: Set<string>;
  saves: Set<string>;
  follows: Set<string>;
  blocked: Set<string>;
}

function mergeById<T extends { id: string }>(seed: T[], over: Record<string, T>): T[] {
  const out = seed.map((s) => over[s.id] ?? s);
  const seen = new Set(seed.map((s) => s.id));
  for (const id of Object.keys(over)) if (!seen.has(id)) out.push(over[id]);
  return out;
}

const cache = new WeakMap<Overlay, World>();

export function buildWorld(overlay: Overlay): World {
  const hit = cache.get(overlay);
  if (hit) return hit;

  const items = mergeById(seedItems, overlay.items);
  const users = mergeById(seedUsers, overlay.users);
  const bounties = mergeById(seedBounties, overlay.bounties);
  const claims = mergeById(seedClaims, overlay.claims);
  const conversations = mergeById(seedConversations, overlay.conversations);
  const notifications = mergeById(seedNotifications, overlay.notifications);
  const reports = mergeById(seedReports, overlay.reports);
  const userById = new Map(users.map((u) => [u.id, u]));
  const me = overlay.sessionUserId;

  const world: World = {
    items,
    itemById: new Map(items.map((i) => [i.id, i])),
    itemBySlug: new Map(items.map((i) => [i.slug, i])),
    users,
    userById,
    userByHandle: new Map(users.map((u) => [u.handle, u])),
    bounties,
    bountyById: new Map(bounties.map((b) => [b.id, b])),
    claims,
    claimById: new Map(claims.map((c) => [c.id, c])),
    conversations,
    conversationById: new Map(conversations.map((c) => [c.id, c])),
    notifications,
    points: [...seedPoints, ...overlay.points],
    kudos: [...seedKudos, ...overlay.kudos],
    reports,
    currentUser: me ? (userById.get(me) ?? null) : null,
    nearLocationId: overlay.nearLocationId,
    likes: new Set(me ? (overlay.likes[me] ?? []) : []),
    saves: new Set(me ? (overlay.saves[me] ?? []) : []),
    follows: new Set(me ? (overlay.follows[me] ?? []) : []),
    blocked: new Set(me ? (overlay.blocked[me] ?? []) : []),
  };
  cache.set(overlay, world);
  return world;
}

/** The pristine seed world — what server components and static pages see. */
export const seedWorld: World = buildWorld(EMPTY_OVERLAY);

/* ── Selectors ────────────────────────────────────────────── */

/** Listings that may appear in public feeds. */
export function publicItems(w: World): Item[] {
  return w.items.filter((i) => i.moderation === "ok");
}

export function activePublicItems(w: World): Item[] {
  return publicItems(w).filter((i) => i.status === "active");
}

export function sortRecent(items: Item[]): Item[] {
  return [...items].sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
}

export function bountyForItem(w: World, item: Item): Bounty | undefined {
  return item.bountyId ? w.bountyById.get(item.bountyId) : undefined;
}

/** Still on offer — not yet paid to a finder, nor withdrawn. */
export function bountyOnOffer(b: Bounty | undefined): b is Bounty {
  return !!b && b.status !== "paid" && b.status !== "cancelled";
}

export function openBounties(w: World, nowMs: number): { bounty: Bounty; item: Item }[] {
  const out: { bounty: Bounty; item: Item }[] = [];
  for (const b of w.bounties) {
    if (b.status !== "open" && b.status !== "claimed") continue;
    if (Date.parse(b.expiresAt) <= nowMs) continue;
    const item = w.itemById.get(b.itemId);
    if (!item || item.moderation !== "ok" || item.status !== "active") continue;
    out.push({ bounty: b, item });
  }
  return out;
}

export function claimsForItem(w: World, itemId: string): Claim[] {
  return w.claims.filter((c) => c.itemId === itemId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function conversationsFor(w: World, userId: string): Conversation[] {
  return w.conversations
    .filter((c) => c.participantIds.includes(userId))
    .sort((a, b) => lastActivity(b) - lastActivity(a));
}

export function lastActivity(c: Conversation): number {
  const last = c.messages[c.messages.length - 1];
  return last ? Date.parse(last.at) : 0;
}

export function unreadCount(c: Conversation, userId: string): number {
  const readAt = c.readAt[userId] ? Date.parse(c.readAt[userId]) : 0;
  return c.messages.filter((m) => m.senderId !== userId && Date.parse(m.at) > readAt).length;
}

export function notificationsFor(w: World, userId: string): AppNotification[] {
  return w.notifications.filter((n) => n.userId === userId).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function itemsByOwner(w: World, userId: string): Item[] {
  return sortRecent(w.items.filter((i) => i.ownerId === userId));
}

export function pointsFor(w: World, userId: string): PointsTransaction[] {
  return w.points.filter((p) => p.userId === userId).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function kudosFor(w: World, userId: string): Kudos[] {
  return w.kudos.filter((k) => k.toUserId === userId).sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export type LeaderboardPeriod = "season" | "month" | "allTime";

export function leaderboard(w: World, period: LeaderboardPeriod): User[] {
  return w.users
    .filter((u) => u.role !== "admin" && !u.suspended && u.points[period] > 0)
    .sort((a, b) => b.points[period] - a.points[period]);
}
