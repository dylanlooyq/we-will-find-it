import { BellRing, Camera, HandHeart, HeartHandshake, MessageCircle, Send, Smile, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { Container, SectionHeader } from "../ui/section";

type Step = { icon: LucideIcon; title: string; body: string };

export const LOSER_STEPS: Step[] = [
  { icon: Camera, title: "Post what you lost", body: "Add a photo, where and when. Under a minute." },
  { icon: Users, title: "The community looks out", body: "Thousands of locals see it. Add a bounty to boost it." },
  { icon: BellRing, title: "Get notified", body: "We alert you to matches and messages instantly." },
  { icon: HeartHandshake, title: "Reunite", body: "Meet somewhere public, confirm, and say thanks." },
];

export const FINDER_STEPS: Step[] = [
  { icon: HandHeart, title: "Find something", body: "Spot a lost wallet, phone, keys or pet? Keep it safe." },
  { icon: Send, title: "Post it", body: "Share a photo and where you found it — hide key details." },
  { icon: MessageCircle, title: "Owner contacts you", body: "They describe what only the owner would know." },
  { icon: Users, title: "Return it", body: "Hand it back at a public place. Claim any bounty." },
  { icon: Smile, title: "Earn recognition", body: "Points, badges and kudos for being a good finder." },
];

function Track({ tone, title, subtitle, steps, as: H = "h3" }: { tone: "coral" | "found"; title: string; subtitle: string; steps: Step[]; as?: "h2" | "h3" }) {
  const Step = H === "h2" ? "h3" : "h4";
  const t = {
    coral: { card: "bg-coral-50/70 ring-coral-100", dot: "bg-coral-600", ink: "text-coral-700", icon: "bg-white text-coral-600", line: "bg-coral-200" },
    found: { card: "bg-found-50/70 ring-found-100", dot: "bg-found-600", ink: "text-found-700", icon: "bg-white text-found-600", line: "bg-found-200" },
  }[tone];
  return (
    <div className={cn("rounded-card p-6 ring-1 sm:p-8", t.card)}>
      <p className={cn("eyebrow", t.ink)}>{subtitle}</p>
      <H className="mt-1 text-2xl font-extrabold text-navy-900">{title}</H>
      <ol className="mt-7 space-y-0">
        {steps.map((s, i) => (
          <li key={s.title} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span aria-hidden className={cn("absolute left-[1.1rem] top-10 h-[calc(100%-1.75rem)] w-0.5", t.line)} />}
            <span className={cn("relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold text-white", t.dot)}>{i + 1}</span>
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2.5">
                <span className={cn("flex size-8 items-center justify-center rounded-xl", t.icon)}>
                  <s.icon className="size-[1.05rem]" aria-hidden />
                </span>
                <Step className="text-[1.02rem] font-extrabold text-navy-900">{s.title}</Step>
              </div>
              <p className="mt-1 text-[0.92rem] leading-relaxed text-navy-600">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HowItWorks({ heading = true }: { heading?: boolean }) {
  return (
    <Container as="section" className="pt-16 sm:pt-24">
      {heading && (
        <SectionHeader eyebrow="How it works" title="Simple for everyone" body="Whether you lost it or found it, we make the hand-back safe and easy." href="/how-it-works" hrefLabel="Learn more" />
      )}
      <div className={cn("grid gap-5 lg:grid-cols-2", heading && "mt-8")}>
        <Track tone="coral" subtitle="If you lost something" title="Lost it? Here's what happens" steps={LOSER_STEPS} as={heading ? "h3" : "h2"} />
        <Track tone="found" subtitle="If you found something" title="Found it? Be the hero" steps={FINDER_STEPS} as={heading ? "h3" : "h2"} />
      </div>
    </Container>
  );
}
