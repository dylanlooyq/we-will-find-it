import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostFlow } from "@/components/post/post-flow";
import { POST_KINDS, parseKind } from "@/lib/post-draft";

export function generateStaticParams() {
  return POST_KINDS.map((kind) => ({ kind }));
}

export const metadata: Metadata = { title: "Post something", robots: { index: false } };

export default function PostKindPage({ params }: PageProps<"/post/[kind]">) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-canvas" />}>
      <Flow params={params} />
    </Suspense>
  );
}

async function Flow({ params }: Pick<PageProps<"/post/[kind]">, "params">) {
  const { kind } = await params;
  const k = parseKind(kind);
  if (!k) notFound();
  return <PostFlow kind={k} />;
}
