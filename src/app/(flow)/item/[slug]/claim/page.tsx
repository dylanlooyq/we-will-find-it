import type { Metadata } from "next";
import { Suspense } from "react";
import { ClaimFlow } from "@/components/bounties/claim-flow";
import { items } from "@/lib/data/items";

export const metadata: Metadata = {
  title: "Claim bounty",
  robots: { index: false },
};

export function generateStaticParams() {
  return items.filter((i) => i.bountyId).map((i) => ({ slug: i.slug }));
}

export default function ClaimPage({ params }: PageProps<"/item/[slug]/claim">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <Claim params={params} />
    </Suspense>
  );
}

async function Claim({ params }: Pick<PageProps<"/item/[slug]/claim">, "params">) {
  const { slug } = await params;
  return <ClaimFlow slug={slug} />;
}
