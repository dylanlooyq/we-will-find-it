import { ActionError, applyAction, type ActionName, type AuthAccount } from "../src/lib/store/reducer.ts";
import type { Item, User } from "../src/lib/types.ts";
import { EMPTY_STATE, type State } from "../src/lib/world.ts";

/**
 * The world in D1: one JSON document per profile, listing, claim, conversation and so on (table `doc`).
 *
 * Writes are whole actions (src/lib/store/reducer.ts) applied to the full state and committed as one
 * batch that first checks the revision counter hasn't moved — if someone else wrote in between, the
 * batch rolls back and the action is run again on fresh data. Nothing is ever half-applied.
 *
 * Each isolate keeps the last state it read; a request only re-reads the table when the revision
 * has changed. This is simple and safe at launch scale; listings and conversations would move to
 * their own tables once the full state no longer fits comfortably in memory.
 */

const RECORDS = ["items", "bounties", "claims", "conversations", "notifications", "users", "reports"] as const;
const LISTS = ["points", "kudos"] as const;
const SETS = ["likes", "saves", "follows", "blocked"] as const;

/** `kind/id` → the row's JSON, exactly as stored. */
type Docs = Map<string, string>;

export interface Snapshot {
  rev: number;
  /** Everything, as nobody in particular: `sessionUserId` is null. */
  state: State;
  docs: Docs;
  /** Every id in use, so a new one can't land on top of an existing record. */
  ids: Set<string>;
}

let cached: Snapshot | undefined;

function toDocs(s: State): Docs {
  const docs: Docs = new Map();
  for (const kind of RECORDS) for (const [id, v] of Object.entries(s[kind])) docs.set(`${kind}/${id}`, JSON.stringify(v));
  for (const kind of LISTS) for (const v of s[kind]) docs.set(`${kind}/${v.id}`, JSON.stringify(v));
  for (const kind of SETS) for (const [id, v] of Object.entries(s[kind])) docs.set(`${kind}/${id}`, JSON.stringify(v));
  return docs;
}

function toState(rows: { kind: string; id: string; data: string }[]): State {
  const s: State = structuredClone({ ...EMPTY_STATE, ready: true });
  for (const row of rows) {
    const v = JSON.parse(row.data);
    if ((RECORDS as readonly string[]).includes(row.kind) || (SETS as readonly string[]).includes(row.kind)) (s[row.kind as (typeof RECORDS)[number]] as Record<string, unknown>)[row.id] = v;
    else if ((LISTS as readonly string[]).includes(row.kind)) (s[row.kind as (typeof LISTS)[number]] as unknown[]).push(v);
  }
  return s;
}

function snapshot(rev: number, state: State, docs: Docs): Snapshot {
  const ids = new Set<string>();
  for (const key of docs.keys()) ids.add(key.slice(key.indexOf("/") + 1));
  for (const c of Object.values(state.conversations)) for (const m of c.messages) ids.add(m.id);
  return { rev, state, docs, ids };
}

const REV = "SELECT value FROM meta WHERE key = 'rev'";

export async function load(env: Env): Promise<Snapshot> {
  if (cached) {
    const rev = await env.DB.prepare(REV).first<number>("value");
    if (rev === cached.rev) return cached;
  }
  // One batch, so the revision and the rows are the same moment in time.
  const [meta, rows] = await env.DB.batch<{ value: number } & { kind: string; id: string; data: string }>([env.DB.prepare(REV), env.DB.prepare("SELECT kind, id, data FROM doc")]);
  const state = toState(rows.results);
  cached = snapshot(meta.results[0].value, state, toDocs(state));
  return cached;
}

const isStale = (err: unknown) => String(err).includes("guard.ok");

const MAX_ATTEMPTS = 12;

/** Too many writers at once for this action to get a turn. Safe to send again. */
export class Busy extends Error {}

async function commit(env: Env, base: Snapshot, next: State, nonce: string): Promise<Snapshot> {
  const docs = toDocs(next);
  const writes: D1PreparedStatement[] = [];
  for (const [key, data] of docs) {
    if (base.docs.get(key) === data) continue;
    const slash = key.indexOf("/");
    writes.push(env.DB.prepare("INSERT INTO doc (kind, id, data) VALUES (?1, ?2, ?3) ON CONFLICT (kind, id) DO UPDATE SET data = excluded.data").bind(key.slice(0, slash), key.slice(slash + 1), data));
  }
  for (const key of base.docs.keys()) {
    if (docs.has(key)) continue;
    const slash = key.indexOf("/");
    writes.push(env.DB.prepare("DELETE FROM doc WHERE kind = ?1 AND id = ?2").bind(key.slice(0, slash), key.slice(slash + 1)));
  }
  if (!writes.length) return base;
  await env.DB.batch([
    // NULL (→ constraint failure → rollback) unless the revision is still the one we read.
    env.DB.prepare("INSERT INTO guard (ok) SELECT CASE WHEN value = ?1 THEN 1 END FROM meta WHERE key = 'rev'").bind(base.rev),
    env.DB.prepare("DELETE FROM guard"),
    env.DB.prepare("UPDATE meta SET value = value + 1 WHERE key = 'rev'"),
    env.DB.prepare("INSERT INTO applied (nonce, at) VALUES (?1, ?2)").bind(nonce, Date.now()),
    env.DB.prepare("DELETE FROM applied WHERE at < ?1").bind(Date.now() - 86_400_000),
    ...writes,
  ]);
  cached = snapshot(base.rev + 1, next, docs);
  return cached;
}

