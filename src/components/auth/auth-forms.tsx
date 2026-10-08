"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Inbox, MailCheck, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { areas } from "@/lib/data/taxonomy";
import { DEMO_PERSONAS } from "@/lib/data/users";
import { useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import { UserAvatar } from "../ui/avatar";
import { Button } from "../ui/button";
import { Confetti, PointsCounter, SuccessCheck } from "../ui/feedback";
import { SelectField, TextArea, TextField } from "../ui/form";
import { GoogleIcon } from "./auth-shell";

/** Only follow same-site, relative `next` targets. */
function useNext(fallback = "/"): string {
  const sp = useSearchParams();
  const n = sp.get("next");
  return n && n.startsWith("/") && !n.startsWith("//") ? n : fallback;
}

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

function PasswordField({ label = "Password", value, onChange, error, hint, autoComplete }: { label?: string; value: string; onChange: (v: string) => void; error?: string; hint?: string; autoComplete?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <TextField label={label} type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)} error={error} hint={hint} autoComplete={autoComplete} inputClassName="pr-12" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute right-2 top-[2.35rem] inline-flex size-9 items-center justify-center rounded-lg text-navy-500 hover:bg-navy-100"
      >
        {show ? <EyeOff className="size-[1.15rem]" /> : <Eye className="size-[1.15rem]" />}
      </button>
    </div>
  );
}

function Divider({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-6 flex items-center gap-4 text-xs font-bold uppercase tracking-wider text-navy-400" role="separator">
      <span className="h-px flex-1 bg-line" />
      {children}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

/* ── Log in ───────────────────────────────────────────────── */

export function LoginForm() {
  const router = useRouter();
  const next = useNext("/");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [errs, setErrs] = useState<{ email?: string; pw?: string }>({});
  const [busy, setBusy] = useState(false);
  const w = useWorld();

  const finish = (id: string) => {
    actions.login(id);
    router.push(next);
  };

  return (
    <div>
      <Button
        full
        size="lg"
        variant="secondary"
        iconLeft={<GoogleIcon className="size-5" />}
        onClick={() => {
          setBusy(true);
          setTimeout(() => finish("u_dylan"), 450);
        }}
        loading={busy}
      >
        Continue with Google
      </Button>
      <Divider>or with email</Divider>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const next: typeof errs = {};
          if (!emailOk(email)) next.email = "Enter a valid email address.";
          if (pw.length < 6) next.pw = "Passwords are at least 6 characters.";
          setErrs(next);
          if (Object.keys(next).length) return;
          setBusy(true);
          const match = w.users.find((u) => u.id.replace("u_", "") === email.split("@")[0].toLowerCase());
          setTimeout(() => finish(match?.id ?? "u_dylan"), 450);
        }}
        className="space-y-4"
      >
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errs.email} placeholder="you@example.com" />
        <PasswordField value={pw} onChange={setPw} error={errs.pw} autoComplete="current-password" />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm font-bold text-coral-700 hover:underline">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" size="lg" full loading={busy}>
          Log in
        </Button>
      </form>

      <div className="mt-8 rounded-2xl bg-navy-50 p-4">
        <p className="flex items-center gap-2 text-sm font-extrabold text-navy-900">
          <Users className="size-4" aria-hidden /> Try a demo account
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_PERSONAS.map((id) => {
            const u = w.userById.get(id);
            if (!u) return null;
            return (
              <button key={id} type="button" onClick={() => finish(id)} className="flex items-center gap-2.5 rounded-xl bg-white p-2.5 text-left shadow-soft transition hover:shadow-lift">
                <UserAvatar user={u} size="sm" />
                <span className="min-w-0 text-[0.82rem] font-bold leading-tight text-navy-900">
                  <span className="block truncate">{u.name}</span>
                  <span className="block truncate text-[0.68rem] font-medium text-navy-500">{id === "u_dylan" ? "Finder · default" : id === "u_priya" ? "Owns S$200 bounty" : id === "u_marcus" ? "Top finder" : "Moderator"}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Sign up ──────────────────────────────────────────────── */

export function SignupForm() {
  const router = useRouter();
  const next = useNext("/");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [agree, setAgree] = useState(false);
  const [errs, setErrs] = useState<{ name?: string; email?: string; pw?: string; agree?: string }>({});
  const [busy, setBusy] = useState(false);

  const create = (n: string, e: string) => {
    actions.signup({ name: n, email: e });
    router.push(`/verify-email?email=${encodeURIComponent(e)}&next=${encodeURIComponent(next)}`);
  };

  return (
    <div>
      <Button full size="lg" variant="secondary" iconLeft={<GoogleIcon className="size-5" />} loading={busy} onClick={() => { setBusy(true); setTimeout(() => create("Jamie Lim", "jamie.lim@gmail.com"), 450); }}>
        Sign up with Google
      </Button>
      <Divider>or with email</Divider>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const x: typeof errs = {};
          if (name.trim().length < 2) x.name = "Tell us what to call you.";
          if (!emailOk(email)) x.email = "Enter a valid email address.";
          if (pw.length < 8) x.pw = "Use at least 8 characters.";
          if (!agree) x.agree = "Please accept the community guidelines to continue.";
          setErrs(x);
          if (Object.keys(x).length) return;
          setBusy(true);
          setTimeout(() => create(name.trim(), email.trim()), 450);
        }}
        className="space-y-4"
      >
        <TextField label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errs.name} placeholder="e.g. Dylan Looi" hint="Only your first name and last initial are shown publicly." />
        <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errs.email} placeholder="you@example.com" />
        <PasswordField label="Password" value={pw} onChange={setPw} error={errs.pw} autoComplete="new-password" hint="At least 8 characters." />
        <div>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-navy-700">
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 size-4 shrink-0 accent-coral-600" />
            <span>
              I agree to the <Link href="/safety" className="font-bold text-coral-700 underline underline-offset-4">community guidelines</Link> — be kind, be honest, meet in public.
            </span>
          </label>
          {errs.agree && <p role="alert" className="mt-1.5 text-xs font-semibold text-coral-700">{errs.agree}</p>}
        </div>
        <Button type="submit" size="lg" full loading={busy} iconRight={<ArrowRight className="size-4" aria-hidden />}>
          Create account
        </Button>
      </form>
    </div>
  );
}

