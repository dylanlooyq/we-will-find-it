"use client";

import { useEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { forgetWorld, refreshWorld, startSync } from "@/lib/store/store";

/**
 * Mounted once at the root. Starts the background refresh of the member's data, and re-reads all of
 * it whenever the signed-in account changes (here or in another tab) — each member sees a different slice.
 */
export function AuthSync() {
  const { data, isPending, error } = authClient.useSession();
  const account = data?.user.id ?? null;
  const verified = !!data?.user.emailVerified;
  const seen = useRef<string | null | undefined>(undefined);

  useEffect(() => startSync(), []);

  useEffect(() => {
    if (isPending || error) return;
    const key = `${account}:${verified}`;
    const first = seen.current === undefined;
    if (seen.current === key) return;
    seen.current = key;
    // The first answer only confirms who was already signed in; startSync has that read in hand.
    if (first) return;
    if (!account) forgetWorld();
    void refreshWorld(true);
  }, [isPending, error, account, verified]);

  return null;
}
