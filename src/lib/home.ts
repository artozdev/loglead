import "server-only";
import {
  contentAnalyses as analysesRepo,
  contentItems as contentRepo,
  conversations as conversationsRepo,
  inboxMessages as inboxRepo,
  leads as leadsRepo,
  visibilityScans as visibilityRepo,
} from "./db";
import type { Vars } from "./i18n";
import { planAllows } from "./plan";
import { contentScore } from "./score";
import {
  CONTENT_STATUS_META,
  leadChannelLabel,
  leadStatusLabel,
  type ContentStatus,
  type ContentType,
  type LeadChannel,
  type LeadStatus,
  type Plan,
  type Platform,
  platformLabel,
} from "./types";

// ---------------------------------------------------------------------------
// Server-side aggregation for the home dashboard.
//
// The dashboard reflects ONLY what ships today: Studio IA, Algo Insider,
// Calendrier éditorial, Analyseur de contenu. Data comes exclusively from
// content_items + content_analyses (+ scheduled items = calendar_events).
// No Leads / Analytics / CMO IA / audience metrics.
// ---------------------------------------------------------------------------

const nf = new Intl.NumberFormat("fr-FR");

const monthPrefix = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const deltaPct = (cur: number, prev: number) =>
  prev === 0 ? (cur === 0 ? 0 : 100) : ((cur - prev) / prev) * 100;

function truncate(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s;
}

