"use client";

import { ArrowRight, Bot, Mail, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import type { ChecklistData } from "@/lib/checklist";
import type {
  B2bCard,
  GrowthPartner,
  HomeData,
  InboxPreviewItem,
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

  useEffect(() => {
    const id = setInterval(() => startTransition(() => router.refresh()), 30 * 60 * 1000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {t("dash.welcome")}, {data.firstName}.
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

      {/* 5 business metric cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {data.b2b.cards.map((c) => (
          <MetricCard key={c.key} card={c} />
        ))}
      </div>

      <GrowthPartnerBlock partner={data.b2b.growthPartner} />

      <div className="grid gap-4 lg:grid-cols-[1.75fr_1fr]">
        <LinkedInGrowthBlock growth={data.b2b.growth} />
        <ContentPipelineBlock items={data.b2b.pipeline} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {data.leadsEnabled ? (
          <PipelineIntelligenceBlock leads={data.b2b.qualifiedLeads} />
        ) : (
          <UpsellBlock />
        )}
        {data.inboxEnabled && <OutreachEngineBlock items={data.inboxPreview} />}
      </div>
    </div>
  );
}

// ----- Metric card -----------------------------------------------------------

function MetricCard({ card }: { card: B2bCard }) {
  const { t } = useLocale();
  const inner = (
    <>
      <p className="text-[13px] font-medium text-muted">{t(`card.${card.key}.label`)}</p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="num text-[26px] font-bold leading-none tracking-tight text-ink">{card.display}</span>
        <span className="text-[12px] text-muted">{t(`card.${card.key}.unit`)}</span>
      </div>
      <p className="mt-1.5 truncate text-[12px] text-muted">{t(`card.${card.key}.sub`, card.subVars)}</p>
      {card.hasDelta && (
        <p className={`num mt-2 text-[12px] font-semibold ${card.good ? "text-success" : "text-danger"}`}>
          {t(`card.${card.key}.delta`, card.deltaVars)}
        </p>
      )}
    </>
  );
  const cls = "rounded-[12px] border-[0.5px] border-line bg-surface p-4";
  return card.href ? (
    <Link href={card.href} className={`${cls} block transition hover:bg-surface-hover`}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
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
  return (
    <section className="rounded-[12px] border-[0.5px] border-line bg-surface">
      <div className="flex items-start justify-between gap-2 border-b-[0.5px] border-line px-5 py-3">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{t("dash.pipelineIntel")}</h2>
          <p className="text-[12px] text-muted">{t("dash.pipelineIntel.sub")}</p>
        </div>
        <Link href="/leads" className="text-[12px] text-primary hover:underline">{t("dash.viewAllLeads")}</Link>
      </div>

      {leads.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-faint">{t("dash.noLeads")}</p>
      ) : (
        <div className="divide-y-[0.5px] divide-line">
          {leads.map((l) => (
            <div key={l.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: scoreColor(l.score) }}
              >
                {l.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2">
                  <span className="text-[13px] font-medium text-ink">{l.name}</span>
                  <span className="text-[12px] text-muted">{l.role}</span>
                </div>
                <p className="truncate text-[12px] text-muted">{t(l.signalKey)}</p>
              </div>
              <span className="num shrink-0 text-[13px] font-semibold" style={{ color: scoreColor(l.score) }}>
                {l.score}/100{l.score >= 85 ? " 🔥" : ""}
              </span>
              <Link href={`/leads/${l.id}`} className="btn-secondary shrink-0 !px-2.5 !py-1.5 text-[12px]">
                <Mail size={13} strokeWidth={1.5} /> {t("common.reachOut")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
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

// ----- Outreach Engine -------------------------------------------------------

function OutreachEngineBlock({ items }: { items: InboxPreviewItem[] }) {
  const { t } = useLocale();
  return (
    <section className="rounded-[12px] border-[0.5px] border-line bg-surface">
      <div className="flex items-start justify-between gap-2 border-b-[0.5px] border-line px-5 py-3">
        <div>
          <h2 className="font-display text-base font-semibold text-ink">{t("dash.outreach")}</h2>
          <p className="text-[12px] text-muted">{t("dash.outreach.sub")}</p>
        </div>
        <Link href="/inbox" className="text-[12px] text-primary hover:underline">{t("dash.viewAll")}</Link>
      </div>
      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13px] text-faint">{t("dash.noConversations")}</p>
      ) : (
        <div className="divide-y-[0.5px] divide-line">
          {items.map((c) => (
            <Link key={c.id} href="/inbox" className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-hover">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                {c.leadName.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-medium text-ink">{c.leadName}</span>
                  {c.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
                </div>
                <p className="truncate text-[12px] text-muted">{c.preview}</p>
              </div>
              <span className="num shrink-0 text-[11px] text-faint">{c.time}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
