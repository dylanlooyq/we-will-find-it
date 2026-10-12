# wewillfind.it

**Singapore's Lost & Found Community** — post what you lost or found, get matched, message safely, offer bounties, and recognise the people who help.

> When someone loses something, the community helps find it.
> When someone finds something, the community helps return it.

Everything is real: accounts, listings, photos, conversations, bounty claims, points and moderation live in a database behind a small API (see [The backend](#the-backend)). The site starts empty and fills up with what members post.

## Run it

```bash
npm install
cp .dev.vars.example .dev.vars
npm run db:migrate:local   # once, and again after adding a migration
npm run dev:api            # the API + a local database and photo bucket → http://localhost:8787
npm run dev                # the site → http://localhost:3000 (forwards /api to the API)
```

Locally, account emails are printed in the `dev:api` terminal instead of being sent, link included.

Needs Node 20+. Built with **Next.js 16** (App Router, Cache Components), **React 19**, **TypeScript** and **Tailwind CSS v4**. Icons: `lucide-react`. Map: `leaflet` + OpenStreetMap tiles.

## Deploy to Cloudflare

The site is a static export served by Cloudflare Workers; the API and the database-backed pages run Worker code (`worker/`, see [The backend](#the-backend)). There are two environments, each its own Worker (`wrangler.jsonc`):

| Environment | URL | Branch | Worker |
| --- | --- | --- | --- |
| **dev** | https://dev.wewillfind.it | `dev` | `wewillfind-it-dev` |
| **prod** | https://wewillfind.it | `main` | `wewillfind-it-prod` |

Pushing to `dev` or `main` runs `.github/workflows/deploy-cloudflare.yml`, which builds and deploys the matching environment. One-time setup: add the repository secrets `CLOUDFLARE_API_TOKEN` (an API token from the "Edit Cloudflare Workers" template) and `CLOUDFLARE_ACCOUNT_ID` under **Settings → Secrets and variables → Actions**.

```bash
npm run deploy:dev      # build for dev.wewillfind.it and deploy it (uses your `wrangler login`)
npm run deploy:prod     # build for wewillfind.it and deploy it
npm run build:dev       # just the static export into ./out (or build:prod)
npm run preview         # serve ./out and the API exactly as Cloudflare does → http://localhost:8787
npm run deploy:www      # the www.wewillfind.it → wewillfind.it redirect Worker (workers/www-redirect)
```

`npm run dev` / `build` / `start` are unaffected — the static build is switched on only by `STATIC_EXPORT=true` (set by `scripts/build-static.mjs`). Things worth knowing:

- The site URL is baked into each build (canonical URLs, sitemap, share cards), so dev and prod are built separately. Always deploy through the npm scripts rather than a bare `wrangler deploy`.
- The dev site is public but sends `X-Robots-Tag: noindex` on every response, so search engines leave it alone.
- Deploys don't touch the database. When a change adds a migration, apply it first: `npm run db:migrate:dev` / `db:migrate:prod`.

## The backend

One Cloudflare Worker per environment (`worker/`) with its own D1 database, R2 photo bucket and secrets, so dev never mixes with prod:

| | dev | prod |
| --- | --- | --- |
| Database (D1) | `wewillfind-it-dev` | `wewillfind-it-prod` |
| Photos (R2) | `wewillfind-it-dev-uploads` | `wewillfind-it-prod-uploads` |
| Secrets | `wrangler secret put <NAME> --env dev` | `wrangler secret put <NAME> --env prod` |

**What it serves**

| Path | What |
| --- | --- |
| `/api/auth/*` | Sign-up, log-in, email verification, password reset, Google sign-in — [Better Auth](https://better-auth.com) (`worker/auth.ts`) |
| `GET /api/world` | The data the signed-in member (or a visitor) is allowed to see |
| `POST /api/action` | One change by the signed-in member: post, message, claim, mark returned, moderate… |
| `POST /api/upload`, `/api/img/*` | Photos |
| `/item/*`, `/user/*`, `/messages/*` | Pages drawn in the browser; the Worker gives real listings and profiles a 200 and their own title, description and share image |

**How data flows.** Every change a member can make is a pure function in `src/lib/store/reducer.ts` — who may do it, what it validates, what it changes. The API runs it against the database and is the authority; the browser runs the same function on its own copy first, so the screen updates at once, then adopts the API's answer (`src/lib/store/store.ts`). The browser refreshes its copy every 20 seconds, every 4 in conversations.

**What the API guarantees**

- Who you are comes from the session cookie, never from the request. Changes must come from this site's own pages (Origin check).
- Members only receive what they may see: their own conversations, claims and notifications; never other people's hidden identifying details, microchip numbers or email addresses (`viewFor` in `worker/world.ts`).
- Writes are all-or-nothing and never lost to a race: each is one database batch that rolls back and retries if another write landed first. A resent action is carried out once.
- Photos are checked by their contents (JPEG, PNG, WebP), stored under random names, and limited to 2.5 MB.

**Moderators** are the accounts whose verified email is listed in `ADMIN_EMAILS` (`wrangler.jsonc`, per environment). They get the Moderation area (`/admin`), see every listing and report, and can hide listings, suspend members and overrule claims.

**Secrets** (per environment):

- `BETTER_AUTH_SECRET` — signs session cookies. Already set; changing it signs everyone out.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — switch on "Continue with Google". Create an OAuth client (type *Web application*) in Google Cloud Console with the redirect URI `https://<site>/api/auth/callback/google`, one client per environment.
- `RESEND_API_KEY` — switches on email sign-up.

**Email.** Verification and password-reset emails are sent through [Resend](https://resend.com) from `noreply@wewillfind.it` (see `worker/email.ts`), which needs `wewillfind.it` verified as a sending domain in the Resend account. Until `RESEND_API_KEY` is set, a deployed site refuses email sign-up with "Email sign-up isn't available yet".

**Database changes.** The schema lives in `migrations/`: `0001` is the accounts tables, `0002` the members' data (one JSON document per profile, listing, conversation and so on). `npm run db:schema` prints the SQL for anything `worker/auth.ts` needs that the migrations don't create yet (after upgrading better-auth, say); save it as the next migration.

**Known limits.** The API reads the whole data set into memory and sends each browser everything it may see. That is simple and safe for a launch-sized community (hundreds of listings); beyond that, listings and conversations should move to their own tables with paged queries. There are no email notifications for new messages, no image moderation, and no sitemap of listings yet.

## Project map

```
src/
  app/
    layout.tsx            root: font, metadata, toasts, post chooser
    (main)/               header + footer + mobile tab bar
      page.tsx            home
      (browse)/           explore · lost · found · pets (shared layout keeps filters mounted)
      map · bounties · leaderboard · notifications · my-posts
      how-it-works · safety
    (flow)/post/          the posting flow (no site chrome)
    (app)/messages/       the inbox
    not-found.tsx         also the shell for listing, claim, profile and conversation pages
    (auth)/               login · signup · forgot-password · reset-password · verify-email · welcome
    (admin)/admin/        moderation: posts · users · reports · bounties · matches · resolved
    icon.svg · apple-icon · opengraph-image · manifest · robots · sitemap
  components/
    ui/                   Button, Badges, Avatar, Overlay (Modal + BottomSheet), forms, toasts, skeletons…
    items/ post/ bounties/ chat/ community/ leaderboard/ profile/ notifications/ admin/ home/ map/ layout/ brand/
  lib/
    types.ts              the domain model (User, Item, Bounty, Claim, Conversation, Message, …)
    data/taxonomy.ts      categories, areas, MRT stations and other places
    world.ts              the data a member sees, indexed for screens
    store/reducer.ts      every action: who may do it and what it changes (shared with the API)
    store/store.ts        the browser's copy: instant updates, background sync
    matching.ts           scores lost ↔ found pairs
    auth-client.ts        client for the accounts API
worker/                   the API: accounts, data, photos, page heads
migrations/               database schema
```

## Architecture notes

- **One seam for data.** Screens read a `World` (`src/lib/world.ts`) via `useWorld()` and change it through `actions` (`src/lib/store/store.ts`). Components never talk to the API directly.
- **Matching** sits behind a `MatchingService` interface (`src/lib/matching.ts`) and runs on the listings the browser holds.
- **Bounties are paid member to member** — PayNow, PayLah!, cash or bank transfer, after the hand-over. The platform never holds, stores or moves money; it only records that the owner marked a bounty paid, and how (`Bounty.paidVia`).
- **Time.** Pages are prerendered as of a fixed instant (`src/lib/clock.ts`) so the build is deterministic; the browser switches to the real clock after hydration (`useNow()`).
- **Next 16 Cache Components:** avoid `Date.now()`/`Math.random()` in server/prerendered code; wrap `useSearchParams`/`usePathname` readers in `<Suspense>`.

## Still to do

- Replace OpenStreetMap's public tile server with a commercial/own tile provider (OSM's server is for light use).
- Email members when they get a message or a claim (today they only see it on the site).
- Image moderation, and an audit log for the moderation tools.
- A sitemap of listings, generated from the database.
