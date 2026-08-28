"use client";

import Link from "next/link";
import { ChevronRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { Prospect, Search as SearchType } from "@/lib/types";

// ---------------------------------------------------------------------------
// Home dashboard — Waalaxy-like: metric cards + "À faire", activity chart,
// recent searches + hot prospects. Charts are hand-rolled SVG (no Recharts).
// ---------------------------------------------------------------------------

const GREEN = "#22C55E";
const BLUE = "#0051FF";
const AMBER = "#F59E0B";
const RED = "#EF4444";

function rel(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1 / 24) return "à l'instant";
  if (d < 1) return `il y a ${Math.max(1, Math.floor(d * 24))}h`;
  if (d < 2) return "hier";
  if (d < 7) return `il y a ${Math.floor(d)}j`;
  return `il y a ${Math.floor(d / 7)} sem`;
}

function initials(s: string) {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

const AVATAR_COLORS = ["#0051FF", "#7C3AED", "#0891B2", "#DB2777", "#059669", "#EA580C", "#4F46E5"];
function avatarColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function scoreColor(n: number) {
  return n > 80 ? GREEN : n >= 60 ? AMBER : RED;
}

// ----- Daily buckets for the activity chart -------------------------------
type Bucket = { label: string; found: number; qualified: number };
function buildDaily(prospects: Prospect[], days: number): Bucket[] {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const buckets: { t: number; found: number; qualified: number; d: Date }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(start);
    d.setDate(start.getDate() - i);
    buckets.push({ t: d.getTime(), found: 0, qualified: 0, d });
  }
  const first = buckets[0].t;
  for (const p of prospects) {
    const dt = new Date(p.createdAt);
    dt.setHours(0, 0, 0, 0);
    if (dt.getTime() < first) continue;
    const idx = Math.round((dt.getTime() - first) / 86400000);
    if (idx >= 0 && idx < buckets.length) {
      buckets[idx].found++;
      if (p.fitScore >= 70) buckets[idx].qualified++;
    }
  }
  return buckets.map((b) => ({
    label: `${b.d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "")} ${b.d.getDate()}`,
    found: b.found,
    qualified: b.qualified,
  }));
}

// ----- Sparkline (mini area line) -----------------------------------------
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 80, h = 32;
  const max = Math.max(1, ...data);
  const n = data.length;
  const pts = data.map((v, i) => [n === 1 ? w : (i / (n - 1)) * w, h - (v / max) * (h - 4) - 2]);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
  const area = `${line} L${w} ${h} L0 ${h} Z`;
  const id = `sg-${color.slice(1)}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} fill="none" className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {pts.length > 0 && <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="2.2" fill={color} />}
    </svg>
  );
}

// ----- Activity chart ------------------------------------------------------
function ActivityChart({ buckets }: { buckets: Bucket[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 760, H = 210, padL = 26, padR = 12, padT = 12, padB = 26;
  const n = buckets.length;
  const maxV = Math.max(1, ...buckets.map((b) => Math.max(b.found, b.qualified)));
  const ticks = maxV <= 4 ? maxV : 4;
  const x = (i: number) => padL + (n <= 1 ? 0 : (i / (n - 1)) * (W - padL - padR));
  const y = (v: number) => padT + (1 - v / maxV) * (H - padT - padB);
  const pathOf = (key: "found" | "qualified") =>
    buckets.map((b, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(b[key]).toFixed(1)}`).join(" ");
  const areaFound = `${pathOf("found")} L${x(n - 1)} ${H - padB} L${x(0)} ${H - padB} Z`;
  // Thin X labels to ~7.
  const labelEvery = Math.max(1, Math.ceil(n / 7));
  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-[210px] w-full">
        {/* gridlines + y ticks */}
        {Array.from({ length: ticks + 1 }, (_, i) => {
          const v = Math.round((maxV / ticks) * i);
          const gy = y(v);
          return (
            <g key={i}>
              <line x1={padL} x2={W - padR} y1={gy} y2={gy} stroke="#F1F5F9" strokeWidth="1" />
              <text x={padL - 6} y={gy + 3} textAnchor="end" fontSize="9" fill="#94A3B8">{v}</text>
            </g>
          );
        })}
        {/* found area + line */}
        <path d={areaFound} fill={BLUE} fillOpacity="0.06" />
        <path d={pathOf("found")} stroke={BLUE} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* qualified dashed line */}
        <path d={pathOf("qualified")} stroke={GREEN} strokeWidth="2" strokeDasharray="4 4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {/* hover guide + points */}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={padT} y2={H - padB} stroke="#CBD5E1" strokeWidth="1" strokeDasharray="3 3" />}
        {buckets.map((b, i) => (
          <g key={i}>
            {hover === i && <circle cx={x(i)} cy={y(b.found)} r="3.2" fill={BLUE} stroke="#fff" strokeWidth="1.5" />}
            {hover === i && <circle cx={x(i)} cy={y(b.qualified)} r="3.2" fill={GREEN} stroke="#fff" strokeWidth="1.5" />}
          </g>
        ))}
        {/* x labels */}
        {buckets.map((b, i) => (i % labelEvery === 0 || i === n - 1) ? (
          <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="#94A3B8">{b.label}</text>
        ) : null)}
        {/* hover hit areas */}
        {buckets.map((_, i) => (
          <rect key={i} x={x(i) - (W - padL - padR) / (2 * Math.max(1, n - 1))} y={0} width={(W - padL - padR) / Math.max(1, n - 1)} height={H} fill="transparent"
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover((h) => (h === i ? null : h))} />
        ))}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-2 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[11px] shadow-md" style={{ left: `calc(${(x(hover) / W) * 100}% - 40px)` }}>
          <div className="font-medium text-ink">{buckets[hover].label}</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: BLUE }} />{buckets[hover].found} trouvés</div>
          <div className="flex items-center gap-1.5 text-muted"><span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />{buckets[hover].qualified} qualifiés</div>
        </div>
      )}
    </div>
  );
}