/**
 * Run one action as `actorId` and commit it. Retries on fresh data if another write got in first.
 * Throws `ActionError` when the action isn't allowed. An action that was already carried out (same
 * nonce — the browser resent it) is not repeated; `result` is then undefined.
 */
export async function act<N extends ActionName>(env: Env, actorId: string | null, name: N, args: Parameters<typeof applyAction<N>>[2], nonce: string): Promise<{ snapshot: Snapshot; result: ReturnType<typeof applyAction<N>>["result"] }> {
  const done = async () => ({ snapshot: await load(env), result: undefined as ReturnType<typeof applyAction<N>>["result"] });
  if (await env.DB.prepare("SELECT 1 FROM applied WHERE nonce = ?1").bind(nonce).first()) return done();
  for (let attempt = 0; ; attempt++) {
    const base = await load(env);
    const applied = applyAction({ ...base.state, sessionUserId: actorId }, name, args, {
      nowMs: Date.now(),
      nonce,
      strict: true,
      taken: (id) => base.ids.has(id),
    });
    try {
      const snapshot = await commit(env, base, { ...applied.state, sessionUserId: null }, nonce);
      return { snapshot, result: applied.result };
    } catch (err) {
      // The same action, sent twice at once: the other copy won.
      if (String(err).includes("applied.nonce")) return done();
      if (!isStale(err)) throw err;
      if (attempt >= MAX_ATTEMPTS) throw new Busy();
      // Someone else's write landed first. Each round lets at least one writer through, so stagger and go again.
      await new Promise((r) => setTimeout(r, Math.random() * 40 * (attempt + 1)));
    }
  }
}

/** The profile behind a signed-in account, created on first sight and kept in step with the account. */
export async function profileOf(env: Env, account: AuthAccount): Promise<User> {
  const { state } = await load(env);
  const existing = Object.values(state.users).find((u) => u.authId === account.id);
  const role = account.admin ? "admin" : "member";
  if (existing && existing.verified === account.emailVerified && (existing.role ?? "member") === role) return existing;
  const { snapshot, result } = await act(env, null, "ensureProfile", account, crypto.randomUUID().replace(/-/g, "").slice(0, 10));
  return snapshot.state.users[result];
}

/* ── What each member may see ─────────────────────────────── */

function pick<T>(all: Record<string, T>, keep: (v: T) => boolean): Record<string, T> {
  return Object.fromEntries(Object.entries(all).filter(([, v]) => keep(v)));
}

/** The slice of the world one member (or a signed-out visitor, `null`) is allowed to read. */
export function viewFor(s: State, viewer: User | null): Omit<State, "ready" | "nearLocationId"> {
  const me = viewer?.id ?? null;
  const admin = viewer?.role === "admin";

  const conversations = pick(s.conversations, (c) => !!me && c.participantIds.includes(me));
  const claims = pick(s.claims, (c) => admin || (!!me && (c.claimantId === me || s.items[c.itemId]?.ownerId === me)));
  // Listings stay readable to the people already dealing with them, even after moderation hides them.
  const involved = new Set([...Object.values(conversations).map((c) => c.itemId), ...Object.values(claims).map((c) => c.itemId)]);

  const items: Record<string, Item> = {};
  for (const item of Object.values(s.items)) {
    const mine = item.ownerId === me;
    const listed = item.moderation === "ok" && !s.users[item.ownerId]?.suspended;
    if (!(admin || mine || listed || involved.has(item.id))) continue;
    // Hidden details and microchip numbers are how an owner tells a real finder from a chancer.
    items[item.id] = admin || mine ? item : { ...item, details: item.details.filter((d) => !d.hidden), ...(item.pet && { pet: { ...item.pet, microchip: undefined } }) };
  }

  const users: Record<string, User> = {};
  for (const u of Object.values(s.users)) users[u.id] = u.id === me ? u : { ...u, authId: undefined };

  return {
    sessionUserId: me,
    items,
    bounties: pick(s.bounties, (b) => !!items[b.itemId]),
    claims,
    conversations,
    notifications: pick(s.notifications, (n) => n.userId === me),
    users,
    reports: admin ? s.reports : {},
    points: s.points,
    kudos: s.kudos,
    likes: me && s.likes[me] ? { [me]: s.likes[me] } : {},
    saves: me && s.saves[me] ? { [me]: s.saves[me] } : {},
    follows: me && s.follows[me] ? { [me]: s.follows[me] } : {},
    blocked: me && s.blocked[me] ? { [me]: s.blocked[me] } : {},
  };
}

export { ActionError };
