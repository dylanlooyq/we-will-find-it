import { createAuth } from "./auth.ts";
import { canSendEmail } from "./email.ts";

// Only /api/* reaches this Worker (assets.run_worker_first in wrangler.jsonc); pages and files are
// served from the static export without running any code.

/** Endpoints that are pointless without a way to send email. */
const NEEDS_EMAIL = new Set(["/api/auth/sign-up/email", "/api/auth/send-verification-email", "/api/auth/request-password-reset"]);

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith("/api/auth/")) return Response.json({ message: "Not found" }, { status: 404 });

    // Until email sending is set up, refuse up front rather than create accounts nobody can verify.
    if (NEEDS_EMAIL.has(pathname) && !canSendEmail(env)) {
      return Response.json({ code: "EMAIL_NOT_CONFIGURED", message: "Email sign-up isn't available yet." }, { status: 503 });
    }

    return createAuth(env, ctx).handler(request);
  },
} satisfies ExportedHandler<Env>;
