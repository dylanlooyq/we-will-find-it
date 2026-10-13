"use client";

import { Coins } from "lucide-react";
import { getLocation } from "@/lib/data/taxonomy";
import { distanceKm } from "@/lib/geo";
import { useNow, useWorld } from "@/lib/store/hooks";
import type { ItemType } from "@/lib/types";
import { activePublicItems, bountyForItem, bountyOnOffer, openBounties, sortRecent } from "@/lib/world";
import { BountyCard } from "../items/bounty-card";
import { ItemCard } from "../items/item-card";
import { NearChip } from "../items/near-chip";
import { EmptyState } from "../ui/states";
import { Button } from "../ui/button";
import { Container, Rail, RailItem, SectionHeader } from "../ui/section";
import { PostButton } from "../layout/post-chooser";

/** "Recently Lost" / "Recently Found" — big visual cards, newest first. `compact` drops the pitch, for members. */
export function RecentSection({ type, compact }: { type: ItemType; compact?: boolean }) {
  const w = useWorld();
  const items = sortRecent(activePublicItems(w).filter((i) => i.type === type)).slice(0, 4);
  const lost = type === "lost";
  return (
    <Container as="section" className={compact ? "pt-10 sm:pt-12" : "pt-14 sm:pt-20"}>
      <SectionHeader
        eyebrow={compact ? undefined : lost ? "Help them look" : "Could it be yours?"}
        title={lost ? "Recently Lost" : "Recently Found"}
        body={compact ? undefined : lost ? "People nearby are looking for these right now. Seen one? Tell them." : "Found by kind strangers across Singapore — waiting to go home."}
        href={lost ? "/lost" : "/found"}
        hrefLabel={lost ? "See all lost" : "See all found"}
        className={compact ? "[&_h2]:text-2xl" : undefined}
      />
      <div className={compact ? "mt-5" : "mt-7"}>
        {items.length === 0 ? (
          <EmptyState
            icon={<Coins className="size-9" aria-hidden />}
            title="Nothing here yet"
            body="Check again later or post what you're looking for."
            action={<PostButton>{lost ? "Post a Lost Item" : "Post a Found Item"}</PostButton>}
          />
        ) : (
          <Rail>
            {items.map((item, i) => {
              const b = bountyForItem(w, item);
              return (
                <RailItem key={item.id}>
                  <ItemCard item={item} bountyAmount={bountyOnOffer(b) ? b.amount : undefined} priority={i < 2} className="h-full" />
                </RailItem>
              );
            })}
          </Rail>
        )}
      </div>
    </Container>
  );
}

/** Gold-accented band: nearest open bounties first. */
export function NearbyBounties() {
  const w = useWorld();
  const now = useNow();
  const near = getLocation(w.nearLocationId);
  const list = openBounties(w, now)
    .map((x) => ({ ...x, km: distanceKm(near, getLocation(x.item.locationId)) }))
    .sort((a, b) => a.km - b.km || b.bounty.amount - a.bounty.amount)
    .slice(0, 4);

  return (
    <section className="dark-band relative isolate mt-16 overflow-hidden bg-navy-900 py-14 text-white sm:mt-24 sm:py-20">
      <div aria-hidden className="absolute -right-24 -top-24 -z-10 size-96 rounded-full bg-gold-500/20 blur-3xl" />
      <div aria-hidden className="absolute -bottom-32 -left-24 -z-10 size-96 rounded-full bg-coral-500/20 blur-3xl" />
      <Container>
        <SectionHeader
          tone="light"
          eyebrow="Bounties"
          title="Bounties Near You"
          body="Cash rewards, paid directly by the owner once they have their item back."
          href="/bounties"
          hrefLabel="All bounties"
        />
        <div className="mt-5">
          <NearChip tone="light" />
        </div>
        <div className="mt-7">
          {list.length === 0 ? (
            <p className="rounded-card bg-white/5 p-8 text-center text-white/80">No open bounties yet — post an item with a reward and the community will look out for it.</p>
          ) : (
            <Rail>
              {list.map(({ item, bounty, km }) => (
                <RailItem key={bounty.id}>
                  <BountyCard item={item} bounty={bounty} distanceKm={km} nowMs={now} className="h-full" />
                </RailItem>
              ))}
            </Rail>
          )}
        </div>
        <div className="mt-8 sm:hidden">
          <Button href="/bounties" variant="gold" full size="lg">
            See all bounties
          </Button>
        </div>
      </Container>
    </section>
  );
}
