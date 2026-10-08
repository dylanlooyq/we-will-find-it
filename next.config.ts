import type { NextConfig } from "next";

/**
 * GitHub Pages (static export)
 * ----------------------------
 * `STATIC_EXPORT=true` switches the build to a fully static site that GitHub Pages can serve:
 *   - `output: "export"`  → writes the site to ./out
 *   - `basePath`          → project sites are served from https://<owner>.github.io/<repo>/
 *   - `trailingSlash`     → emits /route/index.html, which GitHub Pages resolves reliably
 *   - `images.unoptimized`→ there is no image-optimisation server on a static host
 *
 * Without the flag (npm run dev / npm run build / npm start) nothing below applies, so the
 * normal server-rendered workflow is unchanged. See .github/workflows/deploy-pages.yml.
 */
const staticExport = process.env.STATIC_EXPORT === "true";

// "owner/repo" — set automatically by GitHub Actions; scripts/build-pages.mjs derives it from
// the git remote for local builds.
const [owner = "", repo = ""] = (process.env.GITHUB_REPOSITORY ?? "").split("/");
const isUserSite = repo.toLowerCase() === `${owner.toLowerCase()}.github.io`;

// Public URL of the site. Set NEXT_PUBLIC_SITE_URL once a custom domain is attached (e.g. https://wewillfind.it);
// its path (if any) is then the base path, so a domain root means no /<repo>/ prefix.
const customUrl = process.env.NEXT_PUBLIC_SITE_URL ? new URL(process.env.NEXT_PUBLIC_SITE_URL) : null;
const basePath = !staticExport
  ? ""
  : customUrl
    ? customUrl.pathname.replace(/\/+$/, "")
    : repo && !isUserSite
      ? `/${repo}`
      : "";
const siteUrl = customUrl
  ? `${customUrl.origin}${basePath}`
  : staticExport && owner
    ? `https://${owner.toLowerCase()}.github.io${basePath}`
    : "https://wewillfind.it";

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
  // Exposed to the browser bundle through src/lib/site.ts
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: siteUrl,
    NEXT_PUBLIC_STATIC_EXPORT: String(staticExport),
  },
  ...(staticExport && {
    output: "export" as const,
    trailingSlash: true,
    images: { unoptimized: true },
    ...(basePath && { basePath }),
  }),
};

export default nextConfig;
