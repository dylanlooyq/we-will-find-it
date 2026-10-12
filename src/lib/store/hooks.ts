"use client";

import { useMemo, useSyncExternalStore } from "react";
import { PRERENDER_NOW } from "../clock";
import { mockMatchingService } from "../matching";
import type { Item, Match, User } from "../types";
import { buildWorld, type World } from "../world";
import { getServerState, getState, subscribe } from "./store";

/**
 * Everything a screen needs. On the server (and during hydration) this is the empty world, so
 * markup always matches; the member's data arrives right after hydration — check `world.ready`
 * before concluding that something doesn't exist.
 */
export function useWorld(): World {
  const state = useSyncExternalStore(subscribe, getState, getServerState);
  return useMemo(() => buildWorld(state), [state]);
}

export function useCurrentUser(): User | null {
  return useWorld().currentUser;
}

/** True once the page has hydrated and the member's data is here — only then does "missing" mean missing. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => getState().ready, () => false);
}

/* ── Clock ────────────────────────────────────────────────── */

let nowSnap = PRERENDER_NOW;
const nowListeners = new Set<() => void>();
let nowTimer: ReturnType<typeof setInterval> | undefined;

function subscribeNow(cb: () => void) {
  nowListeners.add(cb);
  nowSnap = Date.now();
  if (!nowTimer) {
    nowTimer = setInterval(() => {
      nowSnap = Date.now();
      nowListeners.forEach((l) => l());
    }, 30_000);
  }
  return () => {
    nowListeners.delete(cb);
    if (!nowListeners.size && nowTimer) {
      clearInterval(nowTimer);
      nowTimer = undefined;
    }
  };
}

/** The current time in ms, refreshed every 30s. A fixed instant on the server and during hydration. */
export function useNow(): number {
  return useSyncExternalStore(subscribeNow, () => nowSnap, () => PRERENDER_NOW);
}

/* ── Derived data ─────────────────────────────────────────── */

export function useItem(slug: string): Item | undefined {
  return useWorld().itemBySlug.get(slug);
}

export function useMatches(item: Item | undefined): (Match & { other: Item })[] {
  const w = useWorld();
  return useMemo(() => {
    if (!item) return [];
    return mockMatchingService
      .getMatches(item, w.items.filter((i) => i.moderation === "ok"))
      .map((m) => ({ ...m, other: w.itemById.get(item.type === "lost" ? m.foundItemId : m.lostItemId)! }))
      .filter((m) => m.other);
  }, [item, w]);
}
