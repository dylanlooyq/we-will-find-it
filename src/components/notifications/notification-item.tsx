"use client";

import Link from "next/link";
import { Bell, ChevronRight, Coins, MessageCircle, Sparkles, Target } from "lucide-react";
import { cn } from "@/lib/cn";
import { actions } from "@/lib/store/store";
import type { AppNotification, NotificationType } from "@/lib/types";
import { RelativeTime } from "../ui/meta";

const STYLE: Record<NotificationType, { bg: string; ink: string; icon: typeof Bell }> = {
  match: { bg: "bg-violet-100", ink: "text-violet-700", icon: Target },
  bounty: { bg: "bg-gold-100", ink: "text-gold-800", icon: Coins },
  comment: { bg: "bg-found-100", ink: "text-found-700", icon: MessageCircle },
  update: { bg: "bg-coral-100", ink: "text-coral-700", icon: Bell },
  kudos: { bg: "bg-coral-100", ink: "text-coral-700", icon: Sparkles },
};

const EMOJI = /^(\p{Extended_Pictographic}️?)\s*/u;

/** Splits a leading emoji off the title so it can sit in the icon bubble. */
function split(title: string): { emoji?: string; text: string } {
  const m = title.match(EMOJI);
  return m ? { emoji: m[1], text: title.slice(m[0].length) } : { text: title };
}

/** One row in the inbox. Tapping deep-links to the page it's about and marks it read. */
export function NotificationItem({ n }: { n: AppNotification }) {
  const s = STYLE[n.type];
  const { emoji, text } = split(n.title);
  return (
    <li>
      <Link
        href={n.href || "/"}
        onClick={() => actions.markNotificationRead(n.id)}
        className={cn("group relative flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-navy-50 sm:px-5", !n.read && "bg-found-50/50")}
      >
        <span className={cn("flex size-12 shrink-0 items-center justify-center rounded-2xl text-2xl", s.bg, s.ink)} aria-hidden>
          {emoji ?? <s.icon className="size-6" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={cn("block text-[0.98rem] leading-snug text-navy-900", n.read ? "font-bold" : "font-extrabold")}>{text}</span>
          {n.body && <span className="mt-0.5 line-clamp-2 block text-sm leading-snug text-navy-600">{n.body}</span>}
          <span className="mt-1 block text-xs font-medium text-navy-400">
            <RelativeTime iso={n.at} />
          </span>
        </span>
        {!n.read && (
          <span className="size-2.5 shrink-0 rounded-full bg-coral-600">
            <span className="sr-only">Unread</span>
          </span>
        )}
        <ChevronRight className="size-5 shrink-0 text-navy-300 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </li>
  );
}
