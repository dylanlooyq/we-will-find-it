"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Compass, Home, Plus, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorld } from "@/lib/store/hooks";
import { openPostChooser } from "./post-chooser";

export function TabBarClient() {
  const pathname = usePathname();
  return <TabBarView pathname={pathname} />;
}

export function TabBarView({ pathname }: { pathname: string }) {
  const me = useWorld().currentUser;

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/explore", label: "Explore", icon: Compass, active: ["/explore", "/lost", "/found", "/pets", "/map"].some((p) => pathname.startsWith(p)) },
    null,
    { href: "/bounties", label: "Bounties", icon: Coins, active: pathname.startsWith("/bounties") },
    { href: me ? `/user/${me.handle}` : "/login", label: "Profile", icon: UserRound, active: pathname.startsWith("/user") || pathname.startsWith("/login") },
  ];

  return (
    <nav aria-label="Primary" className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/70 lg:hidden" style={{ paddingBottom: "var(--safe-bottom)" }}>
      <ul className="mx-auto grid h-[var(--tabbar-h)] max-w-md grid-cols-5 items-end px-2 pb-2">
        {tabs.map((t) =>
          t === null ? (
            <li key="post" className="flex justify-center">
              <button type="button" onClick={openPostChooser} aria-label="Post something" className="-mt-6 flex flex-col items-center gap-1">
                <span className="flex size-[3.75rem] items-center justify-center rounded-full bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-coral ring-4 ring-white transition-transform active:scale-90">
                  <Plus className="size-8" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-[0.68rem] font-bold text-navy-800">Post</span>
              </button>
            </li>
          ) : (
            <li key={t.label}>
              <Link
                href={t.href}
                aria-current={t.active ? "page" : undefined}
                className={cn("flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.68rem] font-bold transition-colors", t.active ? "text-coral-700" : "text-navy-500")}
              >
                <t.icon className={cn("size-[1.45rem]", t.active && "fill-coral-100")} strokeWidth={t.active ? 2.4 : 2} aria-hidden />
                {t.label}
              </Link>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
