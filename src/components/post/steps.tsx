"use client";

import { useRef, useState, type ReactNode } from "react";
import { Camera, Check, Coins, ImagePlus, Info, Lock, ShieldCheck, Star, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { categories, getLocation, PAYMENT_OPTIONS } from "@/lib/data/taxonomy";
import { formatDate, formatMoney } from "@/lib/format";
import { fileToDataUrl, MAX_PHOTOS } from "@/lib/images-client";
import { PET_SPECIES, TIME_BANDS, timeLabelOf, titleOf, type Draft, type StepErrors, type StepId } from "@/lib/post-draft";
import { toast } from "@/lib/store/events";
import { Button } from "../ui/button";
import { CategoryIcon } from "../ui/category-icon";
import { Chip, Switch, TextArea, TextField } from "../ui/form";
import { ItemImage } from "../ui/item-image";
import { LocationPicker } from "../ui/location-picker";

type SetDraft = (patch: Partial<Draft>) => void;

export function StepShell({ title, body, children }: { title: string; body?: string; children: ReactNode }) {
  return (
    <section aria-labelledby="step-h" className="animate-fade-up">
      <h1 id="step-h" tabIndex={-1} className="text-[1.75rem] font-extrabold leading-tight text-navy-900 outline-none sm:text-3xl">
        {title}
      </h1>
      {body && <p className="mt-2 max-w-lg text-[0.98rem] leading-relaxed text-navy-600">{body}</p>}
      <div className="mt-7 space-y-6">{children}</div>
    </section>
  );
}

/* ── 1. Photos ────────────────────────────────────────────── */

export function PhotosStep({ draft, set }: { draft: Draft; set: SetDraft }) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const add = async (files: FileList | File[] | null) => {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setBusy(true);
    try {
      const next = [...draft.images];
      for (const f of list.slice(0, MAX_PHOTOS - next.length)) {
        next.push({ file: "upload", label: "Photo you attached", src: await fileToDataUrl(f) });
      }
      set({ images: next });
    } catch {
      toast("One of those photos couldn't be read", { tone: "error" });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const full = draft.images.length >= MAX_PHOTOS;
  return (
    <StepShell
      title="Add photos"
      body={draft.type === "lost" ? "A clear photo of the item — or a similar one — helps people spot it." : "Photograph what you found. Avoid showing serial numbers or personal details."}
    >
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" aria-label="Choose photos to upload" onChange={(e) => add(e.target.files)} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={full || busy}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          add(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-3 rounded-card border-2 border-dashed px-6 py-12 text-center transition-all",
          drag ? "border-coral-500 bg-coral-50" : "border-navy-200 bg-white hover:border-coral-400 hover:bg-coral-50/50",
          (full || busy) && "opacity-60",
        )}
      >
        <span className="flex size-16 items-center justify-center rounded-2xl bg-coral-50 text-coral-600">{busy ? <UploadCloud className="size-8 animate-pulse" aria-hidden /> : <Camera className="size-8" aria-hidden />}</span>
        <span>
          <span className="block text-lg font-extrabold text-navy-900">{busy ? "Adding…" : full ? "Photo limit reached" : "Add photos"}</span>
          <span className="mt-1 block text-sm text-navy-600">Tap to choose, take a photo, or drag them here · up to {MAX_PHOTOS}</span>
        </span>
      </button>

      {draft.images.length > 0 && (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4" aria-label="Your photos">
          {draft.images.map((img, i) => (
            <li key={i} className="relative">
              <ItemImage image={img} category="other" compact className="aspect-square rounded-2xl" />
              {i === 0 && <span className="absolute bottom-1.5 left-1.5 rounded-md bg-navy-950/70 px-1.5 py-0.5 text-[0.62rem] font-bold text-white">Cover</span>}
              <button
                type="button"
                aria-label={`Remove photo ${i + 1}`}
                onClick={() => set({ images: draft.images.filter((_, j) => j !== i) })}
                className="absolute -right-2 -top-2 flex size-7 items-center justify-center rounded-full bg-navy-900 text-white shadow-lift"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
          {!full && (
            <li>
              <button type="button" onClick={() => input.current?.click()} aria-label="Add another photo" className="flex aspect-square w-full items-center justify-center rounded-2xl border-2 border-dashed border-navy-200 text-navy-500 hover:border-coral-400 hover:text-coral-600">
                <ImagePlus className="size-6" aria-hidden />
              </button>
            </li>
          )}
        </ul>
      )}
      <p className="flex items-start gap-2 text-sm leading-relaxed text-navy-600">
        <Info className="mt-0.5 size-4 shrink-0 text-navy-400" aria-hidden />
        No photo? No problem — you can skip this and add one later. Posts with photos get found about 3× faster.
      </p>
    </StepShell>
  );
}

/* ── 2. Details ───────────────────────────────────────────── */

const COLOURS = [
  ["Black", "#111827"],
  ["White", "#ffffff"],
  ["Grey", "#9ca3af"],
  ["Silver", "#d1d5db"],
  ["Blue", "#2b4fdb"],
  ["Red", "#e11d48"],
  ["Green", "#16b66a"],
  ["Brown", "#8b5a3c"],
  ["Purple", "#7a3fe8"],
  ["Pink", "#f472b6"],
  ["Gold", "#f59e0b"],
] as const;

function ColourChips({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  return (
    <fieldset>
      <legend className="mb-2 flex w-full items-baseline justify-between text-sm font-bold text-navy-900">
        {label}
        <span className="text-xs font-medium text-navy-500">Optional</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {COLOURS.map(([name, hex]) => (
          <Chip key={name} active={value === name} onClick={() => onChange(value === name ? "" : name)} className="!h-9 !gap-2 !px-3" icon={<span className="size-3.5 rounded-full ring-1 ring-navy-300" style={{ background: hex }} aria-hidden />}>
            {name}
          </Chip>
        ))}
      </div>
    </fieldset>
  );
}

export function DetailsStep({ draft, set, errors }: { draft: Draft; set: SetDraft; errors: StepErrors }) {
  const lost = draft.type === "lost";
  return (
    <StepShell title="What is it?" body="The more specific you are, the faster the right person finds it.">
      <TextField
        label="Item name"
        placeholder={lost ? "e.g. iPhone 14 Pro — Deep Purple" : "e.g. Black Nike backpack"}
        value={draft.title}
        onChange={(e) => set({ title: e.target.value })}
        error={errors.title}
        maxLength={80}
        autoFocus
      />
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-navy-900">Category</legend>
        <div role="radiogroup" aria-label="Category" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {categories
            .filter((c) => c.id !== "pets")
            .map((c) => {
              const on = draft.category === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => set({ category: c.id })}
                  className={cn("flex flex-col items-center gap-2 rounded-2xl border-2 px-2 py-3.5 text-center text-[0.82rem] font-bold transition-all", on ? "border-coral-600 bg-coral-50 text-coral-800" : "border-line bg-white text-navy-700 hover:border-navy-300")}
                >
                  <CategoryIcon icon={c.icon} className={cn("size-6", on ? "text-coral-600" : "text-navy-500")} />
                  {c.label}
                </button>
              );
            })}
        </div>
        {errors.category && <p role="alert" className="mt-2 text-xs font-semibold text-coral-700">{errors.category}</p>}
      </fieldset>
      <TextArea
        label="Description"
        optional
        value={draft.description}
        onChange={(e) => set({ description: e.target.value })}
        placeholder={lost ? "Where you last had it, what's inside, anything distinctive…" : "Where exactly you found it and what condition it's in…"}
        hint="Don't include phone numbers or addresses — use in-app chat."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Brand" optional value={draft.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="e.g. Apple, Nike, Pedro" />
        <TextField label="Model" optional value={draft.model} onChange={(e) => set({ model: e.target.value })} placeholder="e.g. iPhone 14 Pro" />
        <div className="sm:col-span-2">
          <ColourChips label="Colour" value={draft.colour} onChange={(colour) => set({ colour })} />
        </div>
      </div>
      <div className="rounded-card bg-navy-50 p-4">
        <TextArea label="Unique identifying details" optional value={draft.marks} onChange={(e) => set({ marks: e.target.value })} rows={2} placeholder="Stickers, scratches, engravings, lock-screen photo…" />
        <div className="mt-3 flex items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 size-4 shrink-0 text-mint-700" aria-hidden />
            <div>
              <p className="text-sm font-bold text-navy-900">Keep these private</p>
              <p className="text-xs leading-relaxed text-navy-600">
                {lost ? "Only share them with someone who can prove they have it." : "Ask the owner to describe it — then you can verify."} Recommended.
              </p>
            </div>
          </div>
          <Switch checked={draft.marksPrivate} onChange={(marksPrivate) => set({ marksPrivate })} label="Keep unique details private" tone="found" />
        </div>
      </div>
    </StepShell>
  );
}

/* ── 2b. Pet ──────────────────────────────────────────────── */

export function PetStep({ draft, set, errors }: { draft: Draft; set: SetDraft; errors: StepErrors }) {
  return (
    <StepShell title="Tell us about the pet" body={draft.type === "lost" ? "Every detail helps neighbours recognise them quickly." : "Describe what you can see — leave some details out so the real owner can prove it."}>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-navy-900">What kind of pet?</legend>
        <div role="radiogroup" aria-label="Species" className="grid grid-cols-3 gap-3">
          {PET_SPECIES.map((s) => (
            <button
              key={s.id}
              type="button"
              role="radio"
              aria-checked={draft.species === s.id}
              onClick={() => set({ species: s.id })}
              className={cn("flex flex-col items-center gap-1 rounded-2xl border-2 py-4 transition-all", draft.species === s.id ? "border-coral-600 bg-coral-50" : "border-line bg-white hover:border-navy-300")}
            >
              <span className="text-4xl" aria-hidden>
                {s.emoji}
              </span>
              <span className="text-sm font-bold text-navy-900">{s.label}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label="Name" optional={draft.type === "found"} value={draft.petName} onChange={(e) => set({ petName: e.target.value })} placeholder={draft.type === "lost" ? "e.g. Mochi" : "If there's a tag"} />
        <TextField label="Breed" value={draft.breed} onChange={(e) => set({ breed: e.target.value })} placeholder="e.g. Pomeranian, tabby" error={errors.breed} />
        <TextField label="Colour" value={draft.petColour} onChange={(e) => set({ petColour: e.target.value })} placeholder="e.g. Brown with a cream chest" />
        <TextField label="Age" optional value={draft.age} onChange={(e) => set({ age: e.target.value })} placeholder="e.g. 3 years" />
      </div>
      <TextField label="Collar or harness" optional value={draft.collar} onChange={(e) => set({ collar: e.target.value })} placeholder="e.g. Red collar with a bell" />
      <TextField
        label="Microchip number"
        optional
        value={draft.microchip}
        onChange={(e) => set({ microchip: e.target.value })}
        placeholder={draft.type === "found" ? "Only if a vet has scanned them" : "15-digit number"}
        hint={
          <span className="inline-flex items-start gap-1.5">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {/* A finder can't know the number by looking: say where it comes from, and what it is for. */}
            {draft.type === "found"
              ? "You'll only have this if a vet or the AVS has scanned the pet — leave it blank otherwise. It's never shown publicly: ask anyone claiming the pet for their number and check it matches."
              : "Never shown publicly — only you can see it, so a vet scan can confirm ownership."}
          </span>
        }
      />
      <TextArea label="Anything else?" optional value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Temperament, where they like to hide, what they respond to…" />
    </StepShell>
  );
}

/* ── 3. Where ─────────────────────────────────────────────── */

export function WhereStep({ draft, set, errors }: { draft: Draft; set: SetDraft; errors: StepErrors }) {
  const lost = draft.type === "lost";
  return (
    <StepShell title="Where?" body={lost ? "Where did you last have it? A station, mall or park works great." : "Where did you find it? Be as specific as you can."}>
      <LocationPicker label="Location" value={draft.locationId} onChange={(locationId) => set({ locationId })} error={errors.location} />
      <TextField
        label="Where exactly?"
        optional
        value={draft.locationNote}
        onChange={(e) => set({ locationNote: e.target.value })}
        placeholder={lost ? "e.g. Marina Bay-bound platform, near the escalators" : "e.g. Bench past the playground"}
      />
      {draft.locationId && (
        <p className="flex items-center gap-2 rounded-xl bg-found-50 px-4 py-3 text-sm font-semibold text-found-800">
          <Check className="size-4" aria-hidden />
          People near {getLocation(draft.locationId).name} will be notified of possible matches.
        </p>
      )}
    </StepShell>
  );
}

/* ── 4. When ──────────────────────────────────────────────── */

export function WhenStep({ draft, set, errors, today }: { draft: Draft; set: SetDraft; errors: StepErrors; today: string }) {
  const lost = draft.type === "lost";
  const shift = (days: number) => {
    const [y, m, d] = today.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d - days));
    return dt.toISOString().slice(0, 10);
  };
  const quick = [
    ["Today", today],
    ["Yesterday", shift(1)],
    ["2 days ago", shift(2)],
  ] as const;
  const custom = !quick.some(([, v]) => v === draft.date);

  return (
    <StepShell title="When?" body={draft.pet && lost ? "When did you last see them?" : lost ? "Roughly when did you lose it?" : "Roughly when did you find it?"}>
      <fieldset>
        <legend className="mb-2 text-sm font-bold text-navy-900">Date</legend>
        <div className="flex flex-wrap gap-2">
          {quick.map(([label, v]) => (
            <Chip key={label} active={draft.date === v} onClick={() => set({ date: v })}>
              {label}
            </Chip>
          ))}
          <label className={cn("inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold", custom ? "border-navy-900 bg-navy-900 text-white" : "border-line bg-white text-navy-700")}>
            <span>Pick a date</span>
            <input type="date" value={draft.date} max={today} onChange={(e) => e.target.value && set({ date: e.target.value })} className="bg-transparent text-sm" aria-label="Choose a date" />
          </label>
        </div>
        <p className="mt-2 text-xs text-navy-500">Selected: {formatDate(`${draft.date}T12:00:00+08:00`)}</p>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-bold text-navy-900">Approximate time</legend>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {TIME_BANDS.map((b) => {
            const on = draft.timeMode === "band" && draft.band === b.id;
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={on}
                onClick={() => set({ timeMode: "band", band: b.id })}
                className={cn("rounded-2xl border-2 px-4 py-3 text-left transition-all", on ? "border-coral-600 bg-coral-50" : "border-line bg-white hover:border-navy-300")}
              >
                <span className="block text-[0.95rem] font-extrabold text-navy-900">{b.label}</span>
                <span className="text-xs text-navy-500">{b.hint}</span>
              </button>
            );
          })}
          <button
            type="button"
            aria-pressed={draft.timeMode === "unsure"}
            onClick={() => set({ timeMode: "unsure" })}
            className={cn("rounded-2xl border-2 px-4 py-3 text-left transition-all", draft.timeMode === "unsure" ? "border-coral-600 bg-coral-50" : "border-line bg-white hover:border-navy-300")}
          >
            <span className="block text-[0.95rem] font-extrabold text-navy-900">Not sure</span>
            <span className="text-xs text-navy-500">That&rsquo;s okay</span>
          </button>
        </div>
        <div className={cn("mt-3 flex items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-all", draft.timeMode === "exact" ? "border-coral-600 bg-coral-50" : "border-line bg-white")}>
          <label htmlFor="exact-time" className="text-sm font-bold text-navy-900">
            I remember the time
          </label>
          <input
            id="exact-time"
            type="time"
            value={draft.time}
            onChange={(e) => set({ time: e.target.value, timeMode: "exact" })}
            className="ml-auto h-10 rounded-lg border border-line bg-white px-3 text-sm font-semibold"
          />
        </div>
        {errors.time && <p role="alert" className="mt-2 text-xs font-semibold text-coral-700">{errors.time}</p>}
      </fieldset>
    </StepShell>
  );
}

