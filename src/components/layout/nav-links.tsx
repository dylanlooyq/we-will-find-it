"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { NAV, isActive } from "./nav";

/** Reads the pathname, so it lives behind <Suspense> in the shared header. */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((n) => {
        const active = isActive(pathname, n.match);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-[0.95rem] font-semibold transition-colors",
              active ? "bg-coral-50 text-coral-700" : "text-navy-600 hover:bg-navy-100 hover:text-navy-900",
            )}
          >
            {n.label}
          </Link>
        );
      })}
    </>
  );
}
