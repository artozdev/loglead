"use client";

import {
  ArrowRight,
  BarChart3,
  Bot,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Target,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  VISIBILITY_LLMS,
  type GeoAction,
  type GeoCompetitorInsight,
  type GeoCompetitorScore,
  type GeoQueryGroup,
  type GeoQueryRow,
  type Plan,
  type VisibilityLLM,
  type VisibilityRecommendation,
} from "@/lib/types";
import GeoActionPlanTab from "./GeoActionPlanTab";
import { fmtDate, fmtDateLong, LlmLogo, ScoreRing, Th, UpsellNote } from "./GeoBits";
import GeoCompetitorsTab from "./GeoCompetitorsTab";

// ---------------------------------------------------------------------------
// GEO v2 — Generative Engine Optimization. Scans the 6 big LLMs on 10-15
// niche queries (SSE), tracks competitor visibility on the same answers and
// generates a prioritized action plan. Three tabs: visibility, competitors,
// action plan. Charts are hand-rolled SVG (no chart lib).
// ---------------------------------------------------------------------------

type HistoryItem = {
  id: string;
  date: string;
  score: number; // 0-100
  delta: number | null;
  llmScores: Partial<Record<VisibilityLLM, number>> | null; // null on legacy scans
  isGeo: boolean;
};

type ScanData = {
  rows: GeoQueryRow[];
  llmScores: Partial<Record<VisibilityLLM, number>>;
  globalScore: number;
  recommendations: VisibilityRecommendation[];
  competitorScores: GeoCompetitorScore[];
  competitorInsights: GeoCompetitorInsight[];
  actionPlan: GeoAction[];
  date: string;
};

type Tab = "visibility" | "competitors" | "plan";

const GROUPS: { value: "all" | GeoQueryGroup; label: string }[] = [
  { value: "all", label: "Toutes les requêtes" },
  { value: "niche", label: "Par niche" },
  { value: "competitor", label: "Par concurrent" },
  { value: "brand", label: "Ma marque" },
];
const PERIODS = [
  { value: "7d", label: "7 derniers jours", days: 7 },
  { value: "30d", label: "30 derniers jours", days: 30 },
  { value: "3m", label: "3 derniers mois", days: 90 },
  { value: "all", label: "Tout", days: Infinity },
];
const PAGE_SIZES = [10, 25, 50];

// Response-level buckets (query × LLM): linked > mentioned-without-link >
// opportunity. Shared by the current and previous scan so deltas compare
// like with like.
function bucketMetrics(rows: GeoQueryRow[]) {
  let responses = 0;
  let mentioned = 0;
  let linked = 0;
  for (const r of rows) {
    const statuses = Object.values(r.perLLM);
    responses += statuses.length;
    mentioned += statuses.filter((s) => s === "mentioned").length;
    linked += r.linkedCount ?? 0;
  }
  const mentionsOnly = Math.max(0, mentioned - linked);
  const opp = responses - mentionsOnly - linked;
  const pct = (n: number) => (responses === 0 ? 0 : Math.round((n / responses) * 100));
  return {
    opportunity: { pct: pct(opp), n: opp },
    mentions: { pct: pct(mentionsOnly), n: mentionsOnly },
    links: { pct: pct(linked), n: linked },
  };
}