/* ── Forgot password ──────────────────────────────────────── */

export function ForgotForm() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string>();
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="text-center">
        <div className="flex justify-center">
          <SuccessCheck tone="found" icon={<MailCheck className="size-9" aria-hidden />} />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-navy-900">Check your inbox</h2>
        <p className="mt-2 text-navy-600">
          If an account exists for <strong className="text-navy-900">{email}</strong>, we&rsquo;ve sent a link to reset your password.
        </p>
        <Button href="/login" size="lg" full className="mt-7">
          Back to log in
        </Button>
        <button type="button" onClick={() => setSent(false)} className="mt-4 text-sm font-bold text-coral-700 hover:underline">
          Use a different email
        </button>
      </div>
    );
  }
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!emailOk(email)) return setErr("Enter a valid email address.");
        setSent(true);
      }}
      className="space-y-4"
    >
      <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(undefined); }} error={err} placeholder="you@example.com" />
      <Button type="submit" size="lg" full>
        Send reset link
      </Button>
    </form>
  );
}

/* ── Verify email ─────────────────────────────────────────── */

export function VerifyEmail() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = useNext("/");
  const email = sp.get("email") ?? "your email";
  const [cool, setCool] = useState(0);

  useEffect(() => {
    if (cool <= 0) return;
    const t = setTimeout(() => setCool((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cool]);

  return (
    <div className="text-center">
      <div className="flex justify-center">
        <SuccessCheck tone="coral" icon={<Inbox className="size-9" aria-hidden />} />
      </div>
      <h2 className="mt-6 text-2xl font-extrabold text-navy-900">Verify your email</h2>
      <p className="mx-auto mt-2 max-w-sm text-navy-600">
        We sent a confirmation link to <strong className="text-navy-900">{email}</strong>. Verified members get a blue tick and are trusted more by the community.
      </p>
      <Button
        size="lg"
        full
        className="mt-7"
        iconRight={<ArrowRight className="size-4" aria-hidden />}
        onClick={() => {
          actions.verifyEmail();
          toast("Email verified", { body: "Welcome to wewillfind.it!", tone: "success" });
          router.push(`/welcome?next=${encodeURIComponent(next)}`);
        }}
      >
        I&rsquo;ve verified my email
      </Button>
      <p className="mt-2 text-xs text-navy-500">Demo: this button stands in for clicking the link in your email.</p>
      <button
        type="button"
        disabled={cool > 0}
        onClick={() => {
          setCool(30);
          toast("Verification email sent", { tone: "info" });
        }}
        className={cn("mt-5 text-sm font-bold", cool > 0 ? "text-navy-400" : "text-coral-700 hover:underline")}
      >
        {cool > 0 ? `Resend in ${cool}s` : "Resend email"}
      </button>
    </div>
  );
}

/* ── Profile setup ────────────────────────────────────────── */

const HUES = [14, 38, 120, 168, 210, 250, 280, 330];

export function WelcomeSetup() {
  const router = useRouter();
  const next = useNext("/");
  const w = useWorld();
  const me = w.currentUser;
  // Edits override the account's own values; until touched we simply show the account's values.
  const [nameEdit, setName] = useState<string | null>(null);
  const [hueEdit, setHue] = useState<number | null>(null);
  const [area, setArea] = useState("orchard");
  const [bio, setBio] = useState("");
  const [done, setDone] = useState(false);
  const name = nameEdit ?? me?.name ?? "";
  const hue = hueEdit ?? me?.hue ?? 14;

  if (!me) {
    return (
      <div className="text-center">
        <p className="text-navy-600">Log in first so we can set up your profile.</p>
        <Button href="/login" className="mt-4">
          Log in
        </Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="relative text-center">
        <Confetti count={36} />
        <div className="flex justify-center">
          <SuccessCheck tone="mint" />
        </div>
        <h2 className="mt-6 text-2xl font-extrabold text-navy-900">You&rsquo;re all set, {name.split(" ")[0]}!</h2>
        <p className="mt-2 text-navy-600">Profile complete — you&rsquo;ve earned your first points and the Verified badge.</p>
        <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-mint-100 px-4 py-2 text-lg font-extrabold text-mint-800">
          <PointsCounter from={0} to={10} prefix="+" suffix=" points" />
        </p>
        <Button size="lg" full className="mt-7" onClick={() => router.push(next)}>
          Start exploring
        </Button>
      </div>
    );
  }

  const preview = { ...me, name: name || me.name, hue };
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        actions.updateProfile({ name: name.trim() || me.name, homeArea: area as typeof me.homeArea, bio: bio.trim() || "Here to help return lost things around Singapore.", hue });
        setDone(true);
      }}
      className="space-y-5"
    >
      <div className="flex items-center gap-4">
        <UserAvatar user={preview} size="xl" />
        <div role="radiogroup" aria-label="Avatar colour" className="flex flex-wrap gap-2">
          {HUES.map((h) => (
            <button
              key={h}
              type="button"
              role="radio"
              aria-checked={hue === h}
              aria-label={`Colour ${h}`}
              onClick={() => setHue(h)}
              className={cn("size-8 rounded-full ring-offset-2 transition", hue === h ? "ring-2 ring-navy-900" : "")}
              style={{ backgroundImage: `linear-gradient(135deg, hsl(${h} 62% 48%), hsl(${(h + 38) % 360} 66% 38%))` }}
            />
          ))}
        </div>
      </div>
      <TextField label="Display name" value={name} onChange={(e) => setName(e.target.value)} hint="First name and last initial works well — e.g. Dylan L." />
      <SelectField label="Where do you spend most of your time?" value={area} onChange={(e) => setArea(e.target.value)} hint="Helps us show you nearby listings and your neighbourhood rank.">
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </SelectField>
      <TextArea label="A line about you" optional rows={2} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g. Always on the lookout to help return lost items." />
      <Button type="submit" size="lg" full iconRight={<ArrowRight className="size-4" aria-hidden />}>
        Finish setup · earn +10 points
      </Button>
      <button type="button" onClick={() => router.push(next)} className="mx-auto block text-sm font-bold text-navy-500 hover:text-navy-800">
        Skip for now
      </button>
    </form>
  );
}