// "il y a 2 h" / "hier" / "il y a 3 j" / "à l'instant"
function relTime(iso: string, now: number): string {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.round(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "hier";
  if (d < 7) return `il y a ${d} j`;
  const w = Math.round(d / 7);
  return `il y a ${w} sem.`;
}

const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const FORMAT_LABEL: Record<ContentType, string> = {
  linkedin_post: "Post",
  reel_script: "Script",
  instagram_caption: "Légende",
  story: "Story",
};

// ----- Public shapes (serializable → client) --------------------------------

export type Kpi = {
  key: "generated" | "published" | "analyses" | "score" | "leads" | "visibility";
  label: string;
  tone: string; // tailwind classes for the icon tile (icon chosen by key in the UI)
  value: number; // numeric target (for the count-up)
  display: string; // formatted value ("—" = no data yet, shown as-is)
  delta: number; // % vs previous month
  deltaLabel?: string; // free-form delta text (overrides the % rendering)
  href?: string; // makes the card clickable
  accent?: boolean;
};

export type UpcomingItem = {
  id: string;
  title: string;
  platform: string;
  platformInitial: string;
  day: number;
  month: string;
  time: string;
  badge: "ready" | "draft";
};

export type RecentContent = {
  id: string;
  title: string;
  platform: string;
  platformInitial: string;
  format: string;
  score: number;
  status: ContentStatus;
  statusLabel: string;
  time: string;
  action: "publish" | "edit";
};

// ----- Dashboard v3 : per-network audience blocks ---------------------------
// The app has no live analytics source yet (connections are demo-only), so
// audience figures — followers, weekly views, engagement, active hours — are
// deterministic demo data seeded from the workspace id (same philosophy as the
// AI demo mode). Calendar, today's timeline and published content are REAL.

export type DashNetwork = "linkedin" | "x" | "reddit" | "instagram";

export type NetworkCard = {
  network: DashNetwork;
  label: string;
  followerLabel: string; // "Abonnés" / "Followers" / "Membres"
  value: number;
  delta: number; // followers gained this month
  comments: number;
  likes: number;
  color: string; // stable color for the logo tile / chart series
  comingSoon: boolean; // Instagram in V1 → greyed "Bientôt"
};

export type WeeklyPerf = {
  days: string[]; // ["Lun", …, "Dim"]
  series: { network: DashNetwork; label: string; color: string; values: number[] }[];
  totalViews: number;
  avgEngagement: number; // %
  publishedCount: number; // REAL: published this month
  viewsDelta: number; // % vs previous week (demo)
  engagementDelta: number; // pts (demo)
  publishedDelta: number; // REAL
};

export type EngagementSeries = {
  months: string[];
  series: { network: DashNetwork; label: string; color: string; values: number[]; maxIndex: number; delta: number }[];
};

export type ActiveHours = {
  // 7 rows (Lun→Dim) × 24 cols; intensity 0..1
  networks: {
    network: DashNetwork;
    label: string;
    grid: number[][];
    peakLabel: string; // "Mardi 14h-16h"
    engagements: number;
    likes: number;
    shares: number;
  }[];
};

export type TimelineItem = {
  id: string;
  time: string; // "09:43"
  title: string;
  platform: string;
  platformInitial: string;
  status: ContentStatus;
  statusLabel: string;
};

// Dashboard "Inbox & DM" block — the 5 most recent conversations.
export type InboxPreviewItem = {
  id: string;
  leadId: string;
  leadName: string;
  channel: LeadChannel; // lead acquisition channel (drives the colored icon)
  channelLabel: string;
  preview: string;
  time: string; // relative
  unread: boolean;
  badge: "interested" | "followup" | null;
};

// Dashboard "Leads récents" block — the 4 newest leads.
export type RecentLead = {
  id: string;
  name: string;
  channel: LeadChannel;
  channelLabel: string;
  status: LeadStatus;
  statusLabel: string;
};

export type PublishedCard = {
  id: string;
  title: string;
  platform: string;
  platformInitial: string;
  color: string;
  status: ContentStatus;
  statusLabel: string;
  views: number; // demo
  engagement: string; // demo range, e.g. "2k-5k"
};

// ----- Dashboard v4 : LinkedIn-first B2B repositioning ----------------------
// Business-outcome cards + a LinkedIn growth chart + pipeline/outreach blocks.
// Real where the data exists (leads & their scores, GEO, scheduled content,
// content scores); LinkedIn impressions stay seeded (no Unipile yet).

// Locale-neutral: the UI resolves label/unit/sub/delta from `card.<key>.*` keys
// with these vars, so the dashboard switches language instantly (no reload).
export type B2bCard = {
  key: "reach" | "leads" | "pipeline" | "score" | "visibility";
  display: string; // big value (numbers)
  good: boolean;
  href?: string;
  subVars: Vars;
  deltaVars: Vars;
  hasDelta: boolean;
};

export type LinkedInMetric = {
  key: string;
  labelKey: string; // i18n key for the dropdown label
  values: number[]; // one per day
  goal: number | null; // weekly objective line
  format: "int" | "pct";
};

export type LinkedInGrowth = { days: string[]; metrics: LinkedInMetric[] };

export type PipelineContent = {
  id: string;
  title: string;
  format: string;
  day: number;
  month: string;
  time: string;
  score: number | null;
  status: "ready" | "draft" | "review" | "tocreate";
};

export type QualifiedLead = {
  id: string;
  name: string;
  role: string; // "CEO · OrbitSoft"
  score: number;
  signalKey: string; // "signal.hot" | "signal.warm" | "signal.cool"
};

export type GrowthPartner = {
  isPro: boolean;
  leadId: string | null;
  leadName: string | null;
  leadScore: number;
  nextPost: { day: number; month: string; time: string } | null;
};

export type B2bData = {
  isPro: boolean;
  cards: B2bCard[];
  growth: LinkedInGrowth;
  pipeline: PipelineContent[];
  qualifiedLeads: QualifiedLead[];
  growthPartner: GrowthPartner;
};

export type HomeData = {
  firstName: string;
  workspaceName: string;
  dateLabel: string;
  empty: boolean;
  b2b: B2bData;
  leadsEnabled: boolean; // Leads module unlocked (Growth/Pro) → surface it
  kpis: Kpi[];
  upcoming: UpcomingItem[];
  recentContent: RecentContent[];
  // v3 blocks
  networks: NetworkCard[];
  weekly: WeeklyPerf;
  engagement: EngagementSeries;
  activeHours: ActiveHours;
  calendarMonthLabel: string;
  calendarFirstWeekday: number; // 0 = Monday … 6 = Sunday, for grid alignment
  calendarDays: { day: number; hasContent: boolean; isToday: boolean }[];
  todayTimeline: TimelineItem[];
  published: PublishedCard[];
  demoMetrics: boolean; // audience figures are demo
  // Acquisition blocks (Growth/Pro only — empty arrays otherwise)
  inboxPreview: InboxPreviewItem[];
  inboxUnread: number;
  recentLeads: RecentLead[];
  inboxEnabled: boolean;
};

const platformInitial = (p: Platform) => platformLabel(p).charAt(0).toUpperCase();

// ----- Demo audience generators (deterministic per workspace) ---------------

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
// Small seeded PRNG so the same workspace always yields the same demo figures.
function rng(seed: number): () => number {
  let a = seed || 1;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DASH_NETWORKS: {
  network: DashNetwork;
  label: string;
  followerLabel: string;
  color: string;
  comingSoon: boolean;
  base: number; // follower base magnitude
}[] = [
  { network: "linkedin", label: "LinkedIn", followerLabel: "Abonnés", color: "#0A66C2", comingSoon: false, base: 12000 },
  { network: "x", label: "X", followerLabel: "Followers", color: "var(--color-x)", comingSoon: false, base: 8000 },
  { network: "reddit", label: "Reddit", followerLabel: "Membres", color: "#FF4500", comingSoon: false, base: 3000 },
  { network: "instagram", label: "Instagram", followerLabel: "Followers", color: "#C13584", comingSoon: true, base: 5000 },
];

const DAY_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const FULL_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

function buildNetworkCards(workspaceId: string): NetworkCard[] {
  return DASH_NETWORKS.map((n) => {
    const r = rng(hashSeed(`${workspaceId}:${n.network}:followers`));
    const value = Math.round(n.base * (0.7 + r() * 0.9));
    return {
      network: n.network,
      label: n.label,
      followerLabel: n.followerLabel,
      color: n.color,
      comingSoon: n.comingSoon,
      value,
      delta: Math.round(value * (0.03 + r() * 0.08)),
      comments: Math.round(2000 + r() * 4000),
      likes: Math.round(600 + r() * 1400),
    };
  });
}

function buildWeekly(workspaceId: string, publishedCount: number, publishedDelta: number): WeeklyPerf {
  const active = DASH_NETWORKS.filter((n) => !n.comingSoon);
  const series = active.map((n) => {
    const r = rng(hashSeed(`${workspaceId}:${n.network}:weekly`));
    const scale = n.base / 250;
    const values = DAY_LABELS.map(() => Math.round((20 + r() * 30) * scale));
    return { network: n.network, label: n.label, color: n.color, values };
  });
  const totalViews = series.reduce((a, s) => a + s.values.reduce((x, y) => x + y, 0), 0);
  const r = rng(hashSeed(`${workspaceId}:summary`));
  return {
    days: DAY_LABELS,
    series,
    totalViews,
    avgEngagement: Math.round((3 + r() * 3) * 10) / 10,
    publishedCount,
    viewsDelta: Math.round(5 + r() * 15),
    engagementDelta: Math.round((0.3 + r() * 1) * 10) / 10,
    publishedDelta,
  };
}

function buildEngagement(workspaceId: string): EngagementSeries {
  const now = new Date();
  const months: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(MONTHS_SHORT[d.getMonth()].replace(".", ""));
  }
  const active = DASH_NETWORKS.filter((n) => !n.comingSoon);
  const series = active.map((n) => {
    const r = rng(hashSeed(`${workspaceId}:${n.network}:engagement`));
    const scale = n.base / 1000;
    let acc = 8 * scale + r() * 4 * scale;
    const values = months.map(() => {
      acc += (r() - 0.35) * 3 * scale;
      return Math.max(1, Math.round(acc * 1000));
    });
    const maxIndex = values.indexOf(Math.max(...values));
    return { network: n.network, label: n.label, color: n.color, values, maxIndex, delta: Math.round(5 + r() * 20) };
  });
  return { months, series };
}

function buildActiveHours(workspaceId: string): ActiveHours {
  const active = DASH_NETWORKS.filter((n) => !n.comingSoon);
  const networks = active.map((n) => {
    const r = rng(hashSeed(`${workspaceId}:${n.network}:hours`));
    let peak = { day: 1, hour: 14, v: 0 };
    const grid = FULL_DAYS.map((_, di) =>
      Array.from({ length: 24 }, (_, hi) => {
        // Working hours + midday/evening peaks are more active; weekends quieter.
        const dayFactor = di >= 5 ? 0.5 : 1;
        const hourFactor =
          hi >= 8 && hi <= 21 ? (hi === 12 || hi === 14 || hi === 18 ? 1 : 0.6) : 0.15;
        const v = Math.min(1, dayFactor * hourFactor * (0.5 + r()));
        if (v > peak.v) peak = { day: di, hour: hi, v };
        return Math.round(v * 100) / 100;
      }),
    );
    return {
      network: n.network,
      label: n.label,
      grid,
      peakLabel: `${FULL_DAYS[peak.day]} ${peak.hour}h-${peak.hour + 2}h`,
      engagements: Math.round(8000 + r() * 10000),
      likes: Math.round(800 + r() * 1200),
      shares: Math.round(400 + r() * 900),
    };
  });
  return { networks };
}

// ----- B2B (LinkedIn-first) dashboard data ---------------------------------

const DEAL_VALUE = 2000; // default average deal value (€) for the pipeline estimate
const B2B_QUALIFIED = 70;
const B2B_HOT = 85;

const compactNum = (n: number) =>
  new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);

