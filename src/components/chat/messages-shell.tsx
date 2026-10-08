"use client";

import { useSelectedLayoutSegment } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ConversationList } from "./conversation-list";

/**
 * Inbox + thread. On phones one pane shows at a time, and an open thread goes
 * full-screen (the site header steps aside, like any chat app).
 */
export function MessagesShellView({ activeId, header, children }: { activeId: string | null; header: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <div className={cn("shrink-0", activeId && "max-lg:hidden")}>{header}</div>
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 overflow-hidden bg-white lg:border-x lg:border-line">
        <aside aria-label="Conversations" className={cn("w-full shrink-0 border-r border-line lg:block lg:w-[24rem]", activeId ? "hidden" : "block")}>
          <ConversationList activeId={activeId} />
        </aside>
        <section aria-label="Conversation" className={cn("min-h-0 min-w-0 flex-1", activeId ? "block" : "hidden lg:block")}>
          {children}
        </section>
      </div>
    </div>
  );
}

/** Reads the active segment, so it sits behind <Suspense> in the layout. */
export function MessagesShell({ header, children }: { header: ReactNode; children: ReactNode }) {
  const active = useSelectedLayoutSegment();
  return (
    <MessagesShellView activeId={active} header={header}>
      {children}
    </MessagesShellView>
  );
}
