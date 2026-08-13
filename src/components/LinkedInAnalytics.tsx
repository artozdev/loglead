"use client";

import { Lock, TrendingDown, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type {
  AnalyticsPeriod,
  BreakdownRow,
  FunnelStep,
  LinkedInAnalytics as Data,
  SeriesPoint,
  StatCard,
  TopPost,
} from "@/lib/linkedinAnalytics";
import { leadStatusLabel } from "@/lib/types";

const PERIOD_LABELS: Record<AnalyticsPeriod, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
  year: "Cette année",
};

const CARD_LABELS: Record<string, string> = {
  leads: "Leads LinkedIn",
  inDiscussion: "En discussion",
  converted: "Convertis",
  posts: "Posts publiés",
  convRate: "Taux de conversion",
};

// Metrics LinkedIn locks behind its own UI — surfaced honestly, never faked.
const LOCKED_METRICS = [
  "Impressions",
  "Vues de profil",
  "Nouveaux abonnés",
  "Taux d'engagement",
  "Social Selling Index (SSI)",
  "Démographie de l'audience",
  "Benchmark concurrents",
  "Heatmap des meilleures heures",
];

// ---- Count-up animation ----------------------------------------------------
function useCountUp(target: number, duration = 600) {
  const [value, setValue] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const from = ref.current;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function formatValue(v: number, format: StatCard["format"]): string {
  if (format === "percent") return `${(Math.round(v * 10) / 10).toFixed(1)}%`;
  return Math.round(v).toLocaleString("fr-FR");
}

function delta(current: number, previous: number): { pct: number | null; up: boolean } {
  if (previous === 0) return { pct: current > 0 ? 100 : null, up: current >= previous };
  const pct = ((current - previous) / previous) * 100;
  return { pct: Math.round(pct), up: pct >= 0 };
}

function StatCardView({ card }: { card: StatCard }) {
  const animated = useCountUp(card.value);
  const d = delta(card.value, card.previous);
  return (
    <div className="card !p-4">
      <p className="text-xs font-medium text-muted">{CARD_LABELS[card.key] ?? card.key}</p>
      <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink">
        {formatValue(animated, card.format)}
      </p>
      {d.pct === null ? (
        <p className="mt-1 text-xs text-faint">Pas d&apos;historique</p>
      ) : (
        <p
          className={`mt-1 flex items-center gap-1 text-xs font-medium ${
            d.up ? "text-success" : "text-danger"
          }`}
        >
          {d.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {d.up ? "+" : ""}
          {d.pct}% vs période préc.
        </p>
      )}
    </div>
  );
}

// ---- SVG area chart (maison, pas de Recharts) ------------------------------
function AreaChart({ series }: { series: SeriesPoint[] }) {
  const W = 640;
  const H = 220;
  const pad = { top: 16, right: 12, bottom: 24, left: 28 };
  const max = Math.max(1, ...series.map((p) => p.value));
  const innerW = W - pad.left - pad.right;
  const innerH = H - pad.top - pad.bottom;
  const x = (i: number) =>
    pad.left + (series.length <= 1 ? 0 : (i / (series.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;

  const line = series.map((p, i) => `${i === 0 ? "M" : "L"} ${x(i)} ${y(p.value)}`).join(" ");
  const area = `${line} L ${x(series.length - 1)} ${pad.top + innerH} L ${x(0)} ${pad.top + innerH} Z`;

  const ticks = 3;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Croissance des leads">
      <defs>
        <linearGradient id="li-area" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--c-primary))" stopOpacity="0.22" />
          <stop offset="100%" stopColor="rgb(var(--c-primary))" stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: ticks + 1 }).map((_, i) => {
        const gy = pad.top + (i / ticks) * innerH;
        return (
          <line
            key={i}
            x1={pad.left}
            y1={gy}
            x2={W - pad.right}
            y2={gy}
            stroke="var(--border)"
            strokeWidth="0.5"
          />
        );
      })}
      <path d={area} fill="url(#li-area)" />
      <path d={line} fill="none" stroke="rgb(var(--c-primary))" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {series.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r="2" fill="rgb(var(--c-primary))">
          <title>{`${p.date} : ${p.value}`}</title>
        </circle>
      ))}
    </svg>
  );
}

function Insight({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border-l-[3px] border-primary bg-primary/[0.06] px-3.5 py-2.5 text-sm text-ink">
      💡 {children}
    </div>
  );
}

function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(1, steps[0]?.count ?? 1);
  return (
    <div className="space-y-2">
      {steps.map((s, i) => {
        const width = Math.max(6, (s.count / top) * 100);
        const conv = i === 0 ? 100 : top ? Math.round((s.count / top) * 100) : 0;
        return (
          <div key={s.status} className="flex items-center gap-3">
            <div className="w-28 shrink-0 text-sm text-muted">{leadStatusLabel(s.status)}</div>
            <div className="relative h-8 flex-1 overflow-hidden rounded-md bg-surface-hover">
              <div
                className="flex h-full items-center rounded-md bg-brand-gradient px-2.5 text-xs font-semibold text-white transition-[width] duration-500"
                style={{ width: `${width}%` }}
              >
                {s.count}
              </div>
            </div>
            <div className="w-12 shrink-0 text-right text-xs text-faint">{conv}%</div>
          </div>
        );
      })}
    </div>
  );
}

