import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard } from "@/lib/og";
import { users } from "@/lib/data/users";
import { levelFor } from "@/lib/levels";
import { seedWorld } from "@/lib/world";

export const alt = "A community member on wewillfind.it";
export const size = OG_SIZE;
export const contentType = "image/png";

/** One image per seeded member — mirrors the page's own params (needed for the static export). */
export function generateStaticParams() {
  return users.filter((u) => u.role !== "admin").map((u) => ({ handle: u.handle }));
}

export default async function Image({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const u = seedWorld.userByHandle.get(handle);
  if (!u) return new ImageResponse(<OgCard eyebrow="Member" title="wewillfind.it" />, { ...size });
  const lv = levelFor(u.points.allTime);
  return new ImageResponse(
    <OgCard
      eyebrow={`Level ${lv.level} · ${lv.title}`}
      title={u.name}
      subtitle={`${u.stats.itemsReturned} items returned · rated ${u.rating.toFixed(1)} / 5`}
      chip={`${u.points.allTime.toLocaleString("en-SG")} pts`}
      chipTone="green"
    />,
    { ...size },
  );
}
