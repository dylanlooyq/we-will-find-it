"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bookmark, Coins, ListChecks, MessageCircle, PartyPopper, Plus } from "lucide-react";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { activePublicItems, bountyForItem, claimsForItem, itemsByOwner } from "@/lib/world";
import type { Item } from "@/lib/types";
import { ItemRow } from "../items/item-card";
import { ResolveDialog } from "../items/resolve-flow";
import { PostButton } from "../layout/post-chooser";
import { Pill } from "../ui/badges";
import { Button } from "../ui/button";
import { Tabs } from "../ui/form";
import { Container } from "../ui/section";
import { EmptyState } from "../ui/states";

type Tab = "active" | "resolved" | "saved";

export function MyPostsView() {
  const w = useWorld();
  const me = w.currentUser;
  const [tab, setTab] = useState<Tab>("active");
  const [resolving, setResolving] = useState<Item | null>(null);

  const mine = useMemo(() => (me ? itemsByOwner(w, me.id).filter((i) => i.moderation !== "removed") : []), [w, me]);
  const active = mine.filter((i) => i.status === "active");
  const resolved = mine.filter((i) => i.status === "resolved");
  const saved = useMemo(() => activePublicItems(w).filter((i) => w.saves.has(i.id)), [w]);

  if (!me) {
    return (
      <Container className="py-16">
        <EmptyState icon={<ListChecks className="size-9" aria-hidden />} title="Log in to manage your posts" body="Your listings, claims and saved items live here." tone="coral" action={<Button href="/login?next=/my-posts">Log in</Button>} />
      </Container>
    );
  }

  const list = tab === "active" ? active : tab === "resolved" ? resolved : saved;

  return (
    <Container className="max-w-3xl pb-6 pt-8 sm:pt-12">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-coral-700">Your listings</p>
          <h1 className="mt-2 text-3xl font-extrabold text-navy-900 sm:text-4xl">My Posts</h1>
        </div>
        <PostButton size="sm">New post</PostButton>
      </header>

      <Tabs<Tab>
        label="Post status"
        idPrefix="mine"
        value={tab}
        onChange={setTab}
        className="mt-6"
        tabs={[
          { value: "active", label: "Active", count: active.length },
          { value: "resolved", label: "Resolved", count: resolved.length },
          { value: "saved", label: "Saved", count: saved.length },
        ]}
      />

      <div id={`mine-panel-${tab}`} role="tabpanel" aria-labelledby={`mine-${tab}`} className="mt-5">
        {list.length === 0 ? (
          <EmptyState
            icon={tab === "saved" ? <Bookmark className="size-9" aria-hidden /> : tab === "resolved" ? <PartyPopper className="size-9" aria-hidden /> : <Plus className="size-9" aria-hidden />}
            title={tab === "active" ? "No active posts" : tab === "resolved" ? "Nothing reunited yet" : "No saved items"}
            body={tab === "active" ? "Nothing here yet. Check again later or post what you're looking for." : tab === "resolved" ? "Items you've reunited will appear here — and earn you points." : "Tap the bookmark on any listing to keep an eye on it."}
            tone="coral"
            action={tab === "active" ? <PostButton>Post a Lost Item</PostButton> : <Button href="/explore">Explore listings</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {list.map((item) => {
              const b = bountyForItem(w, item);
              const claims = claimsForItem(w, item.id).filter((c) => c.status === "submitted" || c.status === "more_info");
              const own = item.ownerId === me.id;
              return (
                <li key={item.id}>
                  <ItemRow
                    item={item}
                    titleAs="h2"
                    bountyAmount={b && b.status !== "released" ? b.amount : undefined}
                    note={
                      <span className="flex flex-wrap items-center gap-2 text-navy-500">
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="size-3.5" aria-hidden /> {item.comments}
                        </span>
                        {claims.length > 0 && own && (
                          <Pill tone="gold">
                            <Coins className="size-3" aria-hidden /> {claims.length} claim{claims.length > 1 ? "s" : ""} to review
                          </Pill>
                        )}
                      </span>
                    }
                    trailing={
                      own && item.status === "active" ? (
                        <Button size="sm" variant="secondary" onClick={() => setResolving(item)}>
                          {item.type === "lost" ? "Mark as found" : "Mark as returned"}
                        </Button>
                      ) : tab === "saved" ? (
                        <Button size="sm" variant="ghost" onClick={() => actions.toggleSave(item.id)} aria-label="Remove from saved">
                          <Bookmark className="size-4 fill-coral-500 text-coral-600" aria-hidden />
                        </Button>
                      ) : null
                    }
                  />
                  {claims.length > 0 && own && (
                    <Link href={`/item/${item.slug}`} className="mt-1.5 block rounded-xl bg-gold-50 px-4 py-2.5 text-sm font-bold text-gold-900 hover:bg-gold-100">
                      Review {claims.length} bounty claim{claims.length > 1 ? "s" : ""} →
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {resolving && <ResolveDialog open onClose={() => setResolving(null)} item={resolving} />}
    </Container>
  );
}
