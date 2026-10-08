import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmail } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Verify your email",
  robots: { index: false },
};

export default function VerifyEmailPage() {
  return (
    <AuthShell title="One quick step">
      <Suspense fallback={<div className="h-72" />}>
        <VerifyEmail />
      </Suspense>
    </AuthShell>
  );
}
