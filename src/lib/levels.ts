import type { Level, PointsKind } from "./types";

const TIERS: { level: number; title: string; min: number }[] = [
  { level: 1, title: "Newcomer", min: 0 },
  { level: 2, title: "Explorer", min: 50 },
  { level: 3, title: "Regular", min: 150 },
  { level: 4, title: "Trusted Finder", min: 300 },
  { level: 5, title: "Community Hero", min: 500 },
  { level: 6, title: "Legend", min: 1000 },
];

export const LEVELS = TIERS.map((t, i) => ({ ...t, next: TIERS[i + 1]?.min ?? null }));

export function levelFor(points: number): Level {
  let current = LEVELS[0];
  for (const l of LEVELS) if (points >= l.min) current = l;
  return current;
}

export interface LevelProgress {
  level: Level;
  /** 0–1 progress towards the next level (1 at max level) */
  ratio: number;
  toNext: number | null;
  nextTitle: string | null;
}

export function levelProgress(points: number): LevelProgress {
  const level = levelFor(points);
  if (level.next === null) return { level, ratio: 1, toNext: null, nextTitle: null };
  const span = level.next - level.min;
  return {
    level,
    ratio: Math.min(1, (points - level.min) / span),
    toNext: level.next - points,
    nextTitle: LEVELS[level.level]?.title ?? null,
  };
}

export const POINTS_RULES: { kind: PointsKind; label: string; points: number }[] = [
  { kind: "post_found", label: "Post a found item", points: 10 },
  { kind: "confirm_match", label: "Help confirm a match", points: 10 },
  { kind: "thank_you", label: "Receive a thank-you", points: 20 },
  { kind: "return", label: "Successfully return an item", points: 30 },
  { kind: "bounty_return", label: "Return a bounty item", points: 50 },
  { kind: "top_area", label: "Top finder in your area (monthly)", points: 50 },
  { kind: "profile_complete", label: "Complete your profile", points: 10 },
];

export const POINTS_BY_KIND = Object.fromEntries(POINTS_RULES.map((r) => [r.kind, r.points])) as Record<
  PointsKind,
  number
>;
