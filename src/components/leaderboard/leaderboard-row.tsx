import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatNumber } from "@/lib/format";
import type { User } from "@/lib/types";
import { UserLevel } from "../community/level";
import { UserAvatar } from "../ui/avatar";
import { VerifiedMark } from "../ui/badges";

const MEDAL: Record<number, { bg: string; ring: string; ink: string }> = {
  1: { bg: "bg-gradient-to-br from-gold-300 to-gold-500", ring: "ring-gold-200", ink: "text-gold-900" },
  2: { bg: "bg-gradient-to-br from-navy-100 to-navy-300", ring: "ring-navy-100", ink: "text-navy-800" },
  3: { bg: "bg-gradient-to-br from-[#f3c9a2] to-[#d98f55]", ring: "ring-[#f6dcc3]", ink: "text-[#6b3a14]" },
};

/** Numbered shield for ranks 1–3, quiet numeral after that. */
export function RankMedal({ rank, size = "md" }: { rank: number; size?: "sm" | "md" | "lg" }) {
  const m = MEDAL[rank];
  const dim = { sm: "size-7 text-xs", md: "size-9 text-sm", lg: "size-11 text-base" }[size];
  if (!m) return <span className={cn("inline-flex items-center justify-center font-extrabold tabular-nums text-navy-500", dim)}>{rank}</span>;
  return (
    <span
      className={cn("inline-flex items-center justify-center rounded-[0.7rem] font-extrabold shadow-soft ring-2", dim, m.bg, m.ring, m.ink)}
      aria-label={`Rank ${rank}`}
    >
      {rank}
    </span>
  );
}

/** One line of a leaderboard. The signed-in user's row is highlighted. */
export function LeaderboardRow({
  user,
  rank,
  points,
  me,
  suffix = "pts",
  subtitle,
  className,
}: {
  user: User;
  rank: number;
  points: number;
  me?: boolean;
  suffix?: string;
  subtitle?: React.ReactNode;
  className?: string;
}) {
  return (
    <li
      aria-current={me ? "true" : undefined}
      className={cn("group relative flex items-center gap-3.5 px-3 py-3 transition-colors sm:px-4", me ? "bg-coral-50" : "hover:bg-navy-50/70", className)}
    >
      <RankMedal rank={rank} />
      <UserAvatar user={user} size="md" tick ring={rank === 1 ? "gold" : "none"} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-[0.98rem] font-extrabold text-navy-900">
          <Link href={`/user/${user.handle}`} className="truncate after:absolute after:inset-0 after:content-['']">
            {user.name}
          </Link>
          {me && <span className="rounded-md bg-coral-600 px-1.5 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wide text-white">You</span>}
          {user.verified && <VerifiedMark />}
        </p>
        {subtitle ?? <UserLevel points={user.points.allTime} tone="plain" className="mt-0.5 !bg-transparent !p-0 text-navy-500" />}
      </div>
      <p className={cn("shrink-0 text-lg font-extrabold tabular-nums", me ? "text-coral-700" : "text-navy-900")}>
        {formatNumber(points)}
        <span className="ml-1 text-xs font-bold text-navy-400">{suffix}</span>
      </p>
    </li>
  );
}
