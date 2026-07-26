"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AnalysisVerdict, ContentAnalysis, ContentType } from "@/lib/types";

// Content Analyzer — paste a URL + the content text/transcript, get a graded
// report (Hook, Structure, Rétention/CTA…) with concrete actions, plus a
// "Réécrire avec ces corrections" handoff into the Studio and a saved history.

const REWRITE_TYPE: Record<string, ContentType> = {
  LinkedIn: "linkedin_post",
  Instagram: "instagram_caption",
  TikTok: "reel_script",
  YouTube: "reel_script",
};

const VERDICT: Record<AnalysisVerdict, { text: string; bar: string; chip: string }> = {
  good: { text: "text-success", bar: "bg-success", chip: "border-success/20 bg-success/5 text-success" },
  warn: { text: "text-warning", bar: "bg-warning", chip: "border-warning/30 bg-warning/5 text-warning" },
  bad: { text: "text-danger", bar: "bg-danger", chip: "border-danger/20 bg-danger/5 text-danger" },
};

function scoreBand(s: number): AnalysisVerdict {
  return s >= 75 ? "good" : s >= 45 ? "warn" : "bad";
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function ContentAnalyzerBoard({ history }: { history: ContentAnalysis[] }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [demo, setDemo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ContentAnalysis | null>(null);

  async function run() {
    if (text.trim().length < 30) {
      setError("Colle le texte du post ou la transcription de la vidéo (30 caractères min).");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, text }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Analyse impossible.");
        return;
      }
      setResult(data.analysis);
      setDemo(Boolean(data.demo));
      router.refresh(); // refresh the persisted history list
    } catch {
      setError("Analyse impossible. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Analyseur de contenu 🔍</h1>
        <span className="lead-rule" />
        <p className="mt-2 text-muted">
          Colle l&apos;URL de ta vidéo ou de ton post — on te dit ce qui marche, ce qui ne marche pas, et quoi corriger.
        </p>
      </div>

      {/* Intake */}
      <div className="card space-y-4">
        <div>
          <label className="label" htmlFor="analyze-url">URL du contenu (optionnel)</label>
          <input
            id="analyze-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.linkedin.com/posts/…  ou  https://youtube.com/shorts/…"
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="analyze-text">Texte du post / transcription de la vidéo</label>
          <textarea
            id="analyze-text"
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Colle ici le texte de ton post, ou la transcription de ta vidéo…"
            className="input"
          />
          <p className="mt-2 text-xs text-muted">
            La récupération auto et la transcription vidéo arrivent bientôt — pour l&apos;instant, colle le contenu pour une analyse immédiate.
          </p>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button onClick={run} disabled={loading} className="btn-primary">
          {loading ? "Analyse en cours…" : result ? "Analyser un autre contenu" : "Analyser"}
        </button>
      </div>

      {demo && result && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Mode démo — analyse d&apos;exemple basée sur ton texte. Ajoute ta clé Claude API pour une notation complète en temps réel.
        </p>
      )}

      {result && <Report analysis={result} />}

      {/* History */}
      {history.length > 0 && (
        <section className="card">
          <h2 className="mb-3 font-display text-base font-semibold">Historique des analyses</h2>
          <ul className="divide-y divide-line">
            {history.map((h) => {
              const band = scoreBand(h.globalScore);
              const active = result?.id === h.id;
              return (
                <li key={h.id}>
                  <button
                    onClick={() => {
                      setResult(h);
                      setDemo(false);
                      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`-mx-2 flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left transition hover:bg-canvas ${active ? "bg-canvas" : ""}`}
                  >
                    <span className={`num flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${VERDICT[band].chip}`}>
                      {h.globalScore}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-ink">
                        {h.platform} · {h.kind === "video" ? "Vidéo" : "Post"}
                      </div>
                      <div className="truncate text-xs text-muted">{h.url || "Contenu collé"}</div>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{fmtDate(h.createdAt)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Report({ analysis }: { analysis: ContentAnalysis }) {
  const band = scoreBand(analysis.globalScore);
  const rewriteType = REWRITE_TYPE[analysis.platform];
  const qs = new URLSearchParams({ topic: analysis.rewriteBrief });
  if (rewriteType) qs.set("type", rewriteType);
  const rewriteHref = `/studio?${qs.toString()}`;

  return (
    <div className="space-y-6">
      {/* Score header */}
      <div className="card flex flex-wrap items-center gap-6">
        <ScoreRing score={analysis.globalScore} band={band} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="chip border-line text-muted">{analysis.platform}</span>
            <span className="chip border-line text-muted">{analysis.kind === "video" ? "Vidéo" : "Post texte"}</span>
          </div>
          <h2 className="mt-2 font-display text-lg font-semibold text-ink">
            {band === "good" ? "Solide — quelques réglages et c'est parfait" : band === "warn" ? "Bonne base — des points clés à corriger" : "À retravailler avant de publier"}
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={rewriteHref} className="btn-primary !py-2 text-sm">Réécrire avec ces corrections</Link>
            <Link href="/algo-insider" className="btn-secondary !py-2 text-sm">Voir des exemples qui marchent dans ma niche</Link>
          </div>
        </div>
      </div>

      {/* Criteria */}
      <div className="grid gap-4 md:grid-cols-2">
        {analysis.criteria.map((c, i) => (
          <div key={i} className="card">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-ink">{c.name}</h3>
              <span className={`num text-sm font-bold ${VERDICT[c.verdict].text}`}>{c.score}<span className="text-xs text-muted">/100</span></span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-line">
              <div className={`h-full rounded-full ${VERDICT[c.verdict].bar}`} style={{ width: `${c.score}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">{c.feedback}</p>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCol icon="✅" title="Ce qui est bien" items={analysis.summary.good} tone="text-success" />
        <SummaryCol icon="⚠️" title="À améliorer" items={analysis.summary.improve} tone="text-warning" />
        <SummaryCol icon="🔴" title="À changer absolument" items={analysis.summary.change} tone="text-danger" />
      </div>
    </div>
  );
}

function ScoreRing({ score, band }: { score: number; band: AnalysisVerdict }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const stroke = band === "good" ? "#12B76A" : band === "warn" ? "#F79009" : "#F04438";
  return (
    <div className="relative h-24 w-24 shrink-0">
      <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E7E9EE" strokeWidth="8" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="num font-display text-2xl font-bold text-ink">{score}</span>
        <span className="text-[10px] text-muted">/ 100</span>
      </div>
    </div>
  );
}

function SummaryCol({ icon, title, items, tone }: { icon: string; title: string; items: string[]; tone: string }) {
  return (
    <div className="card">
      <h3 className={`mb-2 flex items-center gap-2 font-display text-sm font-semibold ${tone}`}>
        <span>{icon}</span> {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted">—</p>
      ) : (
        <ul className="space-y-1.5 text-sm text-ink/80">
          {items.map((it, i) => (
            <li key={i} className="leading-snug">{it}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
