import type { Metadata } from "next";
import Link from "next/link";
import { X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { PostOptions } from "@/components/layout/post-chooser";

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
      <div className="mx-auto max-w-3xl px-4 pb-16 pt-8 sm:pt-14">
        <p className="eyebrow text-coral-700">New post</p>
        <h1 className="mt-2 text-3xl font-extrabold text-navy-900 sm:text-5xl">What are you posting?</h1>
        <p className="mt-3 text-lg text-navy-600">It takes under a minute. We&rsquo;ll start looking for matches straight away.</p>
        <div className="mt-9">
          <PostOptions large />
        </div>
      </div>
    </div>
  );
}
