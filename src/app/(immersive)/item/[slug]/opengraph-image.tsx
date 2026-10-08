import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard } from "@/lib/og";
import { items } from "@/lib/data/items";
import { getLocation } from "@/lib/data/taxonomy";
import { formatMoney } from "@/lib/format";
import { seedWorld } from "@/lib/world";

export const alt = "A lost or found listing on wewillfind.it";
export const size = OG_SIZE;
export const contentType = "image/png";

/** One image per seeded listing — mirrors the page's own params (needed for the static export). */
export function generateStaticParams() {
  return items.map((i) => ({ slug: i.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = seedWorld.itemBySlug.get(slug);
  if (!item) return new ImageResponse(<OgCard eyebrow="Listing" title="wewillfind.it" />, { ...size });
  const loc = getLocation(item.locationId);
  const bounty = item.bountyId ? seedWorld.bountyById.get(item.bountyId) : undefined;
  const pet = item.category === "pets";
  const eyebrow = `${item.type === "lost" ? "Lost" : "Found"}${pet ? " pet" : ""} · ${loc.name}`;
  return new ImageResponse(
    <OgCard
      eyebrow={eyebrow}
      title={item.pet?.name ? `${item.pet.name} — ${item.pet.breed}` : item.title}
      subtitle={item.timeLabel ? `${item.timeLabel}` : undefined}
      chip={bounty ? `${formatMoney(bounty.amount)} bounty` : item.type === "lost" ? "LOST" : "FOUND"}
      chipTone={bounty ? "gold" : item.type === "lost" ? "coral" : "blue"}
    />,
    { ...size },
  );
}
