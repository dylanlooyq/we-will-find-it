import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Forgot password",
  robots: { index: false },
};

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={
        <Link href="/login" className="font-bold text-coral-700 hover:underline">
          ← Back to log in
        </Link>
      }
    >
      <ForgotForm />
    </AuthShell>
  );
}
