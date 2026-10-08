/** App-style screens (messages): the screen brings its own header and fills the viewport. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main id="main" className="flex-1">
      {children}
    </main>
  );
}
