/**
 * Domain model for wewillfind.it.
 *
 * Everything the UI renders is expressed in these types. Seed data
 * (src/lib/data) implements them today; a backend can return the same
 * shapes tomorrow without touching a single component.
 */

export type ISODate = string;

/* ── Taxonomy ─────────────────────────────────────────────── */

export type ItemType = "lost" | "found";

export type CategoryId =
  | "electronics"
  | "wallets"
  | "keys"
  | "bags"
  | "accessories"
  | "clothing"
  | "documents"
  | "pets"
  | "other";

export type IconKey =
  | "smartphone"
  | "wallet"
  | "key"
  | "backpack"
  | "watch"
  | "shirt"
  | "file"
  | "paw"
  | "package";

export interface Category {
  id: CategoryId;
  label: string;
  icon: IconKey;
  /** Placeholder-image tint (gradient stops) */
  tint: [string, string];
}

export type AreaId =
  | "orchard"
  | "city"
  | "tampines"
  | "punggol"
  | "sengkang"
  | "woodlands"
  | "yishun"
  | "ang-mo-kio"
  | "bedok"
  | "jurong"
  | "changi"
  | "queenstown"
  | "bukit-merah"
  | "toa-payoh"
  | "bukit-timah"
  | "marine-parade"
  | "hougang";

export interface Area {
  id: AreaId;
  name: string;
  region: "Central" | "East" | "North" | "North-East" | "West";
  lat: number;
  lng: number;
}

export type LocationKind = "mrt" | "mall" | "park" | "campus" | "airport" | "landmark" | "neighbourhood";

export interface Location {
  id: string;
  name: string;
  area: AreaId;
  kind: LocationKind;
  lat: number;
  lng: number;
  /** Secondary line in pickers, e.g. "North-South Line" */
  detail?: string;
}

/* ── People ───────────────────────────────────────────────── */

export interface UserStats {
  itemsFound: number;
  itemsLost: number;
  itemsReturned: number;
  bountyReturns: number;
  /** Distinct areas the user has helped people in */
  areasHelped: number;
  /** People helped in the current calendar month */
  helpedThisMonth: number;
  electronicsReturned: number;
  /** Median reply time (minutes) to a first message */
  responseMinutes: number;
}

export interface UserPoints {
  allTime: number;
  /** Q4 2026 season — what the "Singapore" leaderboard tab ranks */
  season: number;
  month: number;
}

export interface User {
  id: string;
  handle: string;
  name: string;
  /** 0–360, drives the generated avatar */
  hue: number;
  bio: string;
  tagline?: string;
  homeArea: AreaId;
  memberSince: ISODate;
  verified: boolean;
  profileComplete: boolean;
  rating: number;
  reviews: number;
  stats: UserStats;
  points: UserPoints;
  /** Badge ids explicitly awarded (others are derived from stats) */
  badges: string[];
  /** Per-area points, used by the neighbourhood leaderboard */
  areaPoints: Partial<Record<AreaId, number>>;
  role?: "member" | "admin";
  suspended?: boolean;
  /** Uploaded avatar (data URL), falls back to initials */
  avatarSrc?: string;
  /** The real account (accounts API) this profile belongs to. Demo personas don't have one. */
  authId?: string;
}

export interface Level {
  level: number;
  title: string;
  min: number;
  next: number | null;
}

/* ── Items & bounties ─────────────────────────────────────── */

export type ItemStatus = "active" | "resolved";
export type ModerationState = "ok" | "hidden" | "removed" | "fraud";
export type PetSpecies = "dog" | "cat" | "other";

export interface ItemImage {
  /** File name under /public/images (e.g. "iphone-14-pro-orchard-1.jpg") */
  file: string;
  /** Shown while no photo exists, and used as alt text */
  label: string;
  /** Data URL for photos uploaded in-session */
  src?: string;
}

export interface IdentifyingDetail {
  label: string;
  value: string;
  /** Hidden details are only shared with verified claimants */
  hidden?: boolean;
}