export default function GeoBoard({
  initialUrl,
  saasName,
  competitors,
  plan,
  scansLeft,
  history,
  prevScore,
  prevRows,
  initialScan,
}: {
  initialUrl: string;
  saasName: string;
  competitors: string[];
  plan: Plan;
  scansLeft: number | null; // null = unlimited (Pro)
  history: HistoryItem[];
  prevScore: number | null;
  prevRows: GeoQueryRow[] | null;
  initialScan: ScanData | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialUrl);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<Partial<Record<VisibilityLLM, number>>>({});
  const [stages, setStages] = useState<{ site?: boolean; competitors?: boolean; plan?: boolean }>({});
  const [scan, setScan] = useState<ScanData | null>(initialScan);
  const [isDemo, setIsDemo] = useState(false);
  const [tab, setTab] = useState<Tab>("visibility");

  // Filters
  const [group, setGroup] = useState<"all" | GeoQueryGroup>("all");
  const [llmFilter, setLlmFilter] = useState<Set<VisibilityLLM>>(new Set());
  const [period, setPeriod] = useState("7d");
  const [competitorFilter, setCompetitorFilter] = useState("all");
  const [selectedCompetitor, setSelectedCompetitor] = useState<string | null>(null);

  // Table
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [customQuery, setCustomQuery] = useState("");
  const [extraQueries, setExtraQueries] = useState<string[]>([]);

  const canChart = plan !== "starter";
  const canCompetitors = plan !== "starter";
  const canPlanTab = plan !== "starter";
  const canInsights = plan === "pro";
  const canGenerate = plan === "pro";
  const queryCap = plan === "starter" ? 5 : 15;

  async function runScan() {
    if (scanning) return;
    setError(null);
    setProgress({});
    setStages({});
    setScanning(true);
    try {
      const res = await fetch("/api/geo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, extraQueries }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Le scan a échoué. Réessaie dans un instant.");
      }
      // Parse the SSE stream: `data: {...}\n\n` frames.
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done: eof } = await reader.read();
        if (eof) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data: ")) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.stage) {
            setStages((prev) => ({ ...prev, [payload.stage as string]: true }));
          } else if (payload.llm !== undefined) {
            setProgress((prev) => ({ ...prev, [payload.llm as VisibilityLLM]: payload.score }));
          } else if (payload.done) {
            setScan({
              rows: payload.rows,
              llmScores: payload.llmScores,
              globalScore: payload.globalScore,
              recommendations: payload.recommendations ?? [],
              competitorScores: payload.competitorScores ?? [],
              competitorInsights: payload.competitorInsights ?? [],
              actionPlan: payload.actionPlan ?? [],
              date: new Date().toISOString(),
            });
            setIsDemo(Boolean(payload.demo));
            setRemoved(new Set());
            setSelected(new Set());
            setExtraQueries([]);
            setPage(1);
          }
        }
      }
      router.refresh(); // refresh history + quota from the server
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le scan a échoué.");
    } finally {
      setScanning(false);
    }
  }

  // Reload a past report from the history list.
  async function loadReport(id: string) {
    const res = await fetch(`/api/geo?scanId=${id}`);
    if (!res.ok) return;
    const { scan: s } = await res.json();
    setScan({
      rows: s.queryRows,
      llmScores: s.llmScores ?? {},
      globalScore: s.globalScore,
      recommendations: s.recommendations ?? [],
      competitorScores: s.competitorScores ?? [],
      competitorInsights: s.competitorInsights ?? [],
      actionPlan: s.actionPlan ?? [],
      date: s.createdAt,
    });
    setTab("visibility");
    setPage(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ----- Derived table rows (group / LLM / competitor filters applied) -----
  const rows = useMemo(() => {
    if (!scan) return [];
    let list = scan.rows.filter((r) => !removed.has(r.query));
    if (group !== "all") list = list.filter((r) => r.group === group);
    if (competitorFilter !== "all") list = list.filter((r) => r.topCompetitor === competitorFilter);
    if (llmFilter.size > 0) {
      // Re-score each row over the selected LLMs only.
      list = list
        .map((r) => {
          const entries = Object.entries(r.perLLM).filter(([llm]) =>
            llmFilter.has(llm as VisibilityLLM),
          );
          if (entries.length === 0) return null;
          const pts = entries.reduce(
            (a, [, s]) => a + (s === "mentioned" ? 1 : s === "partial" ? 0.5 : 0),
            0,
          );
          const top = entries.sort(
            ([, a], [, b]) =>
              (b === "mentioned" ? 2 : b === "partial" ? 1 : 0) -
              (a === "mentioned" ? 2 : a === "partial" ? 1 : 0),
          )[0];
          return {
            ...r,
            score: Math.round((pts / entries.length) * 100),
            topLLM: top[1] === "not_detected" ? null : (top[0] as VisibilityLLM),
          };
        })
        .filter((r): r is GeoQueryRow => r !== null);
    }
    return list;
  }, [scan, removed, group, llmFilter, competitorFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize);
  const rangeStart = rows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, rows.length);

  // ----- Metrics + deltas vs previous scan -----
  const metrics = useMemo(() => (scan ? bucketMetrics(scan.rows) : null), [scan]);
  const prevMetrics = useMemo(() => (prevRows ? bucketMetrics(prevRows) : null), [prevRows]);

  const competitorAvg = useMemo(() => {
    if (!scan || scan.competitorScores.length === 0) return null;
    return Math.round(
      scan.competitorScores.reduce((a, c) => a + c.avg, 0) / scan.competitorScores.length,
    );
  }, [scan]);

  const sortedLlmScores = useMemo(() => {
    if (!scan) return [];
    return VISIBILITY_LLMS.map((m) => ({ ...m, score: scan.llmScores[m.value] ?? 0 })).sort(
      (a, b) => b.score - a.score,
    );
  }, [scan]);

  // ----- Evolution chart data (GEO scans in period, oldest → newest) -----
  const chartPoints = useMemo(() => {
    const days = PERIODS.find((p) => p.value === period)?.days ?? 7;
    const cutoff = days === Infinity ? 0 : Date.now() - days * 86_400_000;
    return history
      .filter((h) => h.llmScores && new Date(h.date).getTime() >= cutoff)
      .slice()
      .reverse() as (HistoryItem & { llmScores: Partial<Record<VisibilityLLM, number>> })[];
  }, [history, period]);

  const studioBrief = (extra = "") =>
    `/studio?brief=${encodeURIComponent(
      `Rédige un contenu long-form pensé pour la visibilité LLM (GEO) : associe ${saasName} aux problèmes de sa niche, structure FAQ, comparaisons explicites.${extra}`,
    )}`;

  const started = scanning || scan !== null;
  const allLlmDone = VISIBILITY_LLMS.every(({ value }) => progress[value] !== undefined);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[22px] font-medium tracking-tight">
            GEO — Generative Engine Optimization
          </h1>
          <span className="lead-rule" />
          <p className="mt-2 max-w-xl text-muted">
            Mesurez votre visibilité sur les 6 grands LLMs, analysez vos concurrents et
            améliorez votre positionnement IA.
          </p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); void runScan(); }}
          className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"
        >
          <input
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://monsaas.io"
            className="input h-10 !py-0 text-sm sm:w-64"
          />
          <button
            type="submit"
            disabled={scanning || scansLeft === 0}
            className="btn-primary h-10 shrink-0 whitespace-nowrap !py-0 text-sm"
          >
            {scanning ? (
              <><Loader2 size={14} className="animate-spin" /> Scan en cours…</>
            ) : (
              <>Scanner <ArrowRight size={14} /></>
            )}
          </button>
        </form>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>Analyse complète en 30-60 secondes · Résultats mis à jour en temps réel</span>
        {scansLeft !== null && (
          <span className={`num font-medium ${scansLeft === 0 ? "text-warning" : ""}`}>
            {scansLeft} scan{scansLeft > 1 ? "s" : ""} restant{scansLeft > 1 ? "s" : ""} ce mois
          </span>
        )}
      </div>
      {scansLeft === 0 && (
        <p className="text-sm text-warning">
          Quota mensuel atteint —{" "}
          <Link href="/pricing" className="font-medium underline">passe à l&apos;offre supérieure</Link>{" "}
          pour scanner plus souvent.
        </p>
      )}
      {error && <p className="text-sm text-danger">{error}</p>}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-y-[0.5px] border-line py-3">
        <FilterSelect
          icon={FolderOpen}
          value={group}
          onChange={(v) => { setGroup(v as "all" | GeoQueryGroup); setPage(1); }}
          options={GROUPS}
        />
        <LlmMultiSelect selected={llmFilter} onChange={(s) => { setLlmFilter(s); setPage(1); }} />
        <FilterSelect icon={Calendar} value={period} onChange={setPeriod} options={PERIODS} />
        {competitors.length > 0 && (
          <FilterSelect
            icon={Users}
            value={competitorFilter}
            onChange={(v) => {
              setCompetitorFilter(v);
              if (v !== "all") setSelectedCompetitor(v);
              setPage(1);
            }}
            options={[
              { value: "all", label: "Tous les concurrents" },
              ...competitors.map((c) => ({ value: c, label: c })),
            ]}
          />
        )}
        <button
          onClick={() => void runScan()}
          disabled={scanning || scansLeft === 0}
          title="Relancer un scan"
          aria-label="Relancer un scan"
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-[10px] border border-line text-muted hover:bg-surface-hover hover:text-ink disabled:opacity-40"
        >
          <RefreshCw size={14} strokeWidth={1.5} className={scanning ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Scan progress (live SSE) */}
      {scanning && (
        <div className="rounded-xl border-[0.5px] border-line bg-surface p-4">
          <div className="space-y-2 text-sm">
            <StageLine label="Analyse de votre site…" state={stages.site ? "done" : "running"} />
            {VISIBILITY_LLMS.map(({ value: llm, label }, i) => {
              const score = progress[llm];
              return (
                <div key={llm} className="flex items-center gap-2.5">
                  <LlmLogo llm={llm} size={18} />
                  <span className="flex-1 text-ink">
                    Interrogation de {label}
                    {i === 0 ? ` (${queryCap} requêtes)` : ""}…
                  </span>
                  {score !== undefined ? (
                    <span className="num flex items-center gap-1.5 font-medium text-success">
                      <Check size={14} /> Score : {score}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      <Loader2 size={13} className="animate-spin" /> En cours…
                    </span>
                  )}
                </div>
              );
            })}
            <StageLine
              label="Analyse des concurrents…"
              state={stages.competitors ? "done" : allLlmDone ? "running" : "waiting"}
            />
            <StageLine
              label="Génération du plan d'action…"
              state={stages.plan ? "done" : stages.competitors ? "running" : "waiting"}
            />
          </div>
        </div>
      )}

      {!started && (
        <div className="flex flex-col items-center rounded-xl border-[0.5px] border-line bg-surface px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
            <Bot size={26} strokeWidth={1.5} />
          </span>
          <p className="mt-4 font-display text-base font-semibold text-ink">
            Aucun scan pour l&apos;instant
          </p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Lance ton premier scan pour découvrir si {saasName} est recommandé par ChatGPT,
            Claude, Gemini, Perplexity, Grok et Mistral.
          </p>
        </div>
      )}

      {isDemo && scan && (
        <p className="rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          Mode démo — résultats simulés pour ta niche. Ajoute les clés API des modèles dans
          .env.local pour des scans réels.
        </p>
      )}

      {/* Global metric cards (5) */}
      {scan && metrics && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricCard
            value={<>{scan.globalScore}<span className="text-base text-muted">/100</span></>}
            label="Score GEO global"
            hint="Moyenne sur les 6 LLMs"
            delta={prevScore !== null ? scan.globalScore - prevScore : null}
            deltaSuffix=" pts"
          />
          <MetricCard
            value={<>{metrics.opportunity.pct}%<span className="text-base text-muted"> ({metrics.opportunity.n})</span></>}
            label="Opportunités"
            hint="Réponses où tu pourrais apparaître"
            delta={prevMetrics ? metrics.opportunity.pct - prevMetrics.opportunity.pct : null}
            invert
          />
          <MetricCard
            value={<>{metrics.mentions.pct}%<span className="text-base text-muted"> ({metrics.mentions.n})</span></>}
            label="Mentions directes"
            hint="Réponses où ton SaaS est cité"
            delta={prevMetrics ? metrics.mentions.pct - prevMetrics.mentions.pct : null}
          />
          <MetricCard
            value={<>{metrics.links.pct}%<span className="text-base text-muted"> ({metrics.links.n})</span></>}
            label="Liens vers ton site"
            hint="Réponses qui renvoient vers ton URL"
            delta={prevMetrics ? metrics.links.pct - prevMetrics.links.pct : null}
          />
          <MetricCard
            value={
              competitorAvg === null ? (
                <span className="text-muted">—</span>
              ) : (
                <>
                  {scan.globalScore - competitorAvg >= 0 ? "+" : ""}
                  {scan.globalScore - competitorAvg}
                  <span className="text-base text-muted"> pts</span>
                </>
              )
            }
            label="Avance sur concurrents"
            hint="Ton score vs leur moyenne"
            delta={null}
          />
        </div>
      )}

      {/* Tabs */}
      {scan && (
        <>
          <div className="flex gap-1 border-b border-line" role="tablist">
            <TabButton icon={BarChart3} label="Ma visibilité" active={tab === "visibility"} onClick={() => setTab("visibility")} />
            <TabButton icon={Users} label="Concurrents" active={tab === "competitors"} onClick={() => setTab("competitors")} />
            <TabButton icon={Target} label="Plan d'action" active={tab === "plan"} onClick={() => setTab("plan")} />
          </div>

          {tab === "competitors" &&
            (canCompetitors ? (
              <GeoCompetitorsTab
                saasName={saasName}
                myScores={scan.llmScores}
                competitorScores={scan.competitorScores}
                insights={scan.competitorInsights}
                canInsights={canInsights}
                selected={selectedCompetitor}
                onSelect={setSelectedCompetitor}
              />
            ) : (
              <UpsellNote text="Le suivi des concurrents est inclus à partir du plan Growth." />
            ))}

          {tab === "plan" && (
            <GeoActionPlanTab
              actions={scan.actionPlan}
              saasName={saasName}
              globalScore={scan.globalScore}
              queriesCount={scan.rows.length}
              competitorsCount={scan.competitorScores.length}
              canPlan={canPlanTab}
              canGenerate={canGenerate}
            />
          )}

          {tab === "visibility" && (
            <>
              {/* LLM scores + evolution */}
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-xl border-[0.5px] border-line bg-surface p-5">
                  <h2 className="font-display text-base font-semibold text-ink">
                    Score par LLM <span className="ml-1 text-[13px] font-normal text-faint">Cliquer pour filtrer</span>
                  </h2>
                  <div className="mt-4 space-y-2">
                    {sortedLlmScores.map((m) => {
                      const active = llmFilter.has(m.value);
                      return (
                        <button
                          key={m.value}
                          onClick={() => {
                            const next = new Set(llmFilter);
                            if (active) next.delete(m.value);
                            else next.add(m.value);
                            setLlmFilter(next);
                            setPage(1);
                          }}
                          aria-pressed={active}
                          className="flex w-full items-center gap-3"
                        >
                          <div
                            className={`relative h-9 flex-1 overflow-hidden rounded-lg bg-surface-hover transition ${
                              active ? "ring-2 ring-primary/40" : ""
                            }`}
                          >
                            <div
                              className="absolute inset-y-0 left-0 rounded-lg bg-brand-gradient opacity-[0.18] transition-[width] duration-500 ease-smooth"
                              style={{ width: `${m.score}%` }}
                            />
                            <div className="relative flex h-full items-center gap-2 px-3">
                              <LlmLogo llm={m.value} />
                              <span className="text-[13px] font-medium text-ink">{m.label}</span>
                            </div>
                          </div>
                          <span className="num w-8 text-right text-sm font-medium text-ink">{m.score}</span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-xl border-[0.5px] border-line bg-surface p-5">
                  <h2 className="font-display text-base font-semibold text-ink">
                    Évolution <span className="ml-1 text-[13px] font-normal text-faint">Score par LLM dans le temps</span>
                  </h2>
                  {canChart ? (
                    <EvolutionChart points={chartPoints} />
                  ) : (
                    <UpsellNote text="Le graphique d'évolution est inclus à partir du plan Growth." />
                  )}
                </section>
              </div>

              {/* Prompt performance table */}
              <section className="rounded-xl border-[0.5px] border-line bg-surface">
                <div className="flex flex-wrap items-start justify-between gap-3 p-5 pb-3">
                  <div>
                    <h2 className="font-display text-base font-semibold text-ink">
                      Aperçu des performances par requête
                    </h2>
                    <p className="mt-0.5 text-sm text-muted">
                      Visibilité de votre SaaS dans les réponses IA
                    </p>
                  </div>
                  <button
                    onClick={() => void runScan()}
                    disabled={scanning || scansLeft === 0}
                    className="btn-secondary !py-2 text-[13px]"
                  >
                    <RefreshCw size={13} strokeWidth={1.5} className={scanning ? "animate-spin" : ""} />
                    Rafraîchir
                  </button>
                </div>

                {selected.size > 0 && canGenerate && (
                  <div className="mx-5 mb-2 flex items-center justify-between rounded-lg bg-primary/[0.06] px-3 py-2 text-[13px]">
                    <span className="text-ink">{selected.size} requête{selected.size > 1 ? "s" : ""} sélectionnée{selected.size > 1 ? "s" : ""}</span>
                    <Link
                      href={studioBrief(` Cible en priorité ces requêtes : ${[...selected].join(" · ")}.`)}
                      className="font-medium text-primary hover:underline"
                    >
                      Générer du contenu pour ces requêtes →
                    </Link>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] border-collapse text-[13px]">
                    <thead>
                      <tr>
                        <Th className="w-10">
                          <input
                            type="checkbox"
                            aria-label="Tout sélectionner"
                            checked={pageRows.length > 0 && pageRows.every((r) => selected.has(r.query))}
                            onChange={(e) => {
                              const next = new Set(selected);
                              pageRows.forEach((r) => (e.target.checked ? next.add(r.query) : next.delete(r.query)));
                              setSelected(next);
                            }}
                          />
                        </Th>
                        <Th>Requête</Th>
                        <Th>Top LLM</Th>
                        <Th>Score de visibilité</Th>
                        <Th>Top concurrent</Th>
                        <Th className="w-16 text-right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((r) => (
                        <RowWithDetail
                          key={r.query}
                          row={r}
                          expanded={expanded === r.query}
                          selected={selected.has(r.query)}
                          canGenerate={canGenerate}
                          studioHref={studioBrief(` Cible en priorité la requête : « ${r.query} ».`)}
                          onSelect={(checked) => {
                            const next = new Set(selected);
                            checked ? next.add(r.query) : next.delete(r.query);
                            setSelected(next);
                          }}
                          onToggleDetail={() => setExpanded(expanded === r.query ? null : r.query)}
                          onRemove={() => setRemoved(new Set(removed).add(r.query))}
                        />
                      ))}
                      {pageRows.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted">
                            Aucune requête ne correspond à ces filtres.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Custom query (Pro) + pagination */}
                <div className="flex flex-wrap items-center gap-3 border-t-[0.5px] border-line p-3">
                  {canGenerate ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const q = customQuery.trim();
                        if (q && !extraQueries.includes(q)) setExtraQueries([...extraQueries, q]);
                        setCustomQuery("");
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        value={customQuery}
                        onChange={(e) => setCustomQuery(e.target.value)}
                        placeholder="Ajouter une requête au prochain scan…"
                        className="w-64 rounded-lg border border-line bg-canvas px-3 py-1.5 text-[13px] outline-none placeholder:text-faint focus:border-primary"
                      />
                      <button type="submit" className="btn-secondary !px-2.5 !py-1.5" aria-label="Ajouter la requête">
                        <Plus size={14} strokeWidth={1.5} />
                      </button>
                      {extraQueries.length > 0 && (
                        <span className="num text-xs text-muted">
                          +{extraQueries.length} au prochain scan
                        </span>
                      )}
                    </form>
                  ) : (
                    <span className="text-xs text-faint">
                      Requêtes personnalisées disponibles sur le plan Pro
                    </span>
                  )}
                  <div className="ml-auto flex items-center gap-2">
                    <div className="flex items-center rounded-lg border border-line px-2 py-1 text-[13px]">
                      <select
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                        aria-label="Requêtes par page"
                        className="bg-transparent text-ink outline-none"
                      >
                        {PAGE_SIZES.map((n) => (
                          <option key={n} value={n}>{n} par page</option>
                        ))}
                      </select>
                    </div>
                    <span className="num text-xs text-muted">
                      {rangeStart}–{rangeEnd} sur {rows.length}
                    </span>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                      aria-label="Page précédente"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted disabled:opacity-40 [&:not(:disabled)]:hover:bg-surface-hover"
                    >
                      <ChevronLeft size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(page + 1)}
                      aria-label="Page suivante"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-line text-muted disabled:opacity-40 [&:not(:disabled)]:hover:bg-surface-hover"
                    >
                      <ChevronRight size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="rounded-xl border-[0.5px] border-line bg-surface p-5">
          <h2 className="font-display text-base font-semibold text-ink">Historique des scans</h2>
          <div className="mt-3 divide-y divide-line">
            {history.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-4 py-2.5 text-sm">
                <span className="text-ink">Scan du {fmtDateLong(h.date)}</span>
                <span className="flex items-center gap-3">
                  <span className="num font-medium text-ink">Score : {h.score}/100</span>
                  {h.delta !== null && h.delta !== 0 && (
                    <span className={`num text-xs font-semibold ${h.delta > 0 ? "text-success" : "text-danger"}`}>
                      {h.delta > 0 ? "↑ +" : "↓ "}
                      {h.delta} vs précédent
                    </span>
                  )}
                  {h.isGeo && (
                    <button
                      onClick={() => void loadReport(h.id)}
                      className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-ink"
                    >
                      Voir le rapport
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ----- Loading stage line ------------------------------------------------------

function StageLine({ label, state }: { label: string; state: "done" | "running" | "waiting" }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-[18px] w-[18px] items-center justify-center rounded-md bg-surface-hover text-muted">
        <Loader2 size={11} className={state === "running" ? "animate-spin" : "opacity-40"} />
      </span>
      <span className={`flex-1 ${state === "waiting" ? "text-muted" : "text-ink"}`}>{label}</span>
      {state === "done" ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-success">
          <Check size={14} /> Terminé
        </span>
      ) : state === "running" ? (
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <Loader2 size={13} className="animate-spin" /> En cours…
        </span>
      ) : (
        <span className="text-xs text-faint">En attente…</span>
      )}
    </div>
  );
}

// ----- Tabs ---------------------------------------------------------------------

function TabButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] transition ${
        active
          ? "border-primary font-medium text-ink"
          : "border-transparent text-muted hover:text-ink"
      }`}
    >
      <Icon size={14} strokeWidth={1.5} />
      {label}
    </button>
  );
}

// ----- Table row + expandable detail -----------------------------------------

function RowWithDetail({
  row,
  expanded,
  selected,
  canGenerate,
  studioHref,
  onSelect,
  onToggleDetail,
  onRemove,
}: {
  row: GeoQueryRow;
  expanded: boolean;
  selected: boolean;
  canGenerate: boolean;
  studioHref: string;
  onSelect: (checked: boolean) => void;
  onToggleDetail: () => void;
  onRemove: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <>
      <tr className="border-t-[0.5px] border-line hover:bg-surface-hover">
        <td className="px-4 py-3">
          <input
            type="checkbox"
            aria-label={`Sélectionner « ${row.query} »`}
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
          />
        </td>
        <td className="px-4 py-3 font-medium text-ink">{row.query}</td>
        <td className="px-4 py-3">
          {row.topLLM ? (
            <span className="inline-flex items-center gap-2">
              <LlmLogo llm={row.topLLM} />
              <span className="text-ink">
                {VISIBILITY_LLMS.find((x) => x.value === row.topLLM)?.label}
              </span>
            </span>
          ) : (
            <span className="text-faint">—</span>
          )}
        </td>
        <td className="px-4 py-3">
          <ScoreRing score={row.score} />
        </td>
        <td className="px-4 py-3">
          {row.topCompetitor ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-hover px-2.5 py-1 text-xs font-medium text-muted">
              {row.topCompetitor}
            </span>
          ) : (
            <span className="text-faint">—</span>
          )}
        </td>
        <td className="px-4 py-3 text-right">
          <div className="relative inline-block">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Actions"
              className="rounded-lg border border-line p-1.5 text-muted hover:bg-surface-hover hover:text-ink"
            >
              <MoreHorizontal size={14} strokeWidth={1.5} />
            </button>
            {menuOpen && (
              <>
                <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-[10px] border border-line bg-surface p-1 text-left shadow-pop">
                  <button
                    onClick={() => { setMenuOpen(false); onToggleDetail(); }}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink hover:bg-surface-hover"
                  >
                    {expanded ? "Masquer les réponses" : "Voir les réponses complètes"}
                  </button>
                  {canGenerate && (
                    <Link
                      href={studioHref}
                      className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink hover:bg-surface-hover"
                    >
                      Générer du contenu pour améliorer
                    </Link>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); onRemove(); }}
                    className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-danger hover:bg-surface-hover"
                  >
                    Supprimer
                  </button>
                </div>
              </>
            )}
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="border-t-[0.5px] border-line bg-canvas">
          <td colSpan={6} className="px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {VISIBILITY_LLMS.map(({ value: llm, label }) => {
                const s = row.perLLM[llm];
                if (!s) return null;
                const cls =
                  s === "mentioned"
                    ? "border-success/20 bg-success/10 text-success"
                    : s === "partial"
                      ? "border-warning/25 bg-warning/10 text-warning"
                      : "border-danger/15 bg-danger/[0.06] text-danger";
                return (
                  <span key={llm} className={`chip ${cls}`}>
                    {label} · {s === "mentioned" ? "cité" : s === "partial" ? "partiel" : "absent"}
                  </span>
                );
              })}
            </div>
            <p className="mt-2 text-[13px] italic leading-relaxed text-ink/80">{row.excerpt}</p>
          </td>
        </tr>
      )}
    </>
  );
}

// ----- Metric card ------------------------------------------------------------

function MetricCard({
  value,
  label,
  hint,
  delta,
  deltaSuffix = " %",
  invert,
}: {
  value: React.ReactNode;
  label: string;
  hint: string;
  delta: number | null; // vs previous scan; null hides the badge
  deltaSuffix?: string;
  invert?: boolean; // when a decrease is good news (opportunities)
}) {
  const up = (delta ?? 0) >= 0;
  const good = invert ? !up : up;
  return (
    <div className="rounded-[10px] border-[0.5px] border-line bg-surface px-4 py-3.5">
      <div className="flex items-start justify-between gap-2">
        <span className="num text-[28px] font-semibold leading-none tracking-tight text-ink">
          {value}
        </span>
        {delta !== null && delta !== 0 && (
          <span
            className={`num inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              good ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {up ? "↑" : "↓"} {Math.abs(delta)}
            {deltaSuffix}
          </span>
        )}
      </div>
      <p className="mt-2 text-[13px] font-medium text-ink">{label}</p>
      <p className="text-xs text-faint">{hint}</p>
    </div>
  );
}

