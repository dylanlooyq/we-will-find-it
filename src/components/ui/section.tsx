import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Container({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "header" }) {
  return <Tag className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</Tag>;
}

export function SectionHeader({
  eyebrow,
  title,
  body,
  href,
  hrefLabel = "View all",
  action,
  className,
  tone = "default",
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  href?: string;
  hrefLabel?: string;
  action?: ReactNode;
  className?: string;
  tone?: "default" | "light";
}) {
  return (
    <div className={cn("flex items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className={cn("eyebrow mb-2", tone === "light" ? "text-gold-300" : "text-coral-700")}>{eyebrow}</p>}
        <h2 className={cn("text-[1.65rem] font-extrabold leading-tight sm:text-3xl", tone === "light" ? "text-white" : "text-navy-900")}>{title}</h2>
        {body && <p className={cn("mt-2 max-w-xl text-[0.98rem] leading-relaxed", tone === "light" ? "text-white/75" : "text-navy-600")}>{body}</p>}
      </div>
      {action}
      {href && (
        <Link
          href={href}
          className={cn(
            "group hidden shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors sm:inline-flex",
            tone === "light" ? "text-white hover:bg-white/10" : "text-coral-700 hover:bg-coral-50",
          )}
        >
          {hrefLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}

/** Horizontal snap-scroller on phones that becomes a grid from `lg`. */
export function Rail({ children, className, cols = "lg:grid-cols-4" }: { children: ReactNode; className?: string; cols?: string }) {
  return (
    <div
      className={cn(
        "-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-4 px-4 pb-4 pt-1 scrollbar-none sm:-mx-6 sm:px-6 sm:scroll-pl-6",
        "lg:mx-0 lg:grid lg:snap-none lg:overflow-visible lg:px-0 lg:pb-0",
        cols,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function RailItem({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("w-[17.5rem] shrink-0 snap-start sm:w-[19rem] lg:w-auto", className)}>{children}</div>;
}
