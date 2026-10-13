import type { Metadata } from "next";
import Link from "next/link";
import { Coins, MapPinned, ShieldCheck, Trophy, Users } from "lucide-react";
import { CtaBand } from "@/components/home/cta-band";
import { HowItWorks } from "@/components/home/how-it-works";
import { PostButton } from "@/components/layout/post-chooser";
import { Button } from "@/components/ui/button";
import { Container, PageHeader, SectionHeader } from "@/components/ui/section";
import { PAYMENT_OPTIONS } from "@/lib/data/taxonomy";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "Post what you lost or found, let the community look out, get matched and reunited. How wewillfind.it works — including bounties, points and staying safe.",
  alternates: { canonical: "/how-it-works" },
};

const FAQ = [
  {
    q: "Is wewillfind.it free?",
    a: "Yes. Posting, browsing, messaging and claiming are free. Bounties are optional — if you choose to offer one, you pay it directly to the finder once you have your item back. We never hold your money.",
  },
  {
    q: "How do I know a finder really has my item?",
    a: "Keep unique details (a sticker, a scratch, the lock-screen photo) private when you post. Ask the finder to describe them in chat or submit proof photos with a claim. Only when it matches should you arrange a hand-over.",
  },
  {
    q: "How do bounties work?",
    a: `You attach a cash reward when you post a lost item. A finder submits a claim with proof. You verify it, meet in a public place, and confirm receipt — only then do you pay the finder directly, by ${PAYMENT_OPTIONS}. Nothing is paid to, held by or stored on wewillfind.it.`,
  },
  {
    q: "What should I do if I find something valuable?",
    a: "Post it with a photo, keep identifying details private, and wait for the owner to describe them. For items like passports, NRIC cards or bank cards, consider handing them to the nearest police post or MRT customer service counter.",
  },
  {
    q: "Where should I meet?",
    a: "Always somewhere public and busy — an MRT customer service counter, a mall's service desk or a well-lit open area. Bring a friend if you can, and never share your home address.",
  },
  {
    q: "How do points, levels and badges work?",
    a: "You earn points for helping — posting a found item (+10), confirming a match (+10), receiving a thank-you (+20), returning an item (+30) or a bounty item (+50). Points unlock levels from Newcomer to Legend and collectible badges.",
  },
  {
    q: "What about lost pets?",
    a: "Pets work like any listing, with extra fields: species, breed, name, collar and last-seen place. Microchip numbers are never shown publicly — only the owner can see them, so a vet scan can confirm who a pet belongs to.",
  },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const PRINCIPLES = [
  { icon: MapPinned, title: "Hyper-local", body: "Listings are tied to real places — MRT stations, malls, parks — so the people who see them are the people who might help.", tone: "bg-coral-100 text-coral-700" },
  { icon: ShieldCheck, title: "Safe by design", body: "Private details, verified members, public meet-ups and moderators keep exchanges honest.", tone: "bg-found-100 text-found-700" },
  { icon: Coins, title: "Rewarding", body: "Optional bounties, points, badges and kudos recognise the people who go out of their way.", tone: "bg-gold-100 text-gold-800" },
];

export default function HowItWorksPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Container className="pt-6 sm:pt-8">
        <PageHeader
          eyebrow="How it works"
          title={
            <>
              When someone loses something, <span className="text-coral-600">the community helps find it.</span>
            </>
          }
        >
          <div className="flex gap-2.5">
            <PostButton>Post Something</PostButton>
            <Button href="/explore" variant="secondary">
              Explore listings
            </Button>
          </div>
        </PageHeader>
      </Container>

      <HowItWorks heading={false} />

      <Container as="section" className="pt-16 sm:pt-24">
        <SectionHeader eyebrow="Why it works" title="Built around three ideas" />
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {PRINCIPLES.map((p) => (
            <li key={p.title} className="rounded-card bg-white p-6 shadow-soft">
              <span className={`flex size-12 items-center justify-center rounded-2xl ${p.tone}`}>
                <p.icon className="size-6" aria-hidden />
              </span>
              <h3 className="mt-4 text-lg font-extrabold text-navy-900">{p.title}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-navy-600">{p.body}</p>
            </li>
          ))}
        </ul>
      </Container>

      <Container as="section" className="pt-16 sm:pt-24">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-sheet bg-gradient-to-br from-gold-100 to-gold-50 p-7 ring-1 ring-gold-200 sm:p-9">
            <Coins className="size-8 text-gold-700" aria-hidden />
            <h2 className="mt-4 text-2xl font-extrabold text-navy-900">Bounties</h2>
            <p className="mt-2 leading-relaxed text-navy-700">Lost something that matters? Add a cash reward. Finders submit proof, you verify, and you pay the finder directly — only after you have your item back.</p>
            <Button href="/bounties" variant="dark" className="mt-5">
              Browse bounties
            </Button>
          </div>
          <div className="rounded-sheet bg-gradient-to-br from-violet-100 to-violet-50 p-7 ring-1 ring-violet-200 sm:p-9">
            <Trophy className="size-8 text-violet-700" aria-hidden />
            <h2 className="mt-4 text-2xl font-extrabold text-navy-900">Points &amp; badges</h2>
            <p className="mt-2 leading-relaxed text-navy-700">Every good deed earns points. Climb from Newcomer to Legend, collect badges and see who&rsquo;s helping most in your neighbourhood.</p>
            <Button href="/leaderboard" variant="dark" className="mt-5">
              See the leaderboard
            </Button>
          </div>
        </div>
      </Container>

      <Container as="section" className="max-w-3xl pt-16 sm:pt-24">
        <SectionHeader eyebrow="FAQ" title="Questions people ask" />
        <div className="mt-8 divide-y divide-line overflow-hidden rounded-card bg-white shadow-soft">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-5 py-1 sm:px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.02rem] font-extrabold text-navy-900 [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-700 transition-transform group-open:rotate-45" aria-hidden>
                  <span className="text-xl leading-none">+</span>
                </span>
              </summary>
              <p className="pb-5 pr-10 text-[0.95rem] leading-relaxed text-navy-600">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-navy-500">
          <Users className="size-4" aria-hidden /> Still stuck? Read our <Link href="/safety" className="font-bold text-coral-700 underline underline-offset-4">safety guide</Link>.
        </p>
      </Container>

      <CtaBand />
    </>
  );
}
