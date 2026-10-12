"use client";

import { Lock, PartyPopper, Search } from "lucide-react";
import { itemToDraft } from "@/lib/post-draft";
import { useHydrated, useWorld } from "@/lib/store/hooks";
import { bountyForItem, bountyOnOffer } from "@/lib/world";
import { Button } from "../ui/button";
import { EmptyState, Skeleton } from "../ui/states";
import { PostFlow } from "./post-flow";

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-4 py-16">{children}</div>;
}

/** "Edit post": the posting form, filled in from a listing its owner has already published. */
export function EditPost({ slug }: { slug: string }) {
  const w = useWorld();
  const hydrated = useHydrated();
  const me = w.currentUser;
  const item = w.itemBySlug.get(slug);
  const back = <Button href={`/item/${slug}`}>Back to the listing</Button>;

  if (!item) {
    if (!hydrated) {
      return (
        <Notice>
          <Skeleton className="h-64 rounded-card" />
        </Notice>
      );
    }
    return (
      <Notice>
        <EmptyState icon={<Search className="size-9" aria-hidden />} title="We can't find that listing" body="It may have been removed." tone="coral" action={<Button href="/my-posts">My posts</Button>} />
      </Notice>
    );
  }

  if (!me) {
    return (
      <Notice>
        <EmptyState icon={<Lock className="size-9" aria-hidden />} title="Log in to edit this post" body="Only the person who posted it can change it." tone="coral" action={<Button href={`/login?next=/item/${slug}/edit`}>Log in</Button>} />
      </Notice>
    );
  }

  if (item.ownerId !== me.id) {
    return (
      <Notice>
        <EmptyState icon={<Lock className="size-9" aria-hidden />} title="This isn't your post" body="Only the person who posted it can change it." tone="coral" action={back} />
      </Notice>
    );
  }

  if (item.status === "resolved") {
    return (
      <Notice>
        <EmptyState icon={<PartyPopper className="size-9" aria-hidden />} title="This one is already reunited" body="A closed listing can't be changed any more." tone="found" action={back} />
      </Notice>
    );
  }

  const bounty = bountyForItem(w, item);
  const onOffer = bountyOnOffer(bounty) ? bounty : undefined;
  return (
    <PostFlow
      key={item.id}
      kind={item.type}
      edit={{
        itemId: item.id,
        slug: item.slug,
        draft: itemToDraft(item, onOffer?.amount),
        bountyLocked: onOffer?.status === "claimed" || onOffer?.status === "approved",
      }}
    />
  );
}
