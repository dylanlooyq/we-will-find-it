import { distanceKm } from "./geo";
import { getLocation } from "./data/taxonomy";
import type { Item, Match } from "./types";

/**
 * Mock matching engine.
 *
 * `MatchingService` is the seam: today `mockMatchingService` scores listings
 * in-process; a real service (embeddings, image similarity, …) can implement
 * the same interface and be swapped in without touching any UI.
 */
export interface MatchingService {
  getMatches(item: Item, pool: Item[]): Match[];
}

const STOP = new Set(["the", "a", "an", "with", "in", "of", "and", "near", "at", "my", "for", "case", "found", "lost"]);

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((t) => t && !STOP.has(t)),
  );
}

/** |A∩B| / min(|A|,|B|) — forgiving of one listing being wordier than the other. */
function overlap(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / Math.min(a.size, b.size);
}

function detail(item: Item, label: string): string {
  return (item.details.find((d) => d.label.toLowerCase() === label)?.value ?? "").toLowerCase().trim();
}

function distanceScore(km: number): number {
  if (km < 0.3) return 20;
  if (km < 1) return 14;
  if (km < 3) return 10;
  if (km < 6) return 6;
  if (km < 12) return 2;
  return 0;
}

export function scoreMatch(lost: Item, found: Item): Match | null {
  if (lost.category !== found.category) return null;

  const reasons: string[] = [];
  let score = 20; // same category

  const t = overlap(tokens(lost.title), tokens(found.title));
  score += Math.round(t * 25);
  if (t >= 0.6) reasons.push("Similar description");

  const brand = detail(lost, "brand");
  const model = detail(lost, "model");
  const foundBrand = detail(found, "brand");
  let d = 0;
  if (brand && brand === foundBrand) d += 6;
  if (model) {
    if (model === detail(found, "model")) d += 9;
  } else if (brand && brand === foundBrand) {
    // No separate model on the post — the title usually carries it ("iPhone 14 Pro"), so lean on that.
    d += Math.round(t * 9);
  }
  if (!brand && !model && !foundBrand) d = Math.round(overlap(tokens(lost.description), tokens(found.description)) * 15);
  score += d;
  if (d >= 9) reasons.push("Brand & model match");

  const c = overlap(tokens(detail(lost, "colour")), tokens(detail(found, "colour") || found.title));
  score += Math.round(c * 10);
  if (c >= 0.5) reasons.push("Colour matches");

  const km = distanceKm(getLocation(lost.locationId), getLocation(found.locationId));
  score += distanceScore(km);
  if (km < 1) reasons.push("Found nearby");

  const lostTime = Date.parse(lost.occurredAt);
  const foundTime = Date.parse(found.occurredAt);
  const gap = foundTime - lostTime;
  if (gap >= -12 * 3_600_000 && gap <= 3 * 86_400_000) {
    score += 10;
    reasons.push("Found soon after it went missing");
  } else if (gap >= -3 * 86_400_000 && gap <= 10 * 86_400_000) {
    // Loss dates are often approximate, so a find just before the stated loss still counts a little.
    score += 5;
  }

  const pct = Math.min(99, Math.max(0, score));
  return {
    id: `mt_${lost.id}_${found.id}`,
    lostItemId: lost.id,
    foundItemId: found.id,
    score: pct,
    reasons,
    distanceKm: km,
  };
}

export const mockMatchingService: MatchingService = {
  getMatches(item, pool) {
    const wantType = item.type === "lost" ? "found" : "lost";
    const out: Match[] = [];
    for (const other of pool) {
      if (other.id === item.id || other.type !== wantType) continue;
      if (other.status !== "active" || other.moderation !== "ok" || other.ownerId === item.ownerId) continue;
      const m = item.type === "lost" ? scoreMatch(item, other) : scoreMatch(other, item);
      if (m && m.score >= 55) out.push(m);
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 5);
  },
};

/** Convenience wrapper: the *other* item in each match, relative to `item`. */
export function otherItemId(match: Match, item: Item): string {
  return item.type === "lost" ? match.foundItemId : match.lostItemId;
}
