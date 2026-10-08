import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "soft" | "found" | "gold" | "dark" | "ghost" | "success" | "outline-light";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

const base =
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold select-none " +
  "transition-[transform,background-color,box-shadow,color,border-color] duration-200 ease-out " +
  "active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-coral-600 text-white shadow-coral hover:bg-coral-700 hover:shadow-lift",
  secondary: "bg-white text-navy-900 border border-line shadow-soft hover:border-navy-200 hover:bg-navy-50",
  soft: "bg-coral-50 text-coral-700 hover:bg-coral-100",
  found: "bg-found-600 text-white shadow-found hover:bg-found-700",
  gold: "bg-gold-300 text-navy-900 hover:bg-gold-200 shadow-soft",
  dark: "bg-navy-900 text-white hover:bg-navy-800",
  ghost: "text-navy-700 hover:bg-navy-100",
  success: "bg-mint-700 text-white hover:bg-mint-800",
  "outline-light": "border border-white/40 text-white hover:bg-white/10",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 rounded-xl px-3.5 text-sm",
  md: "h-11 rounded-xl px-5 text-[0.95rem]",
  lg: "h-[3.25rem] rounded-2xl px-6 text-base",
  xl: "h-14 rounded-2xl px-8 text-[1.05rem]",
};

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  full?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  children?: ReactNode;
  className?: string;
};

type AsButton = Common & Omit<ComponentProps<"button">, keyof Common> & { href?: undefined };
type AsLink = Common & Omit<ComponentProps<typeof Link>, keyof Common> & { href: string };

export function buttonClasses({
  variant = "primary",
  size = "md",
  full,
  className,
}: Pick<Common, "variant" | "size" | "full" | "className">) {
  return cn(base, variants[variant], sizes[size], full ? "w-full min-w-0" : "shrink-0", className);
}

/** One button for the whole product — renders a Next <Link> when given an href. */
export function Button(props: AsButton | AsLink) {
  const { variant, size, loading, full, iconLeft, iconRight, children, className, ...rest } = props;
  const classes = buttonClasses({ variant, size, full, className });
  const content = (
    <>
      {loading ? <Loader2 className="size-[1.1em] animate-spin" aria-hidden /> : iconLeft}
      {children}
      {!loading && iconRight}
    </>
  );

  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link {...(rest as Omit<AsLink, keyof Common>)} className={classes}>
        {content}
      </Link>
    );
  }
  const btn = rest as Omit<AsButton, keyof Common>;
  return (
    <button type="button" {...btn} disabled={btn.disabled || loading} className={classes} aria-busy={loading || undefined}>
      {content}
    </button>
  );
}

type IconButtonProps = Omit<ComponentProps<"button">, "children"> & {
  label: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  tone?: "plain" | "glass" | "dark";
};

/** Square icon-only button; `label` is required for screen readers. */
export function IconButton({ label, children, size = "md", tone = "plain", className, ...rest }: IconButtonProps) {
  const dim = { sm: "size-9", md: "size-11", lg: "size-12" }[size];
  const tones = {
    plain: "text-navy-700 hover:bg-navy-100",
    glass: "bg-white/85 text-navy-900 shadow-soft backdrop-blur hover:bg-white",
    dark: "bg-navy-900 text-white hover:bg-navy-800",
  }[tone];
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...rest}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition active:scale-95 disabled:opacity-50",
        dim,
        tones,
        className,
      )}
    >
      {children}
    </button>
  );
}
