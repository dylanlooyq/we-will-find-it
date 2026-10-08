import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to wewillfind.it to post, message finders and claim bounties.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to post, message finders and see your matches."
      footer={
        <>
          New here?{" "}
          <Link href="/signup" className="font-bold text-coral-700 hover:underline">
            Create a free account
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-80" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
