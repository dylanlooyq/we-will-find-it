"use client";

import type { ReactNode } from "react";
import { useWorld } from "@/lib/store/hooks";
import { MemberHome, MemberHomeSkeleton } from "./member-home";

/**
 * The home page for two audiences: visitors get the landing page (`children`), signed-in members get
 * their own home. Which one shows before the member's data arrives is decided by `<html data-member>`
 * (see lib/member-hint), so a returning member never watches the landing page flash by.
 */
export function HomeGate({ children }: { children: ReactNode }) {
  const w = useWorld();
  const me = w.currentUser;
  if (me) return <MemberHome me={me} />;
  return (
    <>
      <div data-landing>{children}</div>
      {!w.ready && (
        <div data-member-only>
          <MemberHomeSkeleton />
        </div>
      )}
    </>
  );
}
