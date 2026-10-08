import { Search } from "lucide-react";
import { LogoMark } from "../brand/logo";
import { Button } from "../ui/button";
import { Container } from "../ui/section";
import { PostButton } from "../layout/post-chooser";

export function CtaBand() {
  return (
    <Container as="section" className="pt-16 sm:pt-24">
      <div className="relative isolate overflow-hidden rounded-sheet bg-gradient-to-br from-coral-600 via-coral-600 to-coral-800 px-6 py-14 text-center text-white sm:px-12 sm:py-20">
        <LogoMark size={420} mono="#fff" noShadow className="pointer-events-none absolute -right-20 -top-16 -z-10 opacity-[0.08]" />
        <LogoMark size={260} mono="#fff" noShadow className="pointer-events-none absolute -bottom-20 -left-12 -z-10 opacity-[0.07]" />
        <h2 className="mx-auto max-w-2xl text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Don&rsquo;t worry. We&rsquo;ll find it.</h2>
        <p className="mx-auto mt-4 max-w-lg text-lg text-white/85">Post what you lost — or what you found — and let Singapore help.</p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PostButton size="xl" variant="secondary" className="min-w-52 !text-coral-700">
            Post Something
          </PostButton>
          <Button href="/explore" variant="outline-light" size="xl" iconLeft={<Search className="size-5" aria-hidden />}>
            Browse listings
          </Button>
        </div>
      </div>
    </Container>
  );
}
