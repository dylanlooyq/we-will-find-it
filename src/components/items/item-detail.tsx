"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bookmark,
  CalendarDays,
  ChevronLeft,
  Coins,
  Eye,
  Flag,
  HandHeart,
  Lock,
  MapPin,
  MessageCircle,
  PartyPopper,
  PawPrint,
  Search,
  Share2,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { areaById, getCategory, getLocation, PAYMENT_OPTIONS } from "@/lib/data/taxonomy";
import { formatDate, formatMoney, occurredLabel, timeUntil } from "@/lib/format";
import { distanceKm, formatDistance } from "@/lib/geo";
import { useHydrated, useNow, useWorld } from "@/lib/store/hooks";
import { actions } from "@/lib/store/store";
import { toast } from "@/lib/store/events";
import type { Item } from "@/lib/types";
import { activePublicItems, bountyForItem, claimsForItem, sortRecent } from "@/lib/world";
import { ProfileCard } from "../community/profile-card";
import { PostButton } from "../layout/post-chooser";
import { BountyBadge, Pill, StatusBadge } from "../ui/badges";
import { Button, IconButton } from "../ui/button";
import { CategoryIcon } from "../ui/category-icon";
import { EmptyState, Skeleton } from "../ui/states";
import { RelativeTime } from "../ui/meta";
import { Container, Rail, RailItem, SectionHeader } from "../ui/section";
import { ClaimsPanel } from "./claims-panel";
import { ImageGallery } from "./image-gallery";
import { ContactSheet, ReportDialog, ShareSheet, type ContactMode } from "./item-dialogs";
import { ItemCard } from "./item-card";
import { MatchesSection } from "./matches-section";
import { ResolveDialog, ThankYouDialog } from "./resolve-flow";

export function ItemDetailSkeleton() {
  return (
    <Container className="py-10">
      <Skeleton className="h-6 w-40" />
      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <Skeleton className="aspect-[16/11] rounded-sheet" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    </Container>
  );
}

/** The listing page: gallery, story, identifying details, poster and the right action for *you*. */
export function ItemDetail({ slug }: { slug: string }) {
  const w = useWorld();
  const hydrated = useHydrated();
  const item = w.itemBySlug.get(slug);
  if (!item) {
    if (!hydrated) return <ItemDetailSkeleton />;
    return (
      <Container className="py-16">
        <EmptyState
          icon={<Search className="size-9" aria-hidden />}
          title="We can't find that listing"
          body="It may have been removed or reunited. Try searching for something similar."
          tone="coral"
          action={
            <>
              <Button href="/explore">Browse listings</Button>
              <PostButton variant="secondary">Post something</PostButton>
            </>
          }
        />
      </Container>
    );
  }
  return <Detail item={item} />;
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="py-3.5">
      <dt className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-navy-500">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-navy-100 text-navy-600" aria-hidden>
          {icon}
        </span>
        {label}
      </dt>
      <dd className="mt-1.5 pl-[3.125rem] text-[0.98rem] font-semibold leading-snug text-navy-900">{children}</dd>
    </div>
  );
}

