"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Coins, List, Map as MapIcon, SearchX, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { categoryById, getLocation } from "@/lib/data/taxonomy";
import {
  DEFAULT_FILTERS,
  activeFilterCount,
  filtersFromParams,
  filtersToParams,
  runSearch,
  type Filters,
  type TypeFilter,
} from "@/lib/search";
import { useNow, useWorld } from "@/lib/store/hooks";
import { activePublicItems } from "@/lib/world";
import { PostButton } from "../layout/post-chooser";
import { ItemMap } from "../map/item-map";
import { Button } from "../ui/button";
import { Chip, ChipLink, Segmented, SearchInput } from "../ui/form";
import { Overlay } from "../ui/overlay";
import { Container, PageHeader } from "../ui/section";
import { EmptyState, ItemCardSkeleton } from "../ui/states";
import { FilterFields } from "./filter-fields";
import { ItemCard, ItemRow } from "./item-card";
import { NearChip } from "./near-chip";

const PRESETS: Record<string, TypeFilter> = { "/lost": "lost", "/found": "found", "/pets": "pets" };

const COPY: Record<TypeFilter, { eyebrow: string; title: string }> = {
  all: { eyebrow: "Explore", title: "Lost & found across Singapore" },
  lost: { eyebrow: "Lost items", title: "Help someone find what they lost" },
  found: { eyebrow: "Found items", title: "Found items waiting for their owners" },
  pets: { eyebrow: "Pets", title: "Lost & found pets" },
};

const PAGE = 12;

export function ExploreSkeleton() {
  return (
    <Container className="py-10">
      <div className="h-24" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <ItemCardSkeleton key={i} />
        ))}
      </div>
    </Container>
  );
}

