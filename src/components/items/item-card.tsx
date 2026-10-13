import Link from "next/link";
import { CalendarDays, MapPin, PawPrint, Navigation } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation } from "@/lib/data/taxonomy";
import { formatDistance } from "@/lib/geo";
import { occurredLabel } from "@/lib/format";
import type { Item } from "@/lib/types";
import { BountyBadge, StatusBadge } from "../ui/badges";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";
import { LikeButton } from "./like-button";

type Props = {
  item: Item;
  /** Open bounty amount, if any */
  bountyAmount?: number;
  distanceKm?: number;
  priority?: boolean;
  className?: string;
  /** Heading level for the title — h3 under a section heading, h2 directly under the page h1 */
  titleAs?: "h2" | "h3";
};

/**
 * The listing card. The whole card is one link (stretched ::after on the
 * title) while the like button floats above it, on the photo — no nested
 * interactive elements, full keyboard and screen-reader support.
 */
export function ItemCard({ item, bountyAmount, distanceKm, priority, className, titleAs: Title = "h3" }: Props) {
  const loc = getLocation(item.locationId);
  const pet = item.category === "pets" && item.pet;
  const cover = item.images[0] ?? { file: "none", label: item.title };
  const resolved = item.status === "resolved";

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-card bg-white shadow-soft transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-lift focus-within:shadow-lift",
        className,
      )}
    >
      <div className="relative">
        <ItemImage
          image={cover}
          category={item.category}
          priority={priority}
          captionRightSpace
          className="aspect-[4/3] [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105"
        />
        <div className="absolute inset-x-3 top-3 flex items-start justify-between gap-2">
          <StatusBadge type={item.type} pet={!!pet} resolved={resolved} />
          {bountyAmount ? <BountyBadge amount={bountyAmount} /> : null}
        </div>
        {/* Above the card-wide link, so it can be pressed on its own. */}
        <div className="absolute bottom-3 right-3 z-10">
          <LikeButton itemId={item.id} tone="glass" />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <div className="flex items-baseline justify-between gap-3">
            <Title className="min-w-0 text-[1.05rem] font-extrabold leading-snug text-navy-900">
              <Link href={`/item/${item.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-card">
                {pet && item.pet?.name ? item.pet.name : item.title}
              </Link>
            </Title>
            <RelativeTime iso={item.postedAt} className="shrink-0 whitespace-nowrap text-xs font-medium text-navy-400" />
          </div>
          {pet && (
            <p className="mt-0.5 text-sm font-semibold text-navy-600">
              {[item.pet?.colour, item.pet?.breed].filter(Boolean).join(" ")}
            </p>
          )}
        </div>

        <ul className="space-y-1 text-sm text-navy-600">
          <li className="flex items-center gap-1.5">
            <MapPin className="size-4 shrink-0 text-coral-600" aria-hidden />
            <span className="truncate font-semibold text-navy-800">{loc.name}</span>
            {distanceKm !== undefined && (
              <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-found-700">
                <Navigation className="size-3.5" aria-hidden />
                {formatDistance(distanceKm)}
              </span>
            )}
          </li>
          <li className="flex items-center gap-1.5">
            {pet && item.type === "lost" ? (
              <>
                <PawPrint className="size-4 shrink-0 text-navy-400" aria-hidden />
                <span className="truncate">{item.timeLabel.startsWith("Last seen") ? item.timeLabel : `Last seen ${item.timeLabel.toLowerCase()}`}</span>
              </>
            ) : (
              <>
                <CalendarDays className="size-4 shrink-0 text-navy-400" aria-hidden />
                <span className="truncate">{occurredLabel(item)}</span>
              </>
            )}
          </li>
        </ul>

        <p className="line-clamp-2 text-sm leading-relaxed text-navy-500">{item.description}</p>
      </div>
    </article>
  );
}

/** Dense horizontal variant for sidebars, matches and the map drawer. */
export function ItemRow({
  item,
  bountyAmount,
  trailing,
  className,
  note,
  titleAs: Title = "h3",
}: {
  item: Item;
  bountyAmount?: number;
  trailing?: React.ReactNode;
  className?: string;
  note?: React.ReactNode;
  titleAs?: "h2" | "h3";
}) {
  const loc = getLocation(item.locationId);
  const pet = item.category === "pets" && item.pet;
  return (
    <div className={cn("group relative flex gap-3 rounded-2xl bg-white p-2.5 shadow-soft transition-shadow hover:shadow-lift", className)}>
      <ItemImage image={item.images[0] ?? { file: "none", label: item.title }} category={item.category} compact className="size-[4.75rem] shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-1.5">
          <StatusBadge type={item.type} pet={!!pet} resolved={item.status === "resolved"} variant="soft" />
          {bountyAmount ? <BountyBadge amount={bountyAmount} variant="soft" label={false} /> : null}
        </div>
        <Title className="mt-1 truncate text-[0.95rem] font-extrabold text-navy-900">
          <Link href={`/item/${item.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl">
            {pet && item.pet?.name ? `${item.pet.name} · ${item.pet.breed}` : item.title}
          </Link>
        </Title>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-navy-600">
          <MapPin className="size-3 shrink-0 text-coral-600" aria-hidden />
          {loc.name}
          <span aria-hidden>·</span>
          <RelativeTime iso={item.postedAt} />
        </p>
        {note && <p className="mt-1 text-xs">{note}</p>}
      </div>
      {trailing && <div className="relative z-10 flex shrink-0 items-center">{trailing}</div>}
    </div>
  );
}
