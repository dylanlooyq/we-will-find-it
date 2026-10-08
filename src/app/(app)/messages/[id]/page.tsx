import type { Metadata } from "next";
import { Suspense } from "react";
import { ThreadView } from "@/components/chat/thread-view";
import { Skeleton } from "@/components/ui/states";
import { seedConversations } from "@/lib/data/social";

export const metadata: Metadata = {
  title: "Conversation",
  robots: { index: false },
};

export function generateStaticParams() {
  return seedConversations.map((c) => ({ id: c.id }));
}

export default function ThreadPage({ params }: PageProps<"/messages/[id]">) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4 p-6">
          <Skeleton className="h-16" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="ml-auto h-10 w-1/2" />
        </div>
      }
    >
      <Thread params={params} />
    </Suspense>
  );
}

async function Thread({ params }: Pick<PageProps<"/messages/[id]">, "params">) {
  const { id } = await params;
  return <ThreadView id={id} />;
}