// ----- Evolution chart (custom SVG, smooth lines) ------------------------------

function EvolutionChart({
  points,
}: {
  points: { date: string; llmScores: Partial<Record<VisibilityLLM, number>> }[];
}) {
  if (points.length < 2) {
    return (
      <p className="flex h-48 items-center justify-center text-center text-sm text-muted">
        Lance au moins deux scans sur la période pour voir l&apos;évolution.
      </p>
    );
  }

  const W = 560;
  const H = 220;
  const PAD = { top: 12, right: 12, bottom: 26, left: 30 };
  const iw = W - PAD.left - PAD.right;
  const ih = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.top + (1 - v / 100) * ih;

  // Catmull-Rom → cubic bezier for smooth curves.
  function smoothPath(vals: { x: number; y: number }[]): string {
    if (vals.length < 2) return "";
    let d = `M ${vals[0].x} ${vals[0].y}`;
    for (let i = 0; i < vals.length - 1; i++) {
      const p0 = vals[Math.max(0, i - 1)];
      const p1 = vals[i];
      const p2 = vals[i + 1];
      const p3 = vals[Math.min(vals.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }

  return (
    <div className="mt-3">
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {VISIBILITY_LLMS.map((m) => (
          <span key={m.value} className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: m.chartColor }} />
            {m.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 w-full" role="img" aria-label="Évolution des scores par LLM">
        {/* Horizontal gridlines */}
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--border)"
              strokeWidth="0.5"
            />
            <text x={PAD.left - 6} y={y(v) + 3} textAnchor="end" fontSize="9" fill="var(--text-muted)">
              {v}
            </text>
          </g>
        ))}
        {/* X labels */}
        {points.map((p, i) => (
          <text key={p.date} x={x(i)} y={H - 8} textAnchor="middle" fontSize="9" fill="var(--text-muted)">
            {fmtDate(p.date)}
          </text>
        ))}
        {/* One smooth line per LLM */}
        {VISIBILITY_LLMS.map((m) => {
          const vals = points.map((p, i) => ({ x: x(i), y: y(p.llmScores[m.value] ?? 0) }));
          return (
            <g key={m.value}>
              <path d={smoothPath(vals)} fill="none" stroke={m.chartColor} strokeWidth="1.8" strokeLinecap="round" />
              {vals.map((v, i) => (
                <circle key={i} cx={v.x} cy={v.y} r="2.5" fill={m.chartColor}>
                  <title>{`${m.label} — ${fmtDate(points[i].date)} : ${points[i].llmScores[m.value] ?? 0}/100`}</title>
                </circle>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ----- Filter bits ---------------------------------------------------------------

function FilterSelect({
  icon: Icon,
  value,
  onChange,
  options,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-[10px] border border-line px-2.5 py-2 text-[13px] text-muted">
      <Icon size={13} strokeWidth={1.5} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-ink outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function LlmMultiSelect({
  selected,
  onChange,
}: {
  selected: Set<VisibilityLLM>;
  onChange: (s: Set<VisibilityLLM>) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-[10px] border border-line px-2.5 py-2 text-[13px] text-muted hover:bg-surface-hover hover:text-ink"
      >
        <Bot size={13} strokeWidth={1.5} />
        {selected.size === 0 ? "Filtrer par LLM" : `${selected.size} LLM${selected.size > 1 ? "s" : ""}`}
        <ChevronDown size={12} strokeWidth={1.5} />
      </button>
      {open && (
        <>
          <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-48 rounded-[10px] border border-line bg-surface p-1 shadow-pop">
            {VISIBILITY_LLMS.map((m) => {
              const checked = selected.has(m.value);
              return (
                <label
                  key={m.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] text-ink hover:bg-surface-hover"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      const next = new Set(selected);
                      e.target.checked ? next.add(m.value) : next.delete(m.value);
                      onChange(next);
                    }}
                  />
                  <LlmLogo llm={m.value} size={16} />
                  {m.label}
                </label>
              );
            })}
            {selected.size > 0 && (
              <button
                onClick={() => onChange(new Set())}
                className="mt-1 w-full rounded-lg border-t border-line px-2.5 py-1.5 text-left text-xs text-muted hover:bg-surface-hover"
              >
                Réinitialiser
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
