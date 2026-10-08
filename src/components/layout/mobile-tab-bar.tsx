import { Suspense } from "react";
import { TabBarClient, TabBarView } from "./tab-bar-client";

/**
 * Phone / tablet navigation: Home · Explore · (+) · Bounties · Profile.
 * The centre "+" is deliberately the loudest thing on screen — posting
 * should always be one tap away.
 *
 * It lives in the (main) layout only, so full-screen flows simply don't
 * include it (decided on the server — no hydration guesswork). The active
 * tab needs the pathname, so that part streams in behind Suspense while an
 * identical, inactive bar is shown as the fallback.
 */
export function MobileTabBar() {
  return (
    <Suspense fallback={<TabBarView pathname="" />}>
      <TabBarClient />
    </Suspense>
  );
}
