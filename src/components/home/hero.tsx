import { HeartHandshake, PartyPopper } from "lucide-react";
import { getLocation } from "@/lib/data/taxonomy";
import { users } from "@/lib/data/users";
import { seedWorld } from "@/lib/world";
import { AvatarStack } from "../ui/avatar";
import { BountyBadge, StatusBadge } from "../ui/badges";
import { Button } from "../ui/button";
import { ItemImage } from "../ui/item-image";
import { Container } from "../ui/section";
import { PostButton } from "../layout/post-chooser";
import { FloatPin, SkylineArt } from "./hero-art";
import { HeroSearch } from "./hero-search";
import { Search } from "lucide-react";

/** "Lost something? Found something? We will find it." */
export function Hero() {
  const iphone = seedWorld.itemBySlug.get("iphone-14-pro-orchard")!;
  const iphoneBounty = seedWorld.bountyById.get(iphone.bountyId!)!;
  const keys = seedWorld.itemBySlug.get("toyota-car-keys-punggol-waterway")!;
  const finders = users.filter((u) => ["u_jasmine", "u_marcus", "u_weilin", "u_dylan"].includes(u.id));

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#fff1ea] via-[#fff6f6] to-canvas">
      <div aria-hidden className="absolute -left-24 top-10 -z-10 size-[26rem] rounded-full bg-coral-200/50 blur-3xl" />
      <div aria-hidden className="absolute -right-32 top-32 -z-10 size-[30rem] rounded-full bg-violet-200/50 blur-3xl" />

      <Container className="grid items-center gap-10 pb-14 pt-10 sm:pt-14 lg:grid-cols-[1.12fr_1fr] lg:gap-10 lg:pb-24 lg:pt-16">
        <div className="animate-fade-up">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-bold text-coral-700 shadow-soft backdrop-blur">
            <HeartHandshake className="size-4" aria-hidden />
            Singapore&rsquo;s Lost &amp; Found Community
          </p>
          <h1 className="mt-5 text-[2.3rem] font-extrabold leading-[1.04] tracking-tight text-navy-900 min-[400px]:text-[2.6rem] sm:text-6xl lg:text-[3.85rem] xl:text-[4.1rem]">
            Lost something?
            <br />
            Found something?
            <br />
            <span className="text-coral-600">We will find it.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-navy-600 sm:text-xl">
            Singapore&rsquo;s community-powered lost &amp; found platform. Post in under a minute — neighbours, commuters and finders do the rest.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <PostButton size="xl" className="sm:min-w-52">
              Post Something
            </PostButton>
            <Button href="/explore" variant="secondary" size="xl" iconLeft={<Search className="size-5" aria-hidden />}>
              Explore Lost &amp; Found
            </Button>
          </div>

          <div className="mt-6 hidden sm:block">
            <HeroSearch />
          </div>

          <div className="mt-8 flex items-center gap-3">
            <AvatarStack users={finders} size="md" />
            <p className="text-sm leading-snug text-navy-600">
              <strong className="font-extrabold text-navy-900">4,823 helpful finders</strong>
              <br />
              reuniting people with their things across Singapore
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
          <div className="relative aspect-[6/5.4] overflow-hidden rounded-[2rem] shadow-pop ring-1 ring-white/70 sm:aspect-[6/5]">
            <SkylineArt />
            <FloatPin tone="gold" className="left-[53%] top-[24%]" />
            <FloatPin tone="lost" className="left-[17%] top-[40%]" delay="-1.6s" />
            <FloatPin tone="found" className="left-[79%] top-[38%]" delay="-3s" />
          </div>

          {/* Floating product cards */}
          <div className="absolute -left-2 top-6 w-[15.5rem] animate-float rounded-2xl bg-white p-2.5 shadow-lift sm:-left-6 sm:w-[17rem]" style={{ animationDuration: "6s" }}>
            <div className="flex gap-3">
              <ItemImage image={iphone.images[1]} category="electronics" compact className="size-16 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge type="lost" variant="soft" />
                  <BountyBadge amount={iphoneBounty.amount} variant="soft" label={false} />
                </div>
                <p className="mt-1 truncate text-sm font-extrabold text-navy-900">iPhone 14 Pro</p>
                <p className="truncate text-xs text-navy-600">{getLocation(iphone.locationId).name}</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-5 right-2 w-[15rem] animate-float rounded-2xl bg-white p-2.5 shadow-lift sm:-right-4 sm:w-[16.5rem]" style={{ animationDuration: "7s", animationDelay: "-2s" }}>
            <div className="flex gap-3">
              <ItemImage image={keys.images[0]} category="keys" compact className="size-16 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <StatusBadge type="found" variant="soft" />
                <p className="mt-1 truncate text-sm font-extrabold text-navy-900">Toyota car keys</p>
                <p className="truncate text-xs text-navy-600">{getLocation(keys.locationId).name}</p>
              </div>
            </div>
          </div>

          <div className="absolute -bottom-3 left-3 hidden items-center gap-2.5 rounded-2xl bg-mint-700 px-4 py-2.5 text-white shadow-lift sm:flex">
            <PartyPopper className="size-5" aria-hidden />
            <p className="text-sm font-bold leading-tight">
              Waffles is home!
              <span className="block text-xs font-medium text-white">Reunited 2 days ago</span>
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
