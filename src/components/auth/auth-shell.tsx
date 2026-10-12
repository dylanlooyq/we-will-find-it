import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "../brand/logo";
import { SkylineArt } from "../home/hero-art";

/** Split-screen frame for every sign-in screen: form on the left, skyline art on the right. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" aria-label="wewillfind.it home" className="w-fit">
          <Logo size={32} />
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-extrabold leading-tight text-navy-900 sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-3 text-[1.02rem] leading-relaxed text-navy-600">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-center text-[0.95rem] text-navy-600">{footer}</div>}
        </div>
        <p className="mx-auto flex items-center gap-2 text-xs font-medium text-navy-500">
          <ShieldCheck className="size-4 text-mint-700" aria-hidden />
          We never ask for your NRIC, bank details or card numbers.
        </p>
      </div>

      <aside aria-hidden className="relative hidden overflow-hidden lg:block">
        <div className="absolute inset-0">
          <SkylineArt />
        </div>
      </aside>
    </div>
  );
}

export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}
