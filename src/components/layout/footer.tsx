import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "../brand/logo";

const cols = [
  {
    title: "Browse",
    links: [
      ["Explore all", "/explore"],
      ["Lost items", "/lost"],
      ["Found items", "/found"],
      ["Lost & found pets", "/pets"],
      ["Map", "/map"],
    ],
  },
  {
    title: "Community",
    links: [
      ["Bounties", "/bounties"],
      ["Leaderboard", "/leaderboard"],
      ["How it works", "/how-it-works"],
      ["Safety & trust", "/safety"],
    ],
  },
  {
    title: "Account",
    links: [
      ["Log in", "/login"],
      ["Sign up", "/signup"],
      ["My posts", "/my-posts"],
      ["Messages", "/messages"],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-white pb-28 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_2fr] lg:px-8">
        <div>
          <Logo size={34} />
          <p className="mt-4 max-w-xs text-[0.95rem] leading-relaxed text-navy-600">
            When someone loses something, the community helps find it. When someone finds something, the community helps return it.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint-50 px-3.5 py-2 text-sm font-semibold text-mint-800">
            <ShieldCheck className="size-4" aria-hidden />
            Always meet in a public place
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {cols.map((c) => (
            <nav key={c.title} aria-label={c.title}>
              <h2 className="eyebrow text-navy-400">{c.title}</h2>
              <ul className="mt-4 space-y-3">
                {c.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} className="text-[0.95rem] font-medium text-navy-700 transition-colors hover:text-coral-700">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-sm text-navy-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 wewillfind.it · Singapore&rsquo;s Lost &amp; Found Community</p>
          <p>
            Demo build — we never hold money; bounties are paid directly between members. <Link href="/safety" className="font-semibold text-navy-700 underline underline-offset-4">Read our safety tips</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
