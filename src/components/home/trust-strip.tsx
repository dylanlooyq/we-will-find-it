import { Heart, ShieldCheck, Users } from "lucide-react";
import { Container } from "../ui/section";

const items = [
  { icon: Users, title: "Community powered", body: "Locals helping locals, island-wide.", tone: "bg-violet-100 text-violet-700" },
  { icon: ShieldCheck, title: "Safe by design", body: "Hidden details, public meet-ups, verified members.", tone: "bg-found-100 text-found-700" },
  { icon: Heart, title: "Free to use", body: "Post and browse at no cost. Bounties are optional.", tone: "bg-coral-100 text-coral-700" },
];

export function TrustStrip() {
  return (
    <Container className="-mt-2 sm:-mt-4">
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((i) => (
          <li key={i.title} className="flex items-center gap-4 rounded-card bg-white p-4 shadow-soft">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${i.tone}`}>
              <i.icon className="size-6" aria-hidden />
            </span>
            <div>
              <h2 className="text-[0.98rem] font-extrabold text-navy-900">{i.title}</h2>
              <p className="text-sm leading-snug text-navy-600">{i.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
