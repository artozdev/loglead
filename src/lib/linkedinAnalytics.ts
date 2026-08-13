import "server-only";

import { contentItems, leads } from "@/lib/db";
import type { Lead, LeadStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// LinkedIn Analytics — data layer. Deliberately built ONLY from data we
// genuinely own (the leads + content_items tables). Impressions, profile
// views, followers, engagement, SSI, competitor and viewer-demographic data
// are NOT exposed by any LinkedIn API, so they are surfaced as "locked" in the
// UI rather than faked here.
// ---------------------------------------------------------------------------

export type AnalyticsPeriod = "7d" | "30d" | "90d" | "year";

export const PERIODS: { value: AnalyticsPeriod; days: number }[] = [
  { value: "7d", days: 7 },
  { value: "30d", days: 30 },
  { value: "90d", days: 90 },
  { value: "year", days: 365 },
];

// Lead lifecycle, in funnel order. "lost" sits outside the funnel.
const FUNNEL_STATUSES: LeadStatus[] = [
  "new",
  "contacted",
  "in_discussion",
  "converted",
];

export type StatCard = {
  key: string;
  value: number;
  previous: number;
  format: "int" | "percent";
};

export type FunnelStep = { status: LeadStatus; count: number };

export type SeriesPoint = { date: string; value: number };

export type BreakdownRow = { label: string; count: number };

export type TopPost = {
  id: string;
  title: string;
  publishedDate: string | null;
  status: string;
  attributedLeads: number;
};

export type LinkedInAnalytics = {
  period: AnalyticsPeriod;
  hasLeads: boolean;
  hasPosts: boolean;
  cards: StatCard[];
  funnel: FunnelStep[];
  leadsSeries: SeriesPoint[]; // daily new LinkedIn leads across the window
  postsSeries: SeriesPoint[]; // daily published LinkedIn posts across the window
  topPosts: TopPost[];
  bySector: BreakdownRow[];
  byCompanySize: BreakdownRow[];
  byStatus: BreakdownRow[];
  totalLinkedInLeads: number;
  publishedPosts: number;
};

function dayKey(iso: string): string {
  return iso.slice(0, 10); // YYYY-MM-DD
}

function inWindow(iso: string, start: number, end: number): boolean {
  const t = new Date(iso).getTime();
  return t >= start && t < end;
}

// Aggregate a list of "count by label", keeping the top N and folding the rest
// into "Autres".
function topBreakdown(
  items: (string | undefined)[],
  topN = 4,
): BreakdownRow[] {
  const counts = new Map<string, number>();
  for (const raw of items) {
    const label = (raw ?? "").trim();
    if (!label) continue;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, topN).map(([label, count]) => ({ label, count }));
  const rest = sorted.slice(topN).reduce((s, [, c]) => s + c, 0);
  if (rest > 0) top.push({ label: "Autres", count: rest });
  return top;
}

export async function buildLinkedInAnalytics(
  workspaceId: string,
  period: AnalyticsPeriod = "30d",
): Promise<LinkedInAnalytics> {
  const days = PERIODS.find((p) => p.value === period)?.days ?? 30;
  const now = Date.now();
  const windowMs = days * 24 * 60 * 60 * 1000;
  const curStart = now - windowMs;
  const prevStart = now - 2 * windowMs;

  const allLeads = await leads.listByWorkspace(workspaceId);
  const liLeads = allLeads.filter((l) => l.channel === "linkedin");

  const cur = liLeads.filter((l) => inWindow(l.createdAt, curStart, now));
  const prev = liLeads.filter((l) => inWindow(l.createdAt, prevStart, curStart));

  const countByStatus = (list: Lead[], status: LeadStatus) =>
    list.filter((l) => l.status === status).length;

  const converted = countByStatus(cur, "converted");
  const prevConverted = countByStatus(prev, "converted");
  const inDiscussion = countByStatus(cur, "in_discussion");
  const prevInDiscussion = countByStatus(prev, "in_discussion");

  const convRate = cur.length ? (converted / cur.length) * 100 : 0;
  const prevConvRate = prev.length ? (prevConverted / prev.length) * 100 : 0;

  // ----- Posts (LinkedIn) --------------------------------------------------
  const allContent = await contentItems.listByWorkspace(workspaceId);
  const liPosts = allContent.filter((c) => c.platform === "linkedin");
  const publishedPosts = liPosts.filter((c) => c.status === "published");
  const curPublished = publishedPosts.filter((c) =>
    inWindow(c.createdAt, curStart, now),
  );
  const prevPublished = publishedPosts.filter((c) =>
    inWindow(c.createdAt, prevStart, curStart),
  );

  const cards: StatCard[] = [
    { key: "leads", value: cur.length, previous: prev.length, format: "int" },
    {
      key: "inDiscussion",
      value: inDiscussion,
      previous: prevInDiscussion,
      format: "int",
    },
    { key: "converted", value: converted, previous: prevConverted, format: "int" },
    {
      key: "posts",
      value: curPublished.length,
      previous: prevPublished.length,
      format: "int",
    },
    {
      key: "convRate",
      value: Math.round(convRate * 10) / 10,
      previous: Math.round(prevConvRate * 10) / 10,
      format: "percent",
    },
  ];

  // ----- Funnel (real lead lifecycle) --------------------------------------
  // Each step counts leads that reached at least that stage.
  const stageRank: Record<LeadStatus, number> = {
    new: 0,
    contacted: 1,
    in_discussion: 2,
    converted: 3,
    lost: -1,
  };
  const funnel: FunnelStep[] = FUNNEL_STATUSES.map((status) => ({
    status,
    count: cur.filter(
      (l) => l.status !== "lost" && stageRank[l.status] >= stageRank[status],
    ).length,
  }));

  // ----- Time series (daily) ----------------------------------------------
  const buildSeries = (
    isoDates: string[],
  ): SeriesPoint[] => {
    const buckets = new Map<string, number>();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const iso of isoDates) {
      const k = dayKey(iso);
      if (buckets.has(k)) buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([date, value]) => ({ date, value }));
  };

  const leadsSeries = buildSeries(cur.map((l) => l.createdAt));
  const postsSeries = buildSeries(curPublished.map((c) => c.createdAt));

  // ----- Top posts by attributed leads (real, via sourceContentId) --------
  const leadsByPost = new Map<string, number>();
  for (const l of liLeads) {
    if (l.sourceContentId) {
      leadsByPost.set(
        l.sourceContentId,
        (leadsByPost.get(l.sourceContentId) ?? 0) + 1,
      );
    }
  }
  const topPosts: TopPost[] = publishedPosts
    .map((c) => ({
      id: c.id,
      title: c.title,
      publishedDate: c.scheduledDate ?? c.createdAt.slice(0, 10),
      status: c.status,
      attributedLeads: leadsByPost.get(c.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.attributedLeads - a.attributedLeads ||
        (a.publishedDate! < b.publishedDate! ? 1 : -1),
    )
    .slice(0, 5);

  // ----- Breakdowns (real, from enriched lead fields) ---------------------
  const bySector = topBreakdown(cur.map((l) => l.sector));
  const byCompanySize = topBreakdown(cur.map((l) => l.companySize));
  const byStatus = FUNNEL_STATUSES.concat("lost" as LeadStatus)
    .map((status) => ({ label: status, count: countByStatus(cur, status) }))
    .filter((r) => r.count > 0);

  return {
    period,
    hasLeads: liLeads.length > 0,
    hasPosts: liPosts.length > 0,
    cards,
    funnel,
    leadsSeries,
    postsSeries,
    topPosts,
    bySector,
    byCompanySize,
    byStatus,
    totalLinkedInLeads: liLeads.length,
    publishedPosts: publishedPosts.length,
  };
}
