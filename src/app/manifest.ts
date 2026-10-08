import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/site";

/** Marks this route prerenderable, which a static (GitHub Pages) export requires. */
export function generateStaticParams() {
  return [{}];
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "wewillfind.it — Singapore's Lost & Found Community",
    short_name: "wewillfind.it",
    description: "Post, search and return lost items and pets across Singapore.",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#f6f7fb",
    theme_color: "#ff3b5c",
    icons: [{ src: withBasePath("/icon.svg"), sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
