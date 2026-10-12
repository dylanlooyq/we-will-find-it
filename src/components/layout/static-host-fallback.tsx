"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ClaimFlow } from "@/components/bounties/claim-flow";
import { LogoMark } from "@/components/brand/logo";
import { MessagesShellView } from "@/components/chat/messages-shell";
import { ThreadView } from "@/components/chat/thread-view";
import { ItemDetail } from "@/components/items/item-detail";
import { ProfileView } from "@/components/profile/profile-view";
import { useHydrated } from "@/lib/store/hooks";
import { Footer } from "./footer";
import { Header } from "./header";
import { MobileTabBar } from "./mobile-tab-bar";

type Match =
  | { kind: "item"; slug: string }
  | { kind: "claim"; slug: string }
  | { kind: "user"; handle: string }
  | { kind: "thread"; id: string };

/** The routes whose pages come from the database: listings, their claim forms, profiles and conversations. */
function matchRoute(pathname: string): Match | null {
  const p = pathname.replace(/\/+$/, "");
  let m: RegExpMatchArray | null;
  if ((m = p.match(/^\/item\/([^/]+)\/claim$/))) return { kind: "claim", slug: decodeURIComponent(m[1]) };
  if ((m = p.match(/^\/item\/([^/]+)$/))) return { kind: "item", slug: decodeURIComponent(m[1]) };
  if ((m = p.match(/^\/user\/([^/]+)$/))) return { kind: "user", handle: decodeURIComponent(m[1]) };
  if ((m = p.match(/^\/messages\/([^/]+)$/))) return { kind: "thread", id: decodeURIComponent(m[1]) };
  return null;
}

/**
 * The site is a static export, so only pages known at build time have a file. Listings, members and
 * conversations live in the database: requests for them are answered with the "not found" page —
 * this component — which draws the matching screen from the member's data instead.
 * The Worker (worker/pages.ts) corrects the status and `<head>` for the ones that exist.
 */
export function StaticHostFallback({ notFound }: { notFound: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();

  // First paint (and the prerendered 404.html): a neutral splash, so a real page never flashes "404".
  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas" role="status" aria-label="Loading">
        <LogoMark size={64} className="animate-float" />
      </div>
    );
  }

  const match = matchRoute(pathname);
  if (!match) return notFound;

  switch (match.kind) {
    case "item":
      return (
        <>
          <Header />
          <main id="main" className="flex-1">
            <ItemDetail slug={match.slug} />
          </main>
          <Footer />
        </>
      );
    case "user":
      return (
        <>
          <Header />
          <main id="main" className="flex-1">
            <ProfileView handle={match.handle} />
          </main>
          <Footer />
          <MobileTabBar />
        </>
      );
    case "claim":
      return (
        <main id="main" className="flex-1">
          <ClaimFlow slug={match.slug} />
        </main>
      );
    case "thread":
      return (
        <main id="main" className="flex-1">
          <Suspense fallback={null}>
            <MessagesShellView activeId={match.id} header={<Header />}>
              <ThreadView id={match.id} />
            </MessagesShellView>
          </Suspense>
        </main>
      );
  }
}
