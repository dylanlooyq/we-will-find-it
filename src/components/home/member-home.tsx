"use client";

import Link from "next/link";
import { ArrowRight, Bell, Coins, HandHeart, ListChecks, MessageCircle, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorld } from "@/lib/store/hooks";
import type { User } from "@/lib/types";
import { bountyForItem, bountyOnOffer, claimsForItem, conversationsFor, itemsByOwner, notificationsFor, unreadCount } from "@/lib/world";
import { UserLevel } from "../community/level";
import { ItemRow } from "../items/item-card";
import { Button } from "../ui/button";
import { Container } from "../ui/section";
import { Skeleton } from "../ui/states";
import { NearbyBounties, RecentSection } from "./feeds";
import { HeroSearch } from "./hero-search";

/**
 * Home for someone who is signed in: no pitch. What to do next, what is waiting for them, their own
 * posts, then what is new around them.
 */
export function MemberHome({ me }: { me: User }) {
  const w = useWorld();
  const mine = itemsByOwner(w, me.id).filter((i) => i.status === "active" && i.moderation !== "removed");
  const claims = mine.reduce((n, i) => n + claimsForItem(w, i.id).filter((c) => c.status === "submitted" || c.status === "more_info").length, 0);
  const unreadChats = conversationsFor(w, me.id).filter((c) => unreadCount(c, me.id) > 0).length;
  const unreadNotes = notificationsFor(w, me.id).filter((n) => !n.read).length;

  // `hot` tiles are waiting on the member; the last one is only a way in.
  const tiles = [
    { href: "/messages", icon: MessageCircle, n: unreadChats, label: unreadChats === 1 ? "Unread chat" : "Unread chats", hot: unreadChats > 0 },
    { href: "/notifications", icon: Bell, n: unreadNotes, label: unreadNotes === 1 ? "New notification" : "New notifications", hot: unreadNotes > 0 },
    { href: "/my-posts", icon: Coins, n: claims, label: claims === 1 ? "Claim to review" : "Claims to review", hot: claims > 0 },
    { href: "/my-posts", icon: ListChecks, n: mine.length, label: mine.length === 1 ? "Active post" : "Active posts", hot: false },
  ];

  return (
    <>
      <section className="border-b border-line/70 bg-gradient-to-b from-[#fff4f0] to-canvas" aria-labelledby="home-h">
        <Container className="pb-7 pt-6 sm:pb-9 sm:pt-9">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <h1 id="home-h" className="text-2xl font-extrabold text-navy-900 sm:text-3xl">
              Welcome back, {me.name.split(" ")[0]}
            </h1>
            <Link href={`/user/${me.handle}`} className="rounded-full" aria-label="Your profile and level">
              <UserLevel points={me.points.allTime} />
            </Link>
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center">
            <HeroSearch className="w-full lg:max-w-xl lg:flex-1" />
            <div className="grid grid-cols-2 gap-3 lg:ml-auto lg:flex">
              <Button href="/post/lost" size="xl" className="max-lg:!px-3" iconLeft={<Search className="size-5" aria-hidden />}>
                I lost something
              </Button>
              <Button href="/post/found" size="xl" variant="found" className="max-lg:!px-3" iconLeft={<HandHeart className="size-5" aria-hidden />}>
                I found something
              </Button>
            </div>
          </div>

          <ul className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((t) => (
              <li key={t.label}>
                <Link href={t.href} className="group flex h-full items-center gap-3 rounded-2xl bg-white p-3.5 shadow-soft transition-shadow hover:shadow-lift">
                  <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-xl", t.hot ? "bg-coral-600 text-white" : "bg-navy-100 text-navy-600")}>
                    <t.icon className="size-5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xl font-extrabold leading-none tabular-nums text-navy-900">{t.n}</span>
                    <span className="mt-1 block text-xs font-semibold leading-tight text-navy-600">{t.label}</span>
                  </span>
                  <ArrowRight className="size-4 shrink-0 text-navy-300 transition-transform group-hover:translate-x-0.5 group-hover:text-navy-600 max-sm:hidden" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {mine.length > 0 && (
        <Container as="section" className="pt-10 sm:pt-12">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-extrabold text-navy-900">Your posts</h2>
            <Link href="/my-posts" className="group inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-coral-700 transition-colors hover:bg-coral-50">
              Manage
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
          <ul className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {mine.slice(0, 3).map((item) => {
              const b = bountyForItem(w, item);
              return (
                <li key={item.id}>
                  <ItemRow item={item} titleAs="h3" bountyAmount={bountyOnOffer(b) ? b.amount : undefined} className="h-full" />
                </li>
              );
            })}
          </ul>
        </Container>
      )}

      <RecentSection type="lost" compact />
      <RecentSection type="found" compact />
      <NearbyBounties />
    </>
  );
}

/** What a member sees for the moment between the page arriving and their data being read. */
export function MemberHomeSkeleton() {
  return (
    <Container className="pb-7 pt-6 sm:pb-9 sm:pt-9">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="mt-5 h-14 rounded-2xl" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[4.25rem] rounded-2xl" />
        ))}
      </div>
    </Container>
  );
}
