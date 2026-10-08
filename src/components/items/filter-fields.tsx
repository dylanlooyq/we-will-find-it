"use client";

import { Coins } from "lucide-react";
import { categories, getLocation } from "@/lib/data/taxonomy";
import { DISTANCE_STEPS, type DateRange, type Filters, type SortMode } from "@/lib/search";
import type { CategoryId } from "@/lib/types";
import { CategoryIcon } from "../ui/category-icon";
import { Chip, Segmented, Switch } from "../ui/form";
import { LocationPicker } from "../ui/location-picker";

/** The filter controls — rendered in the desktop sidebar and the mobile sheet. */
export function FilterFields({
  filters,
  onChange,
  originId,
}: {
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  originId: string;
}) {
  const toggleCat = (id: CategoryId) =>
    onChange({ categories: filters.categories.includes(id) ? filters.categories.filter((c) => c !== id) : [...filters.categories, id] });

  return (
    <div className="space-y-7">
      <fieldset>
        <legend className="mb-3 text-sm font-extrabold text-navy-900">Category</legend>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Chip
              key={c.id}
              active={filters.categories.includes(c.id)}
              onClick={() => toggleCat(c.id)}
              icon={<CategoryIcon icon={c.icon} className="size-4" />}
              className="!h-9 !px-3"
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div>
        <LocationPicker
          label="Location"
          hint={filters.locationId ? undefined : `Distances measured from ${getLocation(originId).name}`}
          value={filters.locationId}
          onChange={(id) => onChange({ locationId: id })}
          showQuick={false}
          showLocate
        />
      </div>

      <fieldset>
        <legend className="mb-3 text-sm font-extrabold text-navy-900">Distance</legend>
        <div className="flex flex-wrap gap-2">
          {DISTANCE_STEPS.map((d) => (
            <Chip key={d} active={filters.distance === d} onClick={() => onChange({ distance: d })} className="!h-9 !px-3.5">
              {d === 0 ? "Any" : `${d} km`}
            </Chip>
          ))}
        </div>
      </fieldset>

      <div>
        <p className="mb-3 text-sm font-extrabold text-navy-900">When</p>
        <Segmented<DateRange>
          label="Date range"
          value={filters.date}
          onChange={(date) => onChange({ date })}
          size="sm"
          className="w-full"
          options={[
            { value: "any", label: "Any" },
            { value: "1", label: "24h" },
            { value: "7", label: "7 days" },
            { value: "30", label: "30 days" },
          ]}
        />
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl bg-gold-50 p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gold-200 text-gold-800">
            <Coins className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-extrabold text-navy-900">Bounties only</p>
            <p className="text-xs text-navy-600">Items with a cash reward</p>
          </div>
        </div>
        <Switch checked={filters.bountyOnly} onChange={(bountyOnly) => onChange({ bountyOnly })} label="Show only items with a bounty" tone="gold" />
      </div>

      <div>
        <p className="mb-3 text-sm font-extrabold text-navy-900">Sort by</p>
        <Segmented<SortMode>
          label="Sort order"
          value={filters.sort}
          onChange={(sort) => onChange({ sort })}
          size="sm"
          className="w-full"
          options={[
            { value: "new", label: "Newest" },
            { value: "near", label: "Nearest" },
            { value: "bounty", label: "Bounty" },
          ]}
        />
      </div>
    </div>
  );
}
