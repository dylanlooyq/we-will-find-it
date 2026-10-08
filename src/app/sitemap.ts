import type { MetadataRoute } from "next";
import { DEMO_NOW } from "@/lib/clock";
import { items } from "@/lib/data/items";
import { users } from "@/lib/data/users";
import { SITE_URL } from "@/lib/site";

const base = SITE_URL;

/** Marks this route prerenderable, which a static (GitHub Pages) export requires. */
export function generateStaticParams() {
  return [{}];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date(DEMO_NOW);
  const statics = ["", "/explore", "/lost", "/found", "/pets", "/map", "/bounties", "/leaderboard", "/how-it-works", "/safety"].map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: p === "" || p === "/explore" ? ("hourly" as const) : ("daily" as const),
    priority: p === "" ? 1 : 0.8,
  }));
  const listings = items
    .filter((i) => i.moderation === "ok")
    .map((i) => ({ url: `${base}/item/${i.slug}`, lastModified: new Date(i.postedAt), changeFrequency: "daily" as const, priority: 0.7 }));
  const members = users
    .filter((u) => u.role !== "admin")
    .map((u) => ({ url: `${base}/user/${u.handle}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.4 }));
  return [...statics, ...listings, ...members];
}
