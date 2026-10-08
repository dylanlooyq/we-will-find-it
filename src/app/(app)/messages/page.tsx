import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Messages",
  robots: { index: false },
};

export default function MessagesPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-canvas px-6 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-coral-50 text-coral-600">
        <MessageCircle className="size-9" aria-hidden />
      </span>
      <h2 className="mt-5 text-xl font-extrabold text-navy-900">Select a conversation</h2>
      <p className="mt-2 max-w-xs text-[0.95rem] leading-relaxed text-navy-600">Chat privately with finders and owners. Never share sensitive personal information — and always meet in a public place.</p>
    </div>
  );
}
