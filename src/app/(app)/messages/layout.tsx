import { Suspense } from "react";
import { MessagesShell, MessagesShellView } from "@/components/chat/messages-shell";
import { Header } from "@/components/layout/header";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<MessagesShellView activeId={null} header={<Header />}>{null}</MessagesShellView>}>
      <MessagesShell header={<Header />}>{children}</MessagesShell>
    </Suspense>
  );
}