// ----- Avatar --------------------------------------------------------------
function Avatar({ name, dot }: { name: string; dot?: string }) {
  return (
    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: avatarColor(name) }}>
      {initials(name)}
      {dot && <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface" style={{ background: dot }} />}
    </span>
  );
}

export default function HomeBoard({
  firstName,
  prospects,
  searches,
}: {
  firstName: string;
  credits: number;
  prospects: Prospect[];
  searches: SearchType[];
}) {
  const [days, setDays] = useState(7);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const empty = prospects.length === 0 && searches.length === 0;

  // Metrics
  const now = Date.now();
  const total = prospects.length;
  const qualifiedAll = prospects.filter((p) => p.fitScore >= 70);
  const qualifyRate = total ? Math.round((qualifiedAll.length / total) * 100) : 0;
  const q7 = qualifiedAll.filter((p) => (now - new Date(p.createdAt).getTime()) / 864e5 < 7).length;
  const qPrev = qualifiedAll.filter((p) => {
    const a = (now - new Date(p.createdAt).getTime()) / 864e5;
    return a >= 7 && a < 14;
  }).length;
  const qChange = qPrev ? Math.round(((q7 - qPrev) / qPrev) * 100) : q7 > 0 ? 100 : 0;

  const daily7 = useMemo(() => buildDaily(prospects, 7), [prospects]);
  const buckets = useMemo(() => buildDaily(prospects, days), [prospects, days]);
  const rangeFound = buckets.reduce((s, b) => s + b.found, 0);

  const foundSpark = daily7.map((b) => b.found);
  const qualSpark = daily7.map((b) => b.qualified);

  // À faire
  const todoAll = prospects.filter((p) => p.stage !== "converted" && p.stage !== "archived");
  const todo = [...todoAll].sort((a, b) => b.fitScore - a.fitScore).slice(0, 5);
  function todoAction(p: Prospect): { label: string; cls: string; note?: string; dot?: string } {
    if (p.contactStatus === "replied" || p.lastReplyReceived) return { label: "Répondre", cls: "text-primary" };
    if (p.contactStatus === "message_sent" || p.lastMessageSentAt) return { label: "Relancer", cls: "text-[#F59E0B]", dot: RED, note: "Le prospect est en phase de suivi" };
    return { label: "Vérifier", cls: "text-muted", note: "Le prospect est en phase de découverte" };
  }

  // Hot prospects
  const hot = [...prospects].filter((p) => p.fitScore >= 70).sort((a, b) => b.fitScore - a.fitScore).slice(0, 5);

  const metrics: { label: string; icon: string; value: React.ReactNode; sub: React.ReactNode; spark: number[]; color: string; badge?: { text: string; ok: boolean } }[] = [
    {
      label: "Prospects trouvés", icon: "🔭", value: empty ? "—" : total,
      sub: <>7 derniers jours</>, spark: foundSpark, color: GREEN,
    },
    {
      label: "Taux de qualification", icon: "✦", value: empty ? "—" : <>{qualifyRate}<span className="text-[18px] font-semibold text-muted">%</span></>,
      sub: `${qualifyRate}% de taux de qualification`, spark: qualSpark, color: GREEN,
      badge: { text: `${qualifyRate}%`, ok: qualifyRate >= 60 },
    },
    {
      label: "Prospects qualifiés", icon: "✦", value: empty ? "—" : qualifiedAll.length,
      sub: <><span style={{ color: qChange >= 0 ? GREEN : RED }} className="font-semibold">{qChange >= 0 ? "+" : ""}{qChange}%</span> vs 7j précédents</>,
      spark: qualSpark, color: BLUE,
    },
  ];

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[20px] font-medium tracking-tight text-ink">{greet}, {firstName}. 👋</h1>
          <p className="mt-0.5 text-[13px] text-muted">{date} · loglead.io</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/logagent" className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink transition hover:bg-surface-hover"><span>🔭</span> New Scout search</Link>
          <Link href="/logagent" className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-ink transition hover:bg-surface-hover"><span>⚔️</span> Find competitor clients</Link>
        </div>
      </div>

      {/* Row 1 — left column (metrics + activity chart) + À faire */}
      <div className="mt-6 grid gap-3 lg:grid-cols-4 lg:items-stretch">
        <div className="space-y-3 lg:col-span-3">
          <div className="grid gap-3 sm:grid-cols-3">
          {metrics.map((m) => (
            <div key={m.label} className="relative overflow-hidden rounded-xl border border-line bg-surface px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[12px] text-muted"><span>{m.icon}</span>{m.label}</p>
                {m.badge && <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${m.badge.ok ? "bg-[#22C55E]/12 text-[#16A34A]" : "bg-[#F59E0B]/12 text-[#D97706]"}`}>{m.badge.text}</span>}
              </div>
              <p className="num mt-2 text-[32px] font-bold leading-none text-ink">{m.value}</p>
              <p className="mt-2 max-w-[60%] text-[12px] leading-tight text-muted">{m.sub}</p>
              <div className="absolute bottom-3 right-3">{!empty && <Sparkline data={m.spark} color={m.color} />}</div>
            </div>
          ))}
          </div>

          {/* Activity chart — sits in the gap under the metric cards */}
          {!empty && (
            <div className="rounded-xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><span>🔭</span> Activité de prospection</p>
                <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="cursor-pointer rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[12px] font-medium text-ink outline-none">
                  <option value={7}>7 derniers jours</option>
                  <option value={30}>30 derniers jours</option>
                  <option value={90}>3 mois</option>
                  <option value={365}>Cette année</option>
                </select>
              </div>
              <div className="mt-2 flex items-start justify-between">
                <p className="num text-[32px] font-bold leading-none text-ink">{rangeFound}</p>
                <div className="flex flex-col gap-1 text-[12px] text-muted">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: BLUE }} /> Prospects trouvés</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-0 w-4 border-t-2 border-dashed" style={{ borderColor: GREEN }} /> Prospects qualifiés</span>
                </div>
              </div>
              <div className="mt-3"><ActivityChart buckets={buckets} /></div>
            </div>
          )}
        </div>

        {/* À faire */}
        <div className="flex flex-col rounded-xl border border-line bg-surface p-4 lg:col-span-1">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><span>✦</span> À faire</p>
            <span className="rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold text-canvas">{todoAll.length}</span>
          </div>
          {todo.length === 0 ? (
            <p className="mt-4 text-[12px] text-muted">Rien à traiter pour le moment.</p>
          ) : (
            <div className="mt-2 flex flex-1 flex-col">
              {todo.map((p) => {
                const a = todoAction(p);
                const name = p.contactName ?? p.companyName;
                return (
                  <Link key={p.id} href={`/leads?p=${p.id}`} className="group flex items-center gap-2.5 border-b border-line py-2.5 last:border-b-0 hover:opacity-90">
                    <Avatar name={name} dot={a.dot} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-medium text-ink">{name}</div>
                      <div className="truncate text-[12px]"><span className={`font-medium ${a.cls}`}>{a.label}</span>{a.note && <span className="text-faint"> · {a.note}</span>}</div>
                    </div>
                    <ChevronRight size={15} className="shrink-0 text-faint" />
                  </Link>
                );
              })}
              {todoAll.length > todo.length && <p className="mt-auto pt-3 text-[12px] text-faint">··· + {todoAll.length - todo.length} autres</p>}
            </div>
          )}
        </div>
      </div>

      {empty ? (
        <div className="mt-4 rounded-xl border border-line bg-surface px-6 py-16 text-center">
          <div className="text-[34px]">🔭</div>
          <h2 className="mt-3 font-display text-[19px] font-semibold text-ink">Your agent is ready.</h2>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">Describe your ideal prospect and Scout will find them across LinkedIn, Google Maps and the web.</p>
          <Link href="/logagent" className="btn-primary mx-auto mt-6 !py-2 text-[13px]">→ Start your first search</Link>
        </div>
      ) : (
          /* Row 3 — recent searches + hot prospects */
          <div className="mt-4 grid gap-4 lg:grid-cols-5">
            {/* Recent searches */}
            <div className="rounded-xl border border-line bg-surface p-5 lg:col-span-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><span>🔭</span> Dernières recherches</p>
                <Link href="/logagent" className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1.5 text-[12px] font-medium text-ink transition hover:bg-surface-hover"><Plus size={13} /> Nouvelle</Link>
              </div>
              {searches.length === 0 ? (
                <p className="mt-4 text-[13px] text-muted">Aucune recherche. <Link href="/logagent" className="text-primary hover:underline">Lance ta première recherche →</Link></p>
              ) : (
                <div className="mt-2">
                  {searches.map((s) => {
                    const rate = s.totalResults ? Math.round((s.qualifiedResults / s.totalResults) * 100) : 0;
                    return (
                      <Link key={s.id} href={`/logagent?q=${encodeURIComponent(s.query)}`} className="group flex items-center gap-3 border-b border-line py-3 last:border-b-0">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium text-ink">“{s.title || s.query}”</div>
                          <div className="mt-0.5 text-[12px] text-muted">{s.totalResults} prospects · {rate}% qualifiés · {rel(s.createdAt)}</div>
                        </div>
                        <ChevronRight size={15} className="shrink-0 text-faint transition group-hover:text-primary" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Hot prospects */}
            <div className="rounded-xl border border-line bg-surface p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-[13px] font-semibold text-ink"><span>🔥</span> Prospects chauds</p>
                <Link href="/leads" className="text-[12px] font-medium text-primary hover:underline">Voir tous →</Link>
              </div>
              {hot.length === 0 ? (
                <p className="mt-4 text-[13px] text-muted">Aucun prospect chaud pour l&apos;instant.</p>
              ) : (
                <div className="mt-2">
                  {hot.map((p) => {
                    const name = p.contactName ?? p.companyName;
                    const role = p.contactName ? p.companyName : (p.companySector ?? p.companyLocation ?? "");
                    return (
                      <Link key={p.id} href={`/leads?p=${p.id}`} className="group flex items-start gap-2.5 border-b border-line py-3 last:border-b-0">
                        <Avatar name={name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-medium text-ink">{name}</span>
                            {role && <span className="truncate text-[12px] text-muted">· {role}</span>}
                            <span className="ml-auto flex shrink-0 items-center gap-1 text-[12px] font-semibold text-ink"><span className="h-2 w-2 rounded-full" style={{ background: scoreColor(p.fitScore) }} />{p.fitScore}</span>
                          </div>
                          {p.signalDescription && <div className="mt-0.5 truncate text-[12px] text-muted">Signal : {p.signalDescription}</div>}
                        </div>
                        <ChevronRight size={15} className="mt-1 shrink-0 text-faint transition group-hover:text-primary" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
      )}
    </div>
  );
}
