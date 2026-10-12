import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AuthSync } from "@/components/auth/auth-sync";
import { AppEffects } from "@/components/layout/app-effects";
import { PostChooser } from "@/components/layout/post-chooser";
import { MEMBER_HINT_SCRIPT } from "@/lib/member-hint";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "wewillfind.it — Singapore's Lost & Found Community",
    template: "%s · wewillfind.it",
  },
  description:
    "Lost something? Found something? Singapore's community-powered lost & found platform — post, search, match and return lost items and pets.",
  applicationName: "wewillfind.it",
  openGraph: {
    type: "website",
    siteName: "wewillfind.it",
    locale: "en_SG",
    title: "wewillfind.it — Singapore's Lost & Found Community",
    description: "When someone loses something, the community helps find it.",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#ff3b5c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-SG" data-scroll-behavior="smooth" className={`${jakarta.variable} h-full`} suppressHydrationWarning>
      <head>
        {/* Marks <html data-member> before first paint, so members never see the visitor's version flash by. */}
        <script dangerouslySetInnerHTML={{ __html: MEMBER_HINT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only z-[100] rounded-xl bg-navy-900 px-4 py-3 font-bold text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
        >
          Skip to content
        </a>
        {children}
        <PostChooser />
        <AppEffects />
        <AuthSync />
      </body>
    </html>
  );
}
