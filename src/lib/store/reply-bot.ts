import type { Conversation, Message } from "../types";

/**
 * Scripted, context-aware replies so the chat feels alive in the demo.
 * Pure + deterministic — a real backend simply never calls this.
 */
export function pickReply(conv: Conversation, last: Message, itemIsLost: boolean): string | null {
  if (last.kind === "system") return null;
  const text = (last.text ?? "").toLowerCase();

  if (last.kind === "quick") {
    if (text.includes("at the location")) return "On my way — see you in about 5 minutes! 🙌";
    if (text.includes("meet here")) return "Sure, that works for me. I'll head there now.";
    if (text.includes("found your item")) return itemIsLost ? "Oh wow, thank you so much!! Can we meet today?" : "Thanks for confirming! I'd love to collect it — when are you free?";
    return null;
  }
  if (last.kind === "photo") return "Got the photo, thank you! That matches what I remember. 🙏";
  if (last.kind === "location") return "That works for me. I'll be there.";

  if (/(meet|where|time|when|today|tonight|tomorrow|pm|am)\b/.test(text))
    return "That works for me! I'll bring my ID if you'd like to verify. See you there.";
  if (/(thank|thanks|thx)/.test(text)) return "Really glad it worked out — thank you for being so kind! 😊";
  if (/(photo|picture|pic|sticker|colour|color|describe)/.test(text))
    return "Sure — let me send you more details in a sec. It has a small sticker and a clear case.";
  if (conv.messages.length > 12) return "Sounds good! 👍";

  const generic = [
    "Thanks for getting back to me!",
    "Okay, noted. Could you tell me a bit more so I can be sure?",
    "That sounds right. When would be a good time?",
    "Great — I'm free this evening if that suits you.",
  ];
  return generic[conv.messages.length % generic.length];
}
