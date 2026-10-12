import { betterAuth } from "better-auth";
import { resetPasswordEmail, sendEmail, verificationEmail } from "./email.ts";

/**
 * Builds the Better Auth instance for one request. The database and secrets only exist on `env`,
 * so it can't be created once at module scope; with schema validation off, creating it does no I/O.
 *
 * Accounts, sessions and verification tokens live in D1 (see migrations/). Changing anything here
 * that affects the schema needs a new migration — `npm run db:schema` prints what's missing.
 */
export function createAuth(env: Env, ctx: Pick<ExecutionContext, "waitUntil">) {
  const google =
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET, prompt: "select_account" as const }
      : undefined;

  return betterAuth({
    appName: "wewillfind.it",
    baseURL: env.SITE_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: env.DB,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      revokeSessionsOnPasswordReset: true,
      // Emails go out after the response (waitUntil) so response time doesn't reveal whether an account exists.
      sendResetPassword: async ({ user, url }) => ctx.waitUntil(sendEmail(env, resetPasswordEmail(user, url))),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user, url }) => {
        // Whoever confirms an email is new here. A link sent without a destination (the re-send on an
        // unverified log-in attempt) would land on the home page, so point it at profile setup too.
        const link = new URL(url);
        if ((link.searchParams.get("callbackURL") ?? "/") === "/") link.searchParams.set("callbackURL", "/welcome");
        ctx.waitUntil(sendEmail(env, verificationEmail(user, link.toString())));
      },
    },
    socialProviders: google ? { google } : {},
    // Counters live in D1: Worker memory isn't shared between isolates, so in-memory limits wouldn't hold.
    rateLimit: { enabled: true, storage: "database" },
    advanced: {
      ipAddress: { ipAddressHeaders: ["cf-connecting-ip"] },
      backgroundTasks: { handler: (promise) => ctx.waitUntil(promise) },
      // The schema is owned by migrations/; skip the per-instance introspection queries.
      database: { validateSchema: false },
    },
  });
}
