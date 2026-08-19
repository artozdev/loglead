import GeoBoard from "@/components/GeoBoard";
import { visibilityScans } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

const SCAN_QUOTA = { free: 0, starter: 1, growth: 5, pro: Infinity } as const;
const HISTORY_LIMIT = { free: 0, starter: 0, growth: 3, pro: 12 } as const;

export default async function GeoPage() {
  const { workspace, profile } = await requireProfile();
  const plan = workspace.plan;

  const all = await visibilityScans.listByWorkspace(workspace.id);
  // Legacy scans stored X/6 — normalize to 0-100 for a single scale.
  const norm = (scan: (typeof all)[number]) =>
    scan.queryRows ? scan.globalScore : Math.round((scan.globalScore / 6) * 100);
  const history = all.slice(0, HISTORY_LIMIT[plan]).map((s, i) => {
    // Delta vs the chronologically previous scan (list is newest-first).
    const prev = i + 1 < all.length ? all[i + 1] : undefined;
    return {
      id: s.id,
      date: s.createdAt,
      score: norm(s),
      delta: prev ? norm(s) - norm(prev) : null,
      llmScores: s.queryRows ? s.llmScores ?? null : null,
      isGeo: Boolean(s.queryRows),
    };
  });

  // Latest GEO scan (if any) pre-fills the boards without re-scanning.
  const geoScans = all.filter((s) => s.queryRows);
  const latest = geoScans[0];
  const prevGeo = geoScans[1];

  const used = await visibilityScans.countThisMonth(workspace.id);
  const quota = SCAN_QUOTA[plan];

  return (
    <GeoBoard
      initialUrl={profile.siteUrl ?? ""}
      saasName={profile.saasName}
      competitors={profile.competitors.filter(Boolean)}
      plan={plan}
      scansLeft={quota === Infinity ? null : Math.max(0, quota - used)}
      history={history}
      prevScore={prevGeo ? prevGeo.globalScore : null}
      prevRows={prevGeo?.queryRows ?? null}
      initialScan={
        latest
          ? {
              rows: latest.queryRows!,
              llmScores: latest.llmScores ?? {},
              globalScore: latest.globalScore,
              recommendations: latest.recommendations,
              competitorScores: latest.competitorScores ?? [],
              competitorInsights: latest.competitorInsights ?? [],
              actionPlan: latest.actionPlan ?? [],
              date: latest.createdAt,
            }
          : null
      }
    />
  );
}
