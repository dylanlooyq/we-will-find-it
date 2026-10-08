import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "@/lib/cn";
import { areaById, getLocation } from "@/lib/data/taxonomy";
import { formatTime } from "@/lib/format";
import type { CategoryId, Message } from "@/lib/types";
import { ItemImage } from "../ui/item-image";

/** One message: text, photo, shared location, quick action or system note. */
export function ChatBubble({
  message,
  mine,
  category,
  showTime = true,
  grouped,
}: {
  message: Message;
  mine: boolean;
  category: CategoryId;
  showTime?: boolean;
  /** Visually joins to the previous bubble from the same sender */
  grouped?: boolean;
}) {
  if (message.kind === "system") {
    return (
      <li className="flex justify-center py-1.5">
        <span className="rounded-full bg-navy-100 px-3.5 py-1.5 text-xs font-bold text-navy-600">{message.text}</span>
      </li>
    );
  }

  const align = mine ? "items-end" : "items-start";
  const bubble = mine
    ? "bg-coral-600 text-white rounded-2xl rounded-br-md"
    : "bg-white text-navy-900 rounded-2xl rounded-bl-md shadow-soft ring-1 ring-line/70";

  let body: React.ReactNode;
  if (message.kind === "photo" && message.photo) {
    body = (
      <div className={cn("overflow-hidden", mine ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md shadow-soft ring-1 ring-line/70")}>
        <ItemImage image={message.photo} category={category} className="h-48 w-64 max-w-full sm:h-56 sm:w-72" sizes="288px" />
      </div>
    );
  } else if (message.kind === "location" && message.locationId) {
    const loc = getLocation(message.locationId);
    body = (
      <div className={cn("w-64 max-w-full overflow-hidden", mine ? "rounded-2xl rounded-br-md bg-coral-600 text-white" : "rounded-2xl rounded-bl-md bg-white text-navy-900 shadow-soft ring-1 ring-line/70")}>
        <div className="relative h-24 bg-gradient-to-br from-sky to-[#cfe0f7]">
          <div aria-hidden className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
          <span className="absolute left-1/2 top-1/2 flex size-10 -translate-x-1/2 -translate-y-[60%] items-center justify-center rounded-full bg-coral-600 text-white shadow-lift ring-4 ring-white">
            <MapPin className="size-5" aria-hidden />
          </span>
        </div>
        <div className="px-3.5 py-3">
          <p className={cn("text-[0.68rem] font-bold uppercase tracking-wider", mine ? "text-white/70" : "text-navy-400")}>Suggested meeting point</p>
          <p className="text-[0.95rem] font-extrabold">{loc.name}</p>
          <p className={cn("text-xs", mine ? "text-white/80" : "text-navy-600")}>
            {areaById[loc.area].name}
            {message.text ? ` · ${message.text}` : ""}
          </p>
          <Link
            href={`/map?loc=${loc.id}&dist=1`}
            className={cn("mt-2 inline-flex items-center gap-1 text-xs font-bold hover:underline", mine ? "text-white" : "text-found-700")}
          >
            <Navigation className="size-3" aria-hidden /> View on map
          </Link>
        </div>
      </div>
    );
  } else if (message.kind === "quick") {
    body = (
      <div className={cn("px-4 py-2.5 text-[0.95rem] font-bold", bubble)}>
        <span aria-hidden className="mr-1.5">
          {quickEmoji(message.text)}
        </span>
        {message.text}
      </div>
    );
  } else {
    body = <div className={cn("whitespace-pre-line break-words px-4 py-2.5 text-[0.95rem] leading-relaxed", bubble)}>{message.text}</div>;
  }

  return (
    <li className={cn("flex flex-col", align, grouped ? "mt-0.5" : "mt-3")}>
      <div className={cn("max-w-[84%] sm:max-w-[72%]", mine && "flex flex-col items-end")}>{body}</div>
      {showTime && <time dateTime={message.at} className="mt-1 px-1 text-[0.68rem] font-medium text-navy-400">{formatTime(message.at)}</time>}
    </li>
  );
}

function quickEmoji(text?: string): string {
  const t = (text ?? "").toLowerCase();
  if (t.includes("found")) return "✅";
  if (t.includes("returned")) return "🎉";
  if (t.includes("location")) return "📍";
  if (t.includes("meet")) return "🤝";
  return "💬";
}
