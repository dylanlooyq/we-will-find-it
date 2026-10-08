import { getLocation } from "./data/taxonomy";
import type { CategoryId, IdentifyingDetail, Item, ItemImage, ItemType, PetDetails, PetSpecies } from "./types";
import type { NewItemInput } from "./store/store";

export type PostKind = "lost" | "found" | "lost-pet" | "found-pet";
export const POST_KINDS: PostKind[] = ["lost", "found", "lost-pet", "found-pet"];

export function parseKind(k: string): PostKind | null {
  return (POST_KINDS as string[]).includes(k) ? (k as PostKind) : null;
}

export type StepId = "photos" | "details" | "pet" | "where" | "when" | "bounty" | "review";

export function stepsFor(type: ItemType, pet: boolean): StepId[] {
  const core: StepId[] = ["photos", pet ? "pet" : "details", "where", "when"];
  return type === "lost" ? [...core, "bounty", "review"] : [...core, "review"];
}

export const STEP_TITLES: Record<StepId, string> = {
  photos: "Add photos",
  details: "What is it?",
  pet: "Tell us about the pet",
  where: "Where?",
  when: "When?",
  bounty: "Add a bounty?",
  review: "Ready to publish",
};

export interface Draft {
  type: ItemType;
  pet: boolean;
  images: ItemImage[];
  title: string;
  description: string;
  category: CategoryId | null;
  brand: string;
  model: string;
  colour: string;
  marks: string;
  marksPrivate: boolean;
  species: PetSpecies;
  petName: string;
  breed: string;
  petColour: string;
  age: string;
  collar: string;
  microchip: string;
  locationId: string | null;
  locationNote: string;
  /** YYYY-MM-DD in Singapore time */
  date: string;
  timeMode: "band" | "exact" | "unsure";
  band: string;
  time: string;
  bounty: boolean;
  bountyAmount: string;
}

export function emptyDraft(kind: PostKind, today: string): Draft {
  return {
    type: kind.startsWith("lost") ? "lost" : "found",
    pet: kind.endsWith("pet"),
    images: [],
    title: "",
    description: "",
    category: null,
    brand: "",
    model: "",
    colour: "",
    marks: "",
    marksPrivate: true,
    species: "dog",
    petName: "",
    breed: "",
    petColour: "",
    age: "",
    collar: "",
    microchip: "",
    locationId: null,
    locationNote: "",
    date: today,
    timeMode: "band",
    band: "",
    time: "",
    bounty: false,
    bountyAmount: "50",
  };
}

export const TIME_BANDS = [
  { id: "morning", label: "Morning", hint: "6 – 11 AM", hour: 9, phrase: "in the morning" },
  { id: "lunch", label: "Lunchtime", hint: "11 AM – 2 PM", hour: 12, phrase: "around lunchtime" },
  { id: "afternoon", label: "Afternoon", hint: "2 – 6 PM", hour: 15, phrase: "in the afternoon" },
  { id: "evening", label: "Evening", hint: "6 – 9 PM", hour: 19, phrase: "in the evening" },
  { id: "night", label: "Late night", hint: "After 9 PM", hour: 22, phrase: "late at night" },
];

export const PET_SPECIES: { id: PetSpecies; label: string; emoji: string }[] = [
  { id: "dog", label: "Dog", emoji: "🐶" },
  { id: "cat", label: "Cat", emoji: "🐱" },
  { id: "other", label: "Other", emoji: "🐰" },
];

export function petTitle(d: Draft): string {
  const species = PET_SPECIES.find((s) => s.id === d.species)?.label ?? "Pet";
  const desc = [d.petColour, d.breed || species].filter(Boolean).join(" ");
  if (d.type === "lost") return d.petName ? `${d.petName} — ${desc}` : `Lost ${desc.toLowerCase()}`;
  return d.petName ? `${d.petName} — ${desc}` : `Found: ${desc.toLowerCase()}`;
}

export function titleOf(d: Draft): string {
  return d.pet ? petTitle(d) : d.title.trim();
}

function to12h(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return m ? `${hr}:${String(m).padStart(2, "0")} ${suffix}` : `${hr} ${suffix}`;
}

export function timeLabelOf(d: Draft): string {
  const exact = d.timeMode === "exact" && d.time ? `around ${to12h(d.time)}` : "";
  const band = d.timeMode === "band" && d.band ? (TIME_BANDS.find((b) => b.id === d.band)?.phrase ?? "") : "";
  if (d.pet && d.type === "lost") {
    const when = exact || band;
    return when ? `Last seen ${when}` : "Last seen — time unsure";
  }
  if (exact) return `Around ${to12h(d.time)}`;
  if (band) return TIME_BANDS.find((b) => b.id === d.band)?.label ?? "During the day";
  return "Not sure of the time";
}