function buildB2b(
  workspaceId: string,
  plan: Plan,
  content: ReturnType<typeof contentRepo.listByWorkspace>,
  now: Date,
): B2bData {
  const isPro = plan === "pro";
  const nowMs = now.getTime();
  const WEEK = 7 * 86_400_000;
  const thisMonth = monthPrefix(now);
  const prevMonth = monthPrefix(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const leadsList = planAllows(plan, "leads") ? leadsRepo.listByWorkspace(workspaceId) : [];
  const qualified = leadsList.filter((l) => (l.score ?? 0) >= B2B_QUALIFIED);
  const qualifiedCur = qualified.filter((l) => l.createdAt.slice(0, 7) === thisMonth).length;
  const qualifiedPrev = qualified.filter((l) => l.createdAt.slice(0, 7) === prevMonth).length;
  const hot = leadsList.filter((l) => (l.score ?? 0) >= B2B_HOT);
  const inDiscussion = leadsList.filter((l) => l.status === "in_discussion");

  // GEO
  const scans = visibilityRepo.listByWorkspace(workspaceId);
  const geoOf = (s: (typeof scans)[number]) =>
    s.queryRows ? s.globalScore : Math.round((s.globalScore / 6) * 100);
  const geo = scans[0] ? geoOf(scans[0]) : null;
  const geoDelta = scans[0] && scans[1] ? geoOf(scans[0]) - geoOf(scans[1]) : null;

  // Content score (published this week, else this month)
  const publishedMonth = content.filter((c) => c.status === "published" && c.createdAt.slice(0, 7) === thisMonth);
  const publishedWeek = content.filter((c) => c.status === "published" && nowMs - new Date(c.createdAt).getTime() <= WEEK);
  const scorePool = publishedWeek.length ? publishedWeek : publishedMonth;
  const contentScoreWeek = scorePool.length
    ? Math.round(scorePool.reduce((a, c) => a + contentScore(c.id), 0) / scorePool.length)
    : 0;

  // Seeded LinkedIn reach (no live analytics source yet)
  const r = rng(hashSeed(`${workspaceId}:li-reach`));
  const reach = Math.round(9000 + r() * 8000);
  const reachDelta = Math.round(10 + r() * 40);
  const connections = Math.round(reach * (0.02 + r() * 0.03));

  const pipelineValue = qualified.length * DEAL_VALUE;

  const arrowNum = (n: number) => (n > 0 ? `↑ +${n}` : n < 0 ? `↓ ${n}` : "→ 0");

  const cards: B2bCard[] = [
    {
      key: "reach",
      display: compactNum(reach),
      good: true,
      subVars: { views: compactNum(Math.round(reach * 1.4)), connections },
      deltaVars: { delta: reachDelta },
      hasDelta: true,
    },
    {
      key: "leads",
      display: String(qualifiedCur),
      good: qualifiedCur >= qualifiedPrev,
      subVars: { hot: hot.length },
      deltaVars: { d: arrowNum(qualifiedCur - qualifiedPrev) },
      hasDelta: true,
    },
    {
      key: "pipeline",
      display: pipelineValue > 0 ? `${compactNum(pipelineValue)}€` : "—",
      good: true,
      subVars: { n: inDiscussion.length },
      deltaVars: { amount: compactNum(qualifiedCur * DEAL_VALUE) },
      hasDelta: qualifiedCur > 0,
    },
    {
      key: "score",
      display: contentScoreWeek > 0 ? `${contentScoreWeek}/100` : "—",
      good: true,
      subVars: { n: publishedMonth.length },
      deltaVars: {},
      hasDelta: false,
    },
    {
      key: "visibility",
      display: geo !== null ? `${geo}/100` : "—",
      good: (geoDelta ?? 0) >= 0,
      href: "/geo",
      subVars: {},
      deltaVars: { d: geoDelta !== null ? arrowNum(geoDelta) : "" },
      hasDelta: geoDelta !== null && geoDelta !== 0,
    },
  ];

  // ----- LinkedIn Growth area chart (7 days) -----
  const days: string[] = [];
  const leadsPerDay: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    days.push(DAY_LABELS[(d.getDay() + 6) % 7]);
    const ymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    leadsPerDay.push(leadsList.filter((l) => l.createdAt.slice(0, 10) === ymd).length);
  }
  const seededSeries = (salt: string, base: number, span: number) => {
    const g = rng(hashSeed(`${workspaceId}:li:${salt}`));
    return days.map(() => Math.round(base + g() * span));
  };
  const impressions = seededSeries("impr", 800, 2400);
  const growth: LinkedInGrowth = {
    days,
    metrics: [
      { key: "impressions", labelKey: "chart.impressions", values: impressions, goal: Math.round(Math.max(...impressions) * 0.9), format: "int" },
      { key: "engagement", labelKey: "chart.engagement", values: seededSeries("eng", 3, 5), goal: 6, format: "pct" },
      { key: "leads", labelKey: "chart.leads", values: leadsPerDay, goal: null, format: "int" },
    ],
  };

  // ----- Content pipeline (next 4 scheduled) -----
  const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const pipeline: PipelineContent[] = content
    .filter((c) => c.scheduledDate && c.scheduledDate >= todayYmd)
    .sort((a, b) =>
      `${a.scheduledDate}T${a.scheduledTime ?? "09:00"}` < `${b.scheduledDate}T${b.scheduledTime ?? "09:00"}` ? -1 : 1,
    )
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      // Strip any " · Channel" suffix so the LinkedIn-only dashboard never shows X/Reddit/Email.
      title: truncate(c.title.replace(/\s*·\s*(LinkedIn|X|Reddit|Email|Instagram)\s*$/i, ""), 34),
      format: FORMAT_LABEL[c.type],
      day: Number(c.scheduledDate!.slice(8)),
      month: MONTHS_SHORT[Number(c.scheduledDate!.slice(5, 7)) - 1],
      time: c.scheduledTime ?? "09:00",
      score: contentScore(c.id),
      status: c.status === "scheduled" ? "ready" : "draft",
    }));

  // ----- Pipeline intelligence (top 5 qualified leads, score > 60) -----
  // LinkedIn-only signal key derived from the score tier (localized in the UI).
  const signalKey = (score: number): string =>
    score >= 85 ? "signal.hot" : score >= 70 ? "signal.warm" : "signal.cool";
  const qualifiedLeads: QualifiedLead[] = [...leadsList]
    .filter((l) => (l.score ?? 0) > 60)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 5)
    .map((l) => ({
      id: l.id,
      name: `${l.firstName} ${l.lastName}`.trim(),
      role: [l.jobTitle, l.company].filter(Boolean).join(" · ") || "—",
      score: l.score ?? 0,
      signalKey: signalKey(l.score ?? 0),
    }));

  // ----- AI Growth Partner (Pro) -----
  const topLead = qualifiedLeads[0];
  const nextPost = pipeline[0];
  const growthPartner: GrowthPartner = {
    isPro,
    leadId: topLead?.id ?? null,
    leadName: topLead?.name ?? null,
    leadScore: topLead?.score ?? 0,
    nextPost: nextPost ? { day: nextPost.day, month: nextPost.month, time: nextPost.time } : null,
  };

  return { isPro, cards, growth, pipeline, qualifiedLeads, growthPartner };
}

