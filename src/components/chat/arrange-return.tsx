"use client";

import { useMemo, useState } from "react";
import { Check, MapPin, Send, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import { areaById, getLocation, locations } from "@/lib/data/taxonomy";
import { distanceKm } from "@/lib/geo";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { Item } from "@/lib/types";
import { Button } from "../ui/button";
import { LocationPicker } from "../ui/location-picker";
import { Overlay } from "../ui/overlay";

const TIMES = ["In an hour", "Today, 6 PM", "Today, 8 PM", "Tomorrow, 12 PM", "Tomorrow, 7 PM"];

/**
 * "Arrange return": pick a safe, public meeting point and a time, then send it
 * as a structured message — one tap for the other person to say yes.
 */
export function ArrangeReturn({ open, onClose, convId, item }: { open: boolean; onClose: () => void; convId: string; item: Item }) {
  const itemLoc = getLocation(item.locationId);
  const nearby = useMemo(
    () =>
      locations
        .filter((l) => l.kind === "mrt" && l.id !== itemLoc.id)
        .sort((a, b) => distanceKm(itemLoc, a) - distanceKm(itemLoc, b))
        .slice(0, 2),
    [itemLoc],
  );
  const options = [{ id: itemLoc.id, label: "Same location", sub: itemLoc.name }, ...nearby.map((l) => ({ id: l.id, label: "Nearby MRT", sub: l.name })), { id: "other", label: "Other", sub: "Choose a place" }];
  const [pick, setPick] = useState(options[0].id);
  const [other, setOther] = useState<string | null>(null);
  const [time, setTime] = useState(TIMES[1]);

  const place = pick === "other" ? other : pick;
  const loc = place ? getLocation(place) : null;

  const send = () => {
    if (!loc) return;
    actions.sendMessage(convId, { kind: "location", locationId: loc.id, text: time });
    actions.sendMessage(convId, { kind: "text", text: `Does ${time.toLowerCase()} at ${loc.name} work for you? I'll meet you at the customer service counter.` });
    toast("Meeting point sent", { body: `${loc.name} · ${time}`, tone: "success" });
    onClose();
  };

  return (
    <Overlay open={open} onClose={onClose} title="Arrange return" description="Pick a busy, public place. MRT customer service counters are ideal.">
      <div className="mt-4 space-y-6">
        <div className="relative h-28 overflow-hidden rounded-2xl bg-gradient-to-br from-sky to-[#cfe0f7]">
          <div aria-hidden className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <span className="absolute left-1/2 top-1/2 flex size-11 -translate-x-1/2 -translate-y-[65%] items-center justify-center rounded-full bg-coral-600 text-white shadow-lift ring-4 ring-white">
            <MapPin className="size-5" aria-hidden />
          </span>
          <p className="absolute bottom-2.5 left-3 right-3 truncate rounded-xl bg-white/90 px-3 py-1.5 text-sm font-bold text-navy-900 backdrop-blur">
            {loc ? `${loc.name} · ${areaById[loc.area].name}` : "Choose a meeting point"}
          </p>
        </div>

        <fieldset>
          <legend className="mb-2.5 text-sm font-extrabold text-navy-900">Suggest a meeting point</legend>
          <div role="radiogroup" className="grid gap-2">
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={pick === o.id}
                onClick={() => setPick(o.id)}
                className={cn("flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-all", pick === o.id ? "border-coral-600 bg-coral-50" : "border-line hover:border-navy-300")}
              >
                <span className={cn("flex size-5 items-center justify-center rounded-full border-2", pick === o.id ? "border-coral-600 bg-coral-600 text-white" : "border-navy-300")}>{pick === o.id && <Check className="size-3" strokeWidth={4} />}</span>
                <span className="flex-1">
                  <span className="block text-[0.95rem] font-extrabold text-navy-900">{o.label}</span>
                  <span className="block text-xs text-navy-600">{o.sub}</span>
                </span>
              </button>
            ))}
          </div>
          {pick === "other" && (
            <div className="mt-3">
              <LocationPicker label="Meeting place" value={other} onChange={setOther} showQuick={false} showLocate={false} />
            </div>
          )}
        </fieldset>

        <fieldset>
          <legend className="mb-2.5 text-sm font-extrabold text-navy-900">Suggest a time</legend>
          <div className="flex flex-wrap gap-2">
            {TIMES.map((t) => (
              <button key={t} type="button" aria-pressed={time === t} onClick={() => setTime(t)} className={cn("h-10 rounded-full border px-4 text-sm font-semibold transition-colors", time === t ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-navy-700 hover:bg-navy-50")}>
                {t}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="flex items-start gap-2 rounded-xl bg-mint-50 p-3 text-xs leading-relaxed text-mint-800">
          <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
          Meet in a public place and don&rsquo;t share sensitive personal information.
        </p>
        <div className="sticky bottom-0 -mx-6 -mb-6 border-t border-line bg-white px-6 pb-6 pt-4">
          <Button size="lg" full disabled={!loc} onClick={send} iconLeft={<Send className="size-4" aria-hidden />}>
            Send meeting point
          </Button>
        </div>
      </div>
    </Overlay>
  );
}
