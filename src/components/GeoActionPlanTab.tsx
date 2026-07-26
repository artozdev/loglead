"use client";

import { ArrowRight, Check, Copy, Hammer, Landmark, Lock, Zap } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  GEO_EFFORT_META,
  GEO_IMPACT_META,
  type GeoAction,
  type GeoActionEffort,
} from "@/lib/types";
import { UpsellNote } from "./GeoBits";

// GEO — "Plan d'action" tab: prioritized actions with impact/effort badges,
// estimated score gain, and a direct CTA per action.

const EFFORT_ICON: Record<GeoActionEffort, React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  quick: Zap,
  medium: Hammer,
  long: Landmark,
};

// Rough duration used in the weekly summary.
const EFFORT_SHORT: Record<GeoActionEffort, string> = {
  quick: "2h",
  medium: "1 jour",
  long: "1 semaine",
};

function faqJsonLd(faq: string[], saasName: string): string {
  return JSON.stringify(
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((q) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Réponse à compléter sur la page ${saasName}.`,
        },
      })),
    },
    null,
    2,
  );
}

export default function GeoActionPlanTab({
  actions,
  saasName,
  globalScore,
  queriesCount,
  competitorsCount,
  canPlan, // Growth+
  canGenerate, // Pro
}: {
  actions: GeoAction[];
  saasName: string;
  globalScore: number;
  queriesCount: number;
  competitorsCount: number;
  canPlan: boolean;
  canGenerate: boolean;
}) {
  if (!canPlan) {
    return <UpsellNote text="Le plan d'action GEO personnalisé est inclus à partir du plan Growth." />;
  }
  if (actions.length === 0) {
    return (
      <p className="rounded-xl border-[0.5px] border-line bg-surface px-5 py-10 text-center text-sm text-muted">
        Lance un scan pour générer ton plan d&apos;action personnalisé.
      </p>
    );
  }

  const sorted = [...actions].sort((a, b) => b.points - a.points);
  const top3 = sorted.slice(0, 3);
  const target = Math.min(100, globalScore + top3.reduce((a, x) => a + x.points, 0));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border-[0.5px] border-line bg-surface p-5">
        <h3 className="font-display text-[15px] font-semibold text-ink">
          Votre plan d&apos;action GEO personnalisé
        </h3>
        <p className="mt-1 text-sm text-muted">
          Basé sur l&apos;analyse de vos {queriesCount} requêtes cibles
          {competitorsCount > 0 && <> et de vos {competitorsCount} concurrent{competitorsCount > 1 ? "s" : ""}</>}.
        </p>
        <p className="num mt-3 text-sm">
          <span className="text-muted">Score actuel :</span>{" "}
          <span className="font-semibold text-ink">{globalScore}/100</span>
          <span className="mx-2 text-faint">→</span>
          <span className="text-muted">Objectif atteignable :</span>{" "}
          <span className="font-semibold text-success">{target}/100</span>{" "}
          <span className="text-muted">en 30 jours</span>
        </p>
      </div>

      {/* Prioritized actions */}
      {actions.map((a, i) => (
        <ActionCard key={a.id} action={a} index={i + 1} saasName={saasName} canGenerate={canGenerate} />
      ))}

      {/* Weekly summary */}
      <div className="rounded-xl border-[0.5px] border-line bg-surface p-5">
        <h3 className="font-display text-[15px] font-semibold text-ink">
          Actions à faire cette semaine
        </h3>
        <ul className="mt-3 space-y-2">
          {top3.map((a) => (
            <li key={a.id} className="flex items-center gap-3 text-[13px]">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                <Check size={12} strokeWidth={2.5} />
              </span>
              <span className="flex-1 text-ink">{a.title}</span>
              <span className="num shrink-0 font-semibold text-success">+{a.points} pts</span>
              <span className="num w-20 shrink-0 text-right text-muted">{EFFORT_SHORT[a.effort]}</span>
            </li>
          ))}
        </ul>
        <p className="num mt-4 border-t-[0.5px] border-line pt-3 text-sm">
          <span className="text-muted">Score actuel :</span>{" "}
          <span className="font-semibold text-ink">{globalScore}/100</span>
          <span className="mx-3 text-faint">·</span>
          <span className="text-muted">Score estimé après ces 3 actions :</span>{" "}
          <span className="font-semibold text-success">{target}/100</span>
        </p>
      </div>
    </div>
  );
}

function ActionCard({
  action: a,
  index,
  saasName,
  canGenerate,
}: {
  action: GeoAction;
  index: number;
  saasName: string;
  canGenerate: boolean;
}) {
  const [schemaOpen, setSchemaOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const impact = GEO_IMPACT_META[a.impact];
  const EffortIcon = EFFORT_ICON[a.effort];
  const studioHref = `/studio?brief=${encodeURIComponent(a.cta.brief ?? "")}`;

  function copySchema() {
    void navigator.clipboard.writeText(faqJsonLd(a.cta.faq ?? [], saasName));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border-[0.5px] border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="num font-medium text-faint">Action {index}</span>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-semibold ${impact.cls}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {impact.label}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-2 py-0.5 font-medium text-muted">
          <EffortIcon size={11} strokeWidth={1.5} />
          {GEO_EFFORT_META[a.effort]}
        </span>
        <span className="num ml-auto rounded-full bg-success/10 px-2 py-0.5 font-semibold text-success">
          +{a.points} pts
        </span>
      </div>

      <h4 className="mt-2.5 text-sm font-semibold text-ink">{a.title}</h4>
      <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
        <span className="font-medium text-ink/70">Pourquoi :</span> {a.why}
      </p>
      <ul className="mt-2 space-y-1 text-[13px] text-muted">
        {a.steps.map((s) => (
          <li key={s} className="flex gap-2">
            <span className="text-faint">→</span>
            <span>{s}</span>
          </li>
        ))}
      </ul>

      <div className="mt-3.5">
        {a.cta.kind === "studio" &&
          (canGenerate ? (
            <Link href={studioHref} className="btn-primary inline-flex !py-2 text-[13px]">
              {a.cta.label} <ArrowRight size={13} />
            </Link>
          ) : (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-[10px] border border-line px-3.5 py-2 text-[13px] text-muted hover:bg-surface-hover"
            >
              <Lock size={12} strokeWidth={1.5} /> {a.cta.label} — plan Pro
            </Link>
          ))}
        {a.cta.kind === "schema" && (
          <>
            <button onClick={() => setSchemaOpen(!schemaOpen)} className="btn-primary !py-2 text-[13px]">
              {schemaOpen ? "Masquer le code" : a.cta.label} <ArrowRight size={13} />
            </button>
            {schemaOpen && (
              <div className="relative mt-3">
                <pre className="max-h-72 overflow-auto rounded-lg border-[0.5px] border-line bg-canvas p-3 text-xs leading-relaxed text-ink/80">
                  {`<script type="application/ld+json">\n${faqJsonLd(a.cta.faq ?? [], saasName)}\n</script>`}
                </pre>
                <button
                  onClick={copySchema}
                  className="absolute right-2 top-2 flex items-center gap-1 rounded-lg border border-line bg-surface px-2 py-1 text-xs text-muted hover:text-ink"
                >
                  <Copy size={11} strokeWidth={1.5} /> {copied ? "Copié !" : "Copier"}
                </button>
              </div>
            )}
          </>
        )}
        {a.cta.kind === "analyzer" && (
          <Link href="/content-analyzer" className="btn-secondary inline-flex !py-2 text-[13px]">
            {a.cta.label} <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}
