# wewillfind.it

**Singapore's Lost & Found Community** — post what you lost or found, get matched, message safely, offer bounties, and recognise the people who help.

> When someone loses something, the community helps find it.
> When someone finds something, the community helps return it.

Accounts are real: sign-up, log-in and sessions go through a small API backed by a database (see [Accounts](#accounts)). Everything else — listings, chats, points — is mock data that works end-to-end in the browser and persists in `localStorage`.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

Needs Node 20+. Built with **Next.js 16** (App Router, Cache Components), **React 19**, **TypeScript** and **Tailwind CSS v4**. Icons: `lucide-react`. Map: `leaflet` + OpenStreetMap tiles.

## Deploy to Cloudflare

The site is a static export served by Cloudflare Workers; only `/api/*` runs Worker code (`worker/`, see [Accounts](#accounts)). There are two environments, each its own Worker (`wrangler.jsonc`):

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
- Listings, members and chats created during a demo session don't exist as files, so Cloudflare answers those URLs with `404.html`; `StaticHostFallback` (in `not-found.tsx`) renders the right screen from the browser's saved demo data instead.

## Accounts

Sign-up, log-in, email verification and password reset are real. They are handled by [Better Auth](https://better-auth.com) in a small Cloudflare Worker (`worker/`) that answers `/api/auth/*` on the same domain as the site, and stored in a D1 database — one per environment, so dev accounts never mix with prod:

| | dev | prod |
| --- | --- | --- |
| Database (D1) | `wewillfind-it-dev` | `wewillfind-it-prod` |
| Secrets | `wrangler secret put <NAME> --env dev` | `wrangler secret put <NAME> --env prod` |

What is real and what isn't: the account (name, email, password or Google identity, sessions) lives in the database. The profile built on top of it — points, badges, listings, chats — is still demo data in the browser, created the first time an account signs in on that browser (`AuthSync` → `actions.syncAuth`). The demo personas still work when nobody is signed in.

**Secrets** (per environment):

- `BETTER_AUTH_SECRET` — signs session cookies. Already set; changing it signs everyone out.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — switch on "Continue with Google". Create an OAuth client (type *Web application*) in Google Cloud Console with the redirect URI `https://<site>/api/auth/callback/google`, one client per environment.
- `RESEND_API_KEY` — switches on email sign-up (see Email below).

**Email.** Verification and password-reset emails are sent through [Resend](https://resend.com) from `noreply@wewillfind.it` (see `worker/email.ts`), which needs `wewillfind.it` verified as a sending domain in the Resend account. Until `RESEND_API_KEY` is set, a deployed site refuses email sign-up with "Email sign-up isn't available yet"; locally, without a key, the email is printed in the `dev:api` terminal instead, link included.

**Database changes.** The schema lives in `migrations/`. `npm run db:schema` prints the SQL for anything `worker/auth.ts` needs that the migrations don't create yet (after upgrading better-auth, say). Save it as the next migration and apply it with `npm run db:migrate:dev` / `db:migrate:prod` before deploying the code that needs it — deploys don't run migrations.

**Run it locally.** Copy `.dev.vars.example` to `.dev.vars`, then:

```bash
npm run db:migrate:local   # once, and again after adding a migration
npm run dev:api            # the Worker + a local database → http://localhost:8787
npm run dev                # the site → http://localhost:3000 (forwards /api to the Worker)
```

## Try the journeys

You start signed in as **Dylan L.** (Level 5 · Community Hero). The account menu (top right) has *Demo accounts* to switch persona, and *Reset demo data*.

| Journey | Where to start |
| --- | --- |
| **Loser** — post, get matches, chat, reunite | **Post** → *I lost something* → publish → *Potential matches* → open a match → chat → *Item returned* |
| **Finder** — post a found item, owner contacts you, earn points | **Post** → *I found something* → publish (+10 pts). Open **Messages → Joel T.** → *Item returned* (+30 pts) |
| **Bounty finder** — claim, proof, owner verifies, release | `/item/iphone-14-pro-orchard` → *Claim S$200 Bounty*. The owner "reviews" after a few seconds; then *I've handed it over* → bounty released, +50 pts, badge unlock |
| **Bounty owner** — verify claims | `/item/brown-leather-wallet-tampines-mall` (Dylan's own post) → review Cheryl's claim → *Approve* → *Mark as received* |
| **Pet owner** — lost pet, reunite | **Post** → *I lost a pet*. Browse `/pets` |
| **Moderator** | Account menu → *Switch to Wei Ming K.* → `/admin` |

## Replacing placeholder photos

Item images show a labelled placeholder (**"Image of …"**) until a real photo exists.

1. Open **`/dev/images`** — it lists every slot with its exact file name.
2. Save the photo (JPG/PNG/WebP) as that file name in `public/images/items/`.
3. Run `npm run images` (also runs automatically before `dev` / `build`). The placeholder is swapped for the photo.

## Project map

```
src/
  app/
    layout.tsx            root: font, metadata, toasts, post chooser
    (main)/               header + footer + mobile tab bar
      page.tsx            home
      (browse)/           explore · lost · found · pets (shared layout keeps filters mounted)
      map · bounties · leaderboard · user/[handle] · notifications · my-posts
      how-it-works · safety · dev/images
    (immersive)/item/[slug]   listing detail (own sticky action bar)
    (flow)/               posting + bounty-claim flows (no site chrome)
    (app)/messages/       split-view inbox + thread
    (auth)/               login · signup · forgot-password · reset-password · verify-email · welcome
    (admin)/admin/        moderation: posts · users · reports · bounties · matches · resolved
    icon.svg · apple-icon · opengraph-image · manifest · robots · sitemap
  components/
    ui/                   Button, Badges, Avatar, Overlay (Modal + BottomSheet), forms, toasts, skeletons…
    items/ post/ bounties/ chat/ community/ leaderboard/ profile/ notifications/ admin/ home/ map/ layout/ brand/
  lib/
    types.ts              the domain model (User, Item, Bounty, Claim, Conversation, Message, …)
    data/                 realistic Singapore seed data
    world.ts              seed + local overlay → what screens read
    store/                client demo store (actions, events, simulated replies)
    matching.ts           pluggable matching service (mock scorer today)
    auth-client.ts        client for the accounts API
worker/                   accounts API: Better Auth on a Cloudflare Worker + D1
migrations/               database schema for the accounts API
```

## Architecture notes (for the backend swap)

- **One seam for data.** Screens read a `World` (`src/lib/world.ts`) via `useWorld()`; server components read `seedWorld`. A backend replaces `buildWorld`'s inputs and the action functions in `src/lib/store/store.ts` — components don't change.
- **Matching** sits behind a `MatchingService` interface (`src/lib/matching.ts`).
- **Payments/bounties** are UI + mock state. Nothing moves money.
- **Auth** is real (see [Accounts](#accounts)); `AuthSync` mirrors the signed-in account into the store's session user. No secrets live in the frontend.
- **Time** uses a fixed demo clock (`src/lib/clock.ts`) so prerendering is deterministic.
- **Next 16 Cache Components:** avoid `Date.now()`/`Math.random()` in server/prerendered code; wrap `useSearchParams`/`usePathname` readers in `<Suspense>`. Dynamic routes list their known params in `generateStaticParams`.

## Before going live

- Replace OpenStreetMap's public tile server with a commercial/own tile provider (OSM's server is for light use).
- Replace the hero illustration and placeholders with real photography where desired.
- Connect a real backend for listings, messaging, matching and payments (escrow partner for bounties).
- Add rate limiting, image moderation and an audit log for the moderation tools.
