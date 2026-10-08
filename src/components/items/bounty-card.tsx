import Link from "next/link";
import { Clock, Coins, MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation } from "@/lib/data/taxonomy";
import { formatMoney, timeUntil } from "@/lib/format";
import { formatDistance } from "@/lib/geo";
import type { Bounty, Item } from "@/lib/types";
import { StatusBadge } from "../ui/badges";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";

/** Bounty-first card: the reward is the hero, the item supports it. */
export function BountyCard({
  item,
  bounty,
  distanceKm,
  nowMs,
  className,
}: {
  item: Item;
  bounty: Bounty;
  distanceKm?: number;
  nowMs: number;
  className?: string;
}) {
  const loc = getLocation(item.locationId);
  const pet = item.category === "pets";
  const msLeft = Date.parse(bounty.expiresAt) - nowMs;
  const urgent = msLeft < 3 * 86_400_000;
  const title = pet && item.pet?.name ? `${item.pet.name} · ${item.pet.breed}` : item.title;

  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-card bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift", className)}>
      <div className="relative">
        <ItemImage image={item.images[0]} category={item.category} className="aspect-[16/10] [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105" />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between">
          <StatusBadge type={item.type} pet={pet} />
          {urgent && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-coral-600 px-2 py-1 text-[0.68rem] font-bold text-white">
              <Clock className="size-3" aria-hidden />
              {timeUntil(bounty.expiresAt, nowMs)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-gold-100 to-gold-50 px-4 py-3">
        <p className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-gold-300 text-gold-800 shadow-soft">
            <Coins className="size-5" aria-hidden />
          </span>
          <span className="flex flex-col">
            <span className="text-[1.6rem] font-extrabold leading-none tabular-nums text-navy-900">{formatMoney(bounty.amount)}</span>
            <span className="mt-0.5 text-[0.66rem] font-extrabold uppercase tracking-wider text-gold-800">Bounty</span>
          </span>
        </p>
        <span className="text-right text-xs font-bold text-gold-800">{timeUntil(bounty.expiresAt, nowMs)}</span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-[1.02rem] font-extrabold leading-snug text-navy-900">
          <Link href={`/item/${item.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-card">
            {title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-navy-600">
          <MapPin className="size-4 shrink-0 text-coral-600" aria-hidden />
          <span className="truncate font-semibold text-navy-800">{loc.name}</span>
        </p>
        <div className="mt-1 flex items-center justify-between text-xs font-medium text-navy-500">
          <span>
            Posted <RelativeTime iso={item.postedAt} />
          </span>
          {distanceKm !== undefined && (
            <span className="inline-flex items-center gap-1 font-semibold text-found-700">
              <Navigation className="size-3.5" aria-hidden />
              {formatDistance(distanceKm)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
