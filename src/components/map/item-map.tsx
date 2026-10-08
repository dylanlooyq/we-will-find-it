"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Crosshair, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation } from "@/lib/data/taxonomy";
import { formatDistance } from "@/lib/geo";
import type { Item } from "@/lib/types";
import { BountyBadge, StatusBadge } from "../ui/badges";
import { IconButton } from "../ui/button";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";
import { Skeleton } from "../ui/states";
import type { MapPoint } from "./map-inner";
import type { PinKind } from "./pin-html";

const MapInner = dynamic(() => import("./map-inner"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-sky" role="status" aria-label="Loading map">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  ),
});

export interface MapEntry {
  item: Item;
  bounty: number;
  distanceKm?: number;
}

/** Items sharing a station would stack exactly — fan them out around it. */
function spread(entries: MapEntry[]): MapPoint[] {
  const groups = new Map<string, MapEntry[]>();
  for (const e of entries) {
    const g = groups.get(e.item.locationId) ?? [];
    g.push(e);
    groups.set(e.item.locationId, g);
  }
  const out: MapPoint[] = [];
  for (const [locId, g] of groups) {
    const loc = getLocation(locId);
    g.forEach((e, i) => {
      const n = g.length;
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const r = n === 1 ? 0 : 0.0007 + Math.min(n, 8) * 0.00006;
      const kind: PinKind = e.bounty ? "bounty" : e.item.type;
      out.push({
        id: e.item.id,
        lat: loc.lat + Math.sin(angle) * r,
        lng: loc.lng + (Math.cos(angle) * r) / 0.99,
        kind,
        label: `${e.item.type === "lost" ? "Lost" : "Found"}: ${e.item.title}`,
      });
    });
  }
  return out;
}

export function ItemMap({
  entries,
  origin,
  selectedId,
  onSelect,
  className,
  initialZoom,
}: {
  entries: MapEntry[];
  origin?: { lat: number; lng: number };
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  className?: string;
  initialZoom?: number;
}) {
  const [internal, setInternal] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const selId = selectedId !== undefined ? selectedId : internal;
  const setSel = onSelect ?? setInternal;
  const points = useMemo(() => spread(entries), [entries]);
  const selected = entries.find((e) => e.item.id === selId);

  const counts = useMemo(() => {
    let lost = 0,
      found = 0,
      bounty = 0;
    for (const e of entries) {
      if (e.item.type === "lost") lost++;
      else found++;
      if (e.bounty) bounty++;
    }
    return { lost, found, bounty };
  }, [entries]);

  return (
    <div className={cn("relative isolate overflow-hidden bg-sky", className)}>
      <MapInner points={points} selectedId={selId ?? null} onSelect={setSel} origin={origin} recenterNonce={nonce} initialZoom={initialZoom} />

      <ul className="absolute left-3 top-3 z-[500] flex flex-wrap gap-2" aria-label="Map legend">
        {[
          { label: "Lost", n: counts.lost, dot: "bg-coral-600", glyph: "?" },
          { label: "Found", n: counts.found, dot: "bg-found-600", glyph: "✓" },
          { label: "Bounty", n: counts.bounty, dot: "bg-gold-500", glyph: "$" },
        ].map((l) => (
          <li key={l.label} className="glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-navy-900 shadow-soft">
            <span className={cn("flex size-4 items-center justify-center rounded-full text-[0.6rem] font-extrabold text-white", l.dot)} aria-hidden>
              {l.glyph}
            </span>
            {l.label} <span className="tabular-nums text-navy-500">{l.n}</span>
          </li>
        ))}
      </ul>

      {origin && (
        <IconButton label="Centre on my area" tone="glass" onClick={() => setNonce((n) => n + 1)} className="absolute right-3 top-3 z-[500]">
          <Crosshair className="size-5" />
        </IconButton>
      )}

      {selected && (
        <div className="absolute inset-x-3 bottom-3 z-[600] animate-sheet-up sm:inset-x-auto sm:bottom-4 sm:left-4 sm:w-[24rem]">
          <div className="relative flex gap-3 rounded-2xl bg-white p-3 shadow-pop">
            <ItemImage image={selected.item.images[0]} category={selected.item.category} compact className="size-[5.5rem] shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge type={selected.item.type} pet={selected.item.category === "pets"} variant="soft" />
                {selected.bounty ? <BountyBadge amount={selected.bounty} variant="soft" /> : null}
              </div>
              <p className="mt-1 truncate text-[0.98rem] font-extrabold text-navy-900">
                <Link href={`/item/${selected.item.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl">
                  {selected.item.pet?.name ? `${selected.item.pet.name} · ${selected.item.pet.breed}` : selected.item.title}
                </Link>
              </p>
              <p className="truncate text-sm text-navy-600">{getLocation(selected.item.locationId).name}</p>
              <p className="mt-0.5 text-xs font-medium text-navy-500">
                <RelativeTime iso={selected.item.postedAt} />
                {selected.distanceKm !== undefined && <> · {formatDistance(selected.distanceKm)}</>}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close preview"
              onClick={() => setSel(null)}
              className="relative z-10 -mr-1 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full text-navy-500 hover:bg-navy-100"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
