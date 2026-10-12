import type { Metadata } from "next";
import { BountiesView } from "@/components/bounties/bounties-view";

export const metadata: Metadata = {
  title: "Bounties — cash rewards for returning lost items",
  description:
    "Browse lost items with cash bounties across Singapore. Find it, prove it, hand it back — and the owner pays you the reward directly.",
  alternates: { canonical: "/bounties" },
};

export default function BountiesPage() {
  return <BountiesView />;
}
