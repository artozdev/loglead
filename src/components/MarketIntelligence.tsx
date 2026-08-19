"use client";

import { Lock, RefreshCw, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MarketReport } from "@/lib/types";

// ---------------------------------------------------------------------------
// Market page. Real data comes from: the business profile (competitors), Claude
// ("Ask your market"), and — on refresh — a live pipeline that scrapes recent
// LinkedIn posts (Apify) and analyzes them with Claude into a stored report
// (trends, audience, buying signals, recommendations). Sections without a
// report yet show an honest empty state.
// ---------------------------------------------------------------------------

type Competitor = { name: string; diff?: string };

type Props = {
  saasName: string;
  icp: string;
  sector?: string;
  competitors: Competitor[];
  initialReport?: MarketReport | null;
};

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
  { id: "competitors", label: "Competitors" },
  { id: "audience", label: "Audience" },
  { id: "signals", label: "Signals" },
  { id: "recommendations", label: "Recommendations" },
];

const SUGGESTIONS = [
  "Quelles industries sont en croissance ?",
  "Qui devrais-je surveiller ?",
  "Pourquoi l'AI Visibility est tendance ?",
  "Montre-moi des opportunités en France.",
];

const MOMENTUM: Record<string, { label: string; cls: string }> = {
  hot: { label: "🔥 Hot", cls: "bg-danger/10 text-danger" },
  rising: { label: "📈 Rising", cls: "bg-primary/10 text-primary" },
  steady: { label: "→ Steady", cls: "bg-surface-hover text-muted" },
};

