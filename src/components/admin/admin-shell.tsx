"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { Coins, FileText, Flag, LayoutGrid, PackageCheck, ShieldCheck, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { Button } from "../ui/button";
import { Logo } from "../brand/logo";
import { EmptyState } from "../ui/states";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/posts", label: "Posts", icon: FileText, key: "posts" },
  { href: "/admin/users", label: "Users", icon: Users, key: "users" },
  { href: "/admin/reports", label: "Reports", icon: Flag, key: "reports" },
  { href: "/admin/bounties", label: "Bounties", icon: Coins, key: "bounties" },
  { href: "/admin/matches", label: "Matches", icon: Sparkles, key: "matches" },
  { href: "/admin/resolved", label: "Resolved", icon: PackageCheck, key: "resolved" },
] as const;

function Nav({ counts }: { counts: Record<string, number> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Moderation sections" className="flex gap-1 overflow-x-auto scrollbar-none lg:flex-col">
      {NAV.map((n) => {
        const active = "exact" in n ? pathname === n.href : pathname.startsWith(n.href);
        const c = "key" in n ? counts[n.key] : 0;
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex shrink-0 items-center gap-3 rounded-xl px-3.5 py-2.5 text-[0.95rem] font-bold transition-colors", active ? "bg-navy-900 text-white" : "text-navy-600 hover:bg-navy-100")}
          >
            <n.icon className="size-[1.15rem]" aria-hidden />
            {n.label}
            {c > 0 && <span className={cn("ml-auto rounded-full px-2 py-0.5 text-xs font-extrabold", active ? "bg-white/20 text-white" : "bg-coral-100 text-coral-800")}>{c}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

/** Moderators only. (In this demo, anyone can switch to the moderator account.) */
export function AdminShell({ children }: { children: React.ReactNode }) {
  const w = useWorld();
  const me = w.currentUser;

  const counts = {
    posts: w.items.filter((i) => i.moderation !== "ok").length,
    users: w.users.filter((u) => u.suspended).length,
    reports: w.reports.filter((r) => r.status === "open" || r.status === "reviewing").length,
    bounties: w.claims.filter((c) => c.status === "flagged").length,
    matches: 0,
    resolved: 0,
  };

  if (me?.role !== "admin") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas px-4">
        <EmptyState
          icon={<ShieldCheck className="size-9" aria-hidden />}
          title="Moderators only"
          body="This area is for the wewillfind.it moderation team. In this demo you can switch to the moderator account."
          tone="coral"
          action={
            <>
              <Button onClick={() => actions.login("u_admin")}>Switch to moderator account</Button>
              <Button href="/" variant="secondary">
                Back to site
              </Button>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="sticky top-0 z-40 border-b border-line bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/" aria-label="wewillfind.it">
            <Logo size={28} />
          </Link>
          <span className="rounded-lg bg-navy-900 px-2.5 py-1 text-xs font-extrabold uppercase tracking-wider text-white">Moderation</span>
          <div className="ml-auto flex items-center gap-2">
            <Button href="/" variant="ghost" size="sm">
              Back to site
            </Button>
            <Button variant="secondary" size="sm" onClick={() => actions.login("u_dylan")}>
              Switch to Dylan
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:px-8 lg:py-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Suspense fallback={<div className="h-12" />}>
            <Nav counts={counts} />
          </Suspense>
        </aside>
        <main id="main" className="min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
