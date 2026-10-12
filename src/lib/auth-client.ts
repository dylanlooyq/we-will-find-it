import { createAuthClient } from "better-auth/react";

/**
 * Client for the accounts API — the Worker in worker/, served from this same origin under /api/auth.
 * Sign-in state lives in an HttpOnly cookie; `AuthSync` mirrors it into the store's session user.
 */
export const authClient = createAuthClient();

/**
 * Sent with a log-in attempt that is only asking "is this email confirmed yet?" (the verify-email
 * page). The Worker (worker/auth.ts) then doesn't answer "not yet" with another confirmation email.
 */
export const CONFIRM_CHECK_HEADER = "X-Confirm-Check";

type AuthError = { status?: number; code?: string; message?: string };

/** A sentence for the person at the keyboard. */
export function authErrorMessage(error: AuthError): string {
  if (error.code === "EMAIL_NOT_CONFIGURED") return "Email sign-up isn't available yet.";
  if (error.code === "PROVIDER_NOT_FOUND") return "Google sign-in isn't available yet.";
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") return "That email and password don't match.";
  if (error.status === 429) return "Too many attempts. Wait a minute and try again.";
  // No status: the request never got an answer.
  if (!error.status) return "Couldn't reach the server. Check your connection and try again.";
  return error.message || "Something went wrong. Please try again.";
}
