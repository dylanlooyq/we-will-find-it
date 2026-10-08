import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "../brand/logo";
import { NavLinks } from "./nav-links";
import { HeaderActions } from "./header-actions";
import { NAV } from "./nav";

/**
 * Sticky top bar. Desktop: Logo | Explore · Map · Bounties · Leaderboard ·
 * How it works | Post · Messages · Notifications · Profile.
 * Below `lg` the navigation moves to the bottom tab bar, so the header
 * stays quiet: logo + the account actions.
 */
export function Header() {
  return (
    <header className="glass sticky top-0 z-40 border-b border-line/70">
      <div className="mx-auto flex h-[var(--header-h)] max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="wewillfind.it — home" className="shrink-0 rounded-lg">
          <Logo size={34} />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 items-center gap-1 lg:flex">
          <Suspense
            fallback={NAV.map((n) => (
              <Link key={n.href} href={n.href} className="rounded-full px-4 py-2 text-[0.95rem] font-semibold text-navy-600">
                {n.label}
              </Link>
            ))}
          >
            <NavLinks />
          </Suspense>
        </nav>
        <div className="ml-auto lg:ml-0">
          <HeaderActions />
        </div>
      </div>
    </header>
  );
}
