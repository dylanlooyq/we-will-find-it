"use client";

import { useMemo, useState } from "react";
import { PartyPopper, Send } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatMoney } from "@/lib/format";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import type { Item, KudosTone, PaymentMethod, User } from "@/lib/types";
import { bountyForItem, bountyOnOffer, claimsForItem } from "@/lib/world";
import { PaymentMethodPicker } from "../bounties/pay-reward";
import { UserAvatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Confetti, PointsCounter, SuccessCheck } from "../ui/feedback";
import { TextArea } from "../ui/form";
import { Overlay } from "../ui/overlay";

/* ── Kudos ────────────────────────────────────────────────── */

const TONES: { tone: KudosTone; emoji: string; label: string; presets: string[] }[] = [
  { tone: "heart", emoji: "❤️", label: "Heartfelt", presets: ["Super helpful and responsive!", "You made my day. Thank you!"] },
  { tone: "thumb", emoji: "👍", label: "Smooth handover", presets: ["Made the return really easy.", "Quick, honest and very polite."] },
  { tone: "star", emoji: "🌟", label: "Kind & trusted", presets: ["Really kind person.", "Would trust again, anytime."] },
];

export function ThankYouDialog({ open, onClose, user, itemId }: { open: boolean; onClose: () => void; user: User; itemId?: string }) {
  const [tone, setTone] = useState<KudosTone>("heart");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const active = TONES.find((t) => t.tone === tone)!;
  const first = user.name.split(" ")[0];

  const close = () => {
    onClose();
    setSent(false);
    setMessage("");
  };

  return (
    <Overlay open={open} onClose={close} title={sent ? undefined : `Thank ${first}`} description={sent ? undefined : "Kudos appear on their profile and earn them +20 points."} hideClose={sent} bare={sent}>
      {sent ? (
        <div className="relative px-8 pb-8 pt-10 text-center">
          <Confetti count={26} />
          <div className="flex justify-center">
            <SuccessCheck tone="coral" icon={<span className="text-4xl">❤️</span>} />
          </div>
          <h3 className="mt-5 text-2xl font-extrabold text-navy-900">Thank you sent</h3>
          <p className="mt-1 text-navy-600">{first} will see it on their profile — and just earned +20 points.</p>
          <Button size="lg" full className="mt-6" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-5">
          <div role="radiogroup" aria-label="Kind of thanks" className="grid grid-cols-3 gap-2.5">
            {TONES.map((t) => (
              <button
                key={t.tone}
                type="button"
                role="radio"
                aria-checked={tone === t.tone}
                onClick={() => setTone(t.tone)}
                className={cn("flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition-all", tone === t.tone ? "border-coral-600 bg-coral-50" : "border-line hover:border-navy-300")}
              >
                <span className="text-3xl" aria-hidden>
                  {t.emoji}
                </span>
                <span className="text-xs font-bold text-navy-800">{t.label}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {active.presets.map((p) => (
              <button key={p} type="button" onClick={() => setMessage(p)} className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold text-navy-700 hover:border-coral-300 hover:bg-coral-50">
                {p}
              </button>
            ))}
          </div>
          <TextArea label="Your message" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder={`Say something kind to ${first}…`} />
          <Button
            size="lg"
            full
            iconLeft={<Send className="size-4" aria-hidden />}
            disabled={!message.trim()}
            onClick={() => {
              actions.sendKudos({ toUserId: user.id, tone, message: message.trim(), itemId });
              setSent(true);
            }}
          >
            Send thanks
          </Button>
        </div>
      )}
    </Overlay>
  );
}

/* ── Mark as resolved / returned ──────────────────────────── */

export function ResolveDialog({ open, onClose, item }: { open: boolean; onClose: () => void; item: Item }) {
  const w = useWorld();
  const me = w.currentUser;
  const lost = item.type === "lost";

  const candidates = useMemo(() => {
    if (!me) return [] as { user: User; why: string }[];
    const out = new Map<string, string>();
    for (const c of claimsForItem(w, item.id)) if (c.status !== "rejected" && c.status !== "flagged") out.set(c.claimantId, c.status === "approved" ? "Claim approved" : "Submitted a claim");
    for (const conv of w.conversations.filter((c) => c.itemId === item.id)) {
      for (const id of conv.participantIds) if (id !== me.id && !out.has(id)) out.set(id, "Messaged you");
    }
    return [...out.entries()].flatMap(([id, why]) => {
      const user = w.userById.get(id);
      return user ? [{ user, why }] : [];
    });
  }, [w, item.id, me]);

  // Until the user chooses, default to the first person who helped.
  const [pickState, setPick] = useState<string | null>(null);
  const pick = pickState ?? candidates[0]?.user.id ?? "";
  const [done, setDone] = useState(false);
  const [before, setBefore] = useState(0);
  const [thanks, setThanks] = useState(false);

  const close = () => {
    onClose();
    setDone(false);
    setThanks(false);
    setPick(null);
    setVia(null);
  };

  const helper = pick ? w.userById.get(pick) : undefined;
  const after = me?.points.allTime ?? 0;
  const gained = after - before;

  // A bounty goes straight from the owner to whoever brought the item back.
  const bounty = bountyForItem(w, item);
  const owed = lost && !!helper && bountyOnOffer(bounty) ? bounty : undefined;
  const [via, setVia] = useState<PaymentMethod | null>(null);

  const confirm = () => {
    setBefore(me?.points.allTime ?? 0);
    actions.resolveItem(item.id, pick || undefined, (owed && via) || undefined);
    setDone(true);
  };

  return (
    <>
      <Overlay
        open={open}
        onClose={close}
        title={done ? undefined : lost ? "Mark as resolved" : "Mark as returned"}
        description={done ? undefined : lost ? "Glad you got it back! Tell us who helped so they get the credit they deserve." : "Did you hand it back to its owner? Tell us who — it earns you points and a badge step."}
        bare={done}
        hideClose={done}
      >
        {done ? (
          <div className="relative px-7 pb-8 pt-10 text-center">
            <Confetti count={40} />
            <div className="flex justify-center">
              <SuccessCheck tone="mint" icon={<PartyPopper className="size-9" aria-hidden />} />
            </div>
            <p className="eyebrow mt-5 text-mint-700">{item.category === "pets" ? "Pet reunited" : "Item reunited"}</p>
            <h3 className="mt-1 text-2xl font-extrabold text-navy-900">{lost ? "🎉 Item reunited!" : "🎉 Thank you!"}</h3>
            <p className="mx-auto mt-2 max-w-xs text-navy-600">
              {lost ? "Thanks to the community, this item has found its way home." : "You've helped reunite someone with their item. The community is better for it."}
            </p>
            {gained > 0 && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint-100 px-4 py-2 text-lg font-extrabold text-mint-800">
                <PointsCounter from={0} to={gained} prefix="+" suffix=" points" />
              </p>
            )}
            {lost && helper && (
              <p className="mt-4 text-sm text-navy-600">
                <strong className="text-navy-900">{helper.name}</strong> just earned points for helping you.
              </p>
            )}
            <div className="mt-7 flex flex-col gap-2.5">
              {lost && helper && (
                <Button size="lg" full onClick={() => setThanks(true)} iconLeft={<span aria-hidden>❤️</span>}>
                  Say thanks to {helper.name.split(" ")[0]}
                </Button>
              )}
              <Button size="lg" full variant={lost && helper ? "ghost" : "primary"} onClick={close}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <fieldset>
              <legend className="mb-3 text-sm font-extrabold text-navy-900">{lost ? "Who helped you get it back?" : "Who did you return it to?"}</legend>
              <div className="space-y-2">
                {candidates.map(({ user, why }) => (
                  <label key={user.id} className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-3 transition-colors", pick === user.id ? "border-coral-600 bg-coral-50" : "border-line hover:bg-navy-50")}>
                    <input type="radio" name="helper" checked={pick === user.id} onChange={() => setPick(user.id)} className="size-4 accent-coral-600" />
                    <UserAvatar user={user} size="md" />
                    <span className="flex-1">
                      <span className="block text-[0.95rem] font-bold text-navy-900">{user.name}</span>
                      <span className="block text-xs text-navy-500">{why}</span>
                    </span>
                  </label>
                ))}
                <label className={cn("flex cursor-pointer items-center gap-3 rounded-2xl border p-3.5 transition-colors", pick === "" ? "border-coral-600 bg-coral-50" : "border-line hover:bg-navy-50")}>
                  <input type="radio" name="helper" checked={pick === ""} onChange={() => setPick("")} className="size-4 accent-coral-600" />
                  <span className="text-[0.95rem] font-bold text-navy-900">{lost ? "Someone else / found it myself" : "Someone outside wewillfind.it"}</span>
                </label>
              </div>
            </fieldset>
            {owed && helper && (
              <div className="mt-5 rounded-2xl bg-gold-50 p-4 ring-1 ring-gold-200">
                <p className="text-sm font-extrabold text-navy-900">
                  How did you pay {helper.name.split(" ")[0]} the {formatMoney(owed.amount)} bounty?
                </p>
                <p className="mb-3 mt-1 text-xs leading-relaxed text-navy-600">You pay them directly — wewillfind.it never holds or moves your money.</p>
                <PaymentMethodPicker value={via} onChange={setVia} label="How did you pay the bounty?" />
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" size="lg" className="flex-1" onClick={close}>
                Not yet
              </Button>
              <Button variant="success" size="lg" className="flex-[1.3]" disabled={!!owed && !via} onClick={confirm}>
                {lost ? "Item reunited" : "Mark as returned"}
              </Button>
            </div>
          </div>
        )}
      </Overlay>
      {helper && <ThankYouDialog open={thanks} onClose={() => setThanks(false)} user={helper} itemId={item.id} />}
    </>
  );
}
