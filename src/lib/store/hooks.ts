"use client";

import { useMemo, useSyncExternalStore } from "react";
import { DEMO_NOW } from "../clock";
import { mockMatchingService } from "../matching";
import type { Item, Match, User } from "../types";
import { EMPTY_OVERLAY, buildWorld, type Overlay, type World } from "../world";
import { demoNowMs, getServerState, getState, subscribe, typingStore } from "./store";

/** The raw overlay of local changes. Prefer `useWorld()`. */
export function useOverlay(): Overlay {
  return useSyncExternalStore(subscribe, getState, getServerState);
}

/**
 * Everything a screen needs: seed data + this session's changes.
 * On the server (and during hydration) this is exactly the seed world, so
 * markup always matches; real state arrives right after hydration.
 */
export function useWorld(): World {
  const overlay = useOverlay();
  return useMemo(() => buildWorld(overlay), [overlay]);
}

export function useCurrentUser(): User | null {
  return useWorld().currentUser;
}

/** True once the client has hydrated and local state has been read. */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/* ── Demo clock ───────────────────────────────────────────── */

let nowSnap = DEMO_NOW;
const nowListeners = new Set<() => void>();
let nowTimer: ReturnType<typeof setInterval> | undefined;

function subscribeNow(cb: () => void) {
  nowListeners.add(cb);
  nowSnap = demoNowMs();
  if (!nowTimer) {
    nowTimer = setInterval(() => {
      nowSnap = demoNowMs();
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

/** Current demo time in ms. Equals DEMO_NOW on the server and during hydration. */
export function useNow(): number {
  return useSyncExternalStore(subscribeNow, () => nowSnap, () => DEMO_NOW);
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

export function useIsTyping(convId: string): boolean {
  const set = useSyncExternalStore(typingStore.subscribe, typingStore.get, typingStore.getServer);
  return set.has(convId);
}

export { EMPTY_OVERLAY };
