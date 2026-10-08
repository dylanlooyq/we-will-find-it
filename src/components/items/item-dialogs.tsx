"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Check, Copy, ImagePlus, Mail, Send, ShieldAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { getLocation } from "@/lib/data/taxonomy";
import { BASE_PATH, SITE_URL } from "@/lib/site";
import { fileToDataUrl, MAX_PHOTOS } from "@/lib/images-client";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { Item, ItemImage as ItemImageData, ReportTarget } from "@/lib/types";
import { Button } from "../ui/button";
import { TextArea } from "../ui/form";
import { ItemImage } from "../ui/item-image";
import { Overlay } from "../ui/overlay";

/* ── Share ────────────────────────────────────────────────── */

export function ShareSheet({ open, onClose, title, path }: { open: boolean; onClose: () => void; title: string; path: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window === "undefined" ? `${SITE_URL}${path}` : `${window.location.origin}${BASE_PATH}${path}`;
  const text = `${title} — help find it on wewillfind.it`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied", { tone: "info" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy — long-press the link instead", { tone: "error" });
    }
  };

  const native = typeof navigator !== "undefined" && "share" in navigator;
  const targets = [
    { label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`, cls: "bg-[#e7f9ee] text-[#128c4a]" },
    { label: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, cls: "bg-[#e5f4fc] text-[#1a7fb0]" },
    { label: "Email", href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\n${url}`)}`, cls: "bg-navy-100 text-navy-700", icon: Mail },
  ];

  return (
    <Overlay open={open} onClose={onClose} title="Share this post" description="Every share gets it in front of someone who might know.">
      <div className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-navy-50 p-2 pl-4">
        <p className="min-w-0 flex-1 truncate text-sm font-semibold text-navy-700">{url}</p>
        <Button size="sm" variant={copied ? "success" : "dark"} onClick={copy} iconLeft={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {targets.map((t) => (
          <a key={t.label} href={t.href} target="_blank" rel="noopener noreferrer" className={cn("flex h-14 items-center justify-center gap-2 rounded-2xl text-sm font-bold transition hover:brightness-95", t.cls)}>
            {t.icon && <t.icon className="size-4" aria-hidden />}
            {t.label}
          </a>
        ))}
      </div>
      {native && (
        <Button variant="secondary" full className="mt-3" onClick={() => navigator.share({ title, text, url }).catch(() => {})}>
          More options…
        </Button>
      )}
    </Overlay>
  );
}

/* ── Report ───────────────────────────────────────────────── */

const REASONS = ["Scam / asks for money", "Spam or duplicate", "Inappropriate content", "Wrong information", "Harassment or abuse", "Something else"];

export function ReportDialog({
  open,
  onClose,
  targetType,
  targetId,
  subject,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTarget;
  targetId: string;
  subject: string;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [detail, setDetail] = useState("");
  return (
    <Overlay open={open} onClose={onClose} title={`Report ${subject}`} description="Reports are private. Our moderators review every one.">
      <fieldset className="mt-4">
        <legend className="sr-only">Reason</legend>
        <div className="space-y-2">
          {REASONS.map((r) => (
            <label key={r} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-[0.95rem] font-semibold transition-colors", reason === r ? "border-coral-600 bg-coral-50 text-coral-800" : "border-line hover:bg-navy-50")}>
              <input type="radio" name="reason" value={r} checked={reason === r} onChange={() => setReason(r)} className="size-4 accent-coral-600" />
              {r}
            </label>
          ))}
        </div>
      </fieldset>
      <TextArea label="Anything else?" optional value={detail} onChange={(e) => setDetail(e.target.value)} className="mt-4" rows={3} placeholder="Tell us what happened…" />
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={!reason}
          onClick={() => {
            actions.submitReport({ targetType, targetId, reason: reason!, detail: detail.trim() || undefined });
            setReason(null);
            setDetail("");
            onClose();
          }}
        >
          Send report
        </Button>
      </div>
    </Overlay>
  );
}

/* ── Photo picker (small) ─────────────────────────────────── */

export function PhotoAttach({ photos, onChange, max = 3 }: { photos: ItemImageData[]; onChange: (p: ItemImageData[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const next = [...photos];
      for (const f of Array.from(files).slice(0, Math.min(max, MAX_PHOTOS) - photos.length)) {
        next.push({ file: "upload", label: "Photo you attached", src: await fileToDataUrl(f) });
      }
      onChange(next);
    } catch {
      toast("That photo couldn't be read", { tone: "error" });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };
  return (
    <div>
      <input ref={input} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => add(e.target.files)} aria-label="Add photos" />
      <div className="flex flex-wrap gap-3">
        {photos.map((p, i) => (
          <div key={i} className="relative">
            <ItemImage image={p} category="other" compact className="size-20 rounded-2xl" />
            <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => onChange(photos.filter((_, j) => j !== i))} className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-navy-900 text-white shadow">
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {photos.length < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={busy}
            className="flex size-20 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-navy-200 text-navy-500 transition-colors hover:border-coral-400 hover:bg-coral-50 hover:text-coral-700 disabled:opacity-50"
          >
            <ImagePlus className="size-5" aria-hidden />
            <span className="text-[0.68rem] font-bold">{busy ? "…" : "Add photo"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Contact / "I found this" / "This is mine" ────────────── */

export type ContactMode = "found" | "mine" | "contact";

export function ContactSheet({ open, onClose, item, mode }: { open: boolean; onClose: () => void; item: Item; mode: ContactMode }) {
  const w = useWorld();
  const router = useRouter();
  const owner = w.userById.get(item.ownerId);
  const first = owner?.name.split(" ")[0] ?? "there";
  const short = item.title.split("—")[0].trim();
  const [text, setText] = useState("");
  const [photos, setPhotos] = useState<ItemImageData[]>([]);
  const [sending, setSending] = useState(false);

  const copy = {
    found: {
      title: `Tell ${first} you found it`,
      desc: "Share a few details so they can confirm it's theirs. Keep any identifying detail out of public comments.",
      placeholder: `Hi ${first}, I think I found your ${short} at ${getLocation(item.locationId).name}. It has…`,
      cta: "Send message",
    },
    mine: {
      title: "Claim this item",
      desc: "Describe something only the owner would know — a mark, the contents, a lock-screen photo. The finder will verify before sharing details.",
      placeholder: `Hi ${first}, I think this is mine. It has…`,
      cta: "Send claim",
    },
    contact: { title: `Message ${first}`, desc: "Be kind and clear — and never share sensitive personal information.", placeholder: `Hi ${first}, …`, cta: "Send message" },
  }[mode];

  const send = () => {
    if (!w.currentUser) {
      router.push(`/login?next=/item/${item.slug}`);
      return;
    }
    const body = text.trim() || copy.placeholder.replace("…", "").trim();
    setSending(true);
    const id = actions.startConversation(item.id);
    if (!id) {
      setSending(false);
      return;
    }
    actions.sendMessage(id, { kind: "text", text: body });
    for (const p of photos) actions.sendMessage(id, { kind: "photo", photo: p });
    toast("Message sent", { body: `${first} will be notified.`, tone: "success" });
    onClose();
    setText("");
    setPhotos([]);
    setSending(false);
    router.push(`/messages/${id}`);
  };

  return (
    <Overlay open={open} onClose={onClose} title={copy.title} description={copy.desc}>
      <div className="mt-4 space-y-4">
        <TextArea label="Your message" value={text} onChange={(e) => setText(e.target.value)} placeholder={copy.placeholder} rows={4} />
        <div>
          <p className="mb-2 text-sm font-bold text-navy-900">
            Photos <span className="font-medium text-navy-500">(optional)</span>
          </p>
          <PhotoAttach photos={photos} onChange={setPhotos} />
        </div>
        <p className="flex items-start gap-2 rounded-xl bg-mint-50 p-3 text-xs leading-relaxed text-mint-800">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Never share sensitive personal information. Meet in a public place.
        </p>
        <Button size="lg" full onClick={send} loading={sending} iconLeft={<Send className="size-4" aria-hidden />} variant={mode === "mine" ? "found" : "primary"}>
          {copy.cta}
        </Button>
      </div>
    </Overlay>
  );
}

