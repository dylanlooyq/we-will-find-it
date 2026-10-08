import type { Metadata } from "next";
import { ItemDetail } from "@/components/items/item-detail";
import { getLocation } from "@/lib/data/taxonomy";
import { items } from "@/lib/data/items";
import { formatMoney } from "@/lib/format";
import { seedWorld } from "@/lib/world";

/**
 * Every seeded listing is prerendered with its own metadata. `params` is awaited at
 * the top level, which keeps unlisted slugs (listings posted in-session) renderable
 * on demand — the client component then finds them in the local store.
 */
export function generateStaticParams() {
  return items.map((i) => ({ slug: i.slug }));
}

export async function generateMetadata({ params }: PageProps<"/item/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const item = seedWorld.itemBySlug.get(slug);
  if (!item) return { title: "Listing" };
  const loc = getLocation(item.locationId);
  const bounty = item.bountyId ? seedWorld.bountyById.get(item.bountyId) : undefined;
  const verb = item.type === "lost" ? "Lost" : "Found";
  const title = `${verb}: ${item.title} at ${loc.name}`;
  const description = `${item.description.slice(0, 150).trim()}…${bounty ? ` ${formatMoney(bounty.amount)} bounty.` : ""}`;
  return {
    title,
    description,
    alternates: { canonical: `/item/${item.slug}` },
    openGraph: { title: `${title} · wewillfind.it`, description, url: `/item/${item.slug}`, type: "article" },
  };
}

export default async function ItemPage({ params }: PageProps<"/item/[slug]">) {
  const { slug } = await params;
  return <ItemDetail slug={slug} />;
}