function BreakdownList({ title, rows }: { title: string; rows: BreakdownRow[] }) {
  const total = rows.reduce((s, r) => s + r.count, 0) || 1;
  return (
    <div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <div className="mt-3 space-y-2.5">
        {rows.length === 0 && <p className="text-xs text-faint">Aucune donnée enrichie.</p>}
        {rows.map((r) => {
          const pct = Math.round((r.count / total) * 100);
          return (
            <div key={r.label}>
              <div className="flex justify-between text-xs">
                <span className="truncate text-muted">{r.label}</span>
                <span className="font-medium text-ink">{pct}%</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopPosts({ posts }: { posts: TopPost[] }) {
  if (posts.length === 0) {
    return <p className="text-sm text-faint">Aucun post LinkedIn publié sur la période.</p>;
  }
  return (
    <div className="space-y-2.5">
      {posts.map((p, i) => (
        <div key={p.id} className="rounded-lg border border-line p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-medium text-ink">{p.title}</p>
            <span className="shrink-0 text-xs font-semibold text-faint">#{i + 1}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {p.attributedLeads} lead{p.attributedLeads > 1 ? "s" : ""} généré
            {p.attributedLeads > 1 ? "s" : ""} · Publié le {p.publishedDate}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function LinkedInAnalytics({ data }: { data: Data }) {
  const router = useRouter();
  const [metric, setMetric] = useState<"leads" | "posts">("leads");
  const series = metric === "leads" ? data.leadsSeries : data.postsSeries;

  const converted = data.funnel.find((s) => s.status === "converted")?.count ?? 0;
  const newCount = data.funnel.find((s) => s.status === "new")?.count ?? 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            LinkedIn Analytics
          </h1>
          <p className="mt-1 text-muted">
            Ta performance LinkedIn, basée sur tes vraies données de pipeline.
          </p>
        </div>
        <select
          value={data.period}
          onChange={(e) => router.push(`/linkedin-analytics?period=${e.target.value}`)}
          className="input !w-auto !py-2 text-sm"
          aria-label="Période"
        >
          {(Object.keys(PERIOD_LABELS) as AnalyticsPeriod[]).map((p) => (
            <option key={p} value={p}>
              {PERIOD_LABELS[p]}
            </option>
          ))}
        </select>
      </div>

      {/* Block 1 — Stat cards (all real) */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        {data.cards.map((c) => (
          <StatCardView key={c.key} card={c} />
        ))}
      </div>

      {/* Block 2 — Funnel (real lead lifecycle) */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-ink">Ton funnel LinkedIn</h2>
        <p className="mt-1 text-sm text-muted">
          Du premier contact au lead converti — cycle de vie réel de tes prospects.
        </p>
        <div className="mt-5">
          <Funnel steps={data.funnel} />
        </div>
        {newCount > 0 && (
          <Insight>
            {converted > 0
              ? `${converted} lead${converted > 1 ? "s" : ""} converti${converted > 1 ? "s" : ""} sur ${newCount} entré${newCount > 1 ? "s" : ""} — soit ${Math.round((converted / newCount) * 100)}% de conversion.`
              : `Aucune conversion encore sur cette période. Relance tes ${data.funnel.find((s) => s.status === "contacted")?.count ?? 0} leads contactés.`}
          </Insight>
        )}
      </div>

      {/* Block 3 — Growth chart + top posts */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="card lg:col-span-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold text-ink">Croissance dans le temps</h2>
            <div className="flex gap-1 rounded-lg border border-line p-0.5">
              {(["leads", "posts"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMetric(m)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                    metric === m ? "bg-primary text-white" : "text-muted hover:text-ink"
                  }`}
                >
                  {m === "leads" ? "Leads" : "Posts"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <AreaChart series={series} />
          </div>
        </div>
        <div className="card lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">Meilleurs posts</h2>
          <p className="mt-1 text-sm text-muted">Triés par leads générés (attribution réelle).</p>
          <div className="mt-4">
            <TopPosts posts={data.topPosts} />
          </div>
        </div>
      </div>

      {/* Block 4 — Breakdowns (real, from enriched leads) */}
      <div className="card">
        <h2 className="font-display text-lg font-semibold text-ink">Profil de tes leads LinkedIn</h2>
        <p className="mt-1 text-sm text-muted">
          Répartition de tes prospects — enrichie via FullEnrich.
        </p>
        <div className="mt-5 grid gap-8 md:grid-cols-3">
          <BreakdownList title="Par statut" rows={data.byStatus.map((r) => ({ label: leadStatusLabel(r.label as never), count: r.count }))} />
          <BreakdownList title="Par secteur" rows={data.bySector} />
          <BreakdownList title="Par taille d'entreprise" rows={data.byCompanySize} />
        </div>
      </div>

      {/* Locked section — honest about LinkedIn API limits */}
      <div className="card border-dashed">
        <div className="flex items-center gap-2">
          <Lock size={16} className="text-faint" />
          <h2 className="font-display text-lg font-semibold text-ink">
            Métriques LinkedIn natives
          </h2>
          <span className="chip border-line text-faint">Bientôt</span>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-muted">
          Ces métriques ne sont pas exposées par l&apos;API LinkedIn — elles ne sont visibles
          que dans LinkedIn lui-même. Elles s&apos;afficheront ici dès qu&apos;une source de
          données LinkedIn sera connectée. On n&apos;affiche jamais de chiffres inventés.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {LOCKED_METRICS.map((m) => (
            <div
              key={m}
              className="flex items-center gap-2 rounded-lg border border-line bg-surface-hover/50 px-3 py-2.5 text-sm text-muted opacity-70"
            >
              <Lock size={13} className="shrink-0 text-faint" />
              <span className="truncate">{m}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
