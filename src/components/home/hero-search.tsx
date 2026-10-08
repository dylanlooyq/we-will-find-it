"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";

/** Fastest path for someone who just lost something: type it, see matches. */
export function HeroSearch() {
  const [q, setQ] = useState("");
  const router = useRouter();
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/explore?q=${encodeURIComponent(q.trim())}` : "/explore");
      }}
      className="relative max-w-md"
    >
      <label htmlFor="hero-search" className="sr-only">
        Search lost and found listings
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-navy-500" aria-hidden />
      <input
        id="hero-search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search “black wallet”, “Orchard MRT”…"
        className="h-14 w-full rounded-2xl border border-white bg-white/90 pl-12 pr-14 text-[0.98rem] text-navy-900 shadow-soft backdrop-blur placeholder:text-navy-500 focus:border-navy-900"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-2 top-1/2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-xl bg-navy-900 text-white transition hover:bg-navy-800 active:scale-95"
      >
        <ArrowRight className="size-5" aria-hidden />
      </button>
    </form>
  );
}
