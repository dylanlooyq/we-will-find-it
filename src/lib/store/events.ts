import type { Level } from "../types";

/**
 * A tiny pub-sub the store uses to tell the UI that something delightful
 * (or important) happened: a toast, points earned, a badge unlocked…
 * Keeping it separate means the data layer never imports UI code.
 */
export type AppEvent =
  | { type: "toast"; tone: "success" | "info" | "celebrate" | "error"; title: string; body?: string; href?: string }
  | { type: "points"; points: number; label: string; total: number }
  | { type: "badge"; badgeId: string }
  | { type: "level"; level: Level };

type Listener = (e: AppEvent) => void;
const listeners = new Set<Listener>();

export function onAppEvent(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit(e: AppEvent) {
  for (const fn of listeners) fn(e);
}

export function toast(title: string, opts: { body?: string; tone?: "success" | "info" | "celebrate" | "error"; href?: string } = {}) {
  emit({ type: "toast", tone: opts.tone ?? "success", title, body: opts.body, href: opts.href });
}
