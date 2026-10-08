import type { Metadata } from "next";
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view";

export const metadata: Metadata = {
  title: "Leaderboard — Top Finders in Singapore",
  description:
    "Singapore's most helpful finders, ranked by points for returning lost items. See top finders island-wide and neighbourhood by neighbourhood.",
  alternates: { canonical: "/leaderboard" },
};

export default function LeaderboardPage() {
  return <LeaderboardView />;
}
