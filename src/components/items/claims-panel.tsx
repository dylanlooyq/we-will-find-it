"use client";

import Link from "next/link";
import { useState } from "react";
import { BadgeCheck, CircleHelp, Coins, MessageCircle, ShieldAlert, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/cn";
import { paymentLabel } from "@/lib/data/taxonomy";
import { formatMoney } from "@/lib/format";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { Bounty, BountyStatus, Claim, ClaimStatus, Item } from "@/lib/types";
import { claimsForItem } from "@/lib/world";
import { PayRewardDialog } from "../bounties/pay-reward";
import { UserLevel } from "../community/level";
import { UserAvatar } from "../ui/avatar";
import { Pill } from "../ui/badges";
import { Button } from "../ui/button";
import { TextArea } from "../ui/form";
import { ItemImage } from "../ui/item-image";
import { RelativeTime } from "../ui/meta";

const STATUS: Record<ClaimStatus, { label: string; tone: "gold" | "found" | "mint" | "coral" | "neutral" }> = {
  submitted: { label: "Needs your review", tone: "gold" },
  more_info: { label: "Waiting for more info", tone: "found" },
  approved: { label: "Approved", tone: "mint" },
  rejected: { label: "Declined", tone: "neutral" },
  received: { label: "Bounty paid", tone: "mint" },
  flagged: { label: "Flagged by moderators", tone: "coral" },
};

/** The owner pays the finder themselves, so a bounty is only ever on offer or paid — never held. */
const BOUNTY_LABEL: Record<BountyStatus, string> = { open: "offered", claimed: "offered", approved: "approved", paid: "paid", expired: "expired", cancelled: "not paid" };

function ClaimCard({ claim, item, bounty }: { claim: Claim; item: Item; bounty?: Bounty }) {
  const w = useWorld();
  const user = w.userById.get(claim.claimantId);
  const [mode, setMode] = useState<null | "more" | "reject">(null);
  const [note, setNote] = useState("");
  const [pay, setPay] = useState(false);
  const s = STATUS[claim.status];
  if (!user) return null;
  const open = claim.status === "submitted" || claim.status === "more_info";

  return (
    <article className={cn("rounded-2xl border p-4", claim.status === "flagged" ? "border-coral-200 bg-coral-50/60" : "border-line bg-white")}>
      <header className="flex items-start gap-3">
        <UserAvatar user={user} size="md" tick />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.95rem] font-extrabold text-navy-900">
            <Link href={`/user/${user.handle}`} className="hover:underline">
              {user.name}
            </Link>
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            <UserLevel points={user.points.allTime} tone="plain" />
            <span className="text-xs text-navy-500">
              <RelativeTime iso={claim.createdAt} />
            </span>
          </div>
        </div>
        <Pill tone={s.tone}>{s.label}</Pill>
      </header>

      {claim.status === "flagged" ? (
        <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-coral-800">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Our moderators flagged this claim: it asks for payment before returning. Never pay a finder in advance.
        </p>
      ) : (
        <p className="mt-3 rounded-xl bg-navy-50 p-3 text-sm leading-relaxed text-navy-700">“{claim.message}”</p>
      )}

      {claim.proof.length > 0 && (
        <ul className="mt-3 flex gap-2" aria-label="Proof photos">
          {claim.proof.map((p, i) => (
            <li key={i}>
              <ItemImage image={p} category={item.category} compact className="size-16 rounded-xl" />
            </li>
          ))}
        </ul>
      )}
      {claim.ownerNote && claim.status !== "flagged" && <p className="mt-3 text-xs text-navy-600">Your note: {claim.ownerNote}</p>}

      {open && mode === null && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="success"
            iconLeft={<ThumbsUp className="size-4" aria-hidden />}
            onClick={() => {
              actions.respondClaim(claim.id, "approve");
              toast("Claim approved 🎉", { body: "Arrange the return in a public place.", tone: "celebrate" });
            }}
          >
            Approve
          </Button>
          <Button size="sm" variant="secondary" iconLeft={<CircleHelp className="size-4" aria-hidden />} onClick={() => setMode("more")}>
            Ask for more info
          </Button>
          <Button size="sm" variant="ghost" iconLeft={<ThumbsDown className="size-4" aria-hidden />} onClick={() => setMode("reject")}>
            Reject
          </Button>
        </div>
      )}

      {open && mode !== null && (
        <div className="mt-4 space-y-3">
          <TextArea
            label={mode === "more" ? "What would help you verify?" : "Reason (optional)"}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={mode === "more" ? "Can you describe the sticker on the back?" : "I couldn't verify the details."}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={mode === "more" ? "found" : "primary"}
              onClick={() => {
                actions.respondClaim(claim.id, mode === "more" ? "more_info" : "reject", note.trim() || undefined);
                setMode(null);
                setNote("");
              }}
            >
              {mode === "more" ? "Send request" : "Decline claim"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setMode(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {claim.status === "approved" && (
        <div className="mt-4 flex flex-wrap gap-2">
          {claim.conversationId && (
            <Button href={`/messages/${claim.conversationId}`} size="sm" iconLeft={<MessageCircle className="size-4" aria-hidden />}>
              Arrange return
            </Button>
          )}
          <Button
            size="sm"
            variant="success"
            iconLeft={<BadgeCheck className="size-4" aria-hidden />}
            onClick={() => {
              if (bounty) setPay(true);
              else actions.resolveItem(item.id, claim.claimantId);
            }}
          >
            Mark as received{bounty ? ` · pay ${formatMoney(bounty.amount)}` : ""}
          </Button>
        </div>
      )}
      {bounty && <PayRewardDialog open={pay} onClose={() => setPay(false)} bounty={bounty} finder={user} onConfirm={(via) => actions.resolveItem(item.id, claim.claimantId, via)} />}
      {claim.status !== "approved" && claim.conversationId && claim.status !== "flagged" && claim.status !== "received" && (
        <Link href={`/messages/${claim.conversationId}`} className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-found-700 hover:underline">
          <MessageCircle className="size-4" aria-hidden /> Open conversation
        </Link>
      )}
    </article>
  );
}

/** Owner-only: review bounty claims, ask for proof, approve and pay the finder directly. */
export function ClaimsPanel({ item }: { item: Item }) {
  const w = useWorld();
  const bounty = item.bountyId ? w.bountyById.get(item.bountyId) : undefined;
  const claims = claimsForItem(w, item.id);
  if (!bounty && claims.length === 0) return null;
  return (
    <section aria-labelledby="claims-h" className="rounded-card bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 id="claims-h" className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
          <Coins className="size-5 text-gold-600" aria-hidden />
          Claims {claims.length > 0 && <span className="rounded-full bg-gold-100 px-2 py-0.5 text-sm text-gold-800">{claims.length}</span>}
        </h2>
        {bounty && (
          <Pill tone={bounty.status === "paid" ? "mint" : bounty.status === "cancelled" ? "neutral" : "gold"}>
            {formatMoney(bounty.amount)} · {BOUNTY_LABEL[bounty.status]}
            {bounty.paidVia && ` via ${paymentLabel(bounty.paidVia)}`}
          </Pill>
        )}
      </div>
      {claims.length === 0 ? (
        <p className="mt-3 text-sm leading-relaxed text-navy-600">No claims yet. When someone says they found your item, their proof appears here for you to verify before you pay any bounty.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {claims.map((c) => (
            <ClaimCard key={c.id} claim={c} item={item} bounty={bounty} />
          ))}
        </div>
      )}
    </section>
  );
}
