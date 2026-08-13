import Link from "next/link";
import LinkedInAnalytics from "@/components/LinkedInAnalytics";
import { requireProfile } from "@/lib/guards";
import {
  buildLinkedInAnalytics,
  PERIODS,
  type AnalyticsPeriod,
} from "@/lib/linkedinAnalytics";

export default async function LinkedInAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { workspace } = await requireProfile();
  const raw = (await searchParams).period;
  const period: AnalyticsPeriod = PERIODS.some((p) => p.value === raw)
    ? (raw as AnalyticsPeriod)
    : "30d";

  const data = await buildLinkedInAnalytics(workspace.id, period);

  // Empty state — no LinkedIn leads and no LinkedIn posts yet.
  if (!data.hasLeads && !data.hasPosts) {
    return (
      <div className="mx-auto max-w-md py-16 text-center">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
          LinkedIn Analytics
        </h1>
        <p className="mt-3 text-muted">
          Tes analytics apparaîtront ici dès ton premier post LinkedIn et tes premiers
          leads. Commence par générer et publier un post.
        </p>
        <Link href="/post-generator" className="btn-primary mt-6 inline-flex">
          Créer mon premier post
        </Link>
      </div>
    );
  }

  return <LinkedInAnalytics data={data} />;
}
