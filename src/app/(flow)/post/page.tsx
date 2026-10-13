import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PostOptions } from "@/components/layout/post-chooser";
import { PageHeader } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Post something",
  description: "Post a lost or found item, or a lost or found pet, on wewillfind.it — it takes under a minute.",
  robots: { index: false },
};

export default function PostPage() {
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link href="/" aria-label="wewillfind.it home">
          <Logo size={30} />
        </Link>
        <Link href="/" aria-label="Close" className="inline-flex size-10 items-center justify-center rounded-full text-navy-700 hover:bg-navy-100">
          <X className="size-6" />
        </Link>
      </header>
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-8">
        <PageHeader eyebrow="New post" title="What are you posting?" />
        <div className="mt-5">
          <PostOptions large />
        </div>
      </div>
    </div>
  );
}
