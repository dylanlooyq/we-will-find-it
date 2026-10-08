import type { BadgeDef, BadgeProgress, User } from "./types";

export const BADGES: BadgeDef[] = [
  { id: "helpful-finder", name: "Helpful Finder", description: "Return your first item", group: "Finder", glyph: "heart", tone: "coral", goal: 1 },
  { id: "fast-responder", name: "Fast Responder", description: "Respond within 1 hour", group: "Finder", glyph: "bolt", tone: "violet", goal: 1 },
  { id: "returns-5", name: "5+ Returns", description: "Successfully return 5 items", group: "Finder", glyph: "box", tone: "gold", goal: 5 },
  { id: "returns-10", name: "10+ Returns", description: "Successfully return 10 items", group: "Finder", glyph: "crown-box", tone: "gold", goal: 10 },
  { id: "bounty-hero", name: "Bounty Hero", description: "Successfully return 5 bounty items", group: "Finder", glyph: "trophy", tone: "gold", goal: 5 },
  { id: "electronics-expert", name: "Electronics Expert", description: "Return 5+ electronics", group: "Finder", glyph: "chip", tone: "violet", goal: 5 },
  { id: "singapore-spirit", name: "Singapore Spirit", description: "Help people across 3 different areas", group: "Community", glyph: "merlion", tone: "violet", goal: 3 },
  { id: "kindness-streak", name: "Kindness Streak", description: "Help 5 people in a month", group: "Community", glyph: "flame", tone: "coral", goal: 5 },
  { id: "top-finder-area", name: "Top Finder", description: "Be top 3 in your neighbourhood", group: "Community", glyph: "pin", tone: "coral", goal: 1 },
  { id: "community-hero", name: "Community Hero", description: "Reach Level 5 — 500 points", group: "Community", glyph: "star", tone: "gold", goal: 500 },
  { id: "trusted-member", name: "Trusted Member", description: "Strong ratings from 10+ people", group: "Community", glyph: "shield", tone: "blue", goal: 10 },
  { id: "verified-user", name: "Verified User", description: "Complete your profile", group: "Loser", glyph: "check", tone: "blue", goal: 1 },
  { id: "helpful-loser", name: "Helpful Loser", description: "Mark an item as reunited", group: "Loser", glyph: "hand", tone: "green", goal: 1 },
  { id: "early-supporter", name: "Early Supporter", description: "Joined in 2024", group: "Special", glyph: "star", tone: "navy", goal: 1 },
];

export const badgeById = Object.fromEntries(BADGES.map((b) => [b.id, b])) as Record<string, BadgeDef>;

/** Evaluate every badge for a user: earned flag + progress toward the goal. */
export function getBadgeProgress(user: User): BadgeProgress[] {
  const s = user.stats;
  const explicit = new Set(user.badges);
  const joinedYear = new Date(user.memberSince).getUTCFullYear();

  return BADGES.map((def) => {
    let progress = 0;
    let earned = explicit.has(def.id);

    switch (def.id) {
      case "helpful-finder":
        progress = s.itemsReturned;
        break;
      case "fast-responder":
        progress = s.responseMinutes <= 60 && s.itemsFound > 0 ? 1 : 0;
        break;
      case "returns-5":
      case "returns-10":
        progress = s.itemsReturned;
        break;
      case "bounty-hero":
        progress = s.bountyReturns;
        break;
      case "electronics-expert":
        progress = s.electronicsReturned;
        break;
      case "singapore-spirit":
        progress = s.areasHelped;
        break;
      case "kindness-streak":
        progress = s.helpedThisMonth;
        break;
      case "community-hero":
        progress = user.points.allTime;
        break;
      case "trusted-member":
        progress = user.rating >= 4.7 ? user.reviews : Math.min(user.reviews, def.goal - 1);
        break;
      case "verified-user":
        progress = user.profileComplete ? 1 : 0;
        break;
      case "early-supporter":
        progress = joinedYear <= 2024 ? 1 : 0;
        break;
      case "helpful-loser":
      case "top-finder-area":
        progress = earned ? 1 : 0;
        break;
    }

    if (progress >= def.goal) earned = true;
    return { def, earned, progress: Math.min(progress, def.goal), goal: def.goal };
  });
}

export function earnedBadgeIds(user: User): string[] {
  return getBadgeProgress(user)
    .filter((b) => b.earned)
    .map((b) => b.def.id);
}
