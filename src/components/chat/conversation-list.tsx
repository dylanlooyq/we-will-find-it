"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { useNow, useWorld } from "@/lib/store/hooks";
import { conversationsFor, unreadCount } from "@/lib/world";
import { relTimeShort } from "@/lib/format";
import { StatusBadge } from "../ui/badges";
import { Button } from "../ui/button";
import { UserAvatar } from "../ui/avatar";
import { Chip } from "../ui/form";
import { ItemImage } from "../ui/item-image";
import { EmptyState } from "../ui/states";

/** Inbox: newest first, unread highlighted, grouped by listing. */
export function ConversationList({ activeId }: { activeId: string | null }) {
  const w = useWorld();
  const now = useNow();
  const me = w.currentUser;
  const [unreadOnly, setUnreadOnly] = useState(false);

  if (!me) {
    return (
      <EmptyState
        icon={<MessageCircle className="size-9" aria-hidden />}
        title="Log in to see your messages"
        body="Chats with finders and owners live here."
        tone="coral"
        action={<Button href="/login?next=/messages">Log in</Button>}
      />
    );
  }

  const all = conversationsFor(w, me.id);
  const list = unreadOnly ? all.filter((c) => unreadCount(c, me.id) > 0) : all;
  const totalUnread = all.reduce((n, c) => n + (unreadCount(c, me.id) > 0 ? 1 : 0), 0);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-5 pb-3 pt-5">
        <h1 className="text-2xl font-extrabold text-navy-900">Messages</h1>
        <div className="mt-3 flex gap-2">
          <Chip active={!unreadOnly} onClick={() => setUnreadOnly(false)} className="!h-9">
            All
          </Chip>
          <Chip active={unreadOnly} onClick={() => setUnreadOnly(true)} className="!h-9" count={totalUnread || undefined}>
            Unread
          </Chip>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<MessageCircle className="size-9" aria-hidden />}
          title={unreadOnly ? "You're all caught up" : "No conversations yet"}
          body={unreadOnly ? "No unread messages." : "When you contact a finder or someone contacts you, it shows up here."}
          tone="coral"
          action={!unreadOnly ? <Button href="/explore">Browse listings</Button> : undefined}
        />
      ) : (
        <ul className="flex-1 divide-y divide-line overflow-y-auto" aria-label="Conversations">
          {list.map((c) => {
            const item = w.itemById.get(c.itemId);
            const otherId = c.participantIds.find((p) => p !== me.id);
            const other = otherId ? w.userById.get(otherId) : undefined;
            if (!item || !other) return null;
            const last = c.messages[c.messages.length - 1];
            const unread = unreadCount(c, me.id);
            const active = c.id === activeId;
            const preview = !last ? "No messages yet" : last.kind === "photo" ? "📷 Photo" : last.kind === "location" ? "📍 Shared a meeting point" : last.kind === "system" ? last.text : `${last.senderId === me.id ? "You: " : ""}${last.text}`;
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn("relative flex gap-3.5 px-5 py-4 transition-colors hover:bg-navy-50", active && "bg-coral-50 hover:bg-coral-50", unread > 0 && !active && "bg-found-50/40")}
                >
                  <div className="relative shrink-0">
                    <ItemImage image={item.images[0]} category={item.category} compact className="size-14 rounded-2xl" />
                    <span className="absolute -bottom-1.5 -right-1.5 rounded-full bg-white p-0.5">
                      <UserAvatar user={other} size="xs" />
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={cn("truncate text-[0.98rem]", unread > 0 ? "font-extrabold text-navy-900" : "font-bold text-navy-800")}>{other.name}</p>
                      {last && <time dateTime={last.at} className="shrink-0 text-xs font-medium text-navy-400">{relTimeShort(last.at, now)}</time>}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <StatusBadge type={item.type} pet={item.category === "pets"} resolved={item.status === "resolved"} variant="soft" className="!px-1.5 !py-0.5 !text-[0.6rem]" />
                      <p className="truncate text-xs font-semibold text-navy-600">{item.pet?.name ?? item.title}</p>
                    </div>
                    <p className={cn("mt-1 truncate text-sm", unread > 0 ? "font-semibold text-navy-900" : "text-navy-500")}>{preview}</p>
                  </div>
                  {unread > 0 && (
                    <span className="mt-1 flex size-5 shrink-0 items-center justify-center self-center rounded-full bg-coral-600 text-[0.65rem] font-extrabold text-white">
                      {unread}
                      <span className="sr-only"> unread</span>
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
