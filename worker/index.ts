import { isMemberAction, type AuthAccount } from "../src/lib/store/reducer.ts";
import type { User } from "../src/lib/types.ts";
import { createAuth } from "./auth.ts";
import { canSendEmail } from "./email.ts";
import { page } from "./pages.ts";
import { serveImage, upload } from "./uploads.ts";
import { ActionError, Busy, act, load, profileOf, viewFor } from "./world.ts";

// What reaches this Worker (assets.run_worker_first in wrangler.jsonc):
//   /api/auth/*                 accounts and sessions — Better Auth (auth.ts)
//   /api/world, /api/action     the members' data: read it, change it (world.ts)
//   /api/upload, /api/img/*     photos (uploads.ts)
//   /item/*, /user/*, …         pages drawn in the browser, given a proper status and <head> (pages.ts)
// Every other page and file is served from the static export without running any code.

/** Endpoints that are pointless without a way to send email. */
const NEEDS_EMAIL = new Set(["/api/auth/sign-up/email", "/api/auth/send-verification-email", "/api/auth/request-password-reset"]);

const STATUS = { unauthorized: 401, forbidden: 403, invalid: 400, not_found: 404, conflict: 409 } as const;

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const refuse = (code: keyof typeof STATUS, message: string) => json({ code, message }, STATUS[code]);

/** The signed-in member's profile, or null for a visitor. */
async function member(request: Request, env: Env, ctx: ExecutionContext): Promise<User | null> {
  const session = await createAuth(env, ctx).api.getSession({ headers: request.headers });
  if (!session) return null;
  const { id, name, email, emailVerified } = session.user;
  const admins = (env.ADMIN_EMAILS ?? "").toLowerCase().split(/[\s,]+/);
  // Moderator rights follow a verified email address, never a merely claimed one.
  const account: AuthAccount = { id, name, emailVerified, admin: emailVerified && admins.includes(email.toLowerCase()) };
  return profileOf(env, account);
}

/** Only this site's own pages may change things with a member's cookie. */
const sameOrigin = (request: Request, env: Env) => request.headers.get("Origin") === new URL(env.SITE_URL).origin;

async function world(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const me = await member(request, env, ctx);
  const { rev, state } = await load(env);
  const q = new URL(request.url).searchParams;
  // The browser says which copy it holds and whose; if both still match there is nothing to send.
  if (q.get("have") === String(rev) && (q.get("as") ?? "") === (me?.id ?? "")) return json({ rev });
  return json({ rev, view: viewFor(state, me) });
}

async function action(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!sameOrigin(request, env)) return refuse("forbidden", "That request didn't come from this site.");
  if (Number(request.headers.get("Content-Length") ?? 0) > 200_000) return refuse("invalid", "That's too much to send at once.");
  const body = (await request.json().catch(() => null)) as { name?: unknown; args?: unknown; nonce?: unknown } | null;
  if (!body || typeof body.name !== "string" || !isMemberAction(body.name) || typeof body.nonce !== "string" || !/^[a-z0-9]{10}$/.test(body.nonce)) {
    return refuse("invalid", "That request wasn't understood.");
  }
  const me = await member(request, env, ctx);
  if (!me) return refuse("unauthorized", "Log in to do that.");
  try {
    const { snapshot, result } = await act(env, me.id, body.name, body.args as never, body.nonce);
    return json({ rev: snapshot.rev, view: viewFor(snapshot.state, snapshot.state.users[me.id] ?? me), result });
  } catch (err) {
    if (err instanceof ActionError) return refuse(err.code, err.message);
    if (err instanceof Busy) return json({ message: "Busy — please try again." }, 503);
    throw err;
  }
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/")) return page(request, env);

    if (pathname.startsWith("/api/auth/")) {
      // Until the Resend key is set, refuse up front rather than create accounts nobody can verify.
      if (NEEDS_EMAIL.has(pathname) && !canSendEmail(env)) {
        return json({ code: "EMAIL_NOT_CONFIGURED", message: "Email sign-up isn't available yet." }, 503);
      }
      return createAuth(env, ctx).handler(request);
    }

    if (pathname === "/api/world" && request.method === "GET") return world(request, env, ctx);
    if (pathname === "/api/action" && request.method === "POST") return action(request, env, ctx);
    if (pathname === "/api/upload" && request.method === "POST") {
      if (!sameOrigin(request, env)) return refuse("forbidden", "That request didn't come from this site.");
      const me = await member(request, env, ctx);
      if (!me || me.suspended) return refuse("unauthorized", "Log in to add photos.");
      return upload(request, env, me.id);
    }
    if (pathname.startsWith("/api/img/") && request.method === "GET") return serveImage(pathname.slice("/api/img/".length), env);

    return refuse("not_found", "Not found");
  },
} satisfies ExportedHandler<Env>;
