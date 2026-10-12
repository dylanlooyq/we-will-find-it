import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

const base = SITE_URL;

/** Marks this route prerenderable, which a static export requires. */
export function generateStaticParams() {
  return [{}];
}

export default function sitemap(): MetadataRoute.Sitemap {
  const statics = ["", "/explore", "/lost", "/found", "/pets", "/map", "/bounties", "/leaderboard", "/how-it-works", "/safety"].map((p) => ({
    url: `${base}${p}`,
    changeFrequency: p === "" || p === "/explore" ? ("hourly" as const) : ("daily" as const),
    priority: p === "" ? 1 : 0.8,
  }));
  // Listings and profiles live in the database, which a build-time sitemap can't see.
  return statics;
}
