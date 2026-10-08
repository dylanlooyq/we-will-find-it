"use client";

import Link from "next/link";
import { useSyncExternalStore, type ReactNode } from "react";
import { PawPrint, Search, HandHeart, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Overlay } from "../ui/overlay";
import { buttonClasses } from "../ui/button";

/* A tiny store so any "Post" button in the app can open the chooser. */
let isOpen = false;
const subs = new Set<() => void>();
const set = (v: boolean) => {
  isOpen = v;
  subs.forEach((s) => s());
};
export const openPostChooser = () => set(true);
export const closePostChooser = () => set(false);
const subscribe = (cb: () => void) => {
  subs.add(cb);
  return () => subs.delete(cb);
};

const options = [
  {
    kind: "lost",
    title: "I lost something",
    body: "Phone, wallet, keys, bag…",
    icon: Search,
    tile: "bg-coral-50 text-coral-700 group-hover:bg-coral-100",
    ring: "hover:border-coral-300",
  },
  {
    kind: "found",
    title: "I found something",
    body: "Help it get back home",
    icon: HandHeart,
    tile: "bg-found-50 text-found-700 group-hover:bg-found-100",
    ring: "hover:border-found-300",
  },
  {
    kind: "lost-pet",
    title: "I lost a pet",
    body: "Dog, cat or other",
    icon: PawPrint,
    tile: "bg-coral-50 text-coral-700 group-hover:bg-coral-100",
    ring: "hover:border-coral-300",
    pet: true,
  },
  {
    kind: "found-pet",
    title: "I found a pet",
    body: "Keep it safe, find its family",
    icon: PawPrint,
    tile: "bg-found-50 text-found-700 group-hover:bg-found-100",
    ring: "hover:border-found-300",
    pet: true,
  },
] as const;

/** The four ways to start a post. Used in the sheet and on /post. */
export function PostOptions({ onPick, large }: { onPick?: () => void; large?: boolean }) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", large && "gap-4")}>
      {options.map((o) => (
        <Link
          key={o.kind}
          href={`/post/${o.kind}`}
          onClick={onPick}
          className={cn(
            "group flex flex-col items-start gap-3 rounded-2xl border border-line bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-lift",
            large && "gap-4 rounded-card p-6",
            o.ring,
          )}
        >
          <span className={cn("flex items-center justify-center rounded-2xl transition-colors", large ? "size-16" : "size-12", o.tile)}>
            <o.icon className={large ? "size-8" : "size-6"} aria-hidden />
          </span>
          <span>
            <span className={cn("block font-extrabold leading-tight text-navy-900", large ? "text-xl" : "text-[0.98rem]")}>{o.title}</span>
            <span className={cn("mt-1 block leading-snug text-navy-600", large ? "text-sm" : "text-xs")}>{o.body}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function PostChooser() {
  const open = useSyncExternalStore(subscribe, () => isOpen, () => false);
  return (
    <Overlay open={open} onClose={closePostChooser} title="What are you posting?" description="It takes under a minute.">
      <div className="mt-4">
        <PostOptions onPick={closePostChooser} />
      </div>
    </Overlay>
  );
}

/** Any button that opens the chooser. */
export function PostButton({
  children,
  className,
  variant = "primary",
  size = "md",
  icon = true,
}: {
  children?: ReactNode;
  className?: string;
  variant?: Parameters<typeof buttonClasses>[0]["variant"];
  size?: Parameters<typeof buttonClasses>[0]["size"];
  icon?: boolean;
}) {
  return (
    <button type="button" onClick={openPostChooser} className={buttonClasses({ variant, size, className })}>
      {icon && <Plus className="size-[1.15em]" strokeWidth={3} aria-hidden />}
      {children ?? "Post"}
    </button>
  );
}
