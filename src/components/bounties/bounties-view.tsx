"use client";

import { useMemo, useState } from "react";
import { BadgeCheck, Coins, Gift, HandCoins, HeartHandshake, Megaphone, PackageCheck, SearchCheck, ShieldCheck, Handshake } from "lucide-react";
import { cn } from "@/lib/cn";
import { categories, getLocation, PAYMENT_OPTIONS } from "@/lib/data/taxonomy";
import { formatMoney } from "@/lib/format";
import { distanceKm } from "@/lib/geo";
import { useNow, useWorld } from "@/lib/store/hooks";
import type { CategoryId } from "@/lib/types";
import { openBounties } from "@/lib/world";
import { SkylineArt } from "../home/hero-art";
import { BountyCard } from "../items/bounty-card";
import { NearChip } from "../items/near-chip";
import { PostButton } from "../layout/post-chooser";
import { Button } from "../ui/button";
import { CategoryIcon } from "../ui/category-icon";
import { Chip } from "../ui/form";
import { Container, Rail, RailItem, SectionHeader } from "../ui/section";
import { EmptyState } from "../ui/states";

const PROPS = [
  { icon: Gift, title: "Set a reward", body: "Offer a cash bounty when you post a lost item.", tone: "bg-coral-100 text-coral-700" },
  { icon: HeartHandshake, title: "Encourage good Samaritans", body: "Motivate more people to look out for your item.", tone: "bg-violet-100 text-violet-700" },
  { icon: ShieldCheck, title: "Pay on hand-over", body: "You pay the finder directly, only once you have it back.", tone: "bg-mint-100 text-mint-700" },
];

const FLOW = [
  { icon: Megaphone, label: "You post & attach a bounty" },
  { icon: SearchCheck, label: "A finder spots your item" },
  { icon: PackageCheck, label: "They submit proof" },
  { icon: BadgeCheck, label: "You verify it's yours" },
  { icon: Handshake, label: "You meet in public & confirm" },
  { icon: HandCoins, label: "You pay the finder directly" },
];

