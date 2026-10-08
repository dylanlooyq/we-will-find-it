import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BountiesSection, MatchesAdmin, PostsSection, ReportsSection, ResolvedSection, UsersSection } from "@/components/admin/admin-sections";
import { Skeleton } from "@/components/ui/states";

const SECTIONS = {
  posts: { title: "Posts", Component: PostsSection },
  users: { title: "Users", Component: UsersSection },
  reports: { title: "Reports", Component: ReportsSection },
  bounties: { title: "Bounties", Component: BountiesSection },
  matches: { title: "Matches", Component: MatchesAdmin },
  resolved: { title: "Resolved items", Component: ResolvedSection },
} as const;

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((section) => ({ section }));
}

export const metadata: Metadata = { title: "Moderation" };

export default function AdminSectionPage({ params }: PageProps<"/admin/[section]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96 rounded-card" />}>
      <Section params={params} />
    </Suspense>
  );
}

async function Section({ params }: Pick<PageProps<"/admin/[section]">, "params">) {
  const { section } = await params;
  const s = SECTIONS[section as keyof typeof SECTIONS];
  if (!s) notFound();
  return <s.Component />;
}
