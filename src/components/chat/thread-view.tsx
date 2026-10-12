"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BadgeCheck, CircleHelp, Flag, Info, MessageCircle, MoreVertical, PartyPopper, SendHorizontal, ShieldAlert, ShieldCheck, ThumbsDown, ThumbsUp, UserRound, UserX, ImagePlus, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation } from "@/lib/data/taxonomy";
import { formatDate, formatMoney } from "@/lib/format";
import { fileToDataUrl } from "@/lib/images-client";
import { useHydrated, useNow, useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { Message } from "@/lib/types";
import { bountyOnOffer } from "@/lib/world";
import { DAY } from "@/lib/clock";
import { PayRewardDialog } from "../bounties/pay-reward";
import { UserLevel } from "../community/level";
import { ReportDialog } from "../items/item-dialogs";
import { ItemRow } from "../items/item-card";
import { ThankYouDialog } from "../items/resolve-flow";
import { UserAvatar } from "../ui/avatar";
import { StatusBadge } from "../ui/badges";
import { Button, IconButton } from "../ui/button";
import { DropdownMenu, MenuButton, MenuLink } from "../ui/dropdown";
import { ItemImage } from "../ui/item-image";
import { Overlay } from "../ui/overlay";
import { EmptyState, Skeleton } from "../ui/states";
import { ArrangeReturn } from "./arrange-return";
import { ChatBubble } from "./chat-bubble";

function dayLabel(iso: string, now: number): string {
  const startOf = (ms: number) => new Date(new Date(ms).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" })).getTime();
  const diff = Math.round((startOf(now) - startOf(Date.parse(iso))) / DAY);
  if (diff <= 0) return "Today";
  if (diff === 1) return "Yesterday";
  return formatDate(iso);
}

const QUICK = [
  { id: "at", emoji: "📍", label: "I'm at the location" },
  { id: "meet", emoji: "🤝", label: "Can we meet here?" },
  { id: "found", emoji: "✅", label: "I've found your item" },
  { id: "returned", emoji: "🎉", label: "Item returned" },
] as const;

function groupByDay(messages: Message[], now: number) {
  const out: { day: string; items: Message[] }[] = [];
  for (const m of messages) {
    const day = dayLabel(m.at, now);
    const last = out[out.length - 1];
    if (last && last.day === day) last.items.push(m);
    else out.push({ day, items: [m] });
  }
  return out;
}

export function ThreadView({ id }: { id: string }) {
  const w = useWorld();
  const now = useNow();
  const hydrated = useHydrated();
  const me = w.currentUser;
  const conv = w.conversationById.get(id);
  const item = conv ? w.itemById.get(conv.itemId) : undefined;
  const otherId = conv && me ? conv.participantIds.find((p) => p !== me.id) : undefined;
  const other = otherId ? w.userById.get(otherId) : undefined;

  const [text, setText] = useState("");
  // `?arrange=1` (from the claim tracker) opens the sheet; once the user toggles it, their choice wins.
  const arrangeParam = useSearchParams().get("arrange");
  const [arrangeState, setArrange] = useState<boolean | null>(null);
  const arrange = arrangeState ?? !!arrangeParam;
  const [details, setDetails] = useState(false);
  const [report, setReport] = useState(false);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [pay, setPay] = useState(false);
  const [thanks, setThanks] = useState(false);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const msgCount = conv?.messages.length ?? 0;

  useEffect(() => {
    if (!hydrated || !conv) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    actions.markConversationRead(id);
  }, [msgCount, hydrated, id, conv]);

  const grouped = conv ? groupByDay(conv.messages, now) : [];

  if (!conv || !item || !me || !other) {
    if (!hydrated || !w.ready) {
      return (
        <div className="space-y-4 p-6">
          <Skeleton className="h-16" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="ml-auto h-10 w-1/2" />
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<MessageCircle className="size-9" aria-hidden />}
          title={me ? "We can't find that conversation" : "Log in to see this conversation"}
          body="It may belong to another account. Head back to your inbox to see yours."
          tone="coral"
          action={me ? <Button href="/messages">Back to messages</Button> : <Button href={`/login?next=/messages/${id}`}>Log in</Button>}
        />
      </div>
    );
  }

  const iAmOwner = item.ownerId === me.id;
  const claim = conv.claimId ? w.claimById.get(conv.claimId) : undefined;
  const bounty = item.bountyId ? w.bountyById.get(item.bountyId) : undefined;
  const resolved = item.status === "resolved";
  const blocked = w.blocked.has(other.id);
  const iAmFinder = (item.type === "lost" && !iAmOwner) || (item.type === "found" && iAmOwner);
  const closed = resolved || blocked;
  const owesBounty = iAmOwner && bountyOnOffer(bounty);
  const loc = getLocation(item.locationId);
  const pet = item.category === "pets";

  const send = () => {
    const t = text.trim();
    if (!t || closed) return;
    actions.sendMessage(id, { kind: "text", text: t });
    setText("");
    requestAnimationFrame(() => areaRef.current?.focus());
  };

  const quick = (qid: (typeof QUICK)[number]["id"]) => {
    if (closed) return;
    if (qid === "meet") return setArrange(true);
    // An owner getting a bounty item back pays the finder directly, so ask how.
    if (qid === "returned") return owesBounty ? setPay(true) : setConfirmReturn(true);
    if (qid === "at") {
      actions.sendMessage(id, { kind: "quick", text: "I'm at the location" });
      actions.sendMessage(id, { kind: "location", locationId: item.locationId });
      return;
    }
    actions.sendMessage(id, { kind: "quick", text: "I've found your item" });
  };

  const attach = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      actions.sendMessage(id, { kind: "photo", photo: { file: "upload", label: "Photo shared in chat", src: await fileToDataUrl(f) } });
    } catch {
      toast("That photo couldn't be sent", { tone: "error" });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      {/* Header: item thumbnail · item name · status */}
      <header className="flex items-center gap-3 border-b border-line bg-white px-3 py-3 sm:px-5">
        <Link href="/messages" aria-label="Back to messages" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-navy-700 hover:bg-navy-100 lg:hidden">
          <ArrowLeft className="size-5" />
        </Link>
        <Link href={`/item/${item.slug}`} className="relative shrink-0">
          <ItemImage image={item.images[0]} category={item.category} compact className="size-12 rounded-xl" />
          <span className="absolute -bottom-1 -right-1 rounded-full bg-white p-0.5">
            <UserAvatar user={other} size="xs" />
          </span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[0.98rem] font-extrabold text-navy-900">
            <span className="truncate">{pet && item.pet?.name ? `${item.pet.name} · ${item.pet.breed}` : item.title}</span>
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <StatusBadge type={item.type} pet={pet} resolved={resolved} variant="soft" className="shrink-0 !px-1.5 !py-0.5 !text-[0.6rem]" />
            <p className="min-w-0 flex-1 truncate text-xs font-semibold text-navy-600">
              with{" "}
              <Link href={`/user/${other.handle}`} className="hover:underline">
                {other.name}
              </Link>
            </p>
          </div>
        </div>
        <IconButton label="Item details" onClick={() => setDetails(true)}>
          <Info className="size-5" />
        </IconButton>
        <DropdownMenu label="Conversation options" buttonClassName="inline-flex size-11 items-center justify-center rounded-full text-navy-700 hover:bg-navy-100" button={<MoreVertical className="size-5" aria-hidden />} width="w-60">
          <MenuLink href={`/item/${item.slug}`} icon={<Info className="size-[1.15rem]" />}>
            View listing
          </MenuLink>
          <MenuLink href={`/user/${other.handle}`} icon={<UserRound className="size-[1.15rem]" />}>
            View profile
          </MenuLink>
          <MenuButton onClick={() => setReport(true)} icon={<Flag className="size-[1.15rem]" />}>
            Report user
          </MenuButton>
          <MenuButton danger onClick={() => actions.blockUser(other.id)} icon={<UserX className="size-[1.15rem]" />}>
            Block user
          </MenuButton>
        </DropdownMenu>
      </header>

      {/* Claim banner */}
      {claim && bounty && (
        <div className="border-b border-line bg-gold-50 px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5">
            <p className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
              <span className="rounded-lg bg-gold-300 px-2 py-0.5 text-xs">{formatMoney(bounty.amount)} bounty</span>
              {claim.status === "submitted" && (iAmOwner ? "Verify this claim" : "Waiting for the owner to verify")}
              {claim.status === "more_info" && (iAmOwner ? "Waiting for more info" : "More info requested")}
              {claim.status === "approved" && "Claim approved — arrange the return"}
              {claim.status === "received" && "Bounty paid 🎉"}
              {claim.status === "rejected" && "Claim declined"}
              {claim.status === "flagged" && "Claim flagged by moderators"}
            </p>
            <div className="ml-auto flex flex-wrap gap-2">
              {iAmOwner && (claim.status === "submitted" || claim.status === "more_info") && (
                <>
                  <Button size="sm" variant="success" iconLeft={<ThumbsUp className="size-4" aria-hidden />} onClick={() => actions.respondClaim(claim.id, "approve")}>
                    Approve
                  </Button>
                  <Button size="sm" variant="secondary" iconLeft={<CircleHelp className="size-4" aria-hidden />} onClick={() => actions.respondClaim(claim.id, "more_info", "Could you describe a detail that isn't in the listing?")}>
                    Ask more
                  </Button>
                  <Button size="sm" variant="ghost" iconLeft={<ThumbsDown className="size-4" aria-hidden />} onClick={() => actions.respondClaim(claim.id, "reject", "I couldn't verify the details.")}>
                    Reject
                  </Button>
                </>
              )}
              {iAmOwner && claim.status === "approved" && !resolved && (
                <Button size="sm" variant="success" iconLeft={<BadgeCheck className="size-4" aria-hidden />} onClick={() => setPay(true)}>
                  Mark as Received
                </Button>
              )}
              {!iAmOwner && (
                <Button href={`/item/${item.slug}/claim`} size="sm" variant="secondary">
                  Track claim
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Safety reminder */}
      <p className="flex items-center gap-2 border-b border-line bg-mint-50 px-4 py-2 text-xs font-semibold text-mint-800 sm:px-5">
        <ShieldCheck className="size-4 shrink-0" aria-hidden />
        Never share sensitive personal information. Meet in a public place.
      </p>

      {/* Messages */}
      <div tabIndex={0} className="min-h-0 flex-1 overflow-y-auto px-3 py-4 focus-visible:outline-offset-[-3px] sm:px-6" role="log" aria-live="polite" aria-label={`Conversation with ${other.name}`}>
        {conv.messages.length === 0 && (
          <div className="mx-auto mt-10 max-w-xs text-center">
            <UserAvatar user={other} size="xl" className="mx-auto" />
            <p className="mt-3 font-extrabold text-navy-900">Say hi to {other.name.split(" ")[0]}</p>
            <p className="mt-1 text-sm text-navy-600">{iAmFinder ? "Tell them what you found and where." : "Describe your item so they can confirm it's theirs."}</p>
          </div>
        )}
        {grouped.map((g) => (
          <div key={g.day}>
            <p className="my-4 text-center text-xs font-bold uppercase tracking-wider text-navy-400">{g.day}</p>
            <ul>
              {g.items.map((m, i) => {
                const prev = g.items[i - 1];
                const next = g.items[i + 1];
                const sameAsPrev = prev && prev.senderId === m.senderId && prev.kind !== "system";
                const sameAsNext = next && next.senderId === m.senderId && next.kind !== "system" && Date.parse(next.at) - Date.parse(m.at) < 5 * 60_000;
                return <ChatBubble key={m.id} message={m} mine={m.senderId === me.id} category={item.category} grouped={!!sameAsPrev} showTime={!sameAsNext} />;
              })}
            </ul>
          </div>
        ))}
        {resolved && (
          <div className="mx-auto mt-6 max-w-sm rounded-2xl bg-mint-50 p-4 text-center ring-1 ring-mint-200">
            <PartyPopper className="mx-auto size-6 text-mint-700" aria-hidden />
            <p className="mt-1 font-extrabold text-mint-900">Item reunited</p>
            <p className="text-sm text-mint-800">Thanks to the community, this item has found its way home.</p>
            {iAmOwner && item.type === "lost" && (
              <Button size="sm" variant="success" className="mt-3" onClick={() => setThanks(true)} iconLeft={<span aria-hidden>❤️</span>}>
                Say thanks to {other.name.split(" ")[0]}
              </Button>
            )}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-line bg-white px-3 pb-safe pt-3 sm:px-5">
        {!closed && (
          <div className="-mx-1 mb-3 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none" role="group" aria-label="Quick actions">
            {QUICK.filter((q) => (q.id === "found" ? iAmFinder : true)).map((q) => (
              <button key={q.id} type="button" onClick={() => quick(q.id)} className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-3.5 text-sm font-semibold text-navy-800 transition-colors hover:border-coral-300 hover:bg-coral-50">
                <span aria-hidden>{q.emoji}</span>
                {q.label}
              </button>
            ))}
          </div>
        )}
        {closed ? (
          <p className="pb-3 text-center text-sm font-semibold text-navy-500">{blocked ? "You blocked this user." : "This conversation is closed — the item has been reunited."}</p>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-end gap-2 pb-3"
          >
            <input ref={fileRef} type="file" accept="image/*" className="sr-only" aria-label="Attach a photo" onChange={(e) => attach(e.target.files)} />
            <IconButton label="Attach a photo" onClick={() => fileRef.current?.click()} disabled={busy} className="mb-0.5">
              <ImagePlus className="size-5" />
            </IconButton>
            <IconButton label="Suggest a meeting point" onClick={() => setArrange(true)} className="mb-0.5 max-sm:hidden">
              <MapPin className="size-5" />
            </IconButton>
            <label htmlFor="chat-input" className="sr-only">
              Message
            </label>
            <textarea
              id="chat-input"
              ref={areaRef}
              value={text}
              rows={1}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 128)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Type a message…"
              className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-line bg-navy-50 px-4 py-2.5 text-[0.95rem] leading-snug text-navy-900 placeholder:text-navy-400 focus:border-navy-900 focus:bg-white"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!text.trim()}
              className={cn("mb-0.5 inline-flex size-11 shrink-0 items-center justify-center rounded-full text-white transition-all active:scale-90", text.trim() ? "bg-coral-600 shadow-coral hover:bg-coral-700" : "bg-navy-200")}
            >
              <SendHorizontal className="size-5" aria-hidden />
            </button>
          </form>
        )}
      </div>

      {/* Dialogs */}
      <ArrangeReturn open={arrange} onClose={() => setArrange(false)} convId={id} item={item} />
      <ReportDialog open={report} onClose={() => setReport(false)} targetType="user" targetId={other.id} subject={other.name} />
      {iAmOwner && item.type === "lost" && <ThankYouDialog open={thanks} onClose={() => setThanks(false)} user={other} itemId={item.id} />}
      {owesBounty && bounty && <PayRewardDialog open={pay} onClose={() => setPay(false)} bounty={bounty} finder={other} onConfirm={(via) => actions.markReturned(id, via)} />}

      <Overlay open={confirmReturn} onClose={() => setConfirmReturn(false)} title="Item returned?" description="Only confirm once the item is back with its owner — this closes the listing and awards points.">
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" size="lg" className="flex-1" onClick={() => setConfirmReturn(false)}>
            Not yet
          </Button>
          <Button
            variant="success"
            size="lg"
            className="flex-1"
            onClick={() => {
              setConfirmReturn(false);
              actions.markReturned(id);
            }}
          >
            Yes, it&rsquo;s returned
          </Button>
        </div>
      </Overlay>

      <Overlay open={details} onClose={() => setDetails(false)} title="Item details" variant="sheet">
        <div className="mt-4 space-y-4">
          <ItemRow item={item} bountyAmount={bountyOnOffer(bounty) ? bounty.amount : undefined} />
          <dl className="divide-y divide-line rounded-2xl bg-navy-50 px-4 text-sm">
            <div className="flex gap-3 py-3">
              <dt className="w-24 shrink-0 font-semibold text-navy-500">Where</dt>
              <dd className="font-bold text-navy-900">{loc.name}</dd>
            </div>
            <div className="flex gap-3 py-3">
              <dt className="w-24 shrink-0 font-semibold text-navy-500">With</dt>
              <dd className="font-bold text-navy-900">
                {other.name} <UserLevel points={other.points.allTime} tone="plain" className="ml-1" />
              </dd>
            </div>
            {item.details
              .filter((d) => !d.hidden || iAmOwner)
              .map((d) => (
                <div key={d.label} className="flex gap-3 py-3">
                  <dt className="w-24 shrink-0 font-semibold text-navy-500">{d.label}</dt>
                  <dd className="font-bold text-navy-900">{d.value}</dd>
                </div>
              ))}
          </dl>
          <p className="flex items-start gap-2 rounded-xl bg-gold-50 p-3 text-xs leading-relaxed text-gold-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
            Verify privately: ask the other person to describe details that aren&rsquo;t in the public listing.
          </p>
          <Button href={`/item/${item.slug}`} variant="secondary" full>
            Open full listing
          </Button>
        </div>
      </Overlay>
    </div>
  );
}
