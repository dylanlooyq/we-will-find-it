"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

let lockCount = 0;
function lockScroll() {
  if (lockCount++ === 0) document.documentElement.style.overflow = "hidden";
}
function unlockScroll() {
  if (--lockCount <= 0) {
    lockCount = 0;
    document.documentElement.style.overflow = "";
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  /** auto = bottom sheet on phones, centred modal from md up */
  variant?: "auto" | "modal" | "sheet";
  size?: "sm" | "md" | "lg";
  /** Skip the built-in header (for celebratory / custom layouts) */
  bare?: boolean;
  hideClose?: boolean;
  children: ReactNode;
  className?: string;
};

const widths = { sm: "md:w-[24rem]", md: "md:w-[30rem]", lg: "md:w-[42rem]" };

/**
 * Modal + BottomSheet in one accessible primitive, built on native <dialog>
 * (focus trapping, Escape-to-close and focus restore come from the browser).
 */
export function Overlay({ open, onClose, title, description, variant = "auto", size = "md", bare, hideClose, children, className }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    lockScroll();
    return unlockScroll;
  }, [open]);

  const sheet = variant !== "modal";
  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      aria-describedby={description ? descId : undefined}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "overlay fixed inset-0 m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 open:flex",
        variant === "modal" ? "items-center justify-center p-4" : variant === "sheet" ? "items-end justify-center" : "items-end justify-center md:items-center",
      )}
    >
      {open && (
        <div
          className={cn(
            "relative flex max-h-[92dvh] w-full flex-col overflow-hidden bg-white shadow-pop",
            sheet ? "rounded-t-sheet animate-sheet-up" : "rounded-sheet animate-scale-in",
            variant === "auto" && "md:rounded-sheet md:animate-scale-in md:my-4",
            variant === "sheet" && "md:max-w-lg",
            variant !== "sheet" && widths[size],
            variant === "modal" && "max-w-full",
            className,
          )}
        >
          {sheet && !bare && <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-navy-200 md:hidden" />}
          {!bare && (title || !hideClose) && (
            <div className="flex items-start justify-between gap-4 px-6 pb-2 pt-4 md:pt-6">
              <div>
                {title && (
                  <h2 id={titleId} className="text-xl font-extrabold text-navy-900">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id={descId} className="mt-1 text-sm text-navy-600">
                    {description}
                  </p>
                )}
              </div>
              {!hideClose && (
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="-mr-2 inline-flex size-10 shrink-0 items-center justify-center rounded-full text-navy-600 hover:bg-navy-100"
                >
                  <X className="size-5" />
                </button>
              )}
            </div>
          )}
          <div className={cn("overflow-y-auto", !bare && "px-6 pb-6 pb-safe")}>{children}</div>
        </div>
      )}
    </dialog>
  );
}
