import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      subtitle="You'll use it the next time you log in."
      footer={
        <Link href="/login" className="font-bold text-coral-700 hover:underline">
          ← Back to log in
        </Link>
      }
    >
      <Suspense fallback={<div className="h-48" />}>
        <ResetForm />
      </Suspense>
    </AuthShell>
  );
}
