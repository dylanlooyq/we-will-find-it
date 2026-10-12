import { getLocation } from "../src/lib/data/taxonomy.ts";
import { formatMoney } from "../src/lib/format.ts";
import { levelFor } from "../src/lib/levels.ts";
import { load } from "./world.ts";

/**
 * Listings, profiles and conversations have no file of their own in the static export: their pages
 * are drawn in the browser by the app shell that ships as 404.html (see StaticHostFallback).
 *
 * Left alone, those URLs would answer "404" with a generic title — useless to search engines and to
 * anything that previews a shared link. So for a listing or profile that exists, this answers 200
 * and writes its title, description and photo into the page head.
 */

const ROUTE = /^\/(item|user|messages)\/([^/]+)(\/claim)?\/?$/;

interface Head {
  title: string;
  description: string;
  path: string;
  image?: string;
}

async function headFor(env: Env, kind: string, key: string): Promise<Head | null> {
  const { state } = await load(env);
  if (kind === "item") {
    const item = Object.values(state.items).find((i) => i.slug === key);
    if (!item || item.moderation !== "ok" || state.users[item.ownerId]?.suspended) return null;
    const bounty = item.bountyId ? state.bounties[item.bountyId] : undefined;
    const text = item.description.slice(0, 150).trim();
    return {
      title: `${item.type === "lost" ? "Lost" : "Found"}: ${item.title} at ${getLocation(item.locationId).name}`,
      description: `${text}${item.description.length > 150 ? "…" : ""}${bounty ? ` ${formatMoney(bounty.amount)} bounty.` : ""}`.trim(),
      path: `/item/${item.slug}`,
      image: item.images.find((i) => i.src)?.src,
    };
  }
  const user = Object.values(state.users).find((u) => u.handle === key);
  if (!user || user.suspended) return null;
  const level = levelFor(user.points.allTime);
  return {
    title: `${user.name} · ${level.title}`,
    description: `${user.name} — Level ${level.level} ${level.title} on wewillfind.it. ${user.stats.itemsReturned} items returned.`,
    path: `/user/${user.handle}`,
    image: user.avatarSrc,
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

export async function page(request: Request, env: Env): Promise<Response> {
  const asset = await env.ASSETS.fetch(request);
  const url = new URL(request.url);
  const route = url.pathname.match(ROUTE);
  if (asset.status !== 404 || request.method !== "GET" || !route) return asset;

  const [, kind, key, claim] = route;
  const headers = new Headers(asset.headers);
  headers.delete("ETag");
  headers.set("Cache-Control", "no-cache");
  // Conversations and claim forms are private screens: the shell, a 200, and nothing for crawlers.
  if (kind === "messages" || claim) return new Response(asset.body, { status: 200, headers });

  const head = await headFor(env, kind, decodeURIComponent(key));
  if (!head) return new Response(asset.body, { status: 404, headers });

  const site = new URL(env.SITE_URL).origin;
  const tags = [
    `<meta name="description" content="${esc(head.description)}">`,
    `<link rel="canonical" href="${esc(site + head.path)}">`,
    `<meta property="og:title" content="${esc(`${head.title} · wewillfind.it`)}">`,
    `<meta property="og:description" content="${esc(head.description)}">`,
    `<meta property="og:url" content="${esc(site + head.path)}">`,
    `<meta property="og:type" content="${kind === "item" ? "article" : "profile"}">`,
    `<meta property="og:site_name" content="wewillfind.it">`,
    ...(head.image ? [`<meta property="og:image" content="${esc(site + head.image)}">`, `<meta name="twitter:card" content="summary_large_image">`] : []),
  ].join("");

  const drop = { element: (el: Element) => void el.remove() };
  return new HTMLRewriter()
    .on("title", { element: (el) => void el.setInnerContent(`${head.title} · wewillfind.it`) })
    .on('meta[name="robots"]', drop)
    .on('meta[name="description"]', drop)
    .on('meta[property^="og:"]', drop)
    .on('meta[name^="twitter:"]', drop)
    .on('link[rel="canonical"]', drop)
    .on("head", { element: (el) => void el.append(tags, { html: true }) })
    .transform(new Response(asset.body, { status: 200, headers }));
}
