"use client";

import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { ClaimFlow } from "@/components/bounties/claim-flow";
import { LogoMark } from "@/components/brand/logo";
import { MessagesShellView } from "@/components/chat/messages-shell";
import { ThreadView } from "@/components/chat/thread-view";
import { ItemDetail } from "@/components/items/item-detail";
import { ProfileView } from "@/components/profile/profile-view";
import { IS_STATIC_EXPORT } from "@/lib/site";
import { useHydrated } from "@/lib/store/hooks";
import { Footer } from "./footer";
import { Header } from "./header";
import { MobileTabBar } from "./mobile-tab-bar";

type Match =
  | { kind: "item"; slug: string }
  | { kind: "claim"; slug: string }
  | { kind: "user"; handle: string }
  | { kind: "thread"; id: string };

/** The dynamic routes whose params can be created in the browser (new posts, signups, chats). */
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
 * Static hosts (Cloudflare Workers assets) can only serve pages that were generated at build time. Listings, members
 * and conversations created in the browser during the demo therefore have no file of their own, and
 * requests for them are answered with `404.html`. This renders the matching screen there instead of a 404.
 *
 * Only active in the static build — everywhere else the real route renders and this is a no-op.
 * It deliberately mirrors the layout chrome of the route groups the real pages live in.
 */
export function StaticHostFallback({ notFound }: { notFound: ReactNode }) {
  const pathname = usePathname();
  const hydrated = useHydrated();

  if (!IS_STATIC_EXPORT) return notFound;

  // First paint (and the prerendered 404.html): a neutral splash, so a valid in-session URL never flashes "404".
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