export interface PetDetails {
  species: PetSpecies;
  name?: string;
  breed: string;
  colour: string;
  age?: string;
  collar?: string;
  /** Never exposed publicly — shown only to the owner */
  microchip?: string;
  /** Contact preference shown after a verified conversation */
  contactNote?: string;
}

export interface Item {
  id: string;
  slug: string;
  type: ItemType;
  status: ItemStatus;
  moderation: ModerationState;
  title: string;
  description: string;
  category: CategoryId;
  images: ItemImage[];
  locationId: string;
  /** Free-text refinement: "Platform B, near the escalators" */
  locationNote?: string;
  /** When it was lost / found */
  occurredAt: ISODate;
  /** "Around 8 PM" */
  timeLabel: string;
  postedAt: ISODate;
  ownerId: string;
  bountyId?: string;
  details: IdentifyingDetail[];
  pet?: PetDetails;
  likes: number;
  comments: number;
  views: number;
  resolvedAt?: ISODate;
  /** Who it was returned by (finder) once resolved */
  resolvedWithUserId?: string;
}

export type BountyStatus = "open" | "claimed" | "approved" | "released" | "expired" | "cancelled";

export interface Bounty {
  id: string;
  itemId: string;
  amount: number;
  currency: "SGD";
  status: BountyStatus;
  createdAt: ISODate;
  expiresAt: ISODate;
  /** The claim that was approved, if any */
  winningClaimId?: string;
}

export type ClaimStatus = "submitted" | "more_info" | "approved" | "rejected" | "received" | "flagged";

export interface Claim {
  id: string;
  bountyId: string;
  itemId: string;
  claimantId: string;
  status: ClaimStatus;
  proof: ItemImage[];
  message: string;
  createdAt: ISODate;
  /** Owner's request for more info / rejection reason */
  ownerNote?: string;
  conversationId?: string;
}

/* ── Conversations ────────────────────────────────────────── */

export type MessageKind = "text" | "photo" | "location" | "system" | "quick";

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  text?: string;
  photo?: ItemImage;
  locationId?: string;
  at: ISODate;
}

export interface Conversation {
  id: string;
  itemId: string;
  /** [owner of item, other party] — order is not significant */
  participantIds: [string, string];
  messages: Message[];
  /** user id → ISO of the last time they read it */
  readAt: Record<string, ISODate>;
  claimId?: string;
  returned?: boolean;
}

/* ── Community signals ────────────────────────────────────── */

export type NotificationType = "match" | "bounty" | "comment" | "update" | "kudos";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  at: ISODate;
  read: boolean;
  /** Deep link into the relevant page */
  href: string;
  itemId?: string;
}

export type PointsKind =
  | "post_found"
  | "confirm_match"
  | "thank_you"
  | "return"
  | "bounty_return"
  | "top_area"
  | "profile_complete";

export interface PointsTransaction {
  id: string;
  userId: string;
  kind: PointsKind;
  points: number;
  label: string;
  at: ISODate;
  itemId?: string;
}

export type KudosTone = "heart" | "thumb" | "star";

export interface Kudos {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemId?: string;
  tone: KudosTone;
  message: string;
  at: ISODate;
}

export type ReportTarget = "item" | "user" | "claim";
export type ReportStatus = "open" | "reviewing" | "actioned" | "dismissed";

export interface Report {
  id: string;
  targetType: ReportTarget;
  targetId: string;
  reporterId: string;
  reason: string;
  detail?: string;
  status: ReportStatus;
  at: ISODate;
}

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  /** 0–100 */
  score: number;
  reasons: string[];
  distanceKm: number;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  group: "Finder" | "Loser" | "Community" | "Special";
  /** Visual identity — colour family + glyph key, rendered by <BadgeIcon> */
  glyph:
    | "heart"
    | "bolt"
    | "box"
    | "crown-box"
    | "trophy"
    | "merlion"
    | "shield"
    | "flame"
    | "pin"
    | "star"
    | "check"
    | "chip"
    | "hand";
  tone: "coral" | "violet" | "gold" | "blue" | "green" | "navy";
  goal: number;
}

export interface BadgeProgress {
  def: BadgeDef;
  earned: boolean;
  progress: number;
  goal: number;
}
