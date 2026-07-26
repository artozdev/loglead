"use client";

import { Lightbulb, Newspaper, Plus, Search, Target } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  VISIBILITY_LLMS,
  type GeoCompetitorInsight,
  type GeoCompetitorScore,
  type VisibilityLLM,
} from "@/lib/types";
import { competitorColor, LlmLogo, UpsellNote } from "./GeoBits";

// GEO — "Concurrents" tab: comparative score table, what feeds each
// competitor's visibility (Pro), and share of voice per LLM.

export default function GeoCompetitorsTab({
  saasName,
  myScores,
  competitorScores,
  insights,
  canInsights,
  selected,
  onSelect,
}: {
  saasName: string;
  myScores: Partial<Record<VisibilityLLM, number>>;
  competitorScores: GeoCompetitorScore[];
  insights: GeoCompetitorInsight[];
  canInsights: boolean; // Pro only
  selected: string | null;
  onSelect: (name: string) => void;
}) {
  const myAvg = useMemo(() => {
    const vals = Object.values(myScores);
    return vals.length === 0 ? 0 : Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }, [myScores]);

  const active = selected ?? competitorScores[0]?.name ?? null;
  const insight = insights.find((i) => i.name === active);

  if (competitorScores.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border-[0.5px] border-line bg-surface px-6 py-14 text-center">
        <p className="font-display text-base font-semibold text-ink">Aucun concurrent suivi</p>
        <p className="mt-1 max-w-md text-sm text-muted">
          Renseigne tes concurrents dans ton profil SaaS pour comparer votre visibilité IA —
          puis relance un scan.
        </p>
        <Link href="/profile" className="btn-secondary mt-4 text-[13px]">
          <Plus size={14} strokeWidth={1.5} /> Ajouter un concurrent
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Competitor selector */}
      <div className="flex flex-wrap items-center gap-2">
        {competitorScores.map((c, i) => (
          <button
            key={c.name}
            onClick={() => onSelect(c.name)}
            aria-pressed={c.name === active}
            className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
              c.name === active
                ? "border-primary/40 bg-primary/[0.06] text-primary"
                : "border-line text-muted hover:bg-surface-hover hover:text-ink"
            }`}
          >
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: competitorColor(i) }} />
            {c.name}
          </button>
        ))}
        <Link
          href="/profile"
          className="flex items-center gap-1.5 rounded-full border border-dashed border-line px-3 py-1.5 text-[13px] text-muted hover:bg-surface-hover hover:text-ink"
        >
          <Plus size={13} strokeWidth={1.5} /> Ajouter un concurrent
        </Link>
      </div>

      {/* Comparative score table */}
      <div className="overflow-x-auto rounded-xl border-[0.5px] border-line bg-surface">
        <table className="w-full min-w-[720px] border-collapse text-[13px]">
          <thead>
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-normal text-faint" />
              {VISIBILITY_LLMS.map((m) => (
                <th key={m.value} className="px-3 py-2.5 text-center text-xs font-normal text-faint">
                  <span className="inline-flex items-center gap-1.5">
                    <LlmLogo llm={m.value} size={16} /> {m.label}
                  </span>
                </th>
              ))}
              <th className="px-4 py-2.5 text-center text-xs font-medium text-muted">Moy.</th>
            </tr>
          </thead>
          <tbody>
            {/* The SaaS itself, highlighted */}
            <tr className="border-t-[0.5px] border-line bg-primary/[0.05] shadow-[inset_3px_0_0_var(--color-primary)]">
              <td className="px-4 py-3 font-semibold text-primary">{saasName}</td>
              {VISIBILITY_LLMS.map((m) => (
                <td key={m.value} className="num px-3 py-3 text-center font-medium text-ink">
                  {myScores[m.value] ?? 0}
                </td>
              ))}
              <td className="num px-4 py-3 text-center font-semibold text-ink">{myAvg}</td>
            </tr>
            {competitorScores.map((c, i) => (
              <tr key={c.name} className="border-t-[0.5px] border-line">
                <td className="px-4 py-3 text-ink">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: competitorColor(i) }} />
                    {c.name}
                  </span>
                </td>
                {VISIBILITY_LLMS.map((m) => {
                  const v = c.scores[m.value] ?? 0;
                  const mine = myScores[m.value] ?? 0;
                  // Red when the competitor beats us on that LLM, green when we lead.
                  const cls = v > mine ? "text-danger" : v < mine ? "text-success" : "text-muted";
                  return (
                    <td key={m.value} className={`num px-3 py-3 text-center ${cls}`}>
                      {v}
                    </td>
                  );
                })}
                <td
                  className={`num px-4 py-3 text-center font-medium ${
                    c.avg > myAvg ? "text-danger" : c.avg < myAvg ? "text-success" : "text-muted"
                  }`}
                >
                  {c.avg}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* What feeds the selected competitor's visibility (Pro) */}
        <section className="rounded-xl border-[0.5px] border-line bg-surface p-5">
          <h3 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
            <Search size={15} strokeWidth={1.5} className="text-muted" />
            Ce qui alimente la visibilité de {active} sur les LLMs
          </h3>
          {!canInsights ? (
            <UpsellNote text="L'analyse des sources concurrentes est incluse dans le plan Pro." />
          ) : insight ? (
            <div className="mt-4 space-y-5 text-[13px]">
              <div>
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  <Newspaper size={13} strokeWidth={1.5} className="text-muted" />
                  Sources principales détectées
                </p>
                <ul className="mt-1.5 space-y-1 text-muted">
                  {insight.sources.map((s) => (
                    <li key={s.label}>
                      → <span className="num font-medium text-ink">{s.count}</span> {s.label}
                    </li>
                  ))}
                </ul>
              </div>
              {insight.dominantQueries.length > 0 && (
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-ink">
                    <Target size={13} strokeWidth={1.5} className="text-muted" />
                    Requêtes où {active} domine et pas toi
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {insight.dominantQueries.map((q) => (
                      <li key={q.query} className="flex items-baseline justify-between gap-3">
                        <span className="text-muted">→ « {q.query} »</span>
                        <span className="num shrink-0 font-medium text-danger">
                          {active} : {q.score} %
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div>
                <p className="flex items-center gap-1.5 font-medium text-ink">
                  <Lightbulb size={13} strokeWidth={1.5} className="text-warning" />
                  Ce que tu peux faire pour les dépasser
                </p>
                <ul className="mt-1.5 space-y-1 text-muted">
                  {insight.counters.map((c) => (
                    <li key={c}>→ {c}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted">Relance un scan pour analyser ce concurrent.</p>
          )}
        </section>

        {/* Share of voice per LLM */}
        <section className="rounded-xl border-[0.5px] border-line bg-surface p-5">
          <h3 className="font-display text-[15px] font-semibold text-ink">
            Part de voix{" "}
            <span className="ml-1 text-[13px] font-normal text-faint">
              Répartition des mentions par LLM
            </span>
          </h3>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> {saasName}
            </span>
            {competitorScores.map((c, i) => (
              <span key={c.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: competitorColor(i) }} />
                {c.name}
              </span>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {VISIBILITY_LLMS.map((m) => {
              const mine = myScores[m.value] ?? 0;
              const parts = [
                { name: saasName, value: mine, color: "var(--color-primary)" },
                ...competitorScores.map((c, i) => ({
                  name: c.name,
                  value: c.scores[m.value] ?? 0,
                  color: competitorColor(i),
                })),
              ];
              const total = parts.reduce((a, p) => a + p.value, 0);
              return (
                <div key={m.value} className="flex items-center gap-3">
                  <span className="flex w-24 shrink-0 items-center gap-1.5 text-xs text-muted">
                    <LlmLogo llm={m.value} size={16} /> {m.label}
                  </span>
                  <div className="flex h-4 flex-1 overflow-hidden rounded-full bg-surface-hover">
                    {total > 0 &&
                      parts.map(
                        (p) =>
                          p.value > 0 && (
                            <div
                              key={p.name}
                              title={`${p.name} : ${Math.round((p.value / total) * 100)} % des mentions sur ${m.label}`}
                              style={{
                                width: `${(p.value / total) * 100}%`,
                                backgroundColor: p.color,
                              }}
                            />
                          ),
                      )}
                  </div>
                  <span className="num w-9 shrink-0 text-right text-xs text-muted">
                    {total > 0 ? `${Math.round((mine / total) * 100)} %` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-faint">
            Le pourcentage à droite est ta part de voix sur chaque LLM.
          </p>
        </section>
      </div>
    </div>
  );
}
