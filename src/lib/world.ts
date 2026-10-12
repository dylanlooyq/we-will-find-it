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
 * The "world" is what every screen reads.
 *
 * Its data lives in the database and is owned by the API (worker/): the browser holds the slice of it
 * that the signed-in member may see — a `State` — and `buildWorld` turns that into indexed lookups.
 * Prerendered pages are built from the empty state, so they carry no member data.
 */

export interface State {
  /** False until the first copy has arrived from the API (or from this browser's cache). */
  ready: boolean;
  /** The signed-in member's profile, if any. */
  sessionUserId: string | null;
  /** A preference kept in this browser, not on the server. */
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
  /** member id → the ids they liked / saved / follow / blocked */
  likes: Record<string, string[]>;
  saves: Record<string, string[]>;
  follows: Record<string, string[]>;
  blocked: Record<string, string[]>;
}

export const DEFAULT_NEAR_LOCATION = "orchard-mrt";

export const EMPTY_STATE: State = {
  ready: false,
  sessionUserId: null,
  nearLocationId: DEFAULT_NEAR_LOCATION,
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
  follows: {},
  blocked: {},
};

export interface World {
  /** False until the first copy has arrived — "not found" can't be trusted before that. */
  ready: boolean;
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

const cache = new WeakMap<State, World>();

export function buildWorld(state: State): World {
  const hit = cache.get(state);
  if (hit) return hit;

  const items = Object.values(state.items);
  const users = Object.values(state.users);
  const bounties = Object.values(state.bounties);
  const claims = Object.values(state.claims);
  const conversations = Object.values(state.conversations);
  const userById = new Map(users.map((u) => [u.id, u]));
  const me = state.sessionUserId;

  const world: World = {
    ready: state.ready,
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
    notifications: Object.values(state.notifications),
    points: state.points,
    kudos: state.kudos,
    reports: Object.values(state.reports),
    currentUser: me ? (userById.get(me) ?? null) : null,
    nearLocationId: state.nearLocationId,
    likes: new Set(me ? (state.likes[me] ?? []) : []),
    saves: new Set(me ? (state.saves[me] ?? []) : []),
    follows: new Set(me ? (state.follows[me] ?? []) : []),
    blocked: new Set(me ? (state.blocked[me] ?? []) : []),
  };
  cache.set(state, world);
  return world;
}

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
