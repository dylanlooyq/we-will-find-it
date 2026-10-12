import type { NextConfig } from "next";

/**
 * Static export (Cloudflare Workers)
 * ----------------------------------
 * `STATIC_EXPORT=true` switches the build to a fully static site that a static host can serve:
 *   - `output: "export"`  → writes the site to ./out
 *   - `basePath`          → only if the site URL has a path (it doesn't on dev./apex wewillfind.it)
 *   - `trailingSlash`     → emits /route/index.html, which static hosts resolve reliably
 *   - `images.unoptimized`→ there is no image-optimisation server on a static host
 *
 * Without the flag (npm run dev / npm run build / npm start) nothing below applies, so the
 * normal server-rendered workflow is unchanged. See scripts/build-static.mjs and wrangler.jsonc.
 */
const staticExport = process.env.STATIC_EXPORT === "true";

// Public URL of the site — scripts/build-static.mjs sets NEXT_PUBLIC_SITE_URL per deployment target.
// Its path (if any) is the base path of the static build, so a domain root means no prefix.
const customUrl = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : null;
const basePath = staticExport && customUrl ? customUrl.pathname.replace(/\/+$/, "") : "";
const siteUrl = customUrl ? `${customUrl.origin}${basePath}` : "https://wewillfind.it";

const nextConfig: NextConfig = {
  // Cache Components / Partial Prefetching rely on Partial Prerendering, which needs a server and
  // cannot be combined with `output: "export"` ("PPR cannot be enabled in export mode"). Every page
  // here is already fully static, so the Pages build simply goes without them.
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Dev only: validate "instant navigation" just for segments that opt in explicitly. This app reads
  // its dynamic data (the demo store) on the client by design, so the implicit per-page checks only
  // add noise. (Not applicable — and rejected — when Cache Components is off, i.e. the Pages build.)
  ...(!staticExport && { experimental: { instantInsights: { validationLevel: "manual-warning" as const } } }),
  // The accounts API is a Cloudflare Worker (worker/), not a Next route. In the deployed site both sit on
  // one origin; under `npm run dev` this forwards /api to the Worker running locally (`npm run dev:api`).
  ...(!staticExport && { rewrites: () => [{ source: "/api/:path*", destination: "http://localhost:8787/api/:path*" }] }),
  // Exposed to the browser bundle through src/lib/site.ts
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
  },
  ...(staticExport && {
    output: "export" as const,
    trailingSlash: true,
    images: { unoptimized: true },
    ...(basePath && { basePath }),
  }),
};

export default nextConfig;
