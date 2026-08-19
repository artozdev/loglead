"use client";

import { ArrowRight, Bot, Mail, Plus, TrendingDown, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ChecklistData } from "@/lib/checklist";
import type {
  B2bCard,
  GrowthPartner,
  HomeData,
  LinkedInGrowth,
  PipelineContent,
  QualifiedLead,
} from "@/lib/home";
import { useLocale } from "./LocaleProvider";
import OnboardingChecklist from "./OnboardingChecklist";

// Score color: >80 green · 60-80 orange · <60 red (spec thresholds).
function scoreColor(n: number): string {
  if (n >= 80) return "var(--color-success)";
  if (n >= 60) return "var(--color-warning)";
  return "var(--color-danger)";
}

function smoothPath(vals: { x: number; y: number }[]): string {
  if (vals.length === 0) return "";
  if (vals.length === 1) return `M ${vals[0].x} ${vals[0].y}`;
  let d = `M ${vals[0].x} ${vals[0].y}`;
  for (let i = 0; i < vals.length - 1; i++) {
    const p0 = vals[Math.max(0, i - 1)];
    const p1 = vals[i];
    const p2 = vals[i + 1];
    const p3 = vals[Math.min(vals.length - 1, i + 2)];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function DashboardHome({
  data,
  checklist,
}: {
  data: HomeData;
  checklist?: ChecklistData;
}) {
  const router = useRouter();
  const { t } = useLocale();
  const [, startTransition] = useTransition();

  // Time-aware greeting (computed client-side to avoid a server/client TZ mismatch).
  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(
      t(h < 12 ? "dash.greeting.morning" : h < 18 ? "dash.greeting.afternoon" : "dash.greeting.evening"),
    );
  }, [t]);

  useEffect(() => {
    const id = setInterval(() => startTransition(() => router.refresh()), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  // Post-checkout / trial-start banners, read from the URL then cleaned up.
  const [banner, setBanner] = useState<{ kind: "trial" | "purchased"; credits?: number } | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("trial_started")) setBanner({ kind: "trial" });
    else if (p.get("credits_purchased")) {
      setBanner({ kind: "purchased", credits: Number(p.get("credits_purchased")) });
      window.dispatchEvent(new CustomEvent("loglead:credits-changed"));
    }
    if (p.get("trial_started") || p.get("credits_purchased") || p.get("credits_cancelled")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {greeting ?? t("dash.welcome")}, {data.firstName}.
          </h1>
          <span className="lead-rule" />
          <p className="mt-2 text-muted">
            {data.dateLabel}
            {data.workspaceName ? ` · ${data.workspaceName}` : ""} · {t("dash.subtitleSuffix")}
          </p>
          <p className="mt-1 text-[13px] text-faint">{t("dash.context")}</p>
        </div>
        <Link href="/studio" className="btn-primary !gap-1 !px-3 !py-2 text-[13px]">
          {t("dash.createContent")} <Plus size={15} strokeWidth={2} />
        </Link>
      </div>

      {banner && (
        <div className="dash-rise flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/20 border-l-[3px] border-l-primary bg-primary/5 px-5 py-3.5">
          <div>
            {banner.kind === "trial" ? (
              <>
                <p className="text-sm font-semibold text-ink">🎉 Welcome to LogLead! Your 7-day free trial has started.</p>
                <p className="mt-0.5 text-[13px] text-muted">You have 100 free credits. Use them wisely.</p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-ink">✅ {banner.credits?.toLocaleString("fr-FR")} credits added to your balance.</p>
                <p className="mt-0.5 text-[13px] text-muted">Thanks for your purchase — they never expire.</p>
              </>
            )}
          </div>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("loglead:open-credits"))}
            className="btn-secondary shrink-0 !px-3 !py-2 text-[13px]"
          >
            View credit details
          </button>
        </div>
      )}

      {checklist?.visible && (
        <div className="dash-rise" style={{ animationDelay: "40ms" }}>
          <OnboardingChecklist completed={checklist.completed} />
        </div>
      )}

      {data.empty && !checklist?.visible && (
        <div className="dash-rise rounded-xl border border-line border-l-[3px] border-l-primary bg-primary/5 px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink">🚀 {t("dash.empty.title")}</p>
          <p className="mt-1 text-sm text-muted">{t("dash.empty.desc")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/studio" className="btn-primary !px-3 !py-2 text-[13px]">{t("dash.empty.cta1")}</Link>
            <Link href="/algo-insider" className="btn-secondary !px-3 !py-2 text-[13px]">{t("dash.empty.cta2")}</Link>
          </div>
        </div>
      )}

      {/* Business metrics band + sparklines (Content Score & AI Visibility hidden) */}
      <div className="grid grid-cols-1 divide-y-[0.5px] divide-x-0 divide-line overflow-hidden rounded-[12px] border-[0.5px] border-line bg-surface sm:grid-cols-3 sm:divide-x-[0.5px] sm:divide-y-0">
        {data.b2b.cards
          .filter((c) => c.key !== "score" && c.key !== "visibility")
          .map((c) => (
            <MetricCard key={c.key} card={c} />
          ))}
      </div>

      {/* AI Growth Partner block hidden on request (menu also hidden) —
          restore <GrowthPartnerBlock partner={data.b2b.growthPartner} /> to bring it back. */}

      <div className="grid gap-4 lg:grid-cols-[1.75fr_1fr]">
        <LinkedInGrowthBlock growth={data.b2b.growth} />
        <ContentPipelineBlock items={data.b2b.pipeline} />
      </div>

      {data.leadsEnabled ? (
        <PipelineIntelligenceBlock leads={data.b2b.qualifiedLeads} />
      ) : (
        <UpsellBlock />
      )}
    </div>
  );
}

// ----- Metric card (band cell + sparkline) -----------------------------------

// Minimal SVG sparkline, blue theme — same language as the Leads page.
function Sparkline({ data }: { data: number[] }) {
  const W = 62;
  const H = 30;
  if (!data?.length) return <div style={{ width: W, height: H }} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const x = (i: number) => (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - 2) + 1);
  const y = (v: number) => H - 4 - ((v - min) / range) * (H - 8);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0" aria-hidden>
      <path d={line} fill="none" stroke="rgb(var(--c-primary))" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MetricCard({ card }: { card: B2bCard }) {
  const { t } = useLocale();
  const inner = (
    <div className="flex items-center justify-between gap-3 px-4 py-4">
      <div className="min-w-0">
        <p className="truncate text-[12px] text-muted">{t(`card.${card.key}.label`)}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="num text-[24px] font-semibold leading-none tracking-tight text-ink">{card.display}</span>
          {card.hasDelta && (
            <span className={`inline-flex items-center gap-0.5 text-[12px] font-medium ${card.good ? "text-success" : "text-danger"}`}>
              {card.good ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
              {t(`card.${card.key}.delta`, card.deltaVars)}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-[11px] text-faint">{t(`card.${card.key}.sub`, card.subVars)}</p>
      </div>
      <Sparkline data={card.spark} />
    </div>
  );
  return card.href ? (
    <Link href={card.href} className="block transition hover:bg-surface-hover">{inner}</Link>
  ) : (
    <div>{inner}</div>
  );
}

// ----- AI Growth Partner -----------------------------------------------------

function GrowthPartnerBlock({ partner }: { partner: GrowthPartner }) {
  const { t } = useLocale();
  if (!partner.isPro) {
    return (
      <div className="flex flex-wrap items-center gap-3 rounded-[12px] border-[0.5px] border-line border-l-[3px] border-l-line bg-surface px-5 py-4 opacity-90">
        <Bot size={18} className="text-muted" />
        <p className="flex-1 text-sm text-muted">{t("gp.upsell")}</p>
        <Link href="/pricing" className="btn-primary !py-2 text-[13px]">{t("gp.upgradePro")}</Link>
      </div>
    );
  }
  const firstName = partner.leadName?.split(" ")[0] ?? "";
  const nextAction = partner.nextPost
    ? t("gp.nextAction", {
        action: t("gp.nextPost", { day: partner.nextPost.day, month: partner.nextPost.month, time: partner.nextPost.time }),
      })
    : null;
  return (
    <section className="rounded-[12px] border-[0.5px] border-line border-l-[3px] border-l-primary bg-surface">
      <div className="flex items-center justify-between gap-2 border-b-[0.5px] border-line px-5 py-3">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          <Bot size={18} className="text-primary" /> {t("gp.title")}
        </h2>
        <Link href="/logagent" className="btn-secondary !py-1.5 text-[13px]">{t("gp.open")}</Link>
      </div>
      <div className="px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-faint">{t("gp.today")}</p>
        <p className="mt-1.5 text-sm leading-relaxed text-ink">
          {partner.leadName ? t("gp.rec", { name: partner.leadName, score: partner.leadScore }) : t("gp.recEmpty")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {partner.leadId && (
            <Link href={`/leads/${partner.leadId}`} className="btn-primary !py-2 text-[13px]">
              <Mail size={14} strokeWidth={1.5} /> {t("gp.sendTo", { name: firstName })}
            </Link>
          )}
          <Link href="/logagent" className="btn-ghost !py-2 text-[13px]">{t("gp.seeAll")}</Link>
        </div>
        {nextAction && (
          <p className="mt-3 border-t-[0.5px] border-line pt-3 text-[13px] text-muted">{nextAction}</p>
        )}
      </div>
    </section>
  );
}

// ----- LinkedIn Growth area chart --------------------------------------------

function LinkedInGrowthBlock({ growth }: { growth: LinkedInGrowth }) {
  const { t } = useLocale();
  const [metricKey, setMetricKey] = useState(growth.metrics[0]?.key ?? "impressions");
  const metric = growth.metrics.find((m) => m.key === metricKey) ?? growth.metrics[0];

  const W = 640;
  const H = 220;
  const padX = 8;
  const padTop = 16;
  const padBottom = 28;
  const values = metric?.values ?? [];
  const max = Math.max(1, ...values, metric?.goal ?? 0);
  const stepX = values.length > 1 ? (W - padX * 2) / (values.length - 1) : 0;
  const y = (v: number) => padTop + (1 - v / max) * (H - padTop - padBottom);
  const pts = values.map((v, i) => ({ x: padX + i * stepX, y: y(v) }));
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L ${pts[pts.length - 1].x} ${H - padBottom} L ${pts[0].x} ${H - padBottom} Z` : "";
  const fmt = (v: number) => (metric?.format === "pct" ? `${v}%` : v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v));

  return (
    <section className="rounded-[12px] border-[0.5px] border-line bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
          <TrendingUp size={17} className="text-primary" /> {t("dash.liGrowth")}
        </h2>
        <select
          value={metricKey}
          onChange={(e) => setMetricKey(e.target.value)}
          className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
          aria-label="Metric"
        >
          {growth.metrics.map((m) => (
            <option key={m.key} value={m.key}>{t(m.labelKey)}</option>
          ))}
        </select>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none" style={{ height: 220 }}>
        <defs>
          <linearGradient id="liArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0051FF" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0051FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        {metric?.goal != null && (
          <line x1={padX} x2={W - padX} y1={y(metric.goal)} y2={y(metric.goal)} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
        )}
        {area && <path d={area} fill="url(#liArea)" />}
        {line && <path d={line} fill="none" stroke="#0051FF" strokeWidth={2.5} strokeLinecap="round" />}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#0051FF">
            <title>{`${growth.days[i]} : ${fmt(values[i])}`}</title>
          </circle>
        ))}
      </svg>
      <div className="mt-1 flex justify-between px-1 text-[11px] text-faint">
        {growth.days.map((d, i) => (
          <span key={i} className="num">{d}</span>
        ))}
      </div>
      {metric?.goal != null && (
        <p className="mt-2 text-[11px] text-faint">- - - {t("dash.weeklyGoal", { goal: fmt(metric.goal) })}</p>
      )}
    </section>
  );
}

// ----- Content Pipeline ------------------------------------------------------

function ContentPipelineBlock({ items }: { items: PipelineContent[] }) {
  const { t } = useLocale();
  return (
    <section className="flex flex-col rounded-[12px] border-[0.5px] border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{t("dash.contentPipeline")}</h2>
          <p className="text-[12px] text-muted">{t("dash.scheduledForLi")}</p>
        </div>
        <Link href="/calendar" className="text-[12px] text-primary hover:underline">{t("dash.openCalendar")}</Link>
      </div>

      <div className="mt-4 flex-1 space-y-2">
        {items.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-faint">{t("dash.nothingScheduled")}</p>
        ) : (
          items.map((c) => (
            <Link
              key={c.id}
              href={`/post-generator?content=${c.id}`}
              className="flex items-center gap-2.5 rounded-[10px] border-[0.5px] border-line px-3 py-2.5 transition hover:bg-surface-hover"
            >
              <div className="num w-12 shrink-0 text-center">
                <p className="text-[13px] font-semibold text-ink">{c.day}</p>
                <p className="text-[10px] text-faint">{c.month} · {c.time}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-ink">{c.title}</p>
                <p className="text-[11px] text-faint">{c.format}</p>
              </div>
              {c.score != null && (
                <span className="num text-[12px] font-semibold" style={{ color: scoreColor(c.score) }}>{c.score}</span>
              )}
              <span className={`shrink-0 rounded-full border-[0.5px] px-2 py-0.5 text-[11px] font-medium ${
                c.status === "ready" ? "border-success/25 bg-success/10 text-success" : "border-line bg-surface-hover text-muted"
              }`}>
                {t(`status.${c.status}`)}
              </span>
            </Link>
          ))
        )}
      </div>

      <Link href="/studio" className="btn-secondary mt-3 w-full !py-2 text-[13px]">
        <Plus size={14} strokeWidth={1.5} /> {t("dash.createContent")}
      </Link>
    </section>
  );
}

// ----- Pipeline Intelligence -------------------------------------------------

function PipelineIntelligenceBlock({ leads }: { leads: QualifiedLead[] }) {
  const { t } = useLocale();
  const hot = leads.filter((l) => l.score >= 85).length;

  const signalStyle = (key: string) =>
    key.includes("hot")
      ? "border-danger/25 bg-danger/10 text-danger"
      : key.includes("warm")
        ? "border-warning/25 bg-warning/10 text-warning"
        : "border-primary/20 bg-primary/10 text-primary";

  return (
    <section className="overflow-hidden rounded-[16px] border-[0.5px] border-line bg-surface">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-[0.5px] border-line px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users size={18} strokeWidth={1.8} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{t("dash.pipelineIntel")}</h2>
            <p className="text-[12px] text-muted">{t("dash.pipelineIntel.sub")}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {leads.length > 0 && (
            <div className="hidden items-center gap-4 sm:flex">
              <Stat n={leads.length} label={t("dash.pi.qualified")} />
              <span className="h-8 w-px bg-line" />
              <Stat n={hot} label={t("dash.pi.hot")} accent />
            </div>
          )}
          <Link href="/leads" className="btn-secondary !px-3 !py-1.5 text-[12px]">
            {t("dash.viewAllLeads")} <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Body */}
      {leads.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-hover text-2xl">🎯</span>
          <p className="mt-3 text-sm font-medium text-ink">{t("dash.noLeads")}</p>
        </div>
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
          {leads.map((l) => (
            <div
              key={l.id}
              className="group flex flex-col gap-3 rounded-[14px] border-[0.5px] border-line bg-canvas p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-card"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-sm"
                  style={{ backgroundColor: scoreColor(l.score) }}
                >
                  {l.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">{l.name}</p>
                  <p className="truncate text-[12px] text-muted">{l.role}</p>
                </div>
                <span className={`shrink-0 rounded-full border-[0.5px] px-2 py-0.5 text-[10px] font-semibold ${signalStyle(l.signalKey)}`}>
                  {t(l.signalKey)}
                </span>
              </div>

              {/* Fit score meter */}
              <div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-faint">{t("dash.pi.fit")}</span>
                  <span className="num font-semibold" style={{ color: scoreColor(l.score) }}>
                    {l.score}/100{l.score >= 85 ? " 🔥" : ""}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                  <div className="h-full rounded-full" style={{ width: `${l.score}%`, backgroundColor: scoreColor(l.score) }} />
                </div>
              </div>

              <Link href={`/leads/${l.id}`} className="btn-secondary w-full !py-2 text-[12px] transition group-hover:border-primary/40">
                <Mail size={13} strokeWidth={1.7} /> {t("common.reachOut")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function Stat({ n, label, accent }: { n: number; label: string; accent?: boolean }) {
  return (
    <div className="text-right">
      <p className={`num text-lg font-semibold leading-none ${accent ? "text-danger" : "text-ink"}`}>{n}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}

function UpsellBlock() {
  const { t } = useLocale();
  return (
    <section className="flex flex-col items-center justify-center rounded-[12px] border-[0.5px] border-line bg-surface px-6 py-12 text-center">
      <p className="font-display text-base font-semibold text-ink">{t("dash.pipelineIntel")}</p>
      <p className="mt-1 max-w-sm text-sm text-muted">{t("dash.intelUpsellDesc")}</p>
      <Link href="/pricing" className="btn-primary mt-4 !py-2 text-[13px]">{t("dash.upgradeGrowth")}</Link>
    </section>
  );
}

