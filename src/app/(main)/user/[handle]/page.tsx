import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/profile-view";
import { users } from "@/lib/data/users";
import { levelFor } from "@/lib/levels";
import { seedWorld } from "@/lib/world";

export function generateStaticParams() {
  return users.filter((u) => u.role !== "admin").map((u) => ({ handle: u.handle }));
}

export async function generateMetadata({ params }: PageProps<"/user/[handle]">): Promise<Metadata> {
  const { handle } = await params;
  const u = seedWorld.userByHandle.get(handle);
  if (!u) return { title: "Member profile" };
  const lv = levelFor(u.points.allTime);
  const description = `${u.name} — Level ${lv.level} ${lv.title} on wewillfind.it. ${u.stats.itemsReturned} items returned, rated ${u.rating.toFixed(1)}/5 by the community.`;
  return {
    title: `${u.name} · ${lv.title}`,
    description,
    alternates: { canonical: `/user/${u.handle}` },
    openGraph: { title: `${u.name} on wewillfind.it`, description, type: "profile" },
  };
}

export default async function UserPage({ params }: PageProps<"/user/[handle]">) {
  const { handle } = await params;
  return <ProfileView handle={handle} />;
}
