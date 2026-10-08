import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { WelcomeSetup } from "@/components/auth/auth-forms";

export const metadata: Metadata = {
  title: "Set up your profile",
  robots: { index: false },
};

export default function WelcomePage() {
  return (
    <AuthShell title="Welcome! Let's set up your profile" subtitle="It takes 20 seconds, earns you +10 points and a Verified badge.">
      <Suspense fallback={<div className="h-96" />}>
        <WelcomeSetup />
      </Suspense>
    </AuthShell>
  );
}