export function buildHomeData(
  workspaceId: string,
  workspaceName: string,
  email: string,
  plan: Plan,
): HomeData {
  const now = new Date();
  const nowMs = now.getTime();
  const thisMonth = monthPrefix(now);
  const prevMonth = monthPrefix(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const content = contentRepo.listByWorkspace(workspaceId); // newest first
  const analyses = analysesRepo.listByWorkspace(workspaceId);

  const createdIn = (prefix: string) =>
    content.filter((c) => c.createdAt.slice(0, 7) === prefix);
  const analysesIn = (prefix: string) =>
    analyses.filter((a) => a.createdAt.slice(0, 7) === prefix);

  const avgScore = (items: typeof content) =>
    items.length === 0
      ? 0
      : items.reduce((acc, c) => acc + contentScore(c.id), 0) / items.length;

  // ----- KPIs ---------------------------------------------------------------
  const generatedTotal = content.length;
  const generatedCur = createdIn(thisMonth).length;
  const generatedPrev = createdIn(prevMonth).length;

  const publishedCur = createdIn(thisMonth).filter((c) => c.status === "published").length;
  const publishedPrev = createdIn(prevMonth).filter((c) => c.status === "published").length;

  const analysesTotal = analyses.length;
  const analysesCur = analysesIn(thisMonth).length;
  const analysesPrev = analysesIn(prevMonth).length;

  const scoreAll = avgScore(content);
  const scoreCur = avgScore(createdIn(thisMonth));
  const scorePrev = avgScore(createdIn(prevMonth));

  const empty = content.length === 0 && analyses.length === 0;

  const kpis: Kpi[] = [
    {
      key: "generated",
      label: "Contenus générés",
      tone: "bg-primary/10 text-primary",
      value: generatedTotal,
      display: nf.format(generatedTotal),
      delta: deltaPct(generatedCur, generatedPrev),
      accent: true,
    },
    {
      key: "published",
      label: "Contenus publiés",
      tone: "bg-emerald-100 text-emerald-600",
      value: publishedCur,
      display: nf.format(publishedCur),
      delta: deltaPct(publishedCur, publishedPrev),
    },
    {
      key: "analyses",
      label: "Analyses effectuées",
      tone: "bg-violet-100 text-violet-600",
      value: analysesTotal,
      display: nf.format(analysesTotal),
      delta: deltaPct(analysesCur, analysesPrev),
    },
    {
      key: "score",
      label: "Score moyen",
      tone: "bg-amber-100 text-amber-600",
      value: Math.round(scoreAll),
      display: scoreAll === 0 ? "—" : `${Math.round(scoreAll)}/100`,
      delta: deltaPct(scoreCur, scorePrev),
    },
  ];

  // GEO — latest scan score /100, delta vs the previous scan. Legacy scans
  // stored X/6; normalize them to the 0-100 scale.
  const scans = visibilityRepo.listByWorkspace(workspaceId); // newest first
  const geoScore = (s: (typeof scans)[number]) =>
    s.queryRows ? s.globalScore : Math.round((s.globalScore / 6) * 100);
  const latestScan = scans[0];
  const prevScan = scans[1];
  const visDelta =
    latestScan && prevScan ? geoScore(latestScan) - geoScore(prevScan) : 0;
  kpis.push({
    key: "visibility",
    label: "Score GEO",
    tone: "bg-indigo-100 text-indigo-600",
    value: latestScan ? geoScore(latestScan) : 0,
    display: latestScan ? `${geoScore(latestScan)}/100` : "—",
    delta: 0,
    deltaLabel:
      latestScan && visDelta !== 0
        ? `${visDelta > 0 ? "↑ +" : "↓ "}${visDelta} pts ce mois`
        : undefined,
    href: "/geo",
  });

  // Leads is a Growth/Pro module — surface a "new leads this month" KPI when unlocked.
  const leadsEnabled = planAllows(plan, "leads");
  if (leadsEnabled) {
    const leadsList = leadsRepo.listByWorkspace(workspaceId);
    const leadsCur = leadsList.filter((l) => l.createdAt.slice(0, 7) === thisMonth).length;
    const leadsPrev = leadsList.filter((l) => l.createdAt.slice(0, 7) === prevMonth).length;
    kpis.push({
      key: "leads",
      label: "Nouveaux leads",
      tone: "bg-sky-100 text-sky-600",
      value: leadsCur,
      display: nf.format(leadsCur),
      delta: deltaPct(leadsCur, leadsPrev),
    });
  }

  // ----- Prochaines publications (next 4 scheduled) -------------------------
  const todayYmd = now.toISOString().slice(0, 10);
  const upcoming: UpcomingItem[] = content
    .filter((c) => c.scheduledDate && c.scheduledDate >= todayYmd)
    .sort((a, b) => {
      const ka = `${a.scheduledDate}T${a.scheduledTime ?? "09:00"}`;
      const kb = `${b.scheduledDate}T${b.scheduledTime ?? "09:00"}`;
      return ka < kb ? -1 : 1;
    })
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      title: truncate(c.title, 35),
      platform: platformLabel(c.platform),
      platformInitial: platformInitial(c.platform),
      day: Number(c.scheduledDate!.slice(8)),
      month: MONTHS_SHORT[Number(c.scheduledDate!.slice(5, 7)) - 1],
      time: c.scheduledTime ?? "09:00",
      badge: c.status === "scheduled" ? "ready" : "draft",
    }));

  // ----- Derniers contenus (latest 5 generated) ----------------------------
  const recentContent: RecentContent[] = content.slice(0, 5).map((c) => ({
    id: c.id,
    title: truncate(c.title, 40),
    platform: platformLabel(c.platform),
    platformInitial: platformInitial(c.platform),
    format: FORMAT_LABEL[c.type],
    score: contentScore(c.id),
    status: c.status,
    statusLabel: CONTENT_STATUS_META[c.status].label,
    time: relTime(c.createdAt, nowMs),
    action: c.status === "scheduled" ? "publish" : "edit",
  }));

  // ----- v3 : REAL calendar + today's timeline + published cards ------------
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const todayDay = now.getDate();
  const scheduledDaysThisMonth = new Set(
    content
      .filter((c) => c.scheduledDate?.slice(0, 7) === thisMonth)
      .map((c) => Number(c.scheduledDate!.slice(8, 10))),
  );
  const calendarMonthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
  // Monday-first offset for the grid (0 = Monday … 6 = Sunday).
  const calendarFirstWeekday = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7;
  const calendarDays = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    hasContent: scheduledDaysThisMonth.has(i + 1),
    isToday: i + 1 === todayDay,
  }));

  const todayTimeline: TimelineItem[] = content
    .filter((c) => c.scheduledDate === todayYmd)
    .sort((a, b) => (a.scheduledTime ?? "09:00").localeCompare(b.scheduledTime ?? "09:00"))
    .map((c) => ({
      id: c.id,
      time: c.scheduledTime ?? "09:00",
      title: truncate(c.title, 40),
      platform: platformLabel(c.platform),
      platformInitial: platformInitial(c.platform),
      status: c.status,
      statusLabel: CONTENT_STATUS_META[c.status].label,
    }));

  const ENG_RANGES = ["500-1k", "1k-2k", "2k-5k", "5k-10k"];
  const published: PublishedCard[] = content
    .filter((c) => c.status === "published")
    .slice(0, 6)
    .map((c) => {
      const r = rng(hashSeed(`${workspaceId}:${c.id}:pub`));
      return {
        id: c.id,
        title: truncate(c.title, 90),
        platform: platformLabel(c.platform),
        platformInitial: platformInitial(c.platform),
        color: DASH_NETWORKS.find((n) => n.label === platformLabel(c.platform))?.color ?? "#0051FF",
        status: c.status,
        statusLabel: CONTENT_STATUS_META[c.status].label,
        views: Math.round(120 + r() * 900),
        engagement: ENG_RANGES[Math.floor(r() * ENG_RANGES.length)],
      };
    });

  const publishedDeltaCount = publishedCur - publishedPrev;

  // ----- Inbox & DM + recent leads (Growth/Pro) -----------------------------
  const inboxEnabled = planAllows(plan, "inbox");
  let inboxPreview: InboxPreviewItem[] = [];
  let inboxUnread = 0;
  let recentLeads: RecentLead[] = [];

  if (inboxEnabled) {
    const allLeads = leadsRepo.listByWorkspace(workspaceId); // newest first
    const leadById = new Map(allLeads.map((l) => [l.id, l]));

    inboxPreview = conversationsRepo
      .listByWorkspace(workspaceId)
      .flatMap((c) => {
        const lead = leadById.get(c.leadId);
        if (!lead) return [];
        const msgs = inboxRepo.listByConversation(c.id);
        const last = msgs[msgs.length - 1];
        const unread = last?.direction === "inbound" && !last.readAt;
        // "Intéressé" once the lead replied / is in discussion; "À relancer"
        // when we're waiting on them for 3+ days.
        const waitingDays =
          c.status === "waiting" && c.lastMessageAt
            ? Math.floor((nowMs - new Date(c.lastMessageAt).getTime()) / 86_400_000)
            : 0;
        const badge: InboxPreviewItem["badge"] =
          lead.status === "in_discussion" || lead.status === "converted"
            ? "interested"
            : waitingDays >= 3
              ? "followup"
              : null;
        return [
          {
            id: c.id,
            leadId: lead.id,
            leadName: `${lead.firstName} ${lead.lastName}`.trim(),
            channel: lead.channel,
            channelLabel: leadChannelLabel(lead.channel),
            preview: last ? truncate(last.content.replace(/\s+/g, " "), 70) : "Aucun message",
            time: relTime(c.lastMessageAt ?? c.createdAt, nowMs),
            unread,
            badge,
          },
        ];
      })
      .slice(0, 5);
    inboxUnread = inboxPreview.filter((c) => c.unread).length;

    recentLeads = allLeads.slice(0, 4).map((l) => ({
      id: l.id,
      name: `${l.firstName} ${l.lastName}`.trim(),
      channel: l.channel,
      channelLabel: leadChannelLabel(l.channel),
      status: l.status,
      statusLabel: leadStatusLabel(l.status),
    }));
  }

  const local = (email.split("@")[0] || email).replace(/[._-]+/g, " ").trim();
  const firstName = local.charAt(0).toUpperCase() + local.split(" ")[0].slice(1);

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);

  return {
    firstName,
    workspaceName,
    dateLabel: dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1),
    empty,
    b2b: buildB2b(workspaceId, plan, content, now),
    leadsEnabled,
    kpis,
    upcoming,
    recentContent,
    networks: buildNetworkCards(workspaceId),
    weekly: buildWeekly(workspaceId, publishedCur, publishedDeltaCount),
    engagement: buildEngagement(workspaceId),
    activeHours: buildActiveHours(workspaceId),
    calendarMonthLabel,
    calendarFirstWeekday,
    calendarDays,
    todayTimeline,
    published,
    demoMetrics: true,
    inboxPreview,
    inboxUnread,
    recentLeads,
    inboxEnabled,
  };
}
