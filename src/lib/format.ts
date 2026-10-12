import { DAY, HOUR, MIN } from "./clock";
import type { Item } from "./types";

const TZ = "Asia/Singapore";

const dateFmt = new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const dateShortFmt = new Intl.DateTimeFormat("en-SG", { day: "numeric", month: "short", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat("en-SG", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: TZ });
const monthYearFmt = new Intl.DateTimeFormat("en-SG", { month: "short", year: "numeric", timeZone: TZ });
const weekdayFmt = new Intl.DateTimeFormat("en-SG", { weekday: "short", timeZone: TZ });

/** "5 Oct 2026" */
export const formatDate = (iso: string) => dateFmt.format(new Date(iso)).replace(/\bSept\b/, "Sep");
/** "5 Oct" */
export const formatDateShort = (iso: string) => dateShortFmt.format(new Date(iso));
/** "8:00 pm" → "8:00 PM" */
export const formatTime = (iso: string) => timeFmt.format(new Date(iso)).toUpperCase();
/** "Mar 2024" */
export const formatMonthYear = (iso: string) => monthYearFmt.format(new Date(iso));
export const formatWeekday = (iso: string) => weekdayFmt.format(new Date(iso));

/** "S$1,200" */
export function formatMoney(amount: number): string {
  return `S$${amount.toLocaleString("en-SG")}`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString("en-SG");
}

/** Relative time against an explicit `now` (see `useNow`). */
export function relTime(iso: string, now: number): string {
  const diff = now - Date.parse(iso);
  if (diff < 45_000) return "just now";
  if (diff < HOUR) {
    const m = Math.max(1, Math.round(diff / MIN));
    return `${m} min ago`;
  }
  if (diff < DAY) {
    const h = Math.round(diff / HOUR);
    return h === 1 ? "1 hour ago" : `${h} hours ago`;
  }
  if (diff < 2 * DAY) return "Yesterday";
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} days ago`;
  if (diff < 30 * DAY) {
    const w = Math.floor(diff / (7 * DAY));
    return w === 1 ? "1 week ago" : `${w} weeks ago`;
  }
  return formatDate(iso);
}

/** Compact form for tight UI: "2h", "3d" */
export function relTimeShort(iso: string, now: number): string {
  const diff = now - Date.parse(iso);
  if (diff < HOUR) return `${Math.max(1, Math.round(diff / MIN))}m`;
  if (diff < DAY) return `${Math.round(diff / HOUR)}h`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d`;
  return formatDateShort(iso);
}

/** "Ends in 3 days" / "Ends today" / "Expired" */
export function timeUntil(iso: string, now: number): string {
  const diff = Date.parse(iso) - now;
  if (diff <= 0) return "Expired";
  if (diff < HOUR) return `Ends in ${Math.max(1, Math.round(diff / MIN))} min`;
  if (diff < DAY) return `Ends in ${Math.round(diff / HOUR)}h`;
  const d = Math.ceil(diff / DAY);
  return d === 1 ? "Ends tomorrow" : `Ends in ${d} days`;
}

/** "5 Oct 2026 · Around 8 PM" */
export function occurredLabel(item: Pick<Item, "occurredAt" | "timeLabel">): string {
  return `${formatDate(item.occurredAt)} · ${item.timeLabel}`;
}

/** "Lost" / "Found" with a verb suitable for sentences */
export function typeVerb(type: Item["type"]): string {
  return type === "lost" ? "Lost" : "Found";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function initials(name: string): string {
  const parts = name.replace(/\([^)]*\)/g, "").replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}
