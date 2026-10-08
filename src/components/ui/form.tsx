"use client";

import Link from "next/link";
import { useId, useRef, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

/* ── Field wrapper ────────────────────────────────────────── */

type FieldProps = {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
  children: (a: { id: string; describedBy?: string; invalid: boolean }) => ReactNode;
};

export function Field({ label, hint, error, optional, className, children }: FieldProps) {
  const id = useId();
  const descId = hint || error ? `${id}-desc` : undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm font-bold text-navy-900">
        <span>{label}</span>
        {optional && <span className="text-xs font-medium text-navy-500">Optional</span>}
      </label>
      {children({ id, describedBy: descId, invalid: !!error })}
      {(error || hint) && (
        <p id={descId} className={cn("text-xs leading-relaxed", error ? "font-semibold text-coral-700" : "text-navy-500")} role={error ? "alert" : undefined}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

const control =
  "w-full rounded-xl border bg-white px-4 text-[0.95rem] text-navy-900 placeholder:text-navy-400 transition-colors " +
  "border-line hover:border-navy-300 focus:border-navy-900 disabled:bg-navy-50 disabled:text-navy-400";

export function TextField({
  label,
  hint,
  error,
  optional,
  className,
  inputClassName,
  prefix,
  ...props
}: { label: string; hint?: ReactNode; error?: string; optional?: boolean; className?: string; inputClassName?: string; prefix?: ReactNode } & Omit<ComponentProps<"input">, "className" | "prefix">) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          {prefix && <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-navy-500">{prefix}</span>}
          <input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            {...props}
            className={cn(control, "h-12", !!prefix && "pl-11", invalid && "border-coral-600", inputClassName)}
          />
        </div>
      )}
    </Field>
  );
}

export function TextArea({
  label,
  hint,
  error,
  optional,
  className,
  ...props
}: { label: string; hint?: ReactNode; error?: string; optional?: boolean; className?: string } & Omit<ComponentProps<"textarea">, "className">) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          rows={4}
          {...props}
          className={cn(control, "min-h-28 resize-y py-3 leading-relaxed", invalid && "border-coral-600")}
        />
      )}
    </Field>
  );
}

export function SelectField({
  label,
  hint,
  error,
  optional,
  className,
  children,
  ...props
}: { label: string; hint?: ReactNode; error?: string; optional?: boolean; className?: string } & Omit<ComponentProps<"select">, "className">) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional} className={className}>
      {({ id, describedBy, invalid }) => (
        <div className="relative">
          <select
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            {...props}
            className={cn(control, "h-12 appearance-none pr-10", invalid && "border-coral-600")}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-navy-500" aria-hidden />
        </div>
      )}
    </Field>
  );
}

/* ── Switch ───────────────────────────────────────────────── */

export function Switch({
  checked,
  onChange,
  label,
  className,
  tone = "coral",
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  className?: string;
  tone?: "coral" | "gold" | "found";
}) {
  const on = { coral: "bg-coral-600", gold: "bg-gold-500", found: "bg-found-600" }[tone];
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn("relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors", checked ? on : "bg-navy-200", className)}
    >
      <span className={cn("absolute left-0.5 size-6 rounded-full bg-white shadow transition-transform duration-200", checked && "translate-x-5")} />
    </button>
  );
}

/* ── Segmented control (single choice) ────────────────────── */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
}: {
  options: { value: T; label: ReactNode; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = (i + (e.key === "ArrowRight" ? 1 : -1) + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className={cn("inline-flex rounded-2xl bg-navy-100 p-1", className)}>
      {options.map((o, i) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(o.value)}
            className={cn(
              "inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl font-semibold transition-all",
              size === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-[0.95rem]",
              active ? "bg-white text-navy-900 shadow-soft" : "text-navy-600 hover:text-navy-900",
            )}
          >
            {o.icon}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Chips ────────────────────────────────────────────────── */

type ChipProps = {
  active?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  tone?: "dark" | "coral" | "found" | "gold";
  className?: string;
  count?: number;
};

function chipClass({ active, tone = "dark", className }: Pick<ChipProps, "active" | "tone" | "className">) {
  const on = {
    dark: "bg-navy-900 text-white border-navy-900",
    coral: "bg-coral-600 text-white border-coral-600",
    found: "bg-found-600 text-white border-found-600",
    gold: "bg-gold-300 text-navy-900 border-gold-300",
  }[tone];
  return cn(
    "inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition-all",
    active ? on : "border-line bg-white text-navy-700 hover:border-navy-300 hover:bg-navy-50",
    className,
  );
}

export function Chip({ active, children, icon, tone, className, count, ...rest }: ChipProps & Omit<ComponentProps<"button">, keyof ChipProps>) {
  return (
    <button type="button" aria-pressed={!!active} {...rest} className={chipClass({ active, tone, className })}>
      {icon}
      {children}
      {count !== undefined && <span className={cn("rounded-full px-1.5 text-xs font-bold", active ? "bg-white text-navy-900" : "bg-navy-100 text-navy-700")}>{count}</span>}
    </button>
  );
}

export function ChipLink({ active, children, icon, tone, className, href, count }: ChipProps & { href: string }) {
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={chipClass({ active, tone, className })}>
      {icon}
      {children}
      {count !== undefined && <span className={cn("rounded-full px-1.5 text-xs font-bold", active ? "bg-white text-navy-900" : "bg-navy-100 text-navy-700")}>{count}</span>}
    </Link>
  );
}

/* ── Tabs (underline style) ───────────────────────────────── */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
  className,
  idPrefix = "tab",
}: {
  tabs: { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  idPrefix?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent, i: number) => {
    let next = i;
    if (e.key === "ArrowRight") next = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") next = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    else return;
    e.preventDefault();
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cn("flex gap-1 overflow-x-auto scrollbar-none border-b border-line", className)}>
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            id={`${idPrefix}-${t.value}`}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`${idPrefix}-panel-${t.value}`}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(t.value)}
            className={cn(
              "relative inline-flex h-12 flex-1 items-center justify-center gap-1.5 whitespace-nowrap px-4 text-[0.95rem] font-semibold transition-colors",
              active ? "text-coral-700" : "text-navy-500 hover:text-navy-900",
            )}
          >
            {t.label}
            {t.count !== undefined && <span className={cn("rounded-full px-1.5 text-xs", active ? "bg-coral-100 text-coral-800" : "bg-navy-100 text-navy-600")}>{t.count}</span>}
            <span className={cn("absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-coral-600 transition-transform", active ? "scale-x-100" : "scale-x-0")} />
          </button>
        );
      })}
    </div>
  );
}

/* ── Search input ─────────────────────────────────────────── */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search items, locations, keywords…",
  className,
  onSubmit,
  autoFocus,
  label = "Search",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  label?: string;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn("relative", className)}
    >
      <label htmlFor="search-input" className="sr-only">
        {label}
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-navy-500" aria-hidden />
      <input
        id="search-input"
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-14 w-full rounded-2xl border border-line bg-white pl-12 pr-12 text-base text-navy-900 shadow-soft transition-colors placeholder:text-navy-500 hover:border-navy-300 focus:border-navy-900 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-navy-500 hover:bg-navy-100"
        >
          <X className="size-4" />
        </button>
      )}
    </form>
  );
}
