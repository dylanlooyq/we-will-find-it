"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { actions } from "@/lib/store/store";

/**
 * Mounted once at the root. Keeps the store's session user in step with the real sign-in session:
 * signing in (here or in another tab) switches to that account's profile, signing out leaves it.
 */
export function AuthSync() {
  const { data, isPending, error } = authClient.useSession();
  const id = data?.user.id;
  const name = data?.user.name;
  const emailVerified = data?.user.emailVerified;

  useEffect(() => {
    // An unreachable API says nothing about who is signed in — leave the store as it is.
    if (isPending || error) return;
    actions.syncAuth(id ? { id, name: name ?? "", emailVerified: !!emailVerified } : null);
  }, [isPending, error, id, name, emailVerified]);

  return null;
}
