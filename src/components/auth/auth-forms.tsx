"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Eye, EyeOff, Inbox, MailCheck } from "lucide-react";
import { authClient, authErrorMessage, CONFIRM_CHECK_HEADER } from "@/lib/auth-client";
import { cn } from "@/lib/cn";
import { areas } from "@/lib/data/taxonomy";
import { useWorld } from "@/lib/store/hooks";
import { actions, refreshWorld } from "@/lib/store/store";
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

/** Where a brand-new account lands once it is signed in. */
const welcomeUrl = (next: string) => `/welcome?next=${encodeURIComponent(next)}`;

const verifyUrl = (email: string, next: string) => `/verify-email?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}`;

/**
 * The account someone has just signed up (or tried to log in) with here, kept in memory only — never
 * in storage — until its email is confirmed. On a phone the emailed link usually opens in another
 * browser, the mail app's own, which signs *that* one in; this lets the browser the person started in
 * finish too (see VerifyEmail).
 */
const unconfirmed: { account: { email: string; password: string } | null } = { account: null };

function FormError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mb-4 rounded-xl bg-coral-50 px-4 py-3 text-sm font-semibold text-coral-700">
      {children}
    </p>
  );
}

function GoogleButton({ label, next, onError }: { label: string; next: string; onError: (message: string) => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      full
      size="lg"
      variant="secondary"
      iconLeft={<GoogleIcon className="size-5" />}
      loading={busy}
      onClick={async () => {
        setBusy(true);
        // On success the browser leaves for Google, so the button stays busy.
        const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next, newUserCallbackURL: welcomeUrl(next), errorCallbackURL: "/login" });
        if (error) {
          setBusy(false);
          onError(authErrorMessage(error));
        }
      }}
    >
      {label}
    </Button>
  );
}

/* ── Log in ───────────────────────────────────────────────── */

export function LoginForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = useNext("/");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [errs, setErrs] = useState<{ email?: string; pw?: string }>({});
  // Google sends a failed sign-in back here with ?error=…
  const [formErr, setFormErr] = useState(sp.get("error") ? "Google sign-in didn't complete. Please try again." : undefined);
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <FormError>{formErr}</FormError>
      <GoogleButton label="Continue with Google" next={next} onError={setFormErr} />
      <Divider>or with email</Divider>
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const found: typeof errs = {};
          if (!emailOk(email)) found.email = "Enter a valid email address.";
          if (!pw) found.pw = "Enter your password.";
          setErrs(found);
          setFormErr(undefined);
          if (Object.keys(found).length) return;
          setBusy(true);
          const { data, error } = await authClient.signIn.email({ email: email.trim(), password: pw });
          if (error) {
            setBusy(false);
            // The server has just emailed a fresh confirmation link.
            if (error.code === "EMAIL_NOT_VERIFIED") {
              unconfirmed.account = { email: email.trim(), password: pw };
              return router.push(verifyUrl(email.trim(), next));
            }
            return setFormErr(authErrorMessage(error));
          }
          // Read this member's data before moving on, so the next page opens signed in.
          await refreshWorld(true);
          toast(`Welcome back, ${data.user.name.split(" ")[0]}`, { tone: "info" });
          router.push(next);
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
  const [formErr, setFormErr] = useState<string>();
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <FormError>{formErr}</FormError>
      <GoogleButton label="Sign up with Google" next={next} onError={setFormErr} />
      <Divider>or with email</Divider>
      <form
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const x: typeof errs = {};
          if (name.trim().length < 2) x.name = "Tell us what to call you.";
          if (!emailOk(email)) x.email = "Enter a valid email address.";
          if (pw.length < 8) x.pw = "Use at least 8 characters.";
          if (!agree) x.agree = "Please accept the community guidelines to continue.";
          setErrs(x);
          setFormErr(undefined);
          if (Object.keys(x).length) return;
          setBusy(true);
          // No session yet: the account is signed in by the confirmation link in the email.
          const { error } = await authClient.signUp.email({ name: name.trim(), email: email.trim(), password: pw, callbackURL: welcomeUrl(next) });
          if (error) {
            setBusy(false);
            return setFormErr(authErrorMessage(error));
          }
          unconfirmed.account = { email: email.trim(), password: pw };
          router.push(verifyUrl(email.trim(), next));
        }}
        className="space-y-4"
      >
        <TextField label="Full name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} error={errs.name} placeholder="e.g. John Smith" hint="Only your first name and last initial are shown publicly." />
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
  const [busy, setBusy] = useState(false);
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
      onSubmit={async (e) => {
        e.preventDefault();
        if (!emailOk(email)) return setErr("Enter a valid email address.");
        setBusy(true);
        const { error } = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
        setBusy(false);
        if (error) return setErr(authErrorMessage(error));
        setSent(true);
      }}
      className="space-y-4"
    >
      <TextField label="Email" type="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setErr(undefined); }} error={err} placeholder="you@example.com" />
      <Button type="submit" size="lg" full loading={busy}>
        Send reset link
      </Button>
    </form>
  );
}

