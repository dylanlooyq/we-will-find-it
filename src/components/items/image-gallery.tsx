"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CategoryId, ItemImage as ItemImageData } from "@/lib/types";
import { IconButton } from "../ui/button";
import { ItemImage } from "../ui/item-image";
import { Overlay } from "../ui/overlay";

/** Large gallery with thumbnails, arrows, keyboard control and a lightbox. */
export function ImageGallery({
  images,
  category,
  overlay,
  actions,
  className,
}: {
  images: ItemImageData[];
  category: CategoryId;
  /** Top-left slot (status badge) */
  overlay?: ReactNode;
  /** Top-right slot (save / share) */
  actions?: ReactNode;
  className?: string;
}) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const list = images.length ? images : [{ file: "none", label: "No photo yet" }];
  const n = list.length;
  const go = useCallback((d: number) => setI((x) => (x + d + n) % n), [n]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, go]);

  return (
    <div className={className}>
      <div
        className="group relative overflow-hidden rounded-sheet bg-navy-100 shadow-soft"
        role="group"
        aria-roledescription="carousel"
        aria-label="Item photos"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
      >
        <ItemImage image={list[i]} category={category} priority captionRightSpace sizes="(min-width:1024px) 60vw, 100vw" className="aspect-[4/3] sm:aspect-[16/11]" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open photo full screen"
          className="absolute inset-0 cursor-zoom-in focus-visible:outline-offset-[-6px]"
        />
        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-start justify-between">
          <div className="pointer-events-auto">{overlay}</div>
          <div className="pointer-events-auto flex gap-2">{actions}</div>
        </div>
        {n > 1 && (
          <>
            <IconButton label="Previous photo" tone="glass" onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
              <ChevronLeft className="size-5" />
            </IconButton>
            <IconButton label="Next photo" tone="glass" onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100 max-sm:opacity-100">
              <ChevronRight className="size-5" />
            </IconButton>
          </>
        )}
        <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2">
          <span className="rounded-lg bg-navy-950/65 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm" aria-live="polite">
            {i + 1}/{n}
          </span>
          <span className="flex size-8 items-center justify-center rounded-lg bg-navy-950/65 text-white backdrop-blur-sm">
            <Expand className="size-4" aria-hidden />
          </span>
        </div>
      </div>

      {n > 1 && (
        <ul className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-none" aria-label="Photo thumbnails">
          {list.map((img, idx) => (
            <li key={idx} className="shrink-0">
              <button
                type="button"
                onClick={() => setI(idx)}
                aria-label={`Show photo ${idx + 1}`}
                aria-current={idx === i}
                className={cn("block overflow-hidden rounded-2xl ring-2 ring-offset-2 transition-all", idx === i ? "ring-coral-600" : "ring-transparent opacity-70 hover:opacity-100")}
              >
                <ItemImage image={img} category={category} compact sizes="120px" className="size-20 sm:size-24" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Overlay open={open} onClose={() => setOpen(false)} variant="modal" size="lg" bare className="!bg-navy-950 md:!w-[min(64rem,92vw)]">
        <div className="relative">
          <ItemImage image={list[i]} category={category} sizes="92vw" className="aspect-[4/3] sm:aspect-[16/10]" />
          <IconButton label="Close full screen" tone="glass" onClick={() => setOpen(false)} className="absolute right-3 top-3">
            <span aria-hidden className="text-lg font-bold">
              ×
            </span>
          </IconButton>
          {n > 1 && (
            <>
              <IconButton label="Previous photo" tone="glass" onClick={() => go(-1)} className="absolute left-3 top-1/2 -translate-y-1/2">
                <ChevronLeft className="size-5" />
              </IconButton>
              <IconButton label="Next photo" tone="glass" onClick={() => go(1)} className="absolute right-3 top-1/2 -translate-y-1/2">
                <ChevronRight className="size-5" />
              </IconButton>
            </>
          )}
          <p className="bg-navy-950 px-5 py-3 text-center text-sm text-white/80">
            {list[i].label} · {i + 1}/{n}
          </p>
        </div>
      </Overlay>
    </div>
  );
}
