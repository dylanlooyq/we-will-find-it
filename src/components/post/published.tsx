"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, MapPin, PartyPopper, Plus, Share2, Sparkles } from "lucide-react";
import { getLocation } from "@/lib/data/taxonomy";
import { formatDistance } from "@/lib/geo";
import { useMatches, useWorld } from "@/lib/store/hooks";
import { bountyForItem } from "@/lib/world";
import { MatchScore } from "../items/matches-section";
import { ItemCard } from "../items/item-card";
import { ShareSheet } from "../items/item-dialogs";
import { StatusBadge } from "../ui/badges";
import { Button } from "../ui/button";
import { Confetti, SuccessCheck } from "../ui/feedback";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";
import { openPostChooser } from "../layout/post-chooser";

/** "Your post is live 🎉" — then, immediately, the people who might help. */
export function PublishedState({ itemId }: { itemId: string }) {
  const w = useWorld();
  const item = w.itemById.get(itemId);
  const matches = useMatches(item);
  const [share, setShare] = useState(false);
  if (!item) return null;
  const lost = item.type === "lost";
  const bounty = bountyForItem(w, item);
  const pet = item.category === "pets";

  return (
    <div className="mx-auto max-w-2xl px-4 pb-16 pt-10 sm:pt-14">
      <div className="relative overflow-hidden rounded-sheet bg-white px-6 pb-8 pt-12 text-center shadow-soft sm:px-10">
        <Confetti count={44} />
        <div className="flex justify-center">
          <SuccessCheck tone={lost ? "coral" : "found"} size={96} icon={<PartyPopper className="size-9" aria-hidden />} />
        </div>
        <h1 className="mt-6 text-3xl font-extrabold text-navy-900 sm:text-4xl">Your post is live 🎉</h1>
        <p className="mx-auto mt-3 max-w-md text-[1.02rem] leading-relaxed text-navy-600">
          {lost
            ? "We'll notify you the moment someone finds a match or sends a message."
            : pet
              ? "Thank you for keeping them safe. We'll notify you if their family gets in touch."
              : "Thank you for helping. We'll notify you if the owner reaches out — and you've earned +10 points."}
        </p>
        <div className="mx-auto mt-7 max-w-xs text-left">
          <ItemCard item={item} bountyAmount={bounty?.status === "open" ? bounty.amount : undefined} />
        </div>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button href={`/item/${item.slug}`} size="lg" iconRight={<ArrowRight className="size-4" aria-hidden />}>
            View post
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setShare(true)} iconLeft={<Share2 className="size-4" aria-hidden />}>
            Share it
          </Button>
        </div>
      </div>

      {matches.length > 0 && (
        <section aria-labelledby="pm-h" className="mt-8 rounded-card bg-gradient-to-br from-violet-50 to-white p-5 ring-1 ring-violet-100 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Sparkles className="size-5" aria-hidden />
            </span>
            <div>
              <h2 id="pm-h" className="text-lg font-extrabold text-navy-900">
                🎯 Potential matches
              </h2>
              <p className="text-sm text-navy-600">{lost ? "These found items look like yours." : "These lost listings could belong to the owner."}</p>
            </div>
          </div>
          <ul className="mt-5 space-y-3">
            {matches.map((m) => (
              <li key={m.id} className="relative flex items-center gap-3.5 rounded-2xl bg-white p-3 shadow-soft transition-shadow hover:shadow-lift">
                <MatchScore score={m.score} />
                <ItemImage image={m.other.images[0]} category={m.other.category} compact className="size-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <StatusBadge type={m.other.type} variant="soft" />
                  <p className="mt-1 truncate text-[0.95rem] font-extrabold text-navy-900">
                    <Link href={`/item/${m.other.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:after:rounded-2xl">
                      {m.other.title}
                    </Link>
                  </p>
                  <p className="flex items-center gap-1 truncate text-xs text-navy-600">
                    <MapPin className="size-3 shrink-0 text-coral-600" aria-hidden />
                    {getLocation(m.other.locationId).name} · {formatDistance(m.distanceKm)} · <RelativeTime iso={m.other.postedAt} />
                  </p>
                </div>
                <ArrowRight className="size-5 shrink-0 text-navy-400" aria-hidden />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button href="/" variant="ghost">
          Back to Home
        </Button>
        <Button variant="ghost" onClick={openPostChooser} iconLeft={<Plus className="size-4" aria-hidden />}>
          Post something else
        </Button>
      </div>

      <ShareSheet open={share} onClose={() => setShare(false)} title={item.title} path={`/item/${item.slug}`} />
    </div>
  );
}
