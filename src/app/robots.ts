import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** Marks this route prerenderable, which a static export requires. */
export function generateStaticParams() {
  return [{}];
}

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/messages", "/notifications", "/my-posts", "/post", "/welcome", "/verify-email"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