/* ── 5. Bounty ────────────────────────────────────────────── */

const AMOUNTS = [20, 50, 100, 200, 500];

export function BountyStep({ draft, set, errors }: { draft: Draft; set: SetDraft; errors: StepErrors }) {
  return (
    <StepShell title="Add a bounty?" body="Entirely optional. A reward encourages people to look out for your item.">
      <div className={cn("rounded-card border-2 p-5 transition-colors", draft.bounty ? "border-gold-300 bg-gold-50" : "border-line bg-white")}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-gold-200 text-gold-800">
              <Coins className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-lg font-extrabold text-navy-900">Offer a bounty</p>
              <p className="text-sm text-navy-600">A bounty encourages people to look out for your item.</p>
            </div>
          </div>
          <Switch checked={draft.bounty} onChange={(bounty) => set({ bounty })} label="Offer a bounty" tone="gold" />
        </div>

        {draft.bounty && (
          <div className="mt-6 animate-fade-up">
            <p className="mb-2 text-sm font-bold text-navy-900">Reward amount</p>
            <div className="flex flex-wrap gap-2">
              {AMOUNTS.map((a) => (
                <Chip key={a} tone="gold" active={Number(draft.bountyAmount) === a} onClick={() => set({ bountyAmount: String(a) })}>
                  {formatMoney(a)}
                </Chip>
              ))}
            </div>
            <div className="mt-4 max-w-[14rem]">
              <TextField
                label="Or enter an amount"
                inputMode="numeric"
                prefix={<span className="text-sm font-extrabold text-navy-700">S$</span>}
                value={draft.bountyAmount}
                onChange={(e) => set({ bountyAmount: e.target.value.replace(/[^0-9]/g, "") })}
                error={errors.bounty}
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-card bg-white p-5 shadow-soft">
        <p className="flex items-center gap-2 text-[0.98rem] font-extrabold text-navy-900">
          <ShieldCheck className="size-5 text-mint-700" aria-hidden />
          How bounties stay safe
        </p>
        <ol className="mt-3 space-y-2.5 text-sm leading-relaxed text-navy-700">
          {["Someone finds your item and submits proof.", "You verify it — they only get details after you approve.", "You meet in a public place and confirm you have it back.", `Only then do you pay the finder directly — ${PAYMENT_OPTIONS}.`].map((t, i) => (
            <li key={t} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-mint-100 text-xs font-extrabold text-mint-800">{i + 1}</span>
              {t}
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-navy-50 p-3 text-xs leading-relaxed text-navy-600">
          <strong className="text-navy-800">Nothing to pay now:</strong> wewillfind.it never holds your money. The bounty is a promise — you pay the finder yourself when you have your item back.
        </p>
      </div>
    </StepShell>
  );
}

/* ── 6. Review ────────────────────────────────────────────── */

export function ReviewStep({
  draft,
  go,
  steps,
  signedIn,
  loginHref,
  editing = false,
  bountyLocked = false,
}: {
  draft: Draft;
  go: (s: StepId) => void;
  steps: StepId[];
  signedIn: boolean;
  loginHref: string;
  /** Changing a live listing rather than posting a new one. */
  editing?: boolean;
  /** A finder has claimed the bounty: it is shown, but can't be changed. */
  bountyLocked?: boolean;
}) {
  const lost = draft.type === "lost";
  const title = titleOf(draft) || (lost ? "Untitled lost item" : "Untitled found item");
  const loc = draft.locationId ? getLocation(draft.locationId) : null;
  const rows: { step?: StepId; label: string; value: ReactNode }[] = [
    { step: "photos", label: "Photos", value: draft.images.length ? `${draft.images.length} added` : "None yet" },
    { step: draft.pet ? "pet" : "details", label: draft.pet ? "Pet" : "Item", value: title },
    { step: "where", label: "Where", value: loc ? `${loc.name}${draft.locationNote ? ` · ${draft.locationNote}` : ""}` : "—" },
    { step: "when", label: "When", value: `${formatDate(`${draft.date}T12:00:00+08:00`)} · ${timeLabelOf(draft)}` },
  ];
  if (steps.includes("bounty") || bountyLocked) {
    rows.push({ step: bountyLocked ? undefined : "bounty", label: "Bounty", value: draft.bounty ? <strong className="text-gold-800">{formatMoney(Number(draft.bountyAmount) || 0)}</strong> : "No bounty" });
  }

  return (
    <StepShell
      title={editing ? "Edit your post" : lost ? "Ready to post?" : "Ready to publish?"}
      body={editing ? "Change anything below, then save. Your post keeps its link, messages and claims." : "Take a last look. You can edit any of it from your post afterwards."}
    >
      <dl className="divide-y divide-line rounded-card bg-white px-5 shadow-soft">
        {rows.map(({ step, label, value }) => (
          <div key={label} className="flex items-center gap-4 py-4">
            <dt className="w-20 shrink-0 text-sm font-semibold text-navy-500">{label}</dt>
            <dd className="min-w-0 flex-1 truncate text-[0.95rem] font-bold text-navy-900">{value}</dd>
            {step ? (
              <button type="button" onClick={() => go(step)} className="shrink-0 text-sm font-bold text-coral-700 hover:underline">
                Edit
              </button>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-navy-500">
                <Lock className="size-3.5" aria-hidden /> Claimed
              </span>
            )}
          </div>
        ))}
      </dl>
      {bountyLocked && <p className="text-sm leading-relaxed text-navy-600">A finder has claimed the bounty, so it can&rsquo;t be changed now.</p>}

      {!editing && (
        <div className="rounded-card bg-mint-50 p-5 text-sm text-mint-900">
          <p className="flex items-center gap-2 font-extrabold">
            <Star className="size-4" aria-hidden /> What happens next
          </p>
          <ul className="mt-2.5 list-disc space-y-1.5 pl-5 text-mint-800">
            <li>Your post goes live instantly and we look for matches.</li>
            <li>You&rsquo;ll be notified of messages, claims and matches.</li>
            <li>Details you marked private stay private until someone proves it.</li>
          </ul>
        </div>
      )}

      {!signedIn && (
        <div className="rounded-card bg-gold-50 p-5 ring-1 ring-gold-200">
          <p className="font-extrabold text-navy-900">Log in to publish</p>
          <p className="mt-1 text-sm text-navy-700">Your draft is saved. Log in or create a free account and come right back.</p>
          <div className="mt-4 flex gap-2.5">
            <Button href={loginHref} size="md">
              Log in
            </Button>
            <Button href={loginHref.replace("/login", "/signup")} variant="secondary">
              Sign up
            </Button>
          </div>
        </div>
      )}
    </StepShell>
  );
}
