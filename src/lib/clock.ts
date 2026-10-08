/**
 * The seed world is frozen at a fixed "now" so server and client always agree
 * (and so prerendering never touches the real clock). On the client the demo
 * clock then ticks forward from this anchor — see `useNow()`.
 */
export const DEMO_NOW_ISO = "2026-10-08T15:30:00+08:00";
export const DEMO_NOW = Date.parse(DEMO_NOW_ISO);

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;

/** ISO string for `ms` before the demo anchor — used to author seed data readably. */
export function ago(ms: number): string {
  return new Date(DEMO_NOW - ms).toISOString();
}

/** ISO string for `ms` after the demo anchor. */
export function fromNow(ms: number): string {
  return new Date(DEMO_NOW + ms).toISOString();
}