/* ── Reset password ───────────────────────────────────────── */

export function ResetForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const token = sp.get("token");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string>();
  const [busy, setBusy] = useState(false);

  // The emailed link arrives here with ?token=…, or ?error=… when it has expired or was already used.
  if (!token || sp.get("error")) {
    return (
      <div className="text-center">
        <p className="text-navy-600">This reset link is invalid or has expired. Links work once, for 1 hour.</p>
        <Button href="/forgot-password" size="lg" full className="mt-6">
          Send a new link
        </Button>
      </div>
    );
  }
  return (
    <form
      noValidate
      onSubmit={async (e) => {
        e.preventDefault();
        if (pw.length < 8) return setErr("Use at least 8 characters.");
        setBusy(true);
        const { error } = await authClient.resetPassword({ newPassword: pw, token });
        if (error) {
          setBusy(false);
          return setErr(error.code === "INVALID_TOKEN" ? "This reset link has expired. Request a new one." : authErrorMessage(error));
        }
        toast("Password updated", { body: "Log in with your new password.", tone: "success" });
        router.push("/login");
      }}
      className="space-y-4"
    >
      <PasswordField label="New password" value={pw} onChange={(v) => { setPw(v); setErr(undefined); }} error={err} autoComplete="new-password" hint="At least 8 characters." />
      <Button type="submit" size="lg" full loading={busy}>
        Save new password
      </Button>
    </form>
  );
}

/* ── Verify email ─────────────────────────────────────────── */

export function VerifyEmail() {
  const router = useRouter();
  const sp = useSearchParams();
  const next = useNext("/");
  const email = sp.get("email");
  const [cool, setCool] = useState(0);
  const [checking, setChecking] = useState(false);
  const [notYet, setNotYet] = useState(false);
  const asking = useRef(false);
  const { data } = authClient.useSession();
  const verified = !!data?.user.emailVerified;
  const account = unconfirmed.account?.email === email ? unconfirmed.account : null;

  // The link in the email signs this browser in. When that happens (often in another tab), move on.
  useEffect(() => {
    if (verified) router.replace(welcomeUrl(next));
  }, [verified, router, next]);

  // …unless it was opened in a different browser, which is the usual case on a phone. Logging in only
  // works once the email is confirmed, so trying it answers "confirmed yet?" and finishes the job here.
  const finish = useCallback(async () => {
    if (!account || asking.current) return false;
    asking.current = true;
    const { error } = await authClient.signIn.email(account, { headers: { [CONFIRM_CHECK_HEADER]: "1" } });
    asking.current = false;
    if (error) return false;
    unconfirmed.account = null;
    // Read this member's data before moving on, so the next page opens signed in.
    await refreshWorld(true);
    router.replace(welcomeUrl(next));
    return true;
  }, [account, router, next]);

  // Coming back to this page from the mail app is the moment to look.
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === "visible") void finish();
    };
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [finish]);

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
        We sent a confirmation link to <strong className="text-navy-900">{email ?? "your email"}</strong>. Open it to finish creating your account — the link works for 1 hour.
      </p>
      <p className="mx-auto mt-3 max-w-sm text-sm text-navy-500">Can&rsquo;t see it? Check your spam folder.</p>
      {email && (
        <button
          type="button"
          disabled={cool > 0}
          onClick={async () => {
            setCool(30);
            const { error } = await authClient.sendVerificationEmail({ email, callbackURL: welcomeUrl(next) });
            if (error) toast(authErrorMessage(error), { tone: "error" });
            else toast("Verification email sent", { tone: "info" });
          }}
          className={cn("mt-6 text-sm font-bold", cool > 0 ? "text-navy-400" : "text-coral-700 hover:underline")}
        >
          {cool > 0 ? `Resend in ${cool}s` : "Resend email"}
        </button>
      )}
      {account ? (
        <Button
          size="lg"
          full
          className="mt-6"
          loading={checking}
          onClick={async () => {
            setChecking(true);
            setNotYet(!(await finish()));
            setChecking(false);
          }}
        >
          I&rsquo;ve confirmed my email
        </Button>
      ) : (
        // This page was reloaded, so the new account's details are gone from memory: log in the usual way.
        <Button href={`/login?next=${encodeURIComponent(next)}`} size="lg" full className="mt-6">
          I&rsquo;ve confirmed — log in
        </Button>
      )}
      {notYet && (
        <p role="alert" className="mt-3 text-sm font-semibold text-coral-700">
          We can&rsquo;t see it yet. Open the link in the email, then try again.
        </p>
      )}
      <p className="mx-auto mt-4 max-w-sm text-sm text-navy-500">If the link opens in another app, come back here afterwards — we&rsquo;ll sign you in on this one too.</p>
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
  const { data: session, isPending } = authClient.useSession();

  // Arriving from the email link or from Google, the session is known a moment before its profile is.
  if (isPending || !w.ready || (session && me?.authId !== session.user.id)) return <div className="h-72" />;

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
      <TextField label="Display name" value={name} onChange={(e) => setName(e.target.value)} hint="First name and last initial works well — e.g. John S." />
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
