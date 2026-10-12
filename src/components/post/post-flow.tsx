"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { PRERENDER_NOW } from "@/lib/clock";
import {
  STEP_TITLES,
  draftPreviewItem,
  draftToInput,
  emptyDraft,
  stepsFor,
  validate,
  type Draft,
  type PostKind,
  type StepErrors,
  type StepId,
} from "@/lib/post-draft";
import { useNow, useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import { ItemCard } from "../items/item-card";
import { Logo } from "../brand/logo";
import { Button } from "../ui/button";
import { Segmented } from "../ui/form";
import { BountyStep, DetailsStep, PetStep, PhotosStep, ReviewStep, WhenStep, WhereStep } from "./steps";
import { PublishedState } from "./published";

const sgDate = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
const DRAFT_KEY = (k: PostKind) => `wwfi:draft:${k}`;

/** Serialisable part of a draft (photos are intentionally left out). */
type Saved = Omit<Draft, "images">;

/**
 * The posting flow: photo → details → where → when → (bounty) → review.
 * Designed so a lost phone can be posted in well under a minute: only a
 * name, a category and a place are required; everything else is optional.
 */
export function PostFlow({ kind }: { kind: PostKind }) {
  const router = useRouter();
  const w = useWorld();
  const now = useNow();
  const me = w.currentUser;
  const today = sgDate(now);

  const [draft, setDraft] = useState<Draft>(() => emptyDraft(kind, sgDate(PRERENDER_NOW)));
  const [rawStep, setI] = useState(0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const loaded = useRef(false);

  const steps = stepsFor(draft.type, draft.pet);
  // Switching Lost ⇄ Found can shorten the flow (found has no bounty step) — clamp rather than sync.
  const i = Math.min(rawStep, steps.length - 1);
  const step = steps[i];
  const last = i >= steps.length - 1;

  const set = useCallback((patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
  }, []);

  // Restore a saved draft after hydration (never during — keeps markup identical)
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        // The page was built with a fixed date; a new draft starts from today.
        const raw = window.localStorage.getItem(DRAFT_KEY(kind));
        const saved = raw ? (JSON.parse(raw) as Saved) : {};
        setDraft((d) => ({ ...d, date: sgDate(Date.now()), ...saved, images: d.images }));
      } catch {
        /* ignore */
      }
      loaded.current = true;
    }, 0);
    return () => clearTimeout(t);
  }, [kind]);

  // Autosave (debounced)
  useEffect(() => {
    if (!loaded.current || publishedId) return;
    const t = setTimeout(() => {
      try {
        const { images: _images, ...rest } = draft;
        void _images;
        window.localStorage.setItem(DRAFT_KEY(kind), JSON.stringify(rest));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(t);
  }, [draft, kind, publishedId]);

  // Move focus + scroll to the new step's heading
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const t = setTimeout(() => document.getElementById("step-h")?.focus({ preventScroll: true }), 60);
    return () => clearTimeout(t);
  }, [i, publishedId]);

  const goTo = (id: StepId) => {
    const idx = steps.indexOf(id);
    if (idx >= 0) setI(idx);
  };

  const next = () => {
    const errs = validate(step, draft);
    if (Object.keys(errs).length) {
      setErrors(errs);
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], [role="alert"]')?.scrollIntoView({ block: "center", behavior: "smooth" }));
      return;
    }
    setErrors({});
    setI(Math.min(i + 1, steps.length - 1));
  };

  const back = () => {
    if (i === 0) return exit();
    setErrors({});
    setI(i - 1);
  };

  const exit = () => {
    if (draft.title || draft.petName || draft.description || draft.locationId) toast("Draft saved", { body: "Pick up where you left off any time.", tone: "info" });
    router.push("/");
  };

  const publish = () => {
    if (!me) return;
    // Validate every step once more so nothing required slips through
    for (const s of steps) {
      const e = validate(s, draft);
      if (Object.keys(e).length) {
        setI(steps.indexOf(s));
        setErrors(e);
        return;
      }
    }
    setPublishing(true);
    const created = actions.createItem(draftToInput(draft));
    // If it isn't allowed, the store has already said why.
    if (!created) return setPublishing(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY(kind));
    } catch {
      /* ignore */
    }
    setPublishedId(created.id);
    setPublishing(false);
  };

  const preview = useMemo(() => draftPreviewItem(draft, new Date(now).toISOString(), me?.id ?? ""), [draft, now, me?.id]);
  const previewBounty = draft.type === "lost" && draft.bounty ? Number(draft.bountyAmount) || undefined : undefined;

  if (publishedId) {
    return (
      <div className="min-h-dvh bg-canvas">
        <PublishedState itemId={publishedId} />
      </div>
    );
  }

  const label = draft.pet ? (draft.type === "lost" ? "Post Lost Pet" : "Post Found Pet") : draft.type === "lost" ? "Post Lost Item" : "Post Found Item";
  const heading = draft.pet ? (draft.type === "lost" ? "Lost a pet" : "Found a pet") : draft.type === "lost" ? "Lost an item" : "Found an item";
  const loginHref = `/login?next=/post/${kind}`;

  return (
    <div className="min-h-dvh bg-canvas pb-28 lg:pb-12">
      <header className="glass sticky top-0 z-40 border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={exit} aria-label="Close and save draft" className="inline-flex size-10 items-center justify-center rounded-full text-navy-700 hover:bg-navy-100">
            <X className="size-6" />
          </button>
          <Link href="/" aria-label="wewillfind.it home" className="hidden shrink-0 sm:block">
            <Logo size={26} />
          </Link>
          <div className="min-w-0 flex-1 text-center sm:ml-4 sm:text-left">
            <p className="truncate text-[0.95rem] font-extrabold text-navy-900">{heading}</p>
            <p className="text-xs font-semibold text-navy-500" aria-live="polite">
              Step {i + 1} of {steps.length} · {STEP_TITLES[step]}
            </p>
          </div>
          <Segmented<"lost" | "found">
            label="What happened"
            size="sm"
            value={draft.type}
            onChange={(type) => set({ type })}
            options={[
              { value: "lost", label: "Lost" },
              { value: "found", label: "Found" },
            ]}
          />
        </div>
        <div className="h-1.5 w-full bg-navy-100" role="progressbar" aria-label="Posting progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1}>
          <div className={cn("h-full rounded-r-full transition-all duration-500 ease-out", draft.type === "lost" ? "bg-coral-600" : "bg-found-600")} style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-8 sm:px-6 sm:pt-12 lg:grid-cols-[minmax(0,36rem)_1fr]">
        <div>
          {step === "photos" && <PhotosStep draft={draft} set={set} />}
          {step === "details" && <DetailsStep draft={draft} set={set} errors={errors} />}
          {step === "pet" && <PetStep draft={draft} set={set} errors={errors} />}
          {step === "where" && <WhereStep draft={draft} set={set} errors={errors} />}
          {step === "when" && <WhenStep draft={draft} set={set} errors={errors} today={today} />}
          {step === "bounty" && <BountyStep draft={draft} set={set} errors={errors} />}
          {step === "review" && <ReviewStep draft={draft} go={goTo} steps={steps} signedIn={!!me} loginHref={loginHref} />}

          <div className="mt-10 hidden items-center gap-3 lg:flex">
            <Button variant="secondary" size="lg" onClick={back} iconLeft={<ArrowLeft className="size-4" aria-hidden />}>
              {i === 0 ? "Cancel" : "Back"}
            </Button>
            {last ? (
              <Button size="lg" variant={draft.type === "lost" ? "primary" : "found"} disabled={!me} loading={publishing} onClick={publish} iconLeft={<Send className="size-4" aria-hidden />} className="min-w-52">
                {label}
              </Button>
            ) : (
              <Button size="lg" onClick={next} iconRight={<ArrowRight className="size-4" aria-hidden />} className="min-w-40" variant={draft.type === "lost" ? "primary" : "found"}>
                {step === "photos" && draft.images.length === 0 ? "Skip for now" : "Continue"}
              </Button>
            )}
          </div>
        </div>

        <aside className="hidden lg:block" aria-label="Live preview">
          <div className="sticky top-32">
            <p className="eyebrow mb-3 flex items-center gap-2 text-navy-400">
              <Check className="size-3.5" aria-hidden /> Live preview
            </p>
            <div className="pointer-events-none max-w-[19rem] select-none" aria-hidden inert>
              <ItemCard item={preview} bountyAmount={previewBounty} />
            </div>
            <p className="mt-4 max-w-[19rem] text-sm leading-relaxed text-navy-500">This is how your post will look in Explore. It updates as you type.</p>
          </div>
        </aside>
      </div>

      {/* Mobile action bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/70 px-4 pb-safe pt-3 lg:hidden">
        <div className="mx-auto flex max-w-xl gap-3">
          <Button variant="secondary" size="lg" onClick={back} aria-label={i === 0 ? "Cancel" : "Back"} className="!px-4">
            <ArrowLeft className="size-5" aria-hidden />
          </Button>
          {last ? (
            <Button full size="lg" variant={draft.type === "lost" ? "primary" : "found"} disabled={!me} loading={publishing} onClick={publish}>
              {label}
            </Button>
          ) : (
            <Button full size="lg" onClick={next} iconRight={<ArrowRight className="size-4" aria-hidden />} variant={draft.type === "lost" ? "primary" : "found"}>
              {step === "photos" && draft.images.length === 0 ? "Skip for now" : "Continue"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
