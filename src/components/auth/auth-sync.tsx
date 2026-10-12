"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { MEMBER_ATTR } from "@/lib/member-hint";
import { useWorld } from "@/lib/store/hooks";
import { forgetWorld, refreshWorld, startSync } from "@/lib/store/store";

/**
 * Mounted once at the root. Starts the background refresh of the member's data, and re-reads all of
 * it whenever the signed-in account changes (here or in another tab) — each member sees a different slice.
 * Also keeps `<html data-member>` in step with who is signed in.
 */
export function AuthSync() {
  const { data, isPending, error } = authClient.useSession();
  const account = data?.user.id ?? null;
  const verified = !!data?.user.emailVerified;
  const seen = useRef<string | null | undefined>(undefined);
  const w = useWorld();
  const ready = w.ready;
  const member = !!w.currentUser;

  useEffect(() => startSync(), []);

  // The mark set before first paint is a guess from the last visit; once the data is here, make it true.
  useLayoutEffect(() => {
    if (ready) document.documentElement.toggleAttribute(MEMBER_ATTR, member);
  }, [ready, member]);

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
