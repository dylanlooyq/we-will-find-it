/**
 * Prerendering must never read the real clock (the build would bake in its own time, and the
 * browser's first render has to match it). Pages are built as of this fixed instant; the browser
 * switches to the real time right after hydration — see `useNow()`.
 */
export const PRERENDER_NOW = Date.parse("2026-10-08T15:30:00+08:00");

export const MIN = 60_000;
export const HOUR = 60 * MIN;
export const DAY = 24 * HOUR;
