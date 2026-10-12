"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Award, BadgeCheck, CalendarDays, Check, Crown, Handshake, Heart, MapPin, PackageCheck, Pencil, Share2, Sparkles, Trophy, UserCheck, UserPlus, UserRound, HandHeart } from "lucide-react";
import { getBadgeProgress } from "@/lib/badges";
import { areaById } from "@/lib/data/taxonomy";
import { formatMonthYear, formatNumber } from "@/lib/format";
import { levelFor, POINTS_RULES } from "@/lib/levels";
import { useHydrated, useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import type { PointsKind } from "@/lib/types";
import { bountyForItem, itemsByOwner, kudosFor, leaderboard, pointsFor } from "@/lib/world";
import { BadgeCard } from "../community/badge-card";
import { BadgeIcon } from "../community/badge-icon";
import { LevelProgress, PointsBadge, UserLevel } from "../community/level";
import { ItemCard } from "../items/item-card";
import { ShareSheet } from "../items/item-dialogs";
import { ThankYouDialog } from "../items/resolve-flow";
import { PostButton } from "../layout/post-chooser";
import { UserAvatar } from "../ui/avatar";
import { VerifiedMark } from "../ui/badges";
import { Button } from "../ui/button";
import { Chip, Tabs } from "../ui/form";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";
import { Container } from "../ui/section";
import { EmptyState, Skeleton } from "../ui/states";
import { EditProfileDialog } from "./edit-profile";

type Tab = "badges" | "activity" | "posts" | "kudos";

const KIND_ICON: Record<PointsKind, typeof Award> = {
  post_found: HandHeart,
  confirm_match: Handshake,
  thank_you: Heart,
  return: PackageCheck,
  bounty_return: Trophy,
  top_area: Crown,
  profile_complete: UserCheck,
};

const TONE_EMOJI = { heart: "❤️", thumb: "👍", star: "🌟" } as const;
const GROUPS = ["All", "Finder", "Poster", "Community", "Special"] as const;

export function ProfileView({ handle }: { handle: string }) {
  const w = useWorld();
  const hydrated = useHydrated();
  const router = useRouter();
  const user = w.userByHandle.get(handle);
  const me = w.currentUser;
  const [tab, setTab] = useState<Tab>("badges");
  const [group, setGroup] = useState<(typeof GROUPS)[number]>("All");
  const [edit, setEdit] = useState(false);
  const [share, setShare] = useState(false);
  const [thanks, setThanks] = useState(false);

  const badges = useMemo(() => (user ? getBadgeProgress(user) : []), [user]);
  const rank = useMemo(() => (user ? leaderboard(w, "season").findIndex((u) => u.id === user.id) + 1 : 0), [w, user]);

  if (!user) {
    if (!hydrated) {
      return (
        <Container className="py-10">
          <Skeleton className="h-72 rounded-sheet" />
        </Container>
      );
    }
    return (
      <Container className="py-16">
        <EmptyState icon={<UserRound className="size-9" aria-hidden />} title="We can't find that member" body="They may have changed their username." tone="coral" action={<Button href="/leaderboard">See the leaderboard</Button>} />
      </Container>
    );
  }

  const isMe = me?.id === user.id;
  const following = w.follows.has(user.id);
  const lv = levelFor(user.points.allTime);
  const earned = badges.filter((b) => b.earned);
  const shown = badges.filter((b) => group === "All" || b.def.group === group).sort((a, b) => Number(b.earned) - Number(a.earned) || b.progress / b.goal - a.progress / a.goal);
  const next = badges.filter((b) => !b.earned).sort((a, b) => b.progress / b.goal - a.progress / a.goal)[0];
  const activity = pointsFor(w, user.id);
  const kudos = kudosFor(w, user.id);
  const posts = itemsByOwner(w, user.id).filter((i) => i.moderation === "ok");
  const area = areaById[user.homeArea];

  const stats = [
    { label: "Items found", value: user.stats.itemsFound },
    { label: "Items lost", value: user.stats.itemsLost },
    { label: "Returned", value: user.stats.itemsReturned },
    { label: "Rating", value: user.rating.toFixed(1), star: true },
  ];

  return (
    <Container className="pb-8 pt-5 sm:pt-8">
      {/* ── Header card ───────────────────────────────── */}
      {/*
        One row on a wide screen: avatar and name, the four numbers, the actions. Narrower, the numbers
        drop to their own line under a hairline; on a phone the actions shrink to icons or their own row.
      */}
      <section className="rounded-card bg-white px-4 py-3.5 shadow-soft sm:px-6 sm:py-4" aria-labelledby="profile-name">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-3 sm:gap-x-4">
          <div className="relative">
            <UserAvatar user={user} size="lg" />
            {lv.level >= 5 && (
              <span className="absolute -right-1 -top-1 flex size-7 items-center justify-center rounded-full bg-gold-300 text-gold-900 ring-[3px] ring-white" title={lv.title}>
                <Crown className="size-3.5 fill-current" aria-hidden />
                <span className="sr-only">{lv.title}</span>
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h1 id="profile-name" className="flex flex-wrap items-center gap-1.5 text-xl font-extrabold leading-tight text-navy-900 sm:text-2xl">
              {user.name}
              {user.verified && <VerifiedMark className="[&_svg]:size-5" />}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <UserLevel points={user.points.allTime} />
              {rank > 0 && (
                <Link href="/leaderboard" className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2.5 py-1 text-xs font-bold text-gold-800 hover:bg-gold-200">
                  <Trophy className="size-3" aria-hidden />#{rank} in Singapore
                </Link>
              )}
            </div>
            {user.tagline && <p className="mt-1.5 text-sm font-semibold italic text-navy-700">“{user.tagline}”</p>}
          </div>

          <dl className="order-last grid w-full grid-cols-4 gap-2 border-t border-line pt-2.5 text-center sm:flex sm:gap-0 sm:divide-x sm:divide-line sm:pt-3 sm:text-left xl:order-none xl:mr-3 xl:w-auto xl:border-t-0 xl:pt-0">
            {stats.map((s) => (
              <div key={s.label} className="sm:flex sm:items-baseline sm:gap-1.5 sm:px-4 sm:first:pl-0">
                <dd className="flex items-center justify-center gap-0.5 text-base font-extrabold tabular-nums leading-tight text-navy-900 sm:text-lg">
                  {s.value}
                  {s.star && <span className="text-sm text-gold-500" aria-hidden>★</span>}
                </dd>
                <dt className="text-[0.68rem] font-semibold leading-tight text-navy-600 sm:text-sm">{s.label}</dt>
              </div>
            ))}
          </dl>

          {isMe ? (
            // Your own profile: on a phone the two actions shrink to icons and sit beside your name.
            <div className="flex shrink-0 gap-1.5 sm:gap-2">
              <Button variant="secondary" onClick={() => setEdit(true)} iconLeft={<Pencil className="size-4" aria-hidden />} className="max-sm:!size-10 max-sm:!gap-0 max-sm:!px-0">
                <span className="max-sm:sr-only">Edit profile</span>
              </Button>
              <Button variant="ghost" onClick={() => setShare(true)} iconLeft={<Share2 className="size-4" aria-hidden />} className="max-sm:!size-10 max-sm:!gap-0 max-sm:!px-0">
                <span className="max-sm:sr-only">Share</span>
              </Button>
            </div>
          ) : (
            <div className="flex w-full gap-2 sm:w-auto">
              <Button
                variant={following ? "secondary" : "primary"}
                className="max-sm:!h-10 max-sm:flex-1 max-sm:!px-3"
                aria-pressed={following}
                iconLeft={following ? <Check className="size-4" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
                onClick={() => (me ? actions.toggleFollow(user.id) : router.push(`/login?next=/user/${user.handle}`))}
              >
                {following ? "Following" : "Follow"}
              </Button>
              <Button variant="secondary" className="max-sm:!h-10 max-sm:flex-1 max-sm:!px-3" onClick={() => (me ? setThanks(true) : router.push(`/login?next=/user/${user.handle}`))} iconLeft={<span aria-hidden>❤️</span>}>
                Say thanks
              </Button>
              <Button variant="ghost" className="max-sm:!size-10 max-sm:!px-0" onClick={() => setShare(true)} aria-label="Share profile">
                <Share2 className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </div>
      </section>

      <Tabs<Tab>
        label="Profile sections"
        idPrefix="profile"
        value={tab}
        onChange={setTab}
        className="mt-6 rounded-t-card bg-white px-2 shadow-soft"
        tabs={[
          { value: "badges", label: "Badges", count: earned.length },
          { value: "activity", label: "Activity" },
          { value: "posts", label: "Posts", count: posts.length },
          { value: "kudos", label: "Kudos", count: kudos.length },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div id={`profile-panel-${tab}`} role="tabpanel" aria-labelledby={`profile-${tab}`} className="min-w-0">
          {tab === "badges" && (
            <section id="badges" aria-label="Badge collection" className="scroll-mt-28">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-extrabold text-navy-900">
                  Badge collection{" "}
                  <span className="text-base font-bold text-navy-400">
                    {earned.length}/{badges.length}
                  </span>
                </h2>
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  {GROUPS.map((g) => (
                    <Chip key={g} active={group === g} onClick={() => setGroup(g)} className="!h-9 !px-3.5">
                      {g}
                    </Chip>
                  ))}
                </div>
              </div>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {shown.map((b) => (
                  <li key={b.def.id}>
                    <BadgeCard badge={b} className="h-full" />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {tab === "activity" && (
            <section aria-label="Recent activity">
              <h2 className="text-xl font-extrabold text-navy-900">Recent activity</h2>
              {activity.length === 0 ? (
                <EmptyState icon={<Sparkles className="size-9" aria-hidden />} title="No activity yet" body="Post a found item or help someone out to start earning points." tone="coral" action={<PostButton>Post Something</PostButton>} />
              ) : (
                <ul className="mt-4 divide-y divide-line overflow-hidden rounded-card bg-white shadow-soft">
                  {activity.map((p) => {
                    const item = p.itemId ? w.itemById.get(p.itemId) : undefined;
                    const Icon = KIND_ICON[p.kind];
                    return (
                      <li key={p.id} className="flex items-center gap-3.5 p-3.5 sm:p-4">
                        {item ? (
                          <ItemImage image={item.images[0]} category={item.category} compact className="size-12 shrink-0 rounded-xl" />
                        ) : (
                          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-coral-50 text-coral-600">
                            <Icon className="size-6" aria-hidden />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[0.95rem] font-bold text-navy-900">{p.label}</p>
                          <p className="text-xs text-navy-500">
                            <RelativeTime iso={p.at} />
                          </p>
                        </div>
                        <PointsBadge points={p.points} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {tab === "posts" && (
            <section aria-label="Posts">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-navy-900">Posts</h2>
                {isMe && (
                  <Button href="/my-posts" size="sm" variant="secondary">
                    Manage my posts
                  </Button>
                )}
              </div>
              {posts.length === 0 ? (
                <EmptyState icon={<PackageCheck className="size-9" aria-hidden />} title="No posts yet" body="Nothing here yet. Check again later or post what you're looking for." tone="coral" />
              ) : (
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {posts.map((p) => {
                    const b = bountyForItem(w, p);
                    return <ItemCard key={p.id} item={p} bountyAmount={b?.status === "open" ? b.amount : undefined} className="h-full" />;
                  })}
                </div>
              )}
            </section>
          )}

          {tab === "kudos" && (
            <section aria-label="Kudos">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-navy-900">Kudos</h2>
                {!isMe && (
                  <Button size="sm" onClick={() => (me ? setThanks(true) : router.push(`/login?next=/user/${user.handle}`))} iconLeft={<span aria-hidden>❤️</span>}>
                    Say thanks
                  </Button>
                )}
              </div>
              {kudos.length === 0 ? (
                <EmptyState icon={<Heart className="size-9" aria-hidden />} title="No kudos yet" body={isMe ? "When someone thanks you, it shows up here." : `Be the first to thank ${user.name.split(" ")[0]}.`} tone="coral" />
              ) : (
                <ul className="mt-4 space-y-3">
                  {kudos.map((k) => {
                    const from = w.userById.get(k.fromUserId);
                    return (
                      <li key={k.id} className="flex gap-3.5 rounded-card bg-white p-4 shadow-soft">
                        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-coral-50 text-2xl" aria-hidden>
                          {TONE_EMOJI[k.tone]}
                        </span>
                        <div className="min-w-0">
                          <p className="text-[0.98rem] font-semibold leading-snug text-navy-900">“{k.message}”</p>
                          {from && (
                            <p className="mt-1.5 flex items-center gap-2 text-sm text-navy-500">
                              <UserAvatar user={from} size="xs" />
                              <Link href={`/user/${from.handle}`} className="font-bold text-navy-700 hover:underline">
                                {from.name}
                              </Link>
                              · <RelativeTime iso={k.at} />
                            </p>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>

        {/* ── Sidebar ───────────────────────────────── */}
        <aside className="space-y-5" aria-label="About and progress">
          <LevelProgress points={user.points.allTime}>
            {next && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-navy-50 p-3">
                <BadgeIcon def={next.def} earned={false} size="sm" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-navy-400">Next badge</p>
                  <p className="truncate text-sm font-extrabold text-navy-900">{next.def.name}</p>
                  <p className="text-xs text-navy-600">
                    {formatNumber(next.progress)} / {formatNumber(next.goal)} — {next.def.description}
                  </p>
                </div>
              </div>
            )}
          </LevelProgress>

          <section className="rounded-card bg-white p-5 shadow-soft" aria-labelledby="about-h">
            <h2 id="about-h" className="text-lg font-extrabold text-navy-900">
              About {isMe ? "me" : user.name.split(" ")[0]}
            </h2>
            <p className="mt-2 text-[0.95rem] leading-relaxed text-navy-700">{user.bio || (isMe ? "Add a short bio so people know who you are." : "No bio yet.")}</p>
            <ul className="mt-4 space-y-2 text-sm text-navy-600">
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-coral-600" aria-hidden />
                {area.name}, Singapore
              </li>
              <li className="flex items-center gap-2.5">
                <CalendarDays className="size-4 text-navy-400" aria-hidden />
                Member since {formatMonthYear(user.memberSince)}
              </li>
              {user.verified && (
                <li className="flex items-center gap-2.5 text-found-700">
                  <BadgeCheck className="size-4" aria-hidden />
                  Verified member
                </li>
              )}
            </ul>
          </section>

          <section className="rounded-card bg-white p-5 shadow-soft" aria-labelledby="earn-h">
            <h2 id="earn-h" className="text-lg font-extrabold text-navy-900">
              How to earn points
            </h2>
            <ul className="mt-3 divide-y divide-line">
              {POINTS_RULES.map((r) => {
                const Icon = KIND_ICON[r.kind];
                return (
                  <li key={r.kind} className="flex items-center gap-3 py-2.5 text-sm">
                    <Icon className="size-4 shrink-0 text-navy-400" aria-hidden />
                    <span className="flex-1 font-semibold text-navy-800">{r.label}</span>
                    <PointsBadge points={r.points} />
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>

      {isMe && (
        <EditProfileDialog key={`${user.name}-${user.bio}-${user.hue}`} open={edit} onClose={() => setEdit(false)} user={user} />
      )}
      {!isMe && <ThankYouDialog open={thanks} onClose={() => setThanks(false)} user={user} />}
      <ShareSheet open={share} onClose={() => { setShare(false); }} title={`${user.name} on wewillfind.it`} path={`/user/${user.handle}`} />
    </Container>
  );
}

