// Analytics data layer.
//
// V1 has no native publishing, so there is no real post-performance feed yet.
// This module generates deterministic, per-account demo metrics so the
// Analytics dashboard is fully functional. When you connect real platform APIs
// (LinkedIn/Instagram/TikTok) and UTM tracking, replace `generateAnalytics`
// with the real source — the dashboard (cards, chart, aggregation) is unchanged
// because it only consumes `DailyPoint[]`.

export type MetricKey =
  | "views"
  | "engagement"
  | "likes"
  | "comments"
  | "shares"
  | "saves"
  | "followers"
  | "ctr"
  | "leads";

export type MetricKind = "count" | "rate";

export type MetricDef = {
  key: MetricKey;
  label: string;
  color: string;
  kind: MetricKind;
};

// Order matches the requested card order.
export const METRICS: MetricDef[] = [
  { key: "views", label: "Vues", color: "#0051FF", kind: "count" },
  { key: "engagement", label: "Engagement", color: "#0085FF", kind: "count" },
  { key: "likes", label: "Likes", color: "#EC4899", kind: "count" },
  { key: "comments", label: "Commentaires", color: "#10B981", kind: "count" },
  { key: "shares", label: "Partages", color: "#F59E0B", kind: "count" },
  { key: "saves", label: "Enregistrements", color: "#8B5CF6", kind: "count" },
  { key: "followers", label: "Abonnés gagnés", color: "#06B6D4", kind: "count" },
  { key: "ctr", label: "Taux de clic", color: "#6366F1", kind: "rate" },
  { key: "leads", label: "Leads générés", color: "#EF4444", kind: "count" },
];

export type DailyPoint = {
  date: string; // YYYY-MM-DD
  values: Record<MetricKey, number>;
};

export type Granularity = "day" | "week" | "month";

export type Bucket = {
  label: string;
  values: Record<MetricKey, number>;
};

// ----- Deterministic generator --------------------------------------------

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

export function generateAnalytics(
  seed: string,
  days = 180,
  endDate = new Date(),
): DailyPoint[] {
  const rand = mulberry32(hashSeed(seed));
  const viewsBase = 900 + Math.floor(rand() * 600); // 900–1500/day baseline
  const points: DailyPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    const dow = d.getDay();
    const weekend = dow === 0 || dow === 6;

    const trend = 1 + ((days - 1 - i) / days) * 0.6; // ~+60% over the window
    const season = weekend ? 0.8 : 1.05;
    const noise = 0.85 + rand() * 0.3;

    const views = Math.max(50, Math.round(viewsBase * trend * season * noise));
    const likes = Math.round(views * (0.05 + rand() * 0.03));
    const comments = Math.round(views * (0.005 + rand() * 0.006));
    const shares = Math.round(views * (0.008 + rand() * 0.006));
    const saves = Math.round(views * (0.012 + rand() * 0.012));
    const engagement = likes + comments + shares + saves;
    const ctr = Number((2.5 + rand() * 3).toFixed(2)); // 2.5–5.5 %
    const clicks = (views * ctr) / 100;
    const leads = Math.round(clicks * (0.08 + rand() * 0.12));
    const followers = Math.max(0, Math.round(views * 0.008 + rand() * 8 - 2));

    points.push({
      date: isoDate(d),
      values: { views, engagement, likes, comments, shares, saves, followers, ctr, leads },
    });
  }
  return points;
}

// ----- Aggregation ---------------------------------------------------------

const EMPTY = (): Record<MetricKey, number> =>
  METRICS.reduce(
    (acc, m) => {
      acc[m.key] = 0;
      return acc;
    },
    {} as Record<MetricKey, number>,
  );

// Sum count metrics, average rate metrics, over a set of daily points.
export function summarize(points: DailyPoint[]): Record<MetricKey, number> {
  const out = EMPTY();
  if (points.length === 0) return out;
  for (const m of METRICS) {
    const total = points.reduce((sum, p) => sum + p.values[m.key], 0);
    out[m.key] = m.kind === "rate" ? total / points.length : total;
  }
  return out;
}

// Current period (last `rangeDays`) vs the immediately preceding period.
export function periodSummary(daily: DailyPoint[], rangeDays: number) {
  const n = daily.length;
  const current = daily.slice(Math.max(0, n - rangeDays));
  const previous = daily.slice(
    Math.max(0, n - 2 * rangeDays),
    Math.max(0, n - rangeDays),
  );
  return { current: summarize(current), previous: summarize(previous) };
}

const MONTHS_SHORT = [
  "janv.", "févr.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function bucketKeyLabel(
  d: Date,
  g: Granularity,
): { key: string; label: string } {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  if (g === "day") return { key: isoDate(d), label: `${dd}/${mm}` };
  if (g === "week") {
    const monday = new Date(d);
    monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    const md = String(monday.getDate()).padStart(2, "0");
    const mmo = String(monday.getMonth() + 1).padStart(2, "0");
    return { key: isoDate(monday), label: `${md}/${mmo}` };
  }
  return {
    key: `${d.getFullYear()}-${mm}`,
    label: `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
  };
}

// Bucket daily points by granularity, preserving chronological order.
export function bucketize(
  points: DailyPoint[],
  g: Granularity,
): Bucket[] {
  const order: string[] = [];
  const groups = new Map<string, { label: string; points: DailyPoint[] }>();
  for (const p of points) {
    const { key, label } = bucketKeyLabel(parseDate(p.date), g);
    if (!groups.has(key)) {
      groups.set(key, { label, points: [] });
      order.push(key);
    }
    groups.get(key)!.points.push(p);
  }
  return order.map((key) => {
    const g2 = groups.get(key)!;
    return { label: g2.label, values: summarize(g2.points) };
  });
}
