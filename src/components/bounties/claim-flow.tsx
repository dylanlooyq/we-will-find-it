"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BadgeCheck, CircleHelp, Clock, Coins, HandCoins, Lock, MapPin, MessageCircle, PartyPopper, Send, ShieldCheck, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation, PAYMENT_OPTIONS, paymentLabel } from "@/lib/data/taxonomy";
import { formatMoney } from "@/lib/format";
import { useHydrated, useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { Claim, ItemImage as ItemImageData } from "@/lib/types";
import { claimsForItem } from "@/lib/world";
import { Logo } from "../brand/logo";
import { PhotoAttach } from "../items/item-dialogs";
import { ThankYouDialog } from "../items/resolve-flow";
import { UserAvatar } from "../ui/avatar";
import { StatusBadge } from "../ui/badges";
import { Button } from "../ui/button";
import { Confetti, PointsCounter, SuccessCheck } from "../ui/feedback";
import { TextArea } from "../ui/form";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";
import { EmptyState, Skeleton } from "../ui/states";

const STEP_LABELS = ["Show proof", "Tell the owner", "Submit"];

function ClaimShell({ slug, children, title = "Claim bounty", step }: { slug: string; children: React.ReactNode; title?: string; step?: number }) {
  return (
    <div className="min-h-dvh bg-canvas pb-28 lg:pb-12">
      <header className="glass sticky top-0 z-40 border-b border-line/70">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4 sm:px-6">
          <Link href={`/item/${slug}`} aria-label="Back to the listing" className="inline-flex size-10 items-center justify-center rounded-full text-navy-700 hover:bg-navy-100">
            <X className="size-6" />
          </Link>
          <p className="flex-1 text-center text-[1.02rem] font-extrabold text-navy-900 sm:text-left">{title}</p>
          <Link href="/" className="hidden sm:block" aria-label="wewillfind.it home">
            <Logo size={26} />
          </Link>
        </div>
        {step !== undefined && (
          <div className="mx-auto max-w-3xl px-4 pb-3 sm:px-6">
            <ol className="grid grid-cols-3 gap-2" aria-label="Claim progress">
              {STEP_LABELS.map((l, i) => (
                <li key={l} className="flex flex-col gap-1.5" aria-current={i === step ? "step" : undefined}>
                  <span className={cn("h-1.5 rounded-full transition-colors", i <= step ? "bg-coral-600" : "bg-navy-100")} />
                  <span className={cn("text-xs font-bold", i === step ? "text-coral-700" : i < step ? "text-navy-700" : "text-navy-400")}>
                    {i + 1}. {l}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </header>
      <div className="mx-auto max-w-3xl px-4 pt-6 sm:px-6 sm:pt-10">{children}</div>
    </div>
  );
}

/** "Claim bounty" — three short steps, then a live tracker until the owner has paid the reward. */
export function ClaimFlow({ slug }: { slug: string }) {
  const w = useWorld();
  const hydrated = useHydrated();
  const router = useRouter();
  const me = w.currentUser;
  const item = w.itemBySlug.get(slug);
  const bounty = item?.bountyId ? w.bountyById.get(item.bountyId) : undefined;
  const owner = item ? w.userById.get(item.ownerId) : undefined;
  const claim = item && me ? claimsForItem(w, item.id).find((c) => c.claimantId === me.id) : undefined;

  const [step, setStep] = useState(0);
  const [proof, setProof] = useState<ItemImageData[]>([]);
  const [message, setMessage] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    document.getElementById("claim-h")?.focus({ preventScroll: true });
  }, [step]);

  if (!item || !bounty || !owner) {
    if (!hydrated) {
      return (
        <ClaimShell slug={slug}>
          <Skeleton className="h-64 rounded-card" />
        </ClaimShell>
      );
    }
    return (
      <ClaimShell slug={slug}>
        <EmptyState icon={<Coins className="size-9" aria-hidden />} title="This listing has no bounty" body="You can still message the poster if you've found their item." tone="gold" action={<Button href={`/item/${slug}`}>Back to the listing</Button>} />
      </ClaimShell>
    );
  }

  if (!me) {
    return (
      <ClaimShell slug={slug}>
        <EmptyState
          icon={<Lock className="size-9" aria-hidden />}
          title="Log in to claim this bounty"
          body="We ask finders to sign in so owners know who they're dealing with."
          tone="gold"
          action={
            <>
              <Button href={`/login?next=/item/${slug}/claim`}>Log in</Button>
              <Button href={`/signup?next=/item/${slug}/claim`} variant="secondary">
                Sign up
              </Button>
            </>
          }
        />
      </ClaimShell>
    );
  }

  if (item.ownerId === me.id) {
    return (
      <ClaimShell slug={slug}>
        <EmptyState icon={<Coins className="size-9" aria-hidden />} title="This is your listing" body="Claims from finders appear on your post, where you can approve, decline or ask for more proof." tone="gold" action={<Button href={`/item/${slug}`}>Review claims</Button>} />
      </ClaimShell>
    );
  }

  if (claim) return <ClaimStatus slug={slug} claimId={claim.id} />;

  const first = owner.name.split(" ")[0];

  const submit = () => {
    if (!proof.length && message.trim().length < 30) {
      setErr("Add a photo, or describe the item in a few sentences (30+ characters).");
      setStep(0);
      return;
    }
    setSending(true);
    const c = actions.submitClaim({ itemId: item.id, message: message.trim() || "Here's my proof — I'd be happy to describe more.", proof });
    // If it isn't allowed, the store has already said why.
    if (!c) return setSending(false);
    toast("Your claim has been submitted", { body: `${first} has been notified.`, tone: "celebrate" });
    setSending(false);
    router.refresh();
  };

  return (
    <ClaimShell slug={slug} step={step}>
      <div className="flex items-center gap-4 rounded-card bg-white p-3 shadow-soft">
        <ItemImage image={item.images[0]} category={item.category} compact className="size-20 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <StatusBadge type={item.type} variant="soft" />
          <p className="mt-1 truncate text-[1.02rem] font-extrabold text-navy-900">{item.title}</p>
          <p className="flex items-center gap-1 text-sm text-navy-600">
            <MapPin className="size-3.5 text-coral-600" aria-hidden />
            {getLocation(item.locationId).name}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-gold-100 px-3.5 py-2 text-center">
          <p className="text-xl font-extrabold tabular-nums text-navy-900">{formatMoney(bounty.amount)}</p>
          <p className="text-[0.62rem] font-extrabold uppercase tracking-wider text-gold-800">Bounty</p>
        </div>
      </div>

      <section className="mt-8 animate-fade-up" aria-labelledby="claim-h" key={step}>
        {step === 0 && (
          <>
            <h1 id="claim-h" tabIndex={-1} className="text-3xl font-extrabold text-navy-900 outline-none">
              Show proof
            </h1>
            <p className="mt-2 text-navy-600">Upload photos of the item to show you&rsquo;ve found it. Include any unique details.</p>
            <div className="mt-6 rounded-card bg-white p-5 shadow-soft">
              <PhotoAttach photos={proof} onChange={(p) => { setProof(p); setErr(null); }} max={4} />
              {err && <p role="alert" className="mt-3 text-sm font-semibold text-coral-700">{err}</p>}
            </div>
            <ul className="mt-5 space-y-2.5 text-sm leading-relaxed text-navy-600">
              {["Show the item as it is right now — not a stock photo.", "Include a close-up of a unique mark, sticker or scratch.", "Don't unlock the screen or show passwords or personal data."].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <BadgeCheck className="mt-0.5 size-4 shrink-0 text-mint-700" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
          </>
        )}
        {step === 1 && (
          <>
            <h1 id="claim-h" tabIndex={-1} className="text-3xl font-extrabold text-navy-900 outline-none">
              Tell {first} something only the finder would know
            </h1>
            <p className="mt-2 text-navy-600">Where exactly did you find it? What state was it in? Anything not shown in the listing?</p>
            <div className="mt-6">
              <TextArea
                label="Additional message"
                optional
                value={message}
                onChange={(e) => { setMessage(e.target.value); setErr(null); }}
                rows={6}
                placeholder="Hi! I found this near the MRT gantry at Orchard. It matches the description and the sticker…"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {["It was on a bench near…", "It has a sticker / scratch on…", "The lock screen shows…"].map((p) => (
                  <button key={p} type="button" onClick={() => setMessage((m) => (m ? `${m} ${p}` : p))} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-navy-700 hover:border-coral-300 hover:bg-coral-50">
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h1 id="claim-h" tabIndex={-1} className="text-3xl font-extrabold text-navy-900 outline-none">
              Ready to submit?
            </h1>
            <p className="mt-2 text-navy-600">{first} will review your proof. You&rsquo;ll be notified the moment they respond.</p>
            <dl className="mt-6 divide-y divide-line rounded-card bg-white px-5 shadow-soft">
              <div className="flex gap-4 py-4">
                <dt className="w-24 shrink-0 text-sm font-semibold text-navy-500">Proof</dt>
                <dd className="flex-1 text-[0.95rem] font-bold text-navy-900">{proof.length ? `${proof.length} photo${proof.length > 1 ? "s" : ""}` : "No photos"}</dd>
                <button type="button" onClick={() => setStep(0)} className="text-sm font-bold text-coral-700 hover:underline">
                  Edit
                </button>
              </div>
              <div className="flex gap-4 py-4">
                <dt className="w-24 shrink-0 text-sm font-semibold text-navy-500">Message</dt>
                <dd className="line-clamp-3 flex-1 text-[0.95rem] font-semibold text-navy-800">{message || "—"}</dd>
                <button type="button" onClick={() => setStep(1)} className="text-sm font-bold text-coral-700 hover:underline">
                  Edit
                </button>
              </div>
            </dl>
            <p className="mt-5 flex items-start gap-3 rounded-2xl bg-mint-50 p-4 text-sm leading-relaxed text-mint-900">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-mint-700" aria-hidden />
              Your contact details will be shared with the poster only after they review and approve your claim.
            </p>
          </>
        )}
      </section>

      <div className="glass fixed inset-x-0 bottom-0 z-40 border-t border-line/70 px-4 pb-safe pt-3 lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-3xl gap-3">
          {step > 0 && (
            <Button variant="secondary" size="lg" onClick={() => setStep(step - 1)} aria-label="Back" iconLeft={<ArrowLeft className="size-4" aria-hidden />}>
              <span className="max-sm:sr-only">Back</span>
            </Button>
          )}
          {step < 2 ? (
            <Button size="lg" full={step === 0 ? true : false} className={step > 0 ? "flex-1" : undefined} onClick={() => setStep(step + 1)} iconRight={<ArrowRight className="size-4" aria-hidden />}>
              Continue
            </Button>
          ) : (
            <Button size="lg" className="flex-1" loading={sending} onClick={submit} iconLeft={<Send className="size-4" aria-hidden />}>
              Submit claim
            </Button>
          )}
        </div>
      </div>
    </ClaimShell>
  );
}

/* ── Status / tracker ─────────────────────────────────────── */

type TimelineStep = { key: string; label: string; body: string; state: "done" | "current" | "todo" | "failed" };

function timeline(claim: Claim, ownerFirst: string): TimelineStep[] {
  const s = claim.status;
  const rejected = s === "rejected" || s === "flagged";
  const verified = s === "approved" || s === "received";
  return [
    { key: "sub", label: "Claim submitted", body: "Your proof is with the owner.", state: "done" },
    {
      key: "ver",
      label: rejected ? "Not approved" : "Owner verifies",
      body: rejected ? "The owner couldn't verify this claim." : s === "more_info" ? `${ownerFirst} asked for more info.` : verified ? "Verified — it's a match!" : `${ownerFirst} is reviewing your proof…`,
      state: rejected ? "failed" : verified ? "done" : "current",
    },
    { key: "ret", label: "Arrange the return", body: "Agree a public meeting place and time.", state: s === "received" ? "done" : s === "approved" ? "current" : "todo" },
    { key: "paid", label: "Bounty paid", body: `${ownerFirst} pays you directly once they have it back — ${PAYMENT_OPTIONS}.`, state: s === "received" ? "done" : "todo" },
  ];
}

export function ClaimStatus({ slug, claimId }: { slug: string; claimId: string }) {
  const w = useWorld();
  const router = useRouter();
  const claim = w.claimById.get(claimId)!;
  const item = w.itemById.get(claim.itemId)!;
  const owner = w.userById.get(item.ownerId)!;
  const bounty = w.bountyById.get(claim.bountyId)!;
  const me = w.currentUser!;
  const first = owner.name.split(" ")[0];
  const [waiting, setWaiting] = useState(false);
  const [thanks, setThanks] = useState(false);
  const steps = timeline(claim, first);
  const s = claim.status;

  const handedOver = () => {
    if (!claim.conversationId) return;
    setWaiting(true);
    actions.markReturned(claim.conversationId);
  };

  return (
    <ClaimShell slug={slug} title="Your claim">
      <div className="flex items-center gap-4 rounded-card bg-white p-3 shadow-soft">
        <ItemImage image={item.images[0]} category={item.category} compact className="size-16 shrink-0 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <Link href={`/item/${item.slug}`} className="block truncate text-[1.02rem] font-extrabold text-navy-900 hover:underline">
            {item.title}
          </Link>
          <p className="text-sm text-navy-600">
            Posted by {owner.name} · claimed <RelativeTime iso={claim.createdAt} />
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-gold-100 px-3.5 py-2 text-center">
          <p className="text-lg font-extrabold tabular-nums text-navy-900">{formatMoney(bounty.amount)}</p>
          <p className="text-[0.62rem] font-extrabold uppercase tracking-wider text-gold-800">{s === "received" ? "Paid" : "Bounty"}</p>
        </div>
      </div>

      {/* State banner */}
      <div
        aria-live="polite"
        className={cn(
          "relative mt-6 overflow-hidden rounded-card p-6 text-center sm:p-8",
          s === "received" ? "bg-gradient-to-br from-mint-50 to-white ring-1 ring-mint-200" : s === "approved" ? "bg-gradient-to-br from-mint-50 to-white ring-1 ring-mint-200" : s === "rejected" || s === "flagged" ? "bg-coral-50 ring-1 ring-coral-100" : "bg-white shadow-soft",
        )}
      >
        {(s === "approved" || s === "received") && <Confetti count={34} />}
        {s === "submitted" && (
          <>
            <div className="flex justify-center">
              <span className="relative flex size-20 items-center justify-center rounded-full bg-gold-100 text-gold-700">
                <span className="absolute inset-0 animate-ping-soft rounded-full bg-gold-200" aria-hidden />
                <Clock className="relative size-9" aria-hidden />
              </span>
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-navy-900 sm:text-3xl">Your claim has been submitted</h1>
            <p className="mx-auto mt-2 max-w-md text-navy-600">{first} will review your proof and respond. We&rsquo;ll notify you as soon as they do.</p>
          </>
        )}
        {s === "more_info" && (
          <>
            <div className="flex justify-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-found-100 text-found-700">
                <CircleHelp className="size-9" aria-hidden />
              </span>
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-navy-900">{first} needs a little more info</h1>
            {claim.ownerNote && <p className="mx-auto mt-3 max-w-md rounded-2xl bg-navy-50 p-4 text-left text-navy-700">“{claim.ownerNote}”</p>}
            <Button className="mt-5" href={claim.conversationId ? `/messages/${claim.conversationId}` : "/messages"} iconLeft={<MessageCircle className="size-4" aria-hidden />}>
              Reply in chat
            </Button>
          </>
        )}
        {s === "approved" && (
          <>
            <div className="flex justify-center">
              <SuccessCheck tone="mint" size={92} icon={<HandCoins className="size-9" aria-hidden />} />
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-navy-900 sm:text-3xl">Claim approved 🎉</h1>
            <p className="mx-auto mt-2 max-w-md text-navy-600">
              {first} verified your proof. Now arrange a hand-over in a public place — {first} pays you the {formatMoney(bounty.amount)} bounty directly once they have it back. Agree in chat how: {PAYMENT_OPTIONS}.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" href={claim.conversationId ? `/messages/${claim.conversationId}?arrange=1` : "/messages"} iconLeft={<MapPin className="size-4" aria-hidden />}>
                Arrange Return
              </Button>
              <Button size="lg" variant="success" loading={waiting} onClick={handedOver} iconLeft={<PartyPopper className="size-4" aria-hidden />}>
                {waiting ? "Waiting for owner…" : "I've handed it over"}
              </Button>
            </div>
          </>
        )}
        {s === "received" && (
          <>
            <div className="flex justify-center">
              <SuccessCheck tone="gold" size={96} icon={<Coins className="size-10" aria-hidden />} />
            </div>
            <p className="eyebrow mt-5 text-mint-700">Bounty paid</p>
            <h1 className="mt-1 text-3xl font-extrabold text-navy-900">Item returned! 💰</h1>
            <p className="mx-auto mt-2 max-w-md text-navy-600">
              {first} confirmed they have their item and paid you <strong className="text-navy-900">{formatMoney(bounty.amount)}</strong> directly
              {bounty.paidVia && ` (${paymentLabel(bounty.paidVia)})`}. The community is a little kinder today.
            </p>
            <p className="mx-auto mt-2 max-w-md text-sm text-navy-500">Not received it? Message {first} — rewards go straight from owner to finder, so wewillfind.it can&rsquo;t send or refund them.</p>
            <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint-100 px-4 py-2 text-lg font-extrabold text-mint-800">
              <PointsCounter from={0} to={50} prefix="+" suffix=" points" />
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button size="lg" href={`/user/${me.handle}#badges`} variant="primary">
                See my badges
              </Button>
              <Button size="lg" variant="secondary" onClick={() => setThanks(true)} iconLeft={<span aria-hidden>❤️</span>}>
                Wish {first} well
              </Button>
            </div>
          </>
        )}
        {(s === "rejected" || s === "flagged") && (
          <>
            <div className="flex justify-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-coral-100 text-coral-700">
                <X className="size-9" aria-hidden />
              </span>
            </div>
            <h1 className="mt-5 text-2xl font-extrabold text-navy-900">This claim wasn&rsquo;t approved</h1>
            <p className="mx-auto mt-2 max-w-md text-navy-700">{claim.ownerNote ?? `${first} couldn't verify the details. If you do have the item, message them with more proof.`}</p>
            <div className="mt-5 flex justify-center gap-3">
              <Button href={claim.conversationId ? `/messages/${claim.conversationId}` : "/messages"} variant="secondary" iconLeft={<MessageCircle className="size-4" aria-hidden />}>
                Message {first}
              </Button>
              <Button href="/bounties" variant="ghost">
                Browse bounties
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Timeline */}
      <ol className="mt-6 space-y-0 rounded-card bg-white p-5 shadow-soft sm:p-6" aria-label="Claim timeline">
        {steps.map((t, i) => (
          <li key={t.key} className="relative flex gap-4 pb-6 last:pb-0">
            {i < steps.length - 1 && <span aria-hidden className={cn("absolute left-[1.05rem] top-9 h-[calc(100%-1.5rem)] w-0.5", t.state === "done" ? "bg-mint-300" : "bg-navy-100")} />}
            <span
              className={cn(
                "relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-extrabold",
                t.state === "done" && "bg-mint-600 text-white",
                t.state === "current" && "bg-gold-300 text-navy-900 ring-4 ring-gold-100",
                t.state === "todo" && "bg-navy-100 text-navy-400",
                t.state === "failed" && "bg-coral-600 text-white",
              )}
            >
              {t.state === "done" ? <BadgeCheck className="size-5" aria-hidden /> : t.state === "failed" ? <X className="size-5" aria-hidden /> : i + 1}
            </span>
            <div className="pt-1">
              <p className={cn("text-[0.98rem] font-extrabold", t.state === "todo" ? "text-navy-400" : "text-navy-900")}>{t.label}</p>
              <p className="text-sm text-navy-600">{t.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex items-center gap-3 rounded-card bg-white p-4 shadow-soft">
        <UserAvatar user={owner} size="md" tick />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy-500">Owner</p>
          <p className="truncate font-extrabold text-navy-900">{owner.name}</p>
        </div>
        {claim.conversationId && (
          <Button href={`/messages/${claim.conversationId}`} size="sm" variant="secondary" iconLeft={<MessageCircle className="size-4" aria-hidden />}>
            Open chat
          </Button>
        )}
      </div>

      <p className="mt-6 flex items-start gap-3 rounded-2xl bg-mint-50 p-4 text-sm leading-relaxed text-mint-900">
        <ShieldCheck className="mt-0.5 size-5 shrink-0 text-mint-700" aria-hidden />
        Meet in a public place, like an MRT customer service counter. Never hand over an item before the owner has verified it — and never pay anyone to get your reward.
      </p>

      <ThankYouDialog open={thanks} onClose={() => setThanks(false)} user={owner} itemId={item.id} />
      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => router.push(`/item/${item.slug}`)}>
          Back to the listing
        </Button>
      </div>
    </ClaimShell>
  );
}
