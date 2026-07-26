"use client";

import { useState } from "react";

export type ChartSeries = {
  key: string;
  label: string;
  color: string;
  data: number[];
};

// Lightweight, dependency-free multi-series line chart (responsive SVG).
// Auto-scales to the max of the currently visible series and supports a hover
// guide with a tooltip listing each series value at the nearest point.
export default function MetricChart({
  series,
  xLabels,
  formatValue,
}: {
  series: ChartSeries[];
  xLabels: string[];
  formatValue?: (key: string, v: number) => string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const W = 1000;
  const H = 320;
  const padL = 48;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const n = xLabels.length;
  const max = Math.max(
    1,
    ...series.flatMap((s) => s.data),
  );
  // Round the max up to a "nice" number for the axis.
  const niceMax = niceCeil(max);

  const x = (i: number) => (n <= 1 ? padL + plotW / 2 : padL + (i / (n - 1)) * plotW);
  const y = (v: number) => padT + (1 - v / niceMax) * plotH;

  const gridLines = 4;

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratioPx = (e.clientX - rect.left) / rect.width; // 0..1 across full width
    const inner = (ratioPx - padL / W) / (plotW / W); // 0..1 across plot
    const idx = Math.round(Math.min(1, Math.max(0, inner)) * (n - 1));
    setActive(Number.isFinite(idx) ? idx : null);
  }

  // X-axis label thinning to avoid crowding.
  const labelStep = Math.max(1, Math.ceil(n / 8));

  return (
    <div
      className="relative w-full"
      onMouseMove={onMove}
      onMouseLeave={() => setActive(null)}
    >
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-[320px] w-full"
        role="img"
      >
        <defs>
          <linearGradient id="lead-line" x1="0" y1="0" x2={W} y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#0051FF" />
            <stop offset="1" stopColor="#0085FF" />
          </linearGradient>
          <linearGradient id="lead-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0051FF" stopOpacity="0.14" />
            <stop offset="1" stopColor="#0051FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines + y labels */}
        {Array.from({ length: gridLines + 1 }).map((_, i) => {
          const v = (niceMax / gridLines) * (gridLines - i);
          const yy = padT + (i / gridLines) * plotH;
          return (
            <g key={i}>
              <line
                x1={padL}
                x2={W - padR}
                y1={yy}
                y2={yy}
                stroke="#eef0f4"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={padL - 8}
                y={yy + 4}
                textAnchor="end"
                fontSize={11}
                fill="#9aa3b2"
              >
                {compact(v)}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {xLabels.map((lbl, i) =>
          i % labelStep === 0 || i === n - 1 ? (
            <text
              key={i}
              x={x(i)}
              y={H - 8}
              textAnchor="middle"
              fontSize={11}
              fill="#9aa3b2"
            >
              {lbl}
            </text>
          ) : null,
        )}

        {/* Active vertical guide */}
        {active !== null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={padT}
            y2={padT + plotH}
            stroke="#cbd5e1"
            strokeWidth={1}
            strokeDasharray="4 3"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Series — the primary (index 0) carries the signature "Lead line" */}
        {series.map((s, si) => {
          const primary = si === 0;
          const baseline = padT + plotH;
          const areaPath =
            n > 1
              ? `M ${x(0)},${baseline} L ` +
                s.data.map((v, i) => `${x(i)},${y(v)}`).join(" L ") +
                ` L ${x(n - 1)},${baseline} Z`
              : "";
          return (
            <g key={s.key}>
              {primary && n > 1 && (
                <path d={areaPath} fill="url(#lead-area)" stroke="none" />
              )}
              {n > 1 && (
                <polyline
                  points={s.data.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
                  fill="none"
                  stroke={primary ? "url(#lead-line)" : s.color}
                  strokeWidth={primary ? 2.5 : 2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {active !== null && s.data[active] !== undefined && (
                <circle
                  cx={x(active)}
                  cy={y(s.data[active])}
                  r={3.5}
                  fill="#fff"
                  stroke={primary ? "#0051FF" : s.color}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              )}
              {n === 1 && (
                <circle cx={x(0)} cy={y(s.data[0] ?? 0)} r={4} fill={primary ? "#0051FF" : s.color} />
              )}
            </g>
          );
        })}
      </svg>

      {/* Tooltip */}
      {active !== null && series.length > 0 && (
        <div
          className="pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-soft"
          style={{
            left: `${((padL + (n <= 1 ? plotW / 2 : (active / (n - 1)) * plotW)) / W) * 100}%`,
          }}
        >
          <div className="mb-1 font-semibold text-ink/80">
            {xLabels[active]}
          </div>
          <div className="space-y-0.5">
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-2 whitespace-nowrap">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-muted">{s.label}</span>
                <span className="ml-auto font-medium text-ink">
                  {formatValue
                    ? formatValue(s.key, s.data[active])
                    : Math.round(s.data[active]).toLocaleString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

function compact(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
  return `${Math.round(v)}`;
}
