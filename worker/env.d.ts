// Bindings and required secrets are generated into worker-configuration.d.ts (`npm run cf-typegen`).
// These are the optional ones Wrangler can't infer from wrangler.jsonc.
interface Env {
  /** Google OAuth client — "Continue with Google" is off until both are set. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** Cloudflare Email Sending binding — email sign-up is off until it is added to wrangler.jsonc. */
  EMAIL?: SendEmail;
}
