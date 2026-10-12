import Link from "next/link";
import { Compass, Search } from "lucide-react";
import { Logo, LogoMark } from "@/components/brand/logo";
import { PostButton } from "@/components/layout/post-chooser";
import { StaticHostFallback } from "@/components/layout/static-host-fallback";
import { Button } from "@/components/ui/button";

/** Even a 404 is on-brand: the page you wanted is lost — and we'll help find it. */
function NotFoundContent() {
  return (
    <main id="main" className="flex min-h-dvh flex-col bg-gradient-to-b from-coral-50 via-white to-canvas">
      <header className="mx-auto flex h-16 w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" aria-label="wewillfind.it home">
          <Logo size={32} />
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-6 pb-20 text-center">
        <div className="animate-float">
          <LogoMark size={120} />
        </div>
        <p className="eyebrow mt-8 text-coral-700">Error 404</p>
        <h1 className="mt-3 text-4xl font-extrabold leading-tight text-navy-900 sm:text-5xl">We can&rsquo;t find that page</h1>
        <p className="mt-4 text-lg leading-relaxed text-navy-600">Looks like this one got lost. The irony isn&rsquo;t lost on us — try one of these instead.</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button href="/explore" size="lg" iconLeft={<Search className="size-4" aria-hidden />}>
            Explore listings
          </Button>
          <Button href="/" size="lg" variant="secondary" iconLeft={<Compass className="size-4" aria-hidden />}>
            Go home
          </Button>
        </div>
        <p className="mt-6 text-sm text-navy-500">
          Lost something yourself? <PostButton variant="ghost" size="sm" icon={false} className="!px-1 underline underline-offset-4">Post it</PostButton>
        </p>
      </div>
    </main>
  );
}

/**
 * This file becomes 404.html — the page served for every URL that has no file of its own, which
 * includes every listing, profile and conversation. StaticHostFallback draws those screens; for any
 * other URL it shows the 404 above.
 */
export default function NotFound() {
  return <StaticHostFallback notFound={<NotFoundContent />} />;
}
