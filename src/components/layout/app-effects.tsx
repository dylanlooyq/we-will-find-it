"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { CheckCircle2, Info, PartyPopper, Sparkles, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { badgeById } from "@/lib/badges";
import { useWorld } from "@/lib/store/hooks";
import { onAppEvent, type AppEvent } from "@/lib/store/events";
import type { Level } from "@/lib/types";
import { BadgeIcon } from "../community/badge-icon";
import { Button } from "../ui/button";
import { Confetti } from "../ui/feedback";
import { Overlay } from "../ui/overlay";

type ToastItem = {
  id: number;
  tone: "success" | "info" | "celebrate" | "error";
  title: string;
  body?: string;
  href?: string;
  big?: boolean;
};

const toneStyle = {
  success: { icon: CheckCircle2, bubble: "bg-mint-100 text-mint-700" },
  info: { icon: Info, bubble: "bg-found-100 text-found-700" },
  celebrate: { icon: PartyPopper, bubble: "bg-gold-100 text-gold-700" },
  error: { icon: TriangleAlert, bubble: "bg-coral-100 text-coral-700" },
} as const;

/**
 * Mounted once at the root. Listens for store events and turns them into
 * toasts, "+points" bursts, badge-unlock and level-up celebrations.
 */
export function AppEffects() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [badgeQueue, setBadgeQueue] = useState<string[]>([]);
  const [levelUp, setLevelUp] = useState<Level | null>(null);
  const seq = useRef(0);
  const w = useWorld();
  const me = w.currentUser;

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  useEffect(() => {
    return onAppEvent((e: AppEvent) => {
      if (e.type === "toast") {
        const id = ++seq.current;
        setToasts((t) => [...t.slice(-2), { id, tone: e.tone, title: e.title, body: e.body, href: e.href }]);
        setTimeout(() => dismiss(id), e.body ? 6000 : 4200);
      } else if (e.type === "points") {
        const id = ++seq.current;
        setToasts((t) => [...t.slice(-2), { id, tone: "celebrate", title: `+${e.points} points`, body: e.label, big: true }]);
        setTimeout(() => dismiss(id), 5200);
      } else if (e.type === "badge") {
        setTimeout(() => setBadgeQueue((q) => [...q, e.badgeId]), 900);
      } else if (e.type === "level") {
        setTimeout(() => setLevelUp(e.level), 1500);
      }
    });
  }, [dismiss]);

  const badge = badgeQueue[0] ? badgeById[badgeQueue[0]] : undefined;

  return (
    <>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+1rem)] z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6 lg:items-end lg:px-6"
      >
        {toasts.map((t) => {
          const S = toneStyle[t.tone];
          const content = (
            <>
              <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", S.bubble)}>
                {t.big ? <Sparkles className="size-5" aria-hidden /> : <S.icon className="size-5" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={cn("block font-extrabold text-navy-900", t.big ? "text-lg" : "text-[0.95rem]")}>{t.title}</span>
                {t.body && <span className="mt-0.5 block text-sm leading-snug text-navy-600">{t.body}</span>}
              </span>
            </>
          );
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl bg-white p-3.5 pr-2 shadow-pop ring-1 ring-line animate-toast-in"
            >
              {t.href ? (
                <Link href={t.href} onClick={() => dismiss(t.id)} className="flex min-w-0 flex-1 items-center gap-3">
                  {content}
                </Link>
              ) : (
                content
              )}
              <button type="button" aria-label="Dismiss notification" onClick={() => dismiss(t.id)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-navy-400 hover:bg-navy-100">
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>

      <Overlay open={!!badge} onClose={() => setBadgeQueue((q) => q.slice(1))} variant="modal" size="sm" bare hideClose>
        {badge && (
          <div className="relative overflow-hidden px-8 pb-8 pt-12 text-center">
            <Confetti count={36} />
            <p className="eyebrow text-coral-700">Badge unlocked</p>
            <div className="mt-6 flex justify-center">
              <BadgeIcon def={badge} size="xl" animate />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-navy-900">{badge.name}</h2>
            <p className="mt-1 text-navy-600">{badge.description}</p>
            <div className="mt-7 flex flex-col gap-2.5">
              <Button size="lg" full onClick={() => setBadgeQueue((q) => q.slice(1))}>
                Awesome!
              </Button>
              {me && (
                <Button href={`/user/${me.handle}#badges`} variant="ghost" onClick={() => setBadgeQueue((q) => q.slice(1))}>
                  View my badges
                </Button>
              )}
            </div>
          </div>
        )}
      </Overlay>

      <Overlay open={!!levelUp} onClose={() => setLevelUp(null)} variant="modal" size="sm" bare hideClose>
        {levelUp && (
          <div className="relative overflow-hidden px-8 pb-8 pt-12 text-center">
            <Confetti count={36} />
            <p className="eyebrow text-violet-700">Level up</p>
            <div className="mx-auto mt-6 flex size-28 animate-pop items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-violet-700 text-5xl font-extrabold text-white shadow-lift">
              {levelUp.level}
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-navy-900">You&rsquo;re now a {levelUp.title}</h2>
            <p className="mt-1 text-navy-600">Thank you for helping people across Singapore find their way back to their things.</p>
            <Button size="lg" full className="mt-7" onClick={() => setLevelUp(null)}>
              Keep going
            </Button>
          </div>
        )}
      </Overlay>
    </>
  );
}
