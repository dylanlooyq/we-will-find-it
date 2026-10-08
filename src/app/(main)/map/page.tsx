import type { Metadata } from "next";
import { Suspense } from "react";
import { ExploreSkeleton, ExploreView } from "@/components/items/explore-view";

export const metadata: Metadata = {
  title: "Lost & found map of Singapore",
  description: "See lost items, found items and bounties on a map of Singapore — find what's near your MRT station or neighbourhood.",
  alternates: { canonical: "/map" },
};

export default function MapPage() {
  return (
    <Suspense fallback={<ExploreSkeleton />}>
      <ExploreView forceView="map" />
    </Suspense>
  );
}
