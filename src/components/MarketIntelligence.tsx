"use client";

import { Lock, Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Market page shell. Real data comes from the business profile (competitors,
// ICP, sector) and from Claude ("Ask your market" + AI summary). Everything
// that would require live LinkedIn scraping (trends, competitor metrics,
// audience, buying signals) is shown as an honest "pending" state — never
// faked — until the Apify backend + cron + historical storage exist.
// ---------------------------------------------------------------------------

type Competitor = { name: string; diff?: string };

type Props = {
  saasName: string;
  icp: string;
  sector?: string;
  competitors: Competitor[];
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

export default function MarketIntelligence({ saasName, icp, sector, competitors }: Props) {
  const [active, setActive] = useState("overview");
  const [query, setQuery] = useState("");
  const search = useMarketAsk();
  const summary = useMarketAsk();
  const containerRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Sticky header: AI search + anchor nav */}
      <div className="sticky top-0 z-20 -mx-4 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
        <div className="relative">
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
          {search.error && (
            <p className="mt-2 text-sm text-danger">{search.error}</p>
          )}
          {search.answer && (
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">
              {search.answer}
            </p>
          )}
        </div>
      )}

      {/* SECTION 1 — Overview */}
      <section id="overview" className="scroll-mt-40 space-y-4">
        <SectionHeader emoji="📊" title="Market Overview" desc={`Vue d'ensemble de ton marché — ${saasName}.`} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { k: "Market Score", u: "Claude" },
            { k: "Opportunities", u: "Apify" },
            { k: "Trending Topics", u: "Apify" },
            { k: "Buying Signals", u: "Apify" },
          ].map((c) => (
            <div key={c.k} className="card !p-4">
              <p className="text-xs font-medium text-muted">{c.k}</p>
              <p className="mt-1.5 font-display text-2xl font-semibold text-faint">—</p>
              <p className="mt-1 text-[11px] text-faint">Via {c.u} · bientôt</p>
            </div>
          ))}
        </div>

        <AiCard>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              🤖 AI Market Summary
            </span>
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
          </div>
          {summary.error && <p className="text-sm text-danger">{summary.error}</p>}
          {summary.answer ? (
            <p className="whitespace-pre-wrap">{summary.answer}</p>
          ) : (
            !summary.loading &&
            !summary.error && (
              <p className="text-muted">
                Génère un brief de marché basé sur ton profil (concurrents, ICP, secteur).
                Nécessite des crédits Claude.
              </p>
            )
          )}
        </AiCard>
      </section>

      {/* SECTION 2 — Trends */}
      <section id="trends" className="scroll-mt-40">
        <SectionHeader emoji="🔥" title="Trending Topics" desc="Ce dont ton marché parle sur LinkedIn en ce moment." />
        <Pending reason="Les tendances nécessitent le scraping des posts/hashtags LinkedIn (Apify) + un historique pour calculer les évolutions. Disponible une fois le backend Apify + cron branché." />
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
              <p className="mt-3 text-[11px] text-faint">
                Activité LinkedIn (posts, engagement, followers) — bientôt via Apify.
              </p>
            </div>
          ))}
        </div>
        <Pending reason="Le tableau comparatif (posts/semaine, engagement, croissance followers) nécessite le scraping des pages entreprises LinkedIn (Apify)." />
      </section>

      {/* SECTION 4 — Audience */}
      <section id="audience" className="scroll-mt-40">
        <SectionHeader emoji="👥" title="Audience Intelligence" desc="Qui est ton marché, de quoi il parle et ce dont il a besoin." />
        <Pending reason="L'analyse d'audience (sujets, questions, pain points) croise le scraping des commentaires LinkedIn (Apify) avec une analyse Claude. Nécessite le backend Apify + des crédits Claude." />
      </section>

      {/* SECTION 5 — Signals */}
      <section id="signals" className="scroll-mt-40">
        <SectionHeader emoji="🚀" title="Buying Signals" desc="Entreprises et personnes qui pourraient avoir besoin de ta solution maintenant." />
        <Pending reason="Les signaux d'achat (levées de fonds, recrutements de commerciaux, nouveaux entrants) proviennent du scraping de posts/offres LinkedIn (Apify). Disponible une fois le backend branché." />
      </section>

      {/* SECTION 6 — Recommendations */}
      <section id="recommendations" className="scroll-mt-40">
        <SectionHeader emoji="🤖" title="AI Recommendations" desc="Les 3 actions les plus impactantes de la semaine." />
        <Pending reason="Les recommandations sont générées par Claude à partir des tendances, concurrents et signaux scrapés. Nécessite le backend Apify (données) + des crédits Claude (analyse)." />
      </section>
    </div>
  );
}
