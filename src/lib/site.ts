/**
 * Deployment-aware URL helpers.
 *
 * The normal (server) build and `npm run dev` use the defaults below. The static (Cloudflare)
 * build sets these through `next.config.ts`, per deployment target.
 * Read them only through this module so there is one place to reason about them.
 */

/** "" unless the site is served from a sub-path. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Absolute origin + base path used in canonical URLs, the sitemap and share links. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://wewillfind.it").replace(/\/$/, "");

/** True only in the static (Cloudflare) build. */
export const IS_STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

/**
 * Prefix a root-relative public path ("/images/a.jpg") with the base path.
 * Needed for plain URLs that Next doesn't rewrite for us (`<img>`, unoptimised `next/image`).
 * `next/link` and the router already handle the base path on their own.
 */
export function withBasePath(path: string): string {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}
