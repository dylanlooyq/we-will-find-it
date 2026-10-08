"use client";

import Link from "next/link";
import { Check, Star, UserPlus } from "lucide-react";
import { cn } from "@/lib/cn";
import { areaById } from "@/lib/data/taxonomy";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { User } from "@/lib/types";
import { UserAvatar } from "../ui/avatar";
import { VerifiedMark } from "../ui/badges";
import { Button } from "../ui/button";
import { UserLevel } from "./level";

/** Who you're dealing with: level, rating, verification and track record. */
export function ProfileCard({ user, className, showFollow = true }: { user: User; className?: string; showFollow?: boolean }) {
  const w = useWorld();
  const me = w.currentUser;
  const following = w.follows.has(user.id);
  const isMe = me?.id === user.id;

  return (
    <div className={cn("rounded-2xl bg-navy-50 p-4", className)}>
      <div className="flex items-center gap-3.5">
        <UserAvatar user={user} size="lg" tick />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[1.02rem] font-extrabold text-navy-900">
            <Link href={`/user/${user.handle}`} className="truncate hover:underline">
              {user.name}
            </Link>
            {user.verified && <VerifiedMark />}
          </p>
          <UserLevel points={user.points.allTime} className="mt-1" />
        </div>
        {showFollow && !isMe && (
          <Button
            size="sm"
            variant={following ? "secondary" : "soft"}
            onClick={() => (me ? actions.toggleFollow(user.id) : toast("Log in to follow people", { tone: "info", href: "/login" }))}
            iconLeft={following ? <Check className="size-4" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
            aria-pressed={following}
          >
            {following ? "Following" : "Follow"}
          </Button>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3.5 text-center">
        <div>
          <dt className="text-[0.7rem] font-semibold text-navy-500">Finder score</dt>
          <dd className="mt-0.5 inline-flex items-center justify-center gap-1 text-sm font-extrabold tabular-nums text-navy-900">
            <Star className="size-4 fill-gold-400 text-gold-400" aria-hidden />
            {user.rating.toFixed(1)}
            <span className="sr-only"> out of 5</span>
          </dd>
        </div>
        <div>
          <dt className="text-[0.7rem] font-semibold text-navy-500">Returned</dt>
          <dd className="text-sm font-extrabold tabular-nums text-navy-900">{user.stats.itemsReturned}</dd>
        </div>
        <div>
          <dt className="text-[0.7rem] font-semibold text-navy-500">Area</dt>
          <dd className="text-sm font-extrabold text-navy-900">{areaById[user.homeArea].name}</dd>
        </div>
      </dl>
    </div>
  );
}
