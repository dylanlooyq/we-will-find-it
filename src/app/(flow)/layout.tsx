/** Focused flows (posting, claiming): no site chrome — the flow brings its own header. */
export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return <main id="main" className="flex-1">{children}</main>;
}
