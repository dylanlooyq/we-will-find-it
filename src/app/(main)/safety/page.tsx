import type { Metadata } from "next";
import Link from "next/link";
import { Ban, EyeOff, Flag, Landmark, Lock, PawPrint, ShieldCheck, UserCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container, PageHeader } from "@/components/ui/section";
import { PAYMENT_OPTIONS } from "@/lib/data/taxonomy";

export const metadata: Metadata = {
  title: "Safety & trust",
  description:
    "How to stay safe on wewillfind.it: meet in public, keep identifying details private, never pay to get an item back, and report anything suspicious.",
  alternates: { canonical: "/safety" },
};

const TIPS = [
  { icon: Landmark, title: "Meet in a public place", body: "Choose somewhere busy and well-lit — an MRT customer service counter or a mall service desk is ideal. Bring a friend if you can.", tone: "bg-mint-100 text-mint-700" },
  { icon: EyeOff, title: "Keep details private", body: "When you post, hide a unique detail only the real owner would know. Ask claimants to describe it before you share anything.", tone: "bg-found-100 text-found-700" },
  { icon: Ban, title: "Never pay to get an item back", body: "Real finders never ask for money up front. A bounty is paid directly to the finder, only once the owner has their item back.", tone: "bg-coral-100 text-coral-700" },
  { icon: Lock, title: "Protect your personal info", body: "Don't share your NRIC, home address, card details, banking logins or one-time passwords. To be paid a bounty, a PayNow number or account number is all anyone needs.", tone: "bg-violet-100 text-violet-700" },
  { icon: UserCheck, title: "Check who you're dealing with", body: "Look at their level, rating, verified tick and finder history. New accounts aren't bad — just take extra care.", tone: "bg-gold-100 text-gold-800" },
  { icon: PawPrint, title: "Pets & microchips", body: "Microchip numbers are never shown publicly. Ask a vet or the AVS to scan a found pet instead of trusting a description alone.", tone: "bg-coral-100 text-coral-700" },
];

const FLAGS = [
  "Asks you to pay, PayNow or top up before returning an item",
  "Refuses to meet in public or pushes you to move chats off the app",
  "Can't describe the private details you left out of your post",
  "Sends links asking you to log in, verify a card or enter a code",
  "Pressures you with urgency — “my offer expires in 10 minutes”",
];

export default function SafetyPage() {
  return (
    <>
      <Container className="pt-6 sm:pt-8">
        <PageHeader
          eyebrow={
            <>
              <ShieldCheck className="size-4" aria-hidden /> Staying safe
            </>
          }
          title="Safety & trust"
        />
      </Container>

      <Container as="section" className="pt-5">
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TIPS.map((t) => (
            <li key={t.title} className="rounded-card bg-white p-6 shadow-soft">
              <span className={`flex size-12 items-center justify-center rounded-2xl ${t.tone}`}>
                <t.icon className="size-6" aria-hidden />
              </span>
              <h2 className="mt-4 text-lg font-extrabold text-navy-900">{t.title}</h2>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-navy-600">{t.body}</p>
            </li>
          ))}
        </ul>
      </Container>

      <Container as="section" className="grid gap-5 pt-16 lg:grid-cols-2">
        <div className="rounded-sheet bg-coral-50 p-7 ring-1 ring-coral-100 sm:p-9">
          <h2 className="flex items-center gap-2.5 text-2xl font-extrabold text-navy-900">
            <Flag className="size-6 text-coral-600" aria-hidden /> Red flags
          </h2>
          <ul className="mt-5 space-y-3">
            {FLAGS.map((f) => (
              <li key={f} className="flex gap-3 text-[0.95rem] leading-relaxed text-navy-800">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-coral-500" aria-hidden />
                {f}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-navy-600">See any of these? Tap <strong>Report</strong> on the listing or in the chat. Our moderators review every report.</p>
        </div>
        <div className="rounded-sheet bg-white p-7 shadow-soft sm:p-9">
          <h2 className="flex items-center gap-2.5 text-2xl font-extrabold text-navy-900">
            <Users className="size-6 text-found-600" aria-hidden /> How we protect you
          </h2>
          <ul className="mt-5 space-y-4 text-[0.95rem] leading-relaxed text-navy-700">
            <li><strong className="text-navy-900">Verified members.</strong> Email-verified accounts get a blue tick; ratings and finder history are visible on every profile.</li>
            <li><strong className="text-navy-900">Hidden details.</strong> Posters can keep identifying details private until a claimant proves they know them.</li>
            <li><strong className="text-navy-900">Moderation.</strong> Reports are reviewed by people. Fraudulent listings are removed and repeat offenders are suspended.</li>
            <li><strong className="text-navy-900">Block &amp; report.</strong> You can block anyone, report a listing or a user, and flag a suspicious bounty claim.</li>
            <li><strong className="text-navy-900">No money on the platform.</strong> We never hold, store or move your money. Bounties are paid directly from owner to finder — by {PAYMENT_OPTIONS} — and only after the hand-over.</li>
          </ul>
        </div>
      </Container>

      <Container as="section" className="pt-12">
        <div className="flex flex-col items-start justify-between gap-4 dark-band rounded-card bg-navy-900 p-7 text-white sm:flex-row sm:items-center sm:p-9">
          <div>
            <p className="text-xl font-extrabold">Found something sensitive?</p>
            <p className="mt-1 max-w-xl text-white/75">Passports, NRIC cards and bank cards are best handed to the nearest police post or MRT customer service counter.</p>
          </div>
          <Button href="/how-it-works" variant="gold" size="lg">
            How it works
          </Button>
        </div>
        <p className="mt-6 text-center text-sm text-navy-500">
          Questions? Read the <Link href="/how-it-works" className="font-bold text-coral-700 underline underline-offset-4">FAQ</Link> or <Link href="/explore" className="font-bold text-coral-700 underline underline-offset-4">browse listings</Link>.
        </p>
      </Container>
    </>
  );
}
