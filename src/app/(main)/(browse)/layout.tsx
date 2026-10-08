import { Suspense } from "react";
import { ExploreSkeleton, ExploreView } from "@/components/items/explore-view";

/**
 * Explore, Lost, Found and Pets share this layout, so the search box,
 * filters and results stay mounted while you switch between them —
 * the pages themselves only provide SEO metadata.
 */
export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={<ExploreSkeleton />}>
        <ExploreView />
      </Suspense>
      {children}
    </>
  );
}
