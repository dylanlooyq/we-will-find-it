import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard } from "@/lib/og";

export const alt = "wewillfind.it — Singapore's Lost & Found Community";
export const size = OG_SIZE;
export const contentType = "image/png";

/** Marks this image as prerenderable, which a static (GitHub Pages) export requires. */
export function generateStaticParams() {
  return [{}];
}

export default function Image() {
  return new ImageResponse(<OgCard eyebrow="Lost something? Found something?" title="We will find it." subtitle="Post in under a minute. Singapore helps you reunite." />, { ...size });
}
