"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Building2, Crosshair, GraduationCap, MapPin, Plane, ShoppingBag, TrainFront, TramFront, Trees, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { areaById, getLocation, locations } from "@/lib/data/taxonomy";
import { distanceKm } from "@/lib/geo";
import type { Location, LocationKind } from "@/lib/types";
import { Field } from "./form";
import { toast } from "@/lib/store/events";

const kindIcon: Record<LocationKind, typeof MapPin> = {
  mrt: TrainFront,
  lrt: TramFront,
  mall: ShoppingBag,
  park: Trees,
  campus: GraduationCap,
  airport: Plane,
  landmark: Building2,
  neighbourhood: MapPin,
};

export const QUICK_LOCATIONS = ["orchard-mrt", "punggol-waterway-park", "bugis-mrt", "changi-airport", "nus", "tampines-mall"];

function search(q: string): Location[] {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  return locations
    .map((l) => {
      const hay = `${l.name} ${areaById[l.area].name} ${l.detail ?? ""}`.toLowerCase();
      const idx = hay.indexOf(s);
      const starts = l.name.toLowerCase().startsWith(s);
      return { l, score: starts ? 0 : idx === -1 ? 99 : 1 + idx };
    })
    .filter((x) => x.score < 99)
    .sort((a, b) => a.score - b.score)
    .slice(0, 7)
    .map((x) => x.l);
}

type Props = {
  label?: string;
  value: string | null;
  onChange: (locationId: string | null) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
  showQuick?: boolean;
  showLocate?: boolean;
};

/** Combobox over Singapore locations, with quick picks and "use my location". */
export function LocationPicker({
  label = "Location",
  value,
  onChange,
  error,
  hint,
  placeholder = "e.g. Orchard MRT, Jewel, NUS…",
  showQuick = true,
  showLocate = true,
}: Props) {
  const selected = value ? getLocation(value) : null;
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const root = useRef<HTMLDivElement>(null);
  const results = useMemo(() => search(query), [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const choose = (l: Location) => {
    onChange(l.id);
    setQuery("");
    setOpen(false);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) return toast("Location isn't available on this device", { tone: "error" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const here = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const nearest = [...locations].sort((a, b) => distanceKm(here, a) - distanceKm(here, b))[0];
        if (distanceKm(here, nearest) > 15) return toast("You seem to be outside Singapore", { body: "Pick a place from the list instead.", tone: "info" });
        choose(nearest);
        toast(`Using ${nearest.name}`, { tone: "info" });
      },
      () => toast("Couldn't get your location", { body: "Search for a place instead.", tone: "info" }),
      { timeout: 8000 },
    );
  };

  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy, invalid }) => (
        <div ref={root} className="relative">
          {selected && !open ? (
            <div className={cn("flex h-12 items-center gap-3 rounded-xl border bg-white pl-3.5 pr-2", invalid ? "border-coral-600" : "border-line")}>
              <MapPin className="size-5 shrink-0 text-coral-600" aria-hidden />
              <button
                type="button"
                id={id}
                onClick={() => setOpen(true)}
                className="min-w-0 flex-1 truncate text-left text-[0.95rem] font-semibold text-navy-900"
                aria-label={`Location: ${selected.name}. Change`}
              >
                {selected.name}
                <span className="ml-2 text-xs font-medium text-navy-500">{areaById[selected.area].name}</span>
              </button>
              <button type="button" aria-label="Clear location" onClick={() => onChange(null)} className="inline-flex size-8 items-center justify-center rounded-full text-navy-500 hover:bg-navy-100">
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-navy-400" aria-hidden />
              <input
                id={id}
                role="combobox"
                aria-expanded={open && results.length > 0}
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={open && results[active] ? `${listId}-${results[active].id}` : undefined}
                aria-describedby={describedBy}
                aria-invalid={invalid || undefined}
                autoComplete="off"
                value={query}
                placeholder={placeholder}
                onFocus={() => setOpen(true)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                  setOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => Math.min(a + 1, results.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => Math.max(a - 1, 0));
                  } else if (e.key === "Enter" && open && results[active]) {
                    e.preventDefault();
                    choose(results[active]);
                  } else if (e.key === "Escape") setOpen(false);
                }}
                className={cn(
                  "h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-[0.95rem] text-navy-900 placeholder:text-navy-400 hover:border-navy-300 focus:border-navy-900",
                  invalid ? "border-coral-600" : "border-line",
                )}
              />
            </div>
          )}

          {open && query.trim() && (
            <ul id={listId} role="listbox" aria-label="Matching locations" className="absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-2xl bg-white p-1.5 shadow-pop ring-1 ring-line animate-scale-in">
              {results.length === 0 && <li className="px-3 py-4 text-sm text-navy-600">No match yet — try an MRT station, mall or park.</li>}
              {results.map((l, i) => {
                const Icon = kindIcon[l.kind];
                return (
                  <li
                    key={l.id}
                    id={`${listId}-${l.id}`}
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(l)}
                    className={cn("flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5", i === active && "bg-coral-50")}
                  >
                    <span className="flex size-9 items-center justify-center rounded-lg bg-navy-100 text-navy-600">
                      <Icon className="size-[1.05rem]" aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-navy-900">{l.name}</span>
                      <span className="block truncate text-xs text-navy-500">
                        {areaById[l.area].name}
                        {l.detail ? ` · ${l.detail}` : ""}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {(!selected || open) && (showQuick || showLocate) && !query && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {showLocate && (
                <button type="button" onClick={locate} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-found-50 px-3.5 text-sm font-semibold text-found-700 hover:bg-found-100">
                  <Crosshair className="size-4" aria-hidden />
                  Use my location
                </button>
              )}
              {showQuick &&
                QUICK_LOCATIONS.map((id) => (
                  <button key={id} type="button" onClick={() => choose(getLocation(id))} className="inline-flex h-9 items-center rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-navy-700 hover:border-navy-300 hover:bg-navy-50">
                    {getLocation(id).name}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </Field>
  );
}
