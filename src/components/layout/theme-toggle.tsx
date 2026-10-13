"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { applyTheme, readTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";

/** The sun / moon button in the header. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore<Theme>(subscribeTheme, readTheme, () => "light");
  const dark = theme === "dark";

  // In development React resets <html>'s attributes after hydrating, dropping what the head script set.
  useLayoutEffect(() => applyTheme(readTheme()), []);

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      aria-pressed={dark}
      className={cn("relative inline-flex size-11 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-navy-100", className)}
    >
      {dark ? <Sun className="size-[1.35rem]" aria-hidden /> : <Moon className="size-[1.35rem]" aria-hidden />}
    </button>
  );
}
