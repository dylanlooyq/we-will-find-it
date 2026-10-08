"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";

/** Heart + live count. Sits above a card's stretched link (z-10). */
export function LikeButton({ itemId, className, tone = "default" }: { itemId: string; className?: string; tone?: "default" | "glass" }) {
  const w = useWorld();
  const item = w.itemById.get(itemId);
  const liked = w.likes.has(itemId);
  const count = item?.likes ?? 0;

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? `Unlike (${count} likes)` : `Like (${count} likes)`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!actions.toggleLike(itemId)) toast("Log in to like posts", { tone: "info", href: "/login" });
      }}
      className={cn(
        "relative z-10 -m-1.5 inline-flex items-center gap-1.5 rounded-full p-1.5 text-sm font-semibold transition active:scale-90",
        tone === "glass" ? "bg-white/85 px-3 text-navy-900 shadow-soft backdrop-blur" : liked ? "text-coral-600" : "text-navy-500 hover:text-coral-600",
        className,
      )}
    >
      <Heart className={cn("size-[1.05rem] transition-transform", liked && "scale-110 fill-coral-500 text-coral-500")} aria-hidden />
      <span className="tabular-nums">{count}</span>
    </button>
  );
}
