export const NAV = [
  { href: "/explore", label: "Explore", match: ["/explore", "/lost", "/found", "/pets"] },
  { href: "/map", label: "Map", match: ["/map"] },
  { href: "/bounties", label: "Bounties", match: ["/bounties"] },
  { href: "/leaderboard", label: "Leaderboard", match: ["/leaderboard"] },
  { href: "/how-it-works", label: "How it works", match: ["/how-it-works"] },
] as const;

export function isActive(pathname: string, match: readonly string[]) {
  return match.some((m) => pathname === m || pathname.startsWith(`${m}/`));
}
