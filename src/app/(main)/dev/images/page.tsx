import type { Metadata } from "next";
import { CheckCircle2, CircleDashed, FolderOpen } from "lucide-react";
import available from "@/lib/data/available-images.json";
import { items } from "@/lib/data/items";
import { seedClaims, seedConversations } from "@/lib/data/social";
import type { CategoryId, ItemImage as ItemImageData } from "@/lib/types";
import { ItemImage } from "@/components/ui/item-image";
import { Container } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Image checklist",
  robots: { index: false, follow: false },
};

type Slot = { image: ItemImageData; category: CategoryId; group: string };

/** Every photo the demo expects, so real photography can be dropped in without hunting. */
function collect(): Slot[] {
  const slots: Slot[] = [];
  for (const it of items) for (const image of it.images) slots.push({ image, category: it.category, group: `Listing · ${it.title}` });
  for (const c of seedClaims) for (const image of c.proof) slots.push({ image, category: "other", group: "Bounty claim proof" });
  for (const conv of seedConversations) for (const m of conv.messages) if (m.photo) slots.push({ image: m.photo, category: "other", group: "Chat photo" });
  return slots;
}

export default function ImageChecklistPage() {
  const have = new Set<string>(available);
  const slots = collect();
  const done = slots.filter((s) => have.has(s.image.file)).length;
  const groups = Array.from(new Set(slots.map((s) => s.group)));

  return (
    <Container className="max-w-5xl py-10 sm:py-14">
      <p className="eyebrow text-coral-700">Developer tool</p>
      <h1 className="mt-2 text-3xl font-extrabold text-navy-900 sm:text-4xl">Image checklist</h1>
      <p className="mt-3 max-w-2xl text-navy-600">
        Until a photo exists, the app shows a labelled placeholder (&ldquo;Image of …&rdquo;). To replace one, save a JPG/PNG/WebP with the <strong>exact file name</strong> below into{" "}
        <code className="rounded bg-navy-100 px-1.5 py-0.5 font-mono text-sm">public/images/items/</code> and run <code className="rounded bg-navy-100 px-1.5 py-0.5 font-mono text-sm">npm run images</code> (it also runs before <code className="font-mono text-sm">dev</code> and <code className="font-mono text-sm">build</code>).
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-card bg-white p-4 shadow-soft">
        <FolderOpen className="size-5 text-navy-500" aria-hidden />
        <p className="text-sm font-semibold text-navy-800">
          {done} of {slots.length} photos supplied
        </p>
        <div className="h-2 min-w-40 flex-1 overflow-hidden rounded-full bg-navy-100" role="progressbar" aria-label="Photos supplied" aria-valuenow={done} aria-valuemin={0} aria-valuemax={slots.length}>
          <div className="h-full rounded-full bg-mint-500" style={{ width: `${(done / Math.max(1, slots.length)) * 100}%` }} />
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {groups.map((g) => (
          <section key={g} aria-label={g}>
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy-500">{g}</h2>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {slots
                .filter((s) => s.group === g)
                .map((s) => {
                  const ok = have.has(s.image.file);
                  return (
                    <li key={s.image.file} className="flex gap-3 rounded-2xl bg-white p-3 shadow-soft">
                      <ItemImage image={s.image} category={s.category} compact className="size-20 shrink-0 rounded-xl" />
                      <div className="min-w-0 flex-1">
                        <p className="break-all font-mono text-[0.8rem] font-bold text-navy-900">{s.image.file}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-navy-600">{s.image.label}</p>
                        <p className={`mt-1.5 inline-flex items-center gap-1 text-xs font-bold ${ok ? "text-mint-700" : "text-navy-500"}`}>
                          {ok ? <CheckCircle2 className="size-3.5" aria-hidden /> : <CircleDashed className="size-3.5" aria-hidden />}
                          {ok ? "Supplied" : "Needed"}
                        </p>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}
