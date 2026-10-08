"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main id="main" className="flex min-h-dvh items-center justify-center bg-canvas px-6">
      <div className="max-w-md text-center">
        <span className="mx-auto flex size-20 items-center justify-center rounded-full bg-coral-100 text-coral-700">
          <TriangleAlert className="size-9" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold text-navy-900">Something went wrong</h1>
        <p className="mt-3 text-navy-600">That&rsquo;s on us, not you. Try again — and if it keeps happening, head back home.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={reset} iconLeft={<RotateCcw className="size-4" aria-hidden />}>
            Try again
          </Button>
          <Link href="/" className="inline-flex h-[3.25rem] items-center justify-center rounded-2xl px-6 font-semibold text-navy-700 hover:bg-navy-100">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}
