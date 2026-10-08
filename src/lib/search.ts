import { areaById, getCategory, getLocation } from "./data/taxonomy";
import { DAY } from "./clock";
import { distanceKm } from "./geo";
import type { CategoryId, Item } from "./types";
import type { World } from "./world";
import { bountyForItem } from "./world";

export type TypeFilter = "all" | "lost" | "found" | "pets";
export type SortMode = "new" | "near" | "bounty";
export type DateRange = "any" | "1" | "7" | "30";
export type ViewMode = "list" | "map";

export interface Filters {
  q: string;
  type: TypeFilter;
  categories: CategoryId[];
  locationId: string | null;
  /** Max distance (km) from `originId`; 0 = any */
  distance: number;
  date: DateRange;
  bountyOnly: boolean;
  sort: SortMode;
}

export const DEFAULT_FILTERS: Filters = {
  q: "",
  type: "all",
  categories: [],
  locationId: null,
  distance: 0,
  date: "any",
  bountyOnly: false,
  sort: "new",
};

export const DISTANCE_STEPS = [0, 1, 3, 5, 10, 20] as const;

/** Everything a person might type that should find this listing. */
export function searchText(item: Item): string {
  const loc = getLocation(item.locationId);
  const parts = [
    item.title,
    item.description,
    loc.name,
    areaById[loc.area].name,
    item.locationNote ?? "",
    getCategory(item.category).label,
    item.type,
    ...item.details.filter((d) => !d.hidden).map((d) => d.value),
  ];
  if (item.pet) parts.push(item.pet.name ?? "", item.pet.breed, item.pet.colour, item.pet.species, "pet");
  return parts.join(" ").toLowerCase();
}

export interface Ranked {
  item: Item;
  score: number;
  distanceKm: number;
  bounty: number;
}

export function runSearch(world: World, items: Item[], f: Filters, originId: string, nowMs: number): Ranked[] {
  const origin = getLocation(f.locationId ?? originId);
  const tokens = f.q.toLowerCase().split(/\s+/).filter(Boolean);
  const out: Ranked[] = [];

  for (const item of items) {
    if (f.type === "lost" && item.type !== "lost") continue;
    if (f.type === "found" && item.type !== "found") continue;
    if (f.type === "pets" && item.category !== "pets") continue;
    if (f.categories.length && !f.categories.includes(item.category)) continue;

    const bounty = bountyForItem(world, item);
    const amount = bounty && (bounty.status === "open" || bounty.status === "claimed") ? bounty.amount : 0;
    if (f.bountyOnly && !amount) continue;

    if (f.date !== "any" && nowMs - Date.parse(item.occurredAt) > Number(f.date) * DAY) continue;

    const km = distanceKm(origin, getLocation(item.locationId));
    if (f.distance > 0 && km > f.distance) continue;

    let score = 0;
    if (tokens.length) {
      const hay = searchText(item);
      const title = item.title.toLowerCase();
      let ok = true;
      for (const t of tokens) {
        if (!hay.includes(t)) {
          ok = false;
          break;
        }
        score += title.includes(t) ? 3 : 1;
      }
      if (!ok) continue;
    }
    out.push({ item, score, distanceKm: km, bounty: amount });
  }

  const byRecent = (a: Ranked, b: Ranked) => Date.parse(b.item.postedAt) - Date.parse(a.item.postedAt);
  out.sort((a, b) => {
    if (tokens.length && b.score !== a.score && f.sort === "new") return b.score - a.score || byRecent(a, b);
    if (f.sort === "near") return a.distanceKm - b.distanceKm || byRecent(a, b);
    if (f.sort === "bounty") return b.bounty - a.bounty || byRecent(a, b);
    return byRecent(a, b);
  });
  return out;
}

/** Filters ⇄ URL search params (only non-default values are written). */
export function filtersFromParams(p: URLSearchParams, preset: TypeFilter = "all"): Filters {
  const type = (p.get("type") as TypeFilter | null) ?? preset;
  const dist = Number(p.get("dist") ?? 0);
  return {
    q: p.get("q") ?? "",
    type: ["all", "lost", "found", "pets"].includes(type) ? type : preset,
    categories: (p.get("cat") ?? "").split(",").filter(Boolean) as CategoryId[],
    locationId: p.get("loc"),
    distance: (DISTANCE_STEPS as readonly number[]).includes(dist) ? dist : 0,
    date: (["1", "7", "30"].includes(p.get("date") ?? "") ? p.get("date") : "any") as DateRange,
    bountyOnly: p.get("bounty") === "1",
    sort: (["near", "bounty"].includes(p.get("sort") ?? "") ? p.get("sort") : "new") as SortMode,
  };
}

export function filtersToParams(f: Filters, preset: TypeFilter = "all"): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.type !== preset) p.set("type", f.type);
  if (f.categories.length) p.set("cat", f.categories.join(","));
  if (f.locationId) p.set("loc", f.locationId);
  if (f.distance) p.set("dist", String(f.distance));
  if (f.date !== "any") p.set("date", f.date);
  if (f.bountyOnly) p.set("bounty", "1");
  if (f.sort !== "new") p.set("sort", f.sort);
  return p;
}

export function activeFilterCount(f: Filters): number {
  return (
    (f.categories.length ? 1 : 0) +
    (f.locationId ? 1 : 0) +
    (f.distance ? 1 : 0) +
    (f.date !== "any" ? 1 : 0) +
    (f.bountyOnly ? 1 : 0) +
    (f.sort !== "new" ? 1 : 0)
  );
}
