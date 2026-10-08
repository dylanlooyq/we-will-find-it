/** Sign-in screens bring their own split-screen frame. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex-1 bg-white">
      {children}
    </main>
  );
}
