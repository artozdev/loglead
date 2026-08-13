import Link from "next/link";
import { Telescope } from "lucide-react";
import MarketIntelligence from "@/components/MarketIntelligence";
import { requireProfile } from "@/lib/guards";

export default async function MarketPage() {
  const { profile } = await requireProfile();
  const competitors = (profile.competitors ?? []).filter(Boolean);
  const diffs = profile.competitorDiffs ?? [];

  // Empty state — the whole page is driven by the competitors/niche in the
  // business profile; without them there's nothing to track.
  if (competitors.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary">
          <Telescope size={26} strokeWidth={1.5} />
        </div>
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">
          Ton market intelligence est vide
        </h1>
        <p className="mt-2 text-muted">
          Ajoute tes concurrents et ta niche dans ton profil pour suivre ton marché
          automatiquement.
        </p>
        <Link href="/settings?tab=saas" className="btn-primary mt-6 inline-flex">
          Compléter mon profil
        </Link>
      </div>
    );
  }

  return (
    <MarketIntelligence
      saasName={profile.saasName}
      icp={profile.icp}
      sector={profile.sector}
      competitors={competitors.map((name, i) => ({ name, diff: diffs[i] }))}
    />
  );
}
