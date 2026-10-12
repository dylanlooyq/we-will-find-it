"use client";

import { useWorld } from "@/lib/store/hooks";
import { leaderboard } from "@/lib/world";
import { formatNumber } from "@/lib/format";
import { AvatarStack } from "../ui/avatar";

/** How many members there really are, with the faces of the most helpful ones. */
export function HeroCommunity() {
  const w = useWorld();
  const members = w.users.filter((u) => !u.suspended);
  const faces = (leaderboard(w, "allTime").length ? leaderboard(w, "allTime") : members).slice(0, 4);

  return (
    <div className="mt-8 flex min-h-11 items-center gap-3">
      {faces.length > 0 && <AvatarStack users={faces} size="md" />}
      {w.ready && (
        <p className="text-sm leading-snug text-navy-600">
          <strong className="font-extrabold text-navy-900">
            {formatNumber(members.length)} helpful {members.length === 1 ? "finder" : "finders"}
          </strong>
          <br />
          reuniting people with their things across Singapore
        </p>
      )}
    </div>
  );
}
