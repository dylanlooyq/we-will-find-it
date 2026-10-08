import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";

/** Same chrome as (main) minus the bottom tab bar — pages here have their own sticky action bar. */
export default function ImmersiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
