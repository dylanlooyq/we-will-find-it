import { CtaBand } from "@/components/home/cta-band";
import { NearbyBounties, RecentSection } from "@/components/home/feeds";
import { GoodFinders } from "@/components/home/good-finders";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { CommunityStats } from "@/components/home/stats";
import { TrustStrip } from "@/components/home/trust-strip";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <RecentSection type="lost" />
      <RecentSection type="found" />
      <NearbyBounties />
      <GoodFinders />
      <HowItWorks />
      <CommunityStats />
      <CtaBand />
    </>
  );
}
