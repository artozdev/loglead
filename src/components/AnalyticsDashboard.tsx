"use client";

import { useMemo, useState } from "react";
import {
  bucketize,
  METRICS,
  periodSummary,
  type DailyPoint,
  type Granularity,
  type MetricKey,
} from "@/lib/analytics";
import MetricChart from "./MetricChart";

const RANGES = [
  { days: 7, label: "7 jours" },
  { days: 30, label: "30 jours" },
  { days: 90, label: "90 jours" },
];

const GRANULARITIES: { value: Granularity; label: string }[] = [
  { value: "day", label: "Jour" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
];

function fmt(key: MetricKey, kind: "count" | "rate", v: number): string {
  if (kind === "rate") return `${v.toFixed(1).replace(".", ",")} %`;
  const n = new Intl.NumberFormat("fr-FR").format(Math.round(v));
  return key === "followers" ? `+${n}` : n;
}

function deltaPct(cur: number, prev: number): number {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return ((cur - prev) / prev) * 100;
}

export default function AnalyticsDashboard({
  daily,
}: {
  daily: DailyPoint[];
}) {
  const [rangeDays, setRangeDays] = useState(30);
  const [granularity, setGranularity] = useState<Granularity>("day");
  const [visible, setVisible] = useState<Set<MetricKey>>(
    new Set<MetricKey>(["views", "engagement"]),
  );

  const rangePoints = useMemo(
    () => daily.slice(Math.max(0, daily.length - rangeDays)),
    [daily, rangeDays],
  );

  const { current, previous } = useMemo(
    () => periodSummary(daily, rangeDays),
    [daily, rangeDays],
  );

  const buckets = useMemo(
    () => bucketize(rangePoints, granularity),
    [rangePoints, granularity],
  );

  const series = useMemo(
    () =>
      METRICS.filter((m) => visible.has(m.key)).map((m) => ({
        key: m.key,
        label: m.label,
        color: m.color,
        data: buckets.map((b) => b.values[m.key]),
      })),
    [buckets, visible],
  );

  function toggle(key: MetricKey) {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key); // keep at least one series
      } else {
        next.add(key);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Analytics</h1>
          <p className="mt-1 text-muted">
            Vue d&apos;ensemble de tes performances sur la période sélectionnée.
          </p>
        </div>
        <span className="chip border-amber-200 bg-amber-50 text-amber-700">
          Données de démonstration
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-line bg-surface p-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                rangeDays === r.days
                  ? "bg-brand-gradient text-white shadow-soft"
                  : "text-muted hover:bg-canvas"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="inline-flex rounded-xl border border-line bg-surface p-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g.value}
              onClick={() => setGranularity(g.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                granularity === g.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:bg-canvas"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {METRICS.map((m) => {
          const cur = current[m.key];
          const prev = previous[m.key];
          const d = deltaPct(cur, prev);
          const up = d >= 0;
          const spark = rangePoints.map((p) => p.values[m.key]);
          const primary = m.key === "views";
          return (
            <div key={m.key} className="card relative overflow-hidden">
              {primary && <span className="kpi-accent" />}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: m.color }}
                  />
                  <span className="text-sm font-medium text-muted">
                    {m.label}
                  </span>
                </div>
                <span
                  className={`num text-xs font-semibold ${
                    up ? "text-success" : "text-danger"
                  }`}
                >
                  {up ? "▲" : "▼"} {Math.abs(d).toFixed(1).replace(".", ",")} %
                </span>
              </div>
              <div className="mt-2 flex items-end justify-between gap-2">
                <div className="num font-display font-display text-2xl font-semibold tracking-tight text-ink">
                  {fmt(m.key, m.kind, cur)}
                </div>
                <Sparkline values={spark} color={m.color} />
              </div>
              <div className="mt-1 text-xs text-muted/80">
                vs période précédente
              </div>
            </div>
          );
        })}
      </div>

      {/* Performance chart */}
      <div className="card space-y-4">
        <div>
          <h2 className="font-display text-base font-semibold">Performance dans le temps</h2>
          <p className="text-sm text-muted">
            Active/désactive une métrique dans la légende pour comparer les
            courbes.
          </p>
        </div>

        {/* Legend toggles */}
        <div className="flex flex-wrap gap-2">
          {METRICS.map((m) => {
            const on = visible.has(m.key);
            return (
              <button
                key={m.key}
                onClick={() => toggle(m.key)}
                className={`chip cursor-pointer ${
                  on
                    ? "border-gray-300 text-ink"
                    : "border-line text-muted"
                }`}
              >
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: on ? m.color : "#d1d5db" }}
                />
                {m.label}
              </button>
            );
          })}
        </div>

        <MetricChart
          series={series}
          xLabels={buckets.map((b) => b.label)}
          formatValue={(key, v) => {
            const def = METRICS.find((m) => m.key === key)!;
            return fmt(def.key, def.kind, v);
          }}
        />
      </div>
    </div>
  );
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const w = 72;
  const h = 28;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((v - min) / span) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.8}
      />
    </svg>
  );
}
