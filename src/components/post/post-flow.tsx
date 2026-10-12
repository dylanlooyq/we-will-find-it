"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Send, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { PRERENDER_NOW } from "@/lib/clock";
import { loadDraftPhotos, saveDraftPhotos } from "@/lib/draft-photos";
import {
  STEP_TITLES,
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
import { Logo } from "../brand/logo";
import { Button } from "../ui/button";
import { Segmented } from "../ui/form";
import { BountyStep, DetailsStep, PetStep, PhotosStep, ReviewStep, WhenStep, WhereStep } from "./steps";
import { PublishedState } from "./published";

const sgDate = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
const DRAFT_KEY = (k: PostKind) => `wwfi:draft:${k}`;

/** What localStorage holds: the draft's fields and the step it was left on. Photos live in IndexedDB (see draft-photos). */
type Saved = Partial<Omit<Draft, "images">> & { step?: StepId };

/** A live listing being edited: where it lives, the form filled in from it, and whether its bounty is spoken for. */
export interface PostEdit {
  itemId: string;
  slug: string;
  draft: Draft;
  /** A finder has claimed the bounty, so it can no longer be changed. */
  bountyLocked: boolean;
}

/**
 * The posting flow: photo → details → where → when → (bounty) → review.
 * Designed so a lost phone can be posted in well under a minute: only a
 * name, a category and a place are required; everything else is optional.
 *
 * With `edit` the same steps change a listing that is already live: it opens on the review step,
 * each step returns there, and nothing is kept as a draft.
 */
export function PostFlow({ kind, edit }: { kind: PostKind; edit?: PostEdit }) {
  const router = useRouter();
  const w = useWorld();
  const now = useNow();
  const me = w.currentUser;
  const today = sgDate(now);
  const editing = !!edit;
  const bountyLocked = !!edit?.bountyLocked;

  const [draft, setDraft] = useState<Draft>(() => edit?.draft ?? emptyDraft(kind, sgDate(PRERENDER_NOW)));
  // An edit opens on the last step, the review (the index is clamped below).
  const [rawStep, setI] = useState(edit ? Infinity : 0);
  const [errors, setErrors] = useState<StepErrors>({});
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const loaded = useRef(false);

  const steps = stepsFor(draft.type, draft.pet).filter((s) => !(bountyLocked && s === "bounty"));
  // Switching Lost ⇄ Found can shorten the flow (found has no bounty step) — clamp rather than sync.
  const i = Math.min(rawStep, steps.length - 1);
  const step = steps[i];
  const last = i >= steps.length - 1;

  const set = useCallback((patch: Partial<Draft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setErrors({});
  }, []);

  // Restore a saved draft after hydration (never during — keeps markup identical): its fields,
  // its photos and the step it was left on, so coming back from logging in lands on "post".
  useEffect(() => {
    if (editing) return;
    let cancelled = false;
    const t = setTimeout(async () => {
      let saved: Saved = {};
      try {
        const raw = window.localStorage.getItem(DRAFT_KEY(kind));
        if (raw) saved = JSON.parse(raw) as Saved;
      } catch {
        /* ignore */
      }
      const photos = await loadDraftPhotos(DRAFT_KEY(kind));
      if (cancelled) return;
      const { step: savedStep, ...fields } = saved;
      // The page was built with a fixed date; a new draft starts from today.
      const fresh = emptyDraft(kind, sgDate(Date.now()));
      setDraft((d) => ({ ...d, date: fresh.date, ...fields, images: d.images.length ? d.images : photos }));
      if (savedStep) setI(Math.max(0, stepsFor(fields.type ?? fresh.type, fields.pet ?? fresh.pet).indexOf(savedStep)));
      loaded.current = true;
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [kind, editing]);

  // Autosave (new posts only — `loaded` stays false while editing). Written at once, not debounced:
  // the last step links straight out to log in.
  useEffect(() => {
    if (!loaded.current || publishedId) return;
    try {
      const { images: _images, ...rest } = draft;
      void _images;
      const saved: Saved = { ...rest, step };
      window.localStorage.setItem(DRAFT_KEY(kind), JSON.stringify(saved));
    } catch {
      /* ignore */
    }
  }, [draft, step, kind, publishedId]);

  useEffect(() => {
    if (!loaded.current || publishedId) return;
    void saveDraftPhotos(DRAFT_KEY(kind), draft.images);
  }, [draft.images, kind, publishedId]);

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
    // An edit goes back to the overview; a new post moves on to the next step.
    setI(editing ? steps.length - 1 : Math.min(i + 1, steps.length - 1));
  };

  const back = () => {
    if (editing ? last : i === 0) return exit();
    setErrors({});
    setI(editing ? steps.length - 1 : i - 1);
  };

  const exit = () => {
    if (edit) return router.push(`/item/${edit.slug}`);
    if (draft.title || draft.petName || draft.description || draft.locationId) toast("Draft saved", { body: "Pick up where you left off any time.", tone: "info" });
    router.push("/");
  };

  const publish = async () => {
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
    if (edit) {
      // Wait for the API: leaving at once could cut off photos that are still uploading.
      const saved = await actions.updateItem(edit.itemId, draftToInput(draft));
      // If it isn't allowed, the store has already said why.
      if (!saved) return setPublishing(false);
      toast("Changes saved");
      return router.push(`/item/${edit.slug}`);
    }
    const created = actions.createItem(draftToInput(draft));
    // If it isn't allowed, the store has already said why.
    if (!created) return setPublishing(false);
    try {
      window.localStorage.removeItem(DRAFT_KEY(kind));
    } catch {
      /* ignore */
    }
    void saveDraftPhotos(DRAFT_KEY(kind), []);
    setPublishedId(created.id);
    setPublishing(false);
  };

  if (publishedId) {
    return (
      <div className="min-h-dvh bg-canvas">
        <PublishedState itemId={publishedId} />
      </div>
    );
  }

  const label = editing ? "Save changes" : draft.pet ? (draft.type === "lost" ? "Post Lost Pet" : "Post Found Pet") : draft.type === "lost" ? "Post Lost Item" : "Post Found Item";
  const heading = editing ? "Edit post" : draft.pet ? (draft.type === "lost" ? "Lost a pet" : "Found a pet") : draft.type === "lost" ? "Lost an item" : "Found an item";
  const loginHref = `/login?next=/post/${kind}`;
  const tone = draft.type === "lost" ? "primary" : "found";
  const backLabel = editing ? (last ? "Cancel" : "Back") : i === 0 ? "Cancel" : "Back";
  const nextLabel = editing ? "Done" : step === "photos" && draft.images.length === 0 ? "Skip for now" : "Continue";

  return (
    <div className="min-h-dvh bg-canvas pb-28 lg:pb-12">
      <header className="glass sticky top-0 z-40 border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <button type="button" onClick={exit} aria-label={editing ? "Close without saving" : "Close and save draft"} className="inline-flex size-10 items-center justify-center rounded-full text-navy-700 hover:bg-navy-100">
            <X className="size-6" />
          </button>
          <Link href="/" aria-label="wewillfind.it home" className="hidden shrink-0 sm:block">
            <Logo size={26} />
          </Link>
          <div className="min-w-0 flex-1 text-center sm:ml-4 sm:text-left">
            <p className="truncate text-[0.95rem] font-extrabold text-navy-900">{heading}</p>
            <p className="text-xs font-semibold text-navy-500" aria-live="polite">
              {editing ? (last ? "Your post stays live while you edit" : STEP_TITLES[step]) : `Step ${i + 1} of ${steps.length} · ${STEP_TITLES[step]}`}
            </p>
          </div>
          {/* A live listing keeps its type: points and matches already hang on it. */}
          {!editing && (
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
          )}
        </div>
        {!editing && (
          <div className="h-1.5 w-full bg-navy-100" role="progressbar" aria-label="Posting progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={i + 1}>
            <div className={cn("h-full rounded-r-full transition-all duration-500 ease-out", draft.type === "lost" ? "bg-coral-600" : "bg-found-600")} style={{ width: `${((i + 1) / steps.length) * 100}%` }} />
          </div>
        )}
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
        <div className="mx-auto max-w-xl">
          {step === "photos" && <PhotosStep draft={draft} set={set} />}
          {step === "details" && <DetailsStep draft={draft} set={set} errors={errors} />}
          {step === "pet" && <PetStep draft={draft} set={set} errors={errors} />}
          {step === "where" && <WhereStep draft={draft} set={set} errors={errors} />}
          {step === "when" && <WhenStep draft={draft} set={set} errors={errors} today={today} />}
          {step === "bounty" && <BountyStep draft={draft} set={set} errors={errors} />}
          {step === "review" && <ReviewStep draft={draft} go={goTo} steps={steps} signedIn={!!me} loginHref={loginHref} editing={editing} bountyLocked={bountyLocked} />}

          <div className="mt-10 hidden items-center gap-3 lg:flex">
            <Button variant="secondary" size="lg" onClick={back} iconLeft={<ArrowLeft className="size-4" aria-hidden />}>
              {backLabel}
            </Button>
            {last ? (
              <Button size="lg" variant={tone} disabled={!me} loading={publishing} onClick={publish} iconLeft={editing ? <Check className="size-4" aria-hidden /> : <Send className="size-4" aria-hidden />} className="min-w-52">
                {label}
              </Button>
            ) : (
              <Button size="lg" onClick={next} iconRight={editing ? undefined : <ArrowRight className="size-4" aria-hidden />} className="min-w-40" variant={tone}>
                {nextLabel}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile action bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/70 px-4 pb-safe pt-3 lg:hidden">
        <div className="mx-auto flex max-w-xl gap-3">
          <Button variant="secondary" size="lg" onClick={back} aria-label={backLabel} className="!px-4">
            <ArrowLeft className="size-5" aria-hidden />
          </Button>
          {last ? (
            <Button full size="lg" variant={tone} disabled={!me} loading={publishing} onClick={publish}>
              {label}
            </Button>
          ) : (
            <Button full size="lg" onClick={next} iconRight={editing ? undefined : <ArrowRight className="size-4" aria-hidden />} variant={tone}>
              {nextLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