function Detail({ item }: { item: Item }) {
  const w = useWorld();
  const router = useRouter();
  const now = useNow();
  const me = w.currentUser;
  const owner = w.userById.get(item.ownerId);
  const loc = getLocation(item.locationId);
  const cat = getCategory(item.category);
  const bounty = bountyForItem(w, item);
  const openBounty = bounty && (bounty.status === "open" || bounty.status === "claimed") ? bounty : undefined;
  const isOwner = me?.id === item.ownerId;
  const resolved = item.status === "resolved";
  const pet = item.category === "pets" && item.pet;
  const lost = item.type === "lost";
  const saved = w.saves.has(item.id);
  const claims = claimsForItem(w, item.id);
  const myClaim = me ? claims.find((c) => c.claimantId === me.id) : undefined;
  const origin = getLocation(w.nearLocationId);
  const km = distanceKm(origin, loc);
  const finder = item.resolvedWithUserId ? w.userById.get(item.resolvedWithUserId) : undefined;

  const [share, setShare] = useState(false);
  const [report, setReport] = useState(false);
  const [contact, setContact] = useState<ContactMode | null>(null);
  const [resolve, setResolve] = useState(false);
  const [thanks, setThanks] = useState(false);

  const nearby = sortRecent(
    activePublicItems(w)
      .filter((i) => i.id !== item.id && distanceKm(loc, getLocation(i.locationId)) < 3)
      .sort((a, b) => distanceKm(loc, getLocation(a.locationId)) - distanceKm(loc, getLocation(b.locationId))),
  ).slice(0, 4);

  const gate = (fn: () => void) => () => {
    if (!me) {
      toast("Log in to continue", { body: "It only takes a moment.", tone: "info", href: `/login?next=/item/${item.slug}` });
      router.push(`/login?next=/item/${item.slug}`);
      return;
    }
    fn();
  };

  const startChat = gate(() => {
    const id = actions.startConversation(item.id);
    if (id) router.push(`/messages/${id}`);
  });

  const hiddenCount = item.details.filter((d) => d.hidden).length;
  const title = pet && item.pet?.name ? `${item.pet.name} — ${item.pet.breed}` : item.title;

  /* Primary action area — different for owner / visitor / lost / found */
  const actionsBlock = (
    <div className="space-y-3">
      {resolved ? (
        <div className="rounded-2xl bg-mint-50 p-4 text-mint-900 ring-1 ring-mint-200">
          <p className="flex items-center gap-2 text-[0.98rem] font-extrabold">
            <PartyPopper className="size-5" aria-hidden /> Item reunited
          </p>
          <p className="mt-1 text-sm leading-relaxed text-mint-800">Thanks to the community, this item has found its way home.</p>
          {isOwner && finder && (
            <Button size="sm" variant="success" className="mt-3" onClick={() => setThanks(true)} iconLeft={<span aria-hidden>❤️</span>}>
              Thank {finder.name.split(" ")[0]}
            </Button>
          )}
        </div>
      ) : isOwner ? (
        <>
          <Button size="lg" full variant="success" onClick={() => setResolve(true)} iconLeft={<PartyPopper className="size-5" aria-hidden />}>
            {lost ? "Mark as resolved" : "Mark as returned"}
          </Button>
          <Button size="lg" full variant="secondary" href="/messages" iconLeft={<MessageCircle className="size-5" aria-hidden />}>
            View messages
          </Button>
        </>
      ) : lost ? (
        <>
          <Button size="lg" full onClick={gate(() => setContact("found"))} iconLeft={<HandHeart className="size-5" aria-hidden />}>
            I Found This Item
          </Button>
          {openBounty && (
            <Button size="lg" full variant="gold" href={me ? `/item/${item.slug}/claim` : `/login?next=/item/${item.slug}/claim`} iconLeft={<Coins className="size-5" aria-hidden />}>
              {myClaim ? "View my claim" : `Claim ${formatMoney(openBounty.amount)} Bounty`}
            </Button>
          )}
          <Button size="lg" full variant="secondary" onClick={startChat} iconLeft={<MessageCircle className="size-5" aria-hidden />}>
            Contact Poster
          </Button>
        </>
      ) : (
        <>
          <Button size="lg" full variant="found" onClick={gate(() => setContact("mine"))} iconLeft={<Tag className="size-5" aria-hidden />}>
            This is mine
          </Button>
          <Button size="lg" full variant="secondary" onClick={startChat} iconLeft={<MessageCircle className="size-5" aria-hidden />}>
            Contact Finder
          </Button>
        </>
      )}
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1" onClick={() => setShare(true)} iconLeft={<Share2 className="size-4" aria-hidden />}>
          Share
        </Button>
        {!isOwner && (
          <Button variant="ghost" size="sm" className="flex-1 text-navy-600" onClick={gate(() => setReport(true))} iconLeft={<Flag className="size-4" aria-hidden />}>
            Report
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <article>
      <Container className="pb-32 pt-5 sm:pt-8 lg:pb-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm font-semibold text-navy-600">
          <Link href={lost ? "/lost" : "/found"} className="inline-flex items-center gap-1 rounded-full py-1 pr-2 hover:text-coral-700">
            <ChevronLeft className="size-4" aria-hidden />
            {pet ? "Pets" : lost ? "Lost items" : "Found items"}
          </Link>
          <span aria-hidden className="text-navy-300">
            /
          </span>
          <span className="truncate text-navy-900" aria-current="page">
            {pet && item.pet?.name ? item.pet.name : item.title}
          </span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] xl:gap-10">
          {/* ── Left: story ─────────────────────────────── */}
          <div className="min-w-0 space-y-8">
            <ImageGallery
              images={item.images}
              category={item.category}
              overlay={<StatusBadge type={item.type} pet={!!pet} resolved={resolved} size="md" />}
              actions={
                <>
                  <IconButton label={saved ? "Remove from saved" : "Save post"} tone="glass" onClick={gate(() => actions.toggleSave(item.id))} aria-pressed={saved}>
                    <Bookmark className={cn("size-5", saved && "fill-coral-500 text-coral-600")} />
                  </IconButton>
                  <IconButton label="Share" tone="glass" onClick={() => setShare(true)}>
                    <Share2 className="size-5" />
                  </IconButton>
                </>
              }
            />

            <header>
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone="neutral" className="gap-1.5">
                  <CategoryIcon icon={cat.icon} className="size-3.5" />
                  {cat.label}
                </Pill>
                {item.details
                  .filter((d) => !d.hidden && ["brand", "colour"].includes(d.label.toLowerCase()))
                  .map((d) => (
                    <Pill key={d.label}>{d.value}</Pill>
                  ))}
              </div>
              <h1 className="mt-3 text-[1.9rem] font-extrabold leading-tight text-navy-900 sm:text-4xl">{title}</h1>
              <dl className="mt-4 divide-y divide-line rounded-2xl bg-white px-4 shadow-soft">
                <Row icon={<MapPin className="size-4" aria-hidden />} label={lost ? "Lost at" : "Found at"}>
                  <span>{loc.name}</span>
                  <span className="ml-2 text-sm font-medium text-navy-500">
                    {areaById[loc.area].name} · {formatDistance(km)}
                  </span>
                  {item.locationNote && <span className="mt-0.5 block text-sm font-medium text-navy-600">{item.locationNote}</span>}
                  <Link href={`/map?loc=${loc.id}&dist=1`} className="mt-1 inline-block text-sm font-bold text-coral-700 hover:underline">
                    View on map
                  </Link>
                </Row>
                <Row icon={<CalendarDays className="size-4" aria-hidden />} label={pet && lost ? "Last seen" : lost ? "Lost on" : "Found on"}>
                  {pet && lost && item.timeLabel.startsWith("Last seen") ? `${item.timeLabel} · ${formatDate(item.occurredAt)}` : occurredLabel(item)}
                </Row>
                <Row icon={<Eye className="size-4" aria-hidden />} label="Posted">
                  <RelativeTime iso={item.postedAt} /> <span className="font-medium text-navy-500">· {item.views.toLocaleString("en-SG")} views</span>
                </Row>
              </dl>
            </header>

            {openBounty && (
              <section aria-label="Bounty" className="flex items-center gap-4 rounded-card bg-gradient-to-r from-gold-100 via-gold-50 to-white p-5 ring-1 ring-gold-200">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-gold-300 text-gold-900 shadow-soft">
                  <Coins className="size-8" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-4xl font-extrabold leading-none tabular-nums text-navy-900">{formatMoney(openBounty.amount)}</p>
                  <p className="mt-1 text-sm font-extrabold uppercase tracking-wider text-gold-800">Bounty</p>
                </div>
                <p className="hidden max-w-[16rem] text-sm leading-relaxed text-navy-700 sm:block">
                  The owner pays this directly to whoever returns the item — {PAYMENT_OPTIONS}. {timeUntil(openBounty.expiresAt, now)}.
                </p>
              </section>
            )}

            <section aria-labelledby="desc-h">
              <h2 id="desc-h" className="text-xl font-extrabold text-navy-900">
                Description
              </h2>
              <p className="mt-3 max-w-prose whitespace-pre-line text-[1.02rem] leading-relaxed text-navy-700">{item.description}</p>
            </section>

            {item.details.length > 0 && (
              <section aria-labelledby="details-h">
                <h2 id="details-h" className="text-xl font-extrabold text-navy-900">
                  {pet ? "About the pet" : "Identifying details"}
                </h2>
                <dl className="mt-3 divide-y divide-line rounded-2xl bg-white px-4 shadow-soft">
                  {item.details.map((d) => {
                    const masked = d.hidden && !isOwner;
                    return (
                      <div key={d.label} className="flex items-start gap-4 py-3.5">
                        <dt className="w-32 shrink-0 text-sm font-semibold text-navy-500">{d.label}</dt>
                        <dd className="min-w-0 flex-1 text-[0.95rem] font-semibold text-navy-900">
                          {masked ? (
                            <span className="inline-flex items-center gap-2 rounded-lg bg-navy-100 px-3 py-1.5 text-sm font-semibold text-navy-600">
                              <Lock className="size-3.5" aria-hidden />
                              Hidden — shared privately with a verified claimant
                            </span>
                          ) : (
                            <>
                              {d.value}
                              {d.hidden && isOwner && (
                                <span className="ml-2 inline-flex items-center gap-1 rounded-md bg-gold-100 px-1.5 py-0.5 text-[0.68rem] font-bold text-gold-800">
                                  <Lock className="size-3" aria-hidden /> Only you can see this
                                </span>
                              )}
                            </>
                          )}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
                {hiddenCount > 0 && !isOwner && (
                  <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-navy-600">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-mint-700" aria-hidden />
                    The poster kept {hiddenCount} detail{hiddenCount > 1 ? "s" : ""} private so only the real {lost ? "finder" : "owner"} can prove it. Describe them in your message.
                  </p>
                )}
              </section>
            )}

            {pet && (
              <section aria-labelledby="pet-h" className="rounded-card bg-coral-50/70 p-5 ring-1 ring-coral-100">
                <h2 id="pet-h" className="flex items-center gap-2 text-lg font-extrabold text-navy-900">
                  <PawPrint className="size-5 text-coral-600" aria-hidden />
                  {item.pet?.name ?? "Pet"} at a glance
                </h2>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
                  {[
                    ["Species", item.pet?.species === "dog" ? "Dog 🐶" : item.pet?.species === "cat" ? "Cat 🐱" : "Other 🐰"],
                    ["Breed", item.pet?.breed],
                    ["Colour", item.pet?.colour],
                    ["Age", item.pet?.age],
                    ["Collar", item.pet?.collar],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-semibold text-navy-500">{k}</dt>
                        <dd className="font-bold text-navy-900">{v}</dd>
                      </div>
                    ))}
                  <div>
                    <dt className="font-semibold text-navy-500">Microchip</dt>
                    <dd className="font-bold text-navy-900">
                      {isOwner && item.pet?.microchip ? item.pet.microchip : item.pet?.microchip ? "Chipped · number kept private" : "—"}
                    </dd>
                  </div>
                </dl>
                <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-navy-600">
                  <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  Microchip numbers are never shown publicly. Vets can scan any pet you&rsquo;ve found.
                </p>
              </section>
            )}

            {isOwner && lost && !resolved && <MatchesSection item={item} owner />}
            {isOwner && <ClaimsPanel item={item} />}
            {!isOwner && !resolved && !lost && <MatchesSection item={item} owner={false} />}

            <aside className="flex gap-3 rounded-2xl bg-mint-50 p-4 text-sm leading-relaxed text-mint-900" aria-label="Safety tips">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-mint-700" aria-hidden />
              <div>
                <p className="font-extrabold">Stay safe</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-mint-800">
                  <li>Never share sensitive personal information.</li>
                  <li>Meet in a public place — an MRT customer service counter is ideal.</li>
                  <li>Never pay anyone to return an item. Bounties are paid directly, only after the hand-over.</li>
                  {openBounty && <li>For high-value items, verify identifying details privately in chat.</li>}
                </ul>
              </div>
            </aside>
          </div>

          {/* ── Right: who + what to do ─────────────────── */}
          <div className="min-w-0">
            <div className="space-y-4 lg:sticky lg:top-24">
              <div className="rounded-card bg-white p-5 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <StatusBadge type={item.type} pet={!!pet} resolved={resolved} variant="soft" size="md" />
                  {openBounty && <BountyBadge amount={openBounty.amount} size="md" />}
                </div>
                {owner && (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-navy-400">Posted by</p>
                    <ProfileCard user={owner} />
                  </div>
                )}
                <div className="mt-4 hidden lg:block">{actionsBlock}</div>
              </div>
            </div>
          </div>
        </div>

        {nearby.length > 0 && (
          <section className="mt-16" aria-labelledby="nearby-h">
            <SectionHeader eyebrow={loc.name} title="More nearby" href={`/map?loc=${loc.id}&dist=3`} hrefLabel="See on map" className="[&_h2]:text-2xl" />
            <div className="mt-6">
              <Rail>
                {nearby.map((n) => {
                  const b = bountyForItem(w, n);
                  return (
                    <RailItem key={n.id}>
                      <ItemCard item={n} bountyAmount={b && b.status === "open" ? b.amount : undefined} distanceKm={distanceKm(loc, getLocation(n.locationId))} className="h-full" />
                    </RailItem>
                  );
                })}
              </Rail>
            </div>
          </section>
        )}
      </Container>

      {/* Mobile sticky action bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-30 border-t border-line/70 px-4 pb-safe pt-3 lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2.5">
          {resolved ? (
            <Button full size="lg" variant="secondary" href="/explore">
              Browse more
            </Button>
          ) : isOwner ? (
            <Button full size="lg" variant="success" onClick={() => setResolve(true)}>
              {lost ? "Mark as resolved" : "Mark as returned"}
            </Button>
          ) : lost ? (
            <>
              <Button full size="lg" onClick={gate(() => setContact("found"))} className="min-w-0 flex-1">
                I Found This
              </Button>
              {openBounty && (
                <Button size="lg" variant="gold" href={me ? `/item/${item.slug}/claim` : "/login"} aria-label={`Claim ${formatMoney(openBounty.amount)} bounty`} iconLeft={<Coins className="size-5" aria-hidden />} className="!px-4">
                  {formatMoney(openBounty.amount)}
                </Button>
              )}
              <Button size="lg" variant="secondary" aria-label="Contact poster" onClick={startChat} className="!px-4">
                <MessageCircle className="size-5" aria-hidden />
              </Button>
            </>
          ) : (
            <>
              <Button full size="lg" variant="found" onClick={gate(() => setContact("mine"))} className="min-w-0 flex-1">
                This is mine
              </Button>
              <Button size="lg" variant="secondary" aria-label="Contact finder" onClick={startChat} className="!px-4">
                <MessageCircle className="size-5" aria-hidden />
              </Button>
            </>
          )}
        </div>
      </div>

      <ShareSheet open={share} onClose={() => setShare(false)} title={title} path={`/item/${item.slug}`} />
      <ReportDialog open={report} onClose={() => setReport(false)} targetType="item" targetId={item.id} subject="this listing" />
      {contact && <ContactSheet open onClose={() => setContact(null)} item={item} mode={contact} />}
      {isOwner && <ResolveDialog open={resolve} onClose={() => setResolve(false)} item={item} />}
      {isOwner && finder && <ThankYouDialog open={thanks} onClose={() => setThanks(false)} user={finder} itemId={item.id} />}
    </article>
  );
}
