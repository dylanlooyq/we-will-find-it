// Builds the static site into ./out for one deployment target:
//   npm run build:dev     → https://dev.wewillfind.it
//   npm run build:prod    → https://wewillfind.it
//
// The site URL is baked into the build (canonical URLs, sitemap, share cards), so each target
// needs its own build. `npm run deploy:<target>` runs this and then uploads ./out to Cloudflare.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

// Keep in step with the routes in wrangler.jsonc.
const SITE_URLS = {
  dev: "https://dev.wewillfind.it",
  prod: "https://wewillfind.it",
};

const target = process.argv[2];
if (!Object.hasOwn(SITE_URLS, target)) {
  console.error(`build-static: expected a target (${Object.keys(SITE_URLS).join(" | ")}), got "${target ?? ""}".`);
  process.exit(1);
}

const result = spawnSync("npm run build", {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, STATIC_EXPORT: "true", NEXT_PUBLIC_SITE_URL: SITE_URLS[target] },
});
if (result.status !== 0) process.exit(result.status ?? 1);

// Give Next's generated PNGs real extensions + correct URLs for a static host
const finalize = spawnSync(process.execPath, ["scripts/finalize-static.mjs", "out"], { stdio: "inherit" });
if (finalize.status !== 0) process.exit(finalize.status ?? 1);

// Keep the dev site out of search engines. Cloudflare reads ./out/_headers and applies it to every asset response.
if (target === "dev") {
  writeFileSync(join("out", "_headers"), "/*\n  X-Robots-Tag: noindex\n");
}

console.log(`build-static: ./out is ready for ${SITE_URLS[target]}`);