export function occurredAtOf(d: Draft): string {
  let hhmm = "12:00";
  if (d.timeMode === "exact" && d.time) hhmm = d.time;
  else if (d.timeMode === "band" && d.band) hhmm = `${String(TIME_BANDS.find((b) => b.id === d.band)?.hour ?? 12).padStart(2, "0")}:00`;
  return `${d.date}T${hhmm}:00+08:00`;
}

export interface StepErrors {
  [field: string]: string | undefined;
}

export function validate(step: StepId, d: Draft): StepErrors {
  const e: StepErrors = {};
  if (step === "details") {
    if (d.title.trim().length < 3) e.title = "Give it a short name, like “Black Nike backpack”.";
    if (!d.category) e.category = "Pick the closest category.";
  }
  if (step === "pet") {
    if (!d.breed.trim() && !d.petColour.trim()) e.breed = "Add a breed or colour so people can recognise them.";
  }
  if (step === "where" && !d.locationId) e.location = "Choose where — an MRT station, mall, park…";
  if (step === "when" && d.timeMode === "exact" && !d.time) e.time = "Pick a time, or choose a rough period instead.";
  if (step === "bounty" && d.bounty) {
    const n = Number(d.bountyAmount);
    if (!Number.isFinite(n) || n < 5) e.bounty = "Enter at least S$5.";
    else if (n > 5000) e.bounty = "Bounties are capped at S$5,000 during beta.";
  }
  return e;
}

export function draftDetails(d: Draft): IdentifyingDetail[] {
  const out: IdentifyingDetail[] = [];
  if (d.pet) {
    out.push({ label: "Species", value: PET_SPECIES.find((s) => s.id === d.species)?.label ?? "Pet" });
    if (d.breed.trim()) out.push({ label: "Breed", value: d.breed.trim() });
    if (d.petColour.trim()) out.push({ label: "Colour", value: d.petColour.trim() });
    if (d.collar.trim()) out.push({ label: "Collar", value: d.collar.trim() });
    if (d.microchip.trim()) out.push({ label: "Microchipped", value: "Yes — number held privately", hidden: true });
    return out;
  }
  if (d.brand.trim()) out.push({ label: "Brand", value: d.brand.trim() });
  if (d.model.trim()) out.push({ label: "Model", value: d.model.trim() });
  if (d.colour.trim()) out.push({ label: "Colour", value: d.colour.trim() });
  if (d.marks.trim()) out.push({ label: "Unique marks", value: d.marks.trim(), hidden: d.marksPrivate });
  return out;
}

export function draftPet(d: Draft): PetDetails | undefined {
  if (!d.pet) return undefined;
  return {
    species: d.species,
    name: d.petName.trim() || undefined,
    breed: d.breed.trim() || (PET_SPECIES.find((s) => s.id === d.species)?.label ?? "Pet"),
    colour: d.petColour.trim(),
    age: d.age.trim() || undefined,
    collar: d.collar.trim() || undefined,
    microchip: d.microchip.trim() || undefined,
  };
}

export function draftToInput(d: Draft): NewItemInput {
  const loc = d.locationId ? getLocation(d.locationId) : null;
  const title = titleOf(d);
  const fallbackDesc = d.type === "lost" ? `Lost ${title}${loc ? ` near ${loc.name}` : ""}. Please get in touch if you've seen it.` : `Found ${title}${loc ? ` near ${loc.name}` : ""}. Message me with details to claim it.`;
  const images = d.images.length ? d.images : [];
  return {
    type: d.type,
    title,
    description: d.description.trim() || fallbackDesc,
    category: d.pet ? "pets" : (d.category ?? "other"),
    images: images.map((img, i) => ({ ...img, label: img.label === "Photo you attached" ? `${title}, photo ${i + 1}` : img.label })),
    locationId: d.locationId ?? "orchard-mrt",
    locationNote: d.locationNote,
    occurredAt: occurredAtOf(d),
    timeLabel: timeLabelOf(d),
    details: draftDetails(d),
    pet: draftPet(d),
    bountyAmount: d.type === "lost" && d.bounty ? Number(d.bountyAmount) : undefined,
  };
}

/** A non-persisted Item used for the live preview card. */
export function draftPreviewItem(d: Draft, nowIso: string, ownerId: string): Item {
  const input = draftToInput(d);
  return {
    id: "preview",
    slug: "preview",
    status: "active",
    moderation: "ok",
    postedAt: nowIso,
    ownerId,
    likes: 0,
    comments: 0,
    views: 0,
    ...input,
    title: input.title || (d.type === "lost" ? "What did you lose?" : "What did you find?"),
    images: input.images.length ? input.images : [{ file: "preview", label: input.title || "your photo goes here" }],
  };
}
