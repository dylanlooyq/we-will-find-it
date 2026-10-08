import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Join Singapore's lost & found community — free to post, browse and help.",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <AuthShell
      title="Join the community"
      subtitle="Free to post and browse. Help someone find what they lost today."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-bold text-coral-700 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <Suspense fallback={<div className="h-96" />}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}
