"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Accessible menu button: aria-haspopup/expanded, click-outside + Escape to
 * close (focus returns to the trigger), arrow-key / Home / End navigation.
 */
export function DropdownMenu({
  label,
  button,
  buttonClassName,
  children,
  width = "w-72",
  align = "right",
}: {
  label: string;
  button: ReactNode;
  buttonClassName?: string;
  children: ReactNode;
  width?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      trigger.current?.focus();
      return;
    }
    const items = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    if (!items.length) return;
    const i = items.indexOf(document.activeElement as HTMLElement);
    let next = -1;
    if (e.key === "ArrowDown") next = (i + 1) % items.length;
    else if (e.key === "ArrowUp") next = (i - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next >= 0) {
      e.preventDefault();
      items[next].focus();
    }
  };

  return (
    <div ref={root} className="relative" onKeyDown={onKey}>
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName}
      >
        {button}
      </button>
      {open && (
        <div
          ref={menu}
          role="menu"
          aria-label={label}
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('[role="menuitem"]')) setOpen(false);
          }}
          className={cn(
            "absolute top-full z-50 mt-2 max-h-[80dvh] overflow-y-auto rounded-2xl bg-white p-2 shadow-pop ring-1 ring-line animate-scale-in",
            width,
            align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

const itemCls =
  "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[0.92rem] font-semibold text-navy-800 transition-colors hover:bg-navy-50 focus-visible:bg-navy-50";

export function MenuLink({ href, icon, children, badge }: { href: string; icon?: ReactNode; children: ReactNode; badge?: ReactNode }) {
  return (
    <Link href={href} role="menuitem" className={itemCls}>
      {icon && <span className="text-navy-500">{icon}</span>}
      <span className="flex-1">{children}</span>
      {badge}
    </Link>
  );
}

export function MenuButton({ onClick, icon, children, danger }: { onClick: () => void; icon?: ReactNode; children: ReactNode; danger?: boolean }) {
  return (
    <button type="button" role="menuitem" onClick={onClick} className={cn(itemCls, danger && "text-coral-700 hover:bg-coral-50")}>
      {icon && <span className={danger ? "text-coral-600" : "text-navy-500"}>{icon}</span>}
      <span className="flex-1">{children}</span>
    </button>
  );
}

export function MenuDivider({ label }: { label?: string }) {
  return label ? (
    <p role="presentation" className="eyebrow mt-1 px-3 pb-1 pt-3 text-navy-400">
      {label}
    </p>
  ) : (
    <hr role="separator" className="my-1.5 border-line" />
  );
}
