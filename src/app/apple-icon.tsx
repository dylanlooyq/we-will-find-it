import { ImageResponse } from "next/og";
import { MARK_PATH } from "@/components/brand/logo";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Marks this route prerenderable, which a static export requires. */
export function generateStaticParams() {
  return [{}];
}

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #ff5f7e, #e5184a)" }}>
        <svg width="94" height="122" viewBox="150 120 540 700">
          <path d={MARK_PATH} fill="#ffffff" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
