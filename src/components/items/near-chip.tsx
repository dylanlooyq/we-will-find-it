"use client";

import { useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation } from "@/lib/data/taxonomy";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { Overlay } from "../ui/overlay";
import { LocationPicker } from "../ui/location-picker";

/** "📍 Near Orchard MRT ▾" — sets the origin for every distance in the app. */
export function NearChip({ tone = "default", className }: { tone?: "default" | "light"; className?: string }) {
  const w = useWorld();
  const [open, setOpen] = useState(false);
  const loc = getLocation(w.nearLocationId);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-full px-3.5 text-sm font-bold transition-colors",
          tone === "light" ? "bg-white/10 text-white hover:bg-white/20" : "border border-line bg-white text-navy-800 shadow-soft hover:border-navy-300",
          className,
        )}
      >
        <MapPin className={cn("size-4", tone === "light" ? "text-gold-300" : "text-coral-600")} aria-hidden />
        Near {loc.name}
        <ChevronDown className="size-4 opacity-60" aria-hidden />
      </button>
      <Overlay open={open} onClose={() => setOpen(false)} title="Where are you?" description="We'll show distances and nearby bounties from here.">
        <div className="mt-3 min-h-64">
          <LocationPicker
            label="Your area"
            value={w.nearLocationId}
            onChange={(id) => {
              if (id) {
                actions.setNearLocation(id);
                setOpen(false);
              }
            }}
          />
        </div>
      </Overlay>
    </>
  );
}
