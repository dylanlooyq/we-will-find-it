/**
 * Light or dark. The choice is kept in this browser and applied as `<html data-theme="dark">`, which
 * is all the styles need (see "Dark mode" in app/globals.css). Light unless someone asks for dark.
 *
 * A script in `<head>` (app/layout) applies a saved choice before first paint, so a dark page never
 * flashes light while it loads.
 */
export type Theme = "light" | "dark";

export const THEME_KEY = "wwfi:theme";

export const THEME_SCRIPT = `(function(){try{if(localStorage.getItem("${THEME_KEY}")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;

const listeners = new Set<() => void>();

export function subscribeTheme(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function readTheme(): Theme {
  try {
    return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function applyTheme(theme: Theme) {
  if (theme === "dark") document.documentElement.setAttribute("data-theme", "dark");
  else document.documentElement.removeAttribute("data-theme");
}

export function setTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* it still applies for this visit */
  }
  applyTheme(theme);
  for (const fn of listeners) fn();
}
