"use client";

import { useEffect, useRef, useState } from "react";
import { HeartHandshake, PackageCheck, Users } from "lucide-react";
import { useWorld } from "@/lib/store/hooks";
import { publicItems } from "@/lib/world";
import { PointsCounter } from "../ui/feedback";
import { Container } from "../ui/section";

/** The community's real numbers. Counts up once when scrolled into view. */
export function CommunityStats() {
  const w = useWorld();
  const posted = publicItems(w);
  const STATS = [
    { icon: PackageCheck, value: posted.length, label: "items posted", tone: "bg-coral-50 text-coral-600" },
    { icon: HeartHandshake, value: posted.filter((i) => i.status === "resolved").length, label: "items reunited", tone: "bg-mint-50 text-mint-700" },
    { icon: Users, value: w.users.filter((u) => !u.suspended).length, label: "helpful finders", tone: "bg-found-50 text-found-600" },
  ];
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Container as="section" className="pt-16 sm:pt-24">
      <div ref={ref} className="rounded-sheet bg-white p-6 shadow-soft sm:p-10">
        <p className="eyebrow text-center text-coral-700">Singapore, together</p>
        <h2 className="mt-2 text-center text-[1.65rem] font-extrabold text-navy-900 sm:text-3xl">A community that looks out for each other</h2>
        <ul className="mt-9 grid gap-6 sm:grid-cols-3">
          {STATS.map((s) => (
            <li key={s.label} className="flex items-center gap-4 sm:flex-col sm:text-center">
              <span className={`flex size-14 shrink-0 items-center justify-center rounded-2xl ${s.tone}`}>
                <s.icon className="size-7" aria-hidden />
              </span>
              <div>
                <p className="text-4xl font-extrabold tracking-tight text-navy-900 sm:text-5xl">
                  {seen && w.ready ? <PointsCounter to={s.value} duration={1400} /> : <span className="tabular-nums">0</span>}
                </p>
                <p className="mt-1 text-[0.98rem] font-semibold text-navy-600">{s.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Container>
  );
}