/** The whole discovery experience: search, filters, list and map. */
export function ExploreView({ forceView }: { forceView?: "list" | "map" }) {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();
  const w = useWorld();
  const now = useNow();
  const preset: TypeFilter = PRESETS[pathname] ?? "all";

  const filters = useMemo(() => filtersFromParams(new URLSearchParams(sp.toString()), preset), [sp, preset]);
  const view = forceView ?? (sp.get("view") === "map" ? "map" : "list");

  // What the user has typed but the URL hasn't caught up with yet (null = show the URL's value)
  const [typed, setTyped] = useState<string | null>(null);
  if (typed !== null && typed === filters.q) setTyped(null);
  const q = typed ?? filters.q;
  const [sheet, setSheet] = useState(false);
  const pageKey = `${pathname}?${sp.toString()}`;
  const [paging, setPaging] = useState({ key: pageKey, n: PAGE });
  const shown = paging.key === pageKey ? paging.n : PAGE;
  const [selected, setSelected] = useState<string | null>(null);

  const push = useCallback(
    (next: Filters, nextView = view) => {
      const p = filtersToParams(next, preset);
      if (nextView === "map" && !forceView) p.set("view", "map");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, preset, router, view, forceView],
  );

  const update = useCallback((patch: Partial<Filters>) => push({ ...filters, ...patch }), [filters, push]);

  // Debounced search → URL
  useEffect(() => {
    if (typed === null || typed === filters.q) return;
    const t = setTimeout(() => update({ q: typed }), 280);
    return () => clearTimeout(t);
  }, [typed, filters.q, update]);

  const base = useMemo(() => activePublicItems(w), [w]);
  const results = useMemo(() => runSearch(w, base, filters, w.nearLocationId, now), [w, base, filters, now]);
  const counts = useMemo(() => {
    const c = (type: TypeFilter) => runSearch(w, base, { ...filters, type }, w.nearLocationId, now).length;
    return { all: c("all"), lost: c("lost"), found: c("found"), pets: c("pets") };
  }, [w, base, filters, now]);

  const origin = getLocation(filters.locationId ?? w.nearLocationId);
  const copy = COPY[preset];
  const nActive = activeFilterCount(filters);
  const carry = (() => {
    const p = filtersToParams({ ...filters, type: "all" }, "all");
    if (view === "map" && !forceView) p.set("view", "map");
    const s = p.toString();
    return s ? `?${s}` : "";
  })();

  const pills: { key: string; label: string; clear: Partial<Filters> }[] = [];
  if (filters.categories.length) pills.push({ key: "cat", label: filters.categories.map((c) => categoryById[c].label).join(", "), clear: { categories: [] } });
  if (filters.locationId) pills.push({ key: "loc", label: `Near ${getLocation(filters.locationId).name}`, clear: { locationId: null } });
  if (filters.distance) pills.push({ key: "dist", label: `Within ${filters.distance} km`, clear: { distance: 0 } });
  if (filters.date !== "any") pills.push({ key: "date", label: filters.date === "1" ? "Last 24 hours" : `Last ${filters.date} days`, clear: { date: "any" } });
  if (filters.bountyOnly) pills.push({ key: "bounty", label: "Bounties only", clear: { bountyOnly: false } });
  if (filters.sort !== "new") pills.push({ key: "sort", label: filters.sort === "near" ? "Nearest first" : "Highest bounty", clear: { sort: "new" } });

  const mapEntries = results.map((r) => ({ item: r.item, bounty: r.bounty, distanceKm: r.distanceKm }));
  const visible = results.slice(0, shown);

  const clearAll = () => {
    setTyped(null);
    push({ ...DEFAULT_FILTERS, type: preset });
  };

  const resultsBody =
    results.length === 0 ? (
      <EmptyState
        icon={<SearchX className="size-9" aria-hidden />}
        title="No nearby items"
        body="Nothing here yet. Check again later or post what you're looking for."
        tone="coral"
        action={
          <>
            <PostButton>Post a Lost Item</PostButton>
            {(nActive > 0 || q) && (
              <Button variant="secondary" onClick={clearAll}>
                Clear filters
              </Button>
            )}
          </>
        }
      />
    ) : view === "list" ? (
      <>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((r, i) => (
            <ItemCard key={r.item.id} item={r.item} bountyAmount={r.bounty || undefined} distanceKm={r.distanceKm} priority={i < 3} className="h-full" titleAs="h2" />
          ))}
        </div>
        {shown < results.length && (
          <div className="mt-8 flex justify-center">
            <Button variant="secondary" size="lg" onClick={() => setPaging({ key: pageKey, n: shown + PAGE })}>
              Show more ({results.length - shown} left)
            </Button>
          </div>
        )}
      </>
    ) : null;

  return (
    <Container className="pb-6 pt-6 sm:pt-8">
      <PageHeader eyebrow={copy.eyebrow} title={copy.title} />

      {/* Search and the list/map switch share a line; on a phone the switch shrinks to its icons. */}
      <div className="mt-4 flex items-center gap-2.5 sm:gap-3">
        <SearchInput value={q} onChange={setTyped} className="min-w-0 flex-1" />
        {!forceView && (
          <Segmented<"list" | "map">
            label="Layout"
            value={view}
            onChange={(v) => push(filters, v)}
            className="shrink-0"
            options={[
              { value: "list", label: <span className="max-sm:sr-only">List</span>, icon: <List className="size-4" aria-hidden /> },
              { value: "map", label: <span className="max-sm:sr-only">Map</span>, icon: <MapIcon className="size-4" aria-hidden /> },
            ]}
          />
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <ChipLink href={`/explore${carry}`} active={preset === "all"} count={counts.all}>
          All
        </ChipLink>
        <ChipLink href={`/lost${carry}`} active={preset === "lost"} tone="coral" count={counts.lost}>
          Lost
        </ChipLink>
        <ChipLink href={`/found${carry}`} active={preset === "found"} tone="found" count={counts.found}>
          Found
        </ChipLink>
        <ChipLink href={`/pets${carry}`} active={preset === "pets"} count={counts.pets}>
          Pets
        </ChipLink>
        <ChipLink href="/bounties" tone="gold" icon={<Coins className="size-4" aria-hidden />}>
          Bounties
        </ChipLink>
        <span className="mx-1 hidden h-6 w-px shrink-0 bg-line sm:block" aria-hidden />
        <NearChip className="hidden shrink-0 sm:inline-flex" />
        <Chip onClick={() => setSheet(true)} className="ml-auto lg:hidden" icon={<SlidersHorizontal className="size-4" aria-hidden />} active={nActive > 0} count={nActive || undefined}>
          Filters
        </Chip>
      </div>

      {pills.length > 0 && (
        <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {pills.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => update(p.clear)}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-coral-50 pl-3 pr-2 text-xs font-bold text-coral-800 hover:bg-coral-100"
                aria-label={`Remove filter: ${p.label}`}
              >
                {p.label}
                <X className="size-3.5" aria-hidden />
              </button>
            </li>
          ))}
          <li>
            <button type="button" onClick={clearAll} className="px-2 text-xs font-bold text-navy-600 underline underline-offset-4 hover:text-navy-900">
              Clear all
            </button>
          </li>
        </ul>
      )}

      <p className="mt-4 text-sm font-semibold text-navy-600" aria-live="polite">
        {results.length} {results.length === 1 ? "listing" : "listings"}
        {q && <> for “{q}”</>}
      </p>

      {view === "list" ? (
        <div className="mt-4 grid gap-8 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
          <aside className="hidden lg:block" aria-label="Filters">
            <div className="sticky top-24 rounded-card bg-white p-5 shadow-soft">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-navy-900">Filters</h2>
                {nActive > 0 && (
                  <button type="button" onClick={clearAll} className="text-sm font-bold text-coral-700 hover:underline">
                    Reset
                  </button>
                )}
              </div>
              <FilterFields filters={filters} onChange={update} originId={w.nearLocationId} />
            </div>
          </aside>
          <section aria-label="Results">{resultsBody}</section>
        </div>
      ) : (
        <div className="mt-4 grid gap-5 lg:grid-cols-[26rem_minmax(0,1fr)]">
          <section aria-label="Results" className="order-2 lg:order-1 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto lg:pr-2">
            {results.length === 0 ? (
              resultsBody
            ) : (
              <ul className="space-y-3">
                {results.slice(0, 40).map((r) => (
                  <li key={r.item.id} onMouseEnter={() => setSelected(r.item.id)} className={cn("rounded-2xl transition-shadow", selected === r.item.id && "ring-2 ring-coral-500")}>
                    <ItemRow item={r.item} bountyAmount={r.bounty || undefined} titleAs="h2" />
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="order-1 lg:sticky lg:top-24 lg:order-2 lg:h-[calc(100dvh-12rem)]">
            <ItemMap entries={mapEntries} origin={origin} selectedId={selected} onSelect={setSelected} className="h-[58dvh] rounded-card shadow-soft lg:h-full" />
          </div>
        </div>
      )}

      <Overlay open={sheet} onClose={() => setSheet(false)} title="Filters" variant="sheet">
        <div className="mt-3">
          <FilterFields filters={filters} onChange={update} originId={w.nearLocationId} />
        </div>
        <div className="sticky bottom-0 -mx-6 mt-6 flex gap-3 border-t border-line bg-white px-6 pt-4">
          <Button variant="secondary" size="lg" onClick={clearAll} className="flex-1">
            Clear all
          </Button>
          <Button size="lg" onClick={() => setSheet(false)} className="flex-[1.4]">
            Show {results.length} results
          </Button>
        </div>
      </Overlay>
    </Container>
  );
}