function BountyHero({ count, total }: { count: number; total: number }) {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-gold-50 via-coral-50 to-white">
      <div aria-hidden className="absolute inset-y-0 right-0 -z-10 hidden w-[55%] opacity-60 [mask-image:linear-gradient(to_left,black_30%,transparent)] lg:block">
        <SkylineArt />
      </div>
      <Container className="grid items-center gap-8 py-12 sm:py-16 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <span className="flex size-16 items-center justify-center rounded-3xl bg-coral-600 text-white shadow-coral">
            <Megaphone className="size-8 -rotate-12" aria-hidden />
          </span>
          <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-navy-900 sm:text-6xl">
            <span className="text-coral-600">Bounties</span>
          </h1>
          <p className="mt-3 text-2xl font-extrabold leading-snug text-navy-900 sm:text-3xl">A bigger incentive to return what&rsquo;s lost.</p>
          <p className="mt-4 max-w-lg text-[1.02rem] leading-relaxed text-navy-600">
            Lost something valuable? Add a cash reward. Found something with a bounty? Prove it, hand it back, and get paid — safely.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <PostButton size="lg">Offer a bounty</PostButton>
            <Button href="#how-bounties-work" variant="secondary" size="lg">
              How it works
            </Button>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-navy-800 shadow-soft backdrop-blur">
            <Coins className="size-4 text-gold-600" aria-hidden />
            {count} open bounties · <span className="text-gold-800">{formatMoney(total)}</span> in rewards
          </p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          {PROPS.map((p) => (
            <li key={p.title} className="flex items-start gap-4 rounded-card bg-white/90 p-4 shadow-soft backdrop-blur">
              <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl", p.tone)}>
                <p.icon className="size-6" aria-hidden />
              </span>
              <div>
                <h2 className="text-[1.02rem] font-extrabold text-navy-900">{p.title}</h2>
                <p className="mt-0.5 text-sm leading-snug text-navy-600">{p.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

function Section({
  title,
  eyebrow,
  body,
  entries,
  nowMs,
  showDistance,
}: {
  title: string;
  eyebrow: string;
  body: string;
  entries: { item: import("@/lib/types").Item; bounty: import("@/lib/types").Bounty; km: number }[];
  nowMs: number;
  showDistance?: boolean;
}) {
  const [all, setAll] = useState(false);
  if (entries.length === 0) return null;
  const list = all ? entries : entries.slice(0, 4);
  return (
    <Container as="section" className="pt-14 sm:pt-16">
      <SectionHeader eyebrow={eyebrow} title={title} body={body} action={entries.length > 4 ? <Button variant="ghost" size="sm" onClick={() => setAll((a) => !a)}>{all ? "Show less" : `See all ${entries.length}`}</Button> : null} />
      <div className="mt-6">
        <Rail className={all ? "lg:grid-cols-4 flex-wrap" : undefined}>
          {list.map(({ item, bounty, km }) => (
            <RailItem key={bounty.id}>
              <BountyCard item={item} bounty={bounty} nowMs={nowMs} distanceKm={showDistance || true ? km : undefined} className="h-full" />
            </RailItem>
          ))}
        </Rail>
      </div>
    </Container>
  );
}

export function BountiesView() {
  const w = useWorld();
  const now = useNow();
  const [cat, setCat] = useState<CategoryId | "all">("all");
  const near = getLocation(w.nearLocationId);

  const all = useMemo(
    () => openBounties(w, now).map((x) => ({ ...x, km: distanceKm(near, getLocation(x.item.locationId)) })),
    [w, now, near],
  );
  const present = useMemo(() => new Set(all.map((x) => x.item.category)), [all]);
  const filtered = cat === "all" ? all : all.filter((x) => x.item.category === cat);
  const total = all.reduce((s, x) => s + x.bounty.amount, 0);

  const highest = [...filtered].sort((a, b) => b.bounty.amount - a.bounty.amount);
  const nearby = [...filtered].sort((a, b) => a.km - b.km);
  const recent = [...filtered].sort((a, b) => Date.parse(b.bounty.createdAt) - Date.parse(a.bounty.createdAt));
  const ending = [...filtered].sort((a, b) => Date.parse(a.bounty.expiresAt) - Date.parse(b.bounty.expiresAt));

  return (
    <>
      <BountyHero count={all.length} total={total} />

      <Container className="sticky top-[var(--header-h)] z-30 -mt-px border-b border-line/70 bg-canvas/95 py-3 backdrop-blur">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <NearChip className="shrink-0" />
          <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden />
          <Chip active={cat === "all"} onClick={() => setCat("all")} className="!h-9 shrink-0">
            All
          </Chip>
          {categories
            .filter((c) => present.has(c.id))
            .map((c) => (
              <Chip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} icon={<CategoryIcon icon={c.icon} className="size-4" />} className="!h-9 shrink-0">
                {c.label}
              </Chip>
            ))}
        </div>
      </Container>

      {filtered.length === 0 ? (
        <Container className="pt-10">
          <EmptyState
            icon={<Coins className="size-9" aria-hidden />}
            title="No bounties here yet"
            body="Nothing here yet. Check again later or post what you're looking for."
            tone="gold"
            action={<PostButton>Post a Lost Item</PostButton>}
          />
        </Container>
      ) : (
        <>
          <Section eyebrow="Biggest rewards" title="Highest Bounties" body="The rewards worth getting out of bed for." entries={highest} nowMs={now} />
          <Section eyebrow={`Near ${near.name}`} title="Nearby Bounties" body="Close enough to check on your way home." entries={nearby} nowMs={now} showDistance />
          <Section eyebrow="Just posted" title="Recently Added" body="Fresh bounties — be the first to spot them." entries={recent} nowMs={now} />
          <Section eyebrow="Running out of time" title="Ending Soon" body="These rewards expire in the next few days." entries={ending.filter((e) => Date.parse(e.bounty.expiresAt) - now < 14 * 86_400_000)} nowMs={now} />
        </>
      )}

      <Container as="section" className="pt-20" >
        <div id="how-bounties-work" className="scroll-mt-32 rounded-sheet bg-white p-6 shadow-soft sm:p-10">
          <p className="eyebrow text-coral-700">How bounties work</p>
          <h2 className="mt-2 text-2xl font-extrabold text-navy-900 sm:text-3xl">From &ldquo;lost&rdquo; to &ldquo;paid&rdquo; in six steps</h2>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
            {FLOW.map((s, i) => (
              <li key={s.label} className="relative flex items-start gap-3.5 lg:flex-col lg:items-center lg:text-center">
                <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gold-100 text-gold-800">
                  <s.icon className="size-7" aria-hidden />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-navy-900 text-xs font-extrabold text-white">{i + 1}</span>
                </span>
                <p className="pt-1 text-[0.95rem] font-bold leading-snug text-navy-800 lg:pt-3">{s.label}</p>
              </li>
            ))}
          </ol>
          <p className="mt-8 rounded-2xl bg-navy-50 p-4 text-sm leading-relaxed text-navy-600">
            <strong className="text-navy-800">We never hold your money.</strong> Rewards go straight from the owner to the finder — by {PAYMENT_OPTIONS} — once the item is back with its owner. Nothing is stored on, or paid through, wewillfind.it.
          </p>
        </div>
      </Container>
    </>
  );
}