// ---- Claude "ask" hook -----------------------------------------------------
function useMarketAsk() {
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (question: string) => {
    setLoading(true);
    setError(null);
    setAnswer(null);
    try {
      const res = await fetch("/api/market/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error ?? "Analyse impossible.");
      else setAnswer(data.answer);
    } catch {
      setError("Connexion impossible. Réessaie.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { answer, loading, error, run };
}

// ---- Reusable honest "pending" block ---------------------------------------
function Pending({ reason }: { reason: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-line bg-surface-hover/40 px-4 py-5 text-sm text-muted">
      <Lock size={15} className="mt-0.5 shrink-0 text-faint" />
      <p>{reason}</p>
    </div>
  );
}

function SectionHeader({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-lg font-semibold text-ink">
        <span className="mr-2">{emoji}</span>
        {title}
      </h2>
      <p className="mt-0.5 text-sm text-muted">{desc}</p>
    </div>
  );
}

function AiCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border-l-[3px] border-primary bg-primary/[0.06] p-4 text-sm leading-relaxed text-ink">
      {children}
    </div>
  );
}

export default function MarketIntelligence({ saasName, icp, sector, competitors, initialReport }: Props) {
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const [report, setReport] = useState<MarketReport | null>(initialReport ?? null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const search = useMarketAsk();
  const summary = useMarketAsk();
  const containerRef = useRef<HTMLDivElement>(null);

  // Refresh: scrape LinkedIn posts (Apify) + analyze (Claude) → stored report.
  const refresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    setRefreshError(null);
    try {
      const res = await fetch("/api/market/refresh", { method: "POST" });
      const data = await res.json();
      if (res.status === 402) {
        window.dispatchEvent(
          new CustomEvent("loglead:insufficient-credits", {
            detail: { needed: data.needed, balance: data.balance, action: data.action },
          }),
        );
        return;
      }
      if (!res.ok) {
        setRefreshError(data.error ?? "Actualisation impossible.");
        return;
      }
      setReport(data.report);
      window.dispatchEvent(new CustomEvent("loglead:credits-changed"));
    } catch {
      setRefreshError("Connexion impossible. Réessaie.");
    } finally {
      setRefreshing(false);
    }
  }, [refreshing]);

  // Highlight the nav tab of the section currently in view.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitSearch = (q: string) => {
    const question = q.trim();
    if (question.length < 2) return;
    setQuery(question);
    void search.run(question);
  };

  const freshness = report
    ? new Date(report.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Sticky header: AI search + anchor nav + refresh */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSearch(query);
              }}
              placeholder="Ask your market..."
              className="input h-12 !pl-11 pr-4"
              aria-label="Ask your market"
            />
          </div>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="btn-primary h-12 shrink-0 !px-4 disabled:opacity-60"
            title="Scanner LinkedIn (Apify) et analyser ton marché — coûte 30 crédits"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">{refreshing ? "Analyse…" : "Actualiser"}</span>
          </button>
        </div>

        {/* Suggestion pills */}
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuery(s);
                submitSearch(s);
              }}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted transition hover:border-primary/40 hover:text-ink"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Anchor nav */}
        <nav className="mt-3 flex gap-1 overflow-x-auto">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className={`shrink-0 border-b-2 px-3 py-1.5 text-sm transition ${
                active === s.id
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      {refreshError && (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{refreshError}</p>
      )}

      {/* Search answer panel */}
      {(search.loading || search.answer || search.error) && (
        <div className="rounded-xl border border-line bg-surface p-4">
          <div className="flex items-center gap-2 text-xs font-medium text-muted">
            <Sparkles size={14} className="text-primary" />
            Ask your market
          </div>
          {search.loading && (
            <div className="mt-3 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-full animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-surface-hover" />
            </div>
          )}
          {search.error && <p className="mt-2 text-sm text-danger">{search.error}</p>}
          {search.answer && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{search.answer}</p>
          )}
        </div>
      )}

      {/* SECTION 1 — Overview */}
      <section id="overview" className="scroll-mt-40 space-y-4">
        <SectionHeader emoji="📊" title="Market Overview" desc={`Vue d'ensemble de ton marché — ${saasName}.`} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { k: "Market Score", v: report ? `${report.marketScore}` : "—" },
            { k: "Opportunities", v: report ? `${report.signals.length}` : "—" },
            { k: "Trending Topics", v: report ? `${report.trends.length}` : "—" },
            { k: "Posts scannés", v: report ? `${report.postsAnalyzed}` : "—" },
          ].map((c) => (
            <div key={c.k} className="card !p-4">
              <p className="text-xs font-medium text-muted">{c.k}</p>
              <p className={`mt-1.5 font-display text-2xl font-semibold ${report ? "text-ink" : "text-faint"}`}>{c.v}</p>
              <p className="mt-1 text-[11px] text-faint">{freshness ? `MàJ ${freshness}` : "Via Apify · clique Actualiser"}</p>
            </div>
          ))}
        </div>

        <AiCard>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">🤖 AI Market Summary</span>
            {!report && (
              <button
                onClick={() =>
                  summary.run(
                    `Rédige un brief d'analyste de marché (3 phrases max) pour ${saasName}. ICP : ${icp}. Secteur : ${sector ?? "non précisé"}. Concurrents : ${competitors.map((c) => c.name).join(", ")}. Sans chiffres inventés.`,
                  )
                }
                disabled={summary.loading}
                className="btn-secondary !py-1.5 !text-xs disabled:opacity-50"
              >
                {summary.loading ? "Génération…" : "↺ Générer"}
              </button>
            )}
          </div>
          {report ? (
            <p className="whitespace-pre-wrap">{report.headline}</p>
          ) : summary.answer ? (
            <p className="whitespace-pre-wrap">{summary.answer}</p>
          ) : summary.error ? (
            <p className="text-sm text-danger">{summary.error}</p>
          ) : (
            !summary.loading && (
              <p className="text-muted">
                Clique <span className="font-medium text-ink">Actualiser</span> pour scanner LinkedIn et générer une analyse réelle de ton marché — ou génère un brief rapide depuis ton profil.
              </p>
            )
          )}
        </AiCard>
      </section>

      {/* SECTION 2 — Trends */}
      <section id="trends" className="scroll-mt-40 space-y-3">
        <SectionHeader emoji="🔥" title="Trending Topics" desc="Ce dont ton marché parle sur LinkedIn en ce moment." />
        {report && report.trends.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {report.trends.map((t) => {
              const m = MOMENTUM[t.momentum] ?? MOMENTUM.steady;
              return (
                <div key={t.topic} className="card !p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{t.topic}</p>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${m.cls}`}>{m.label}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-muted">{t.summary}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <Pending reason="Aucune tendance encore. Clique « Actualiser » pour scanner les posts LinkedIn de ton marché (Apify) et les analyser." />
        )}
      </section>

      {/* SECTION 3 — Competitors (REAL: names + diffs from profile) */}
      <section id="competitors" className="scroll-mt-40 space-y-4">
        <SectionHeader emoji="🥊" title="Competitor Radar" desc="Tes concurrents directs (depuis ton profil)." />
        <div className="grid gap-3 md:grid-cols-2">
          {competitors.map((c) => (
            <div key={c.name} className="card !p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/[0.08] font-display text-sm font-bold text-primary">
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <div className="font-semibold text-ink">{c.name}</div>
              </div>
              {c.diff && (
                <p className="mt-2 text-sm text-muted">
                  <span className="font-medium text-ink">Ta différence : </span>
                  {c.diff}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4 — Audience */}
      <section id="audience" className="scroll-mt-40 space-y-3">
        <SectionHeader emoji="👥" title="Audience Intelligence" desc="Qui est ton marché, de quoi il parle et ce dont il a besoin." />
        {report && (report.audienceTopics.length || report.audiencePainPoints.length) ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="card !p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Sujets</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {report.audienceTopics.map((t) => (
                  <span key={t} className="rounded-full bg-surface-hover px-2.5 py-1 text-xs text-ink">{t}</span>
                ))}
              </div>
            </div>
            <div className="card !p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Questions récurrentes</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                {report.audienceQuestions.map((q) => <li key={q}>• {q}</li>)}
              </ul>
            </div>
            <div className="card !p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Pain points</p>
              <ul className="mt-2 space-y-1.5 text-sm text-muted">
                {report.audiencePainPoints.map((p) => <li key={p}>• {p}</li>)}
              </ul>
            </div>
          </div>
        ) : (
          <Pending reason="L'analyse d'audience (sujets, questions, pain points) apparaît après une actualisation du marché." />
        )}
      </section>

      {/* SECTION 5 — Signals */}
      <section id="signals" className="scroll-mt-40 space-y-3">
        <SectionHeader emoji="🚀" title="Buying Signals" desc="Entreprises et personnes qui pourraient avoir besoin de ta solution maintenant." />
        {report && report.signals.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {report.signals.map((s) => (
              <div key={s.title} className="card !p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-ink">{s.title}</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">{s.kind}</span>
                </div>
                <p className="mt-1 text-xs font-medium text-muted">{s.who}</p>
                <p className="mt-1.5 text-sm text-muted">{s.why}</p>
              </div>
            ))}
          </div>
        ) : (
          <Pending reason="Les signaux d'achat (recrutements, levées, lancements, frustrations) apparaissent après une actualisation du marché." />
        )}
      </section>

      {/* SECTION 6 — Recommendations */}
      <section id="recommendations" className="scroll-mt-40 space-y-3">
        <SectionHeader emoji="🤖" title="AI Recommendations" desc="Les actions les plus impactantes de la semaine." />
        {report && report.recommendations.length > 0 ? (
          <div className="space-y-2">
            {report.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-line bg-surface p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{i + 1}</span>
                <p className="text-sm text-ink">{r}</p>
              </div>
            ))}
          </div>
        ) : (
          <Pending reason="Les recommandations sont générées à partir des tendances et signaux réels — clique « Actualiser »." />
        )}
      </section>
    </div>
  );
}
