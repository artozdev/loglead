"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ALGO_NETWORKS, INSTAGRAM_SOON_TOOLTIP, type AlgoNetwork, type AlgoNetworkInsight, type AlgoTechnique } from "@/lib/types";

// Algo Insider — the dynamic, niche-specific algorithm guide. Tabs per network,
// visual section cards (not a wall of text), "Mis à jour" recency, and a
// "Créer un contenu" deep-link that pre-fills the Studio brief.

function relTime(iso: string): string {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.round(diff / 60_000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `il y a ${d} j`;
  return `il y a ${Math.round(d / 30)} mois`;
}

// Build a Studio deep-link that pre-fills the brief from a technique.
function studioHref(network: AlgoNetwork, t: AlgoTechnique): string {
  const ct = ALGO_NETWORKS.find((n) => n.value === network)?.contentType;
  const topic = `${t.title} : ${t.example}`;
  const qs = new URLSearchParams({ topic });
  if (ct) qs.set("type", ct);
  return `/studio?${qs.toString()}`;
}

export default function AlgoInsiderBoard({
  niche,
  networks,
  generatedAt,
  demo,
}: {
  niche: string;
  networks: AlgoNetworkInsight[];
  generatedAt: string;
  demo: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<AlgoNetwork>("linkedin");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = useMemo(
    () => networks.find((n) => n.network === tab) ?? networks[0],
    [networks, tab],
  );

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/algo", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Génération impossible.");
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Génération impossible.");
    } finally {
      setRefreshing(false);
    }
  }

  if (!current) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">LinkedIn Intelligence 🧠</h1>
          <span className="lead-rule" />
          <p className="mt-2 text-muted">
            Comprends comment fonctionnent les algorithmes pour{" "}
            {niche ? <span className="font-medium text-ink">{niche}</span> : "ta niche"} — et exactement quoi faire pour mettre ton SaaS en avant.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip border-success/20 bg-success/5 text-success">Mis à jour {relTime(generatedAt)}</span>
          <button
            onClick={refresh}
            disabled={refreshing}
            className="btn-secondary !py-2 text-sm"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" />
            </svg>
            {refreshing ? "Génération…" : "Actualiser"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">{error}</p>
      )}
      {demo && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Mode démo — exemples adaptés à ta niche. Ajoute ta clé Claude API pour des recommandations générées en temps réel.
        </p>
      )}

      {/* Network tabs — Instagram is coming soon (disabled + badge) */}
      <div className="flex flex-wrap gap-2">
        {ALGO_NETWORKS.map((n) => {
          const on = tab === n.value;
          if (n.comingSoon) {
            return (
              <span
                key={n.value}
                title={INSTAGRAM_SOON_TOOLTIP}
                aria-disabled="true"
                className="relative inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink/70 opacity-40"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: n.dot }} />
                {n.label}
                <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                  Bientôt
                </span>
              </span>
            );
          }
          return (
            <button
              key={n.value}
              onClick={() => setTab(n.value)}
              aria-pressed={on}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition ${
                on ? "border-primary/30 bg-primary/[0.06] text-primary" : "border-line bg-surface text-ink/70 hover:bg-canvas"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: n.dot }} />
              {n.label}
            </button>
          );
        })}
      </div>

      {/* Top row: when to post + current algorithm */}
      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard icon="⏰" title="Quand poster" className="lg:col-span-1">
          <p className="text-sm text-ink/80">{current.bestTimes}</p>
        </SectionCard>
        <SectionCard icon="📈" title="L'algorithme en ce moment" badge="Tendance" className="lg:col-span-2">
          <p className="text-sm text-ink/80">{current.trend}</p>
        </SectionCard>
      </div>

      {/* What to post + hooks */}
      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard icon="📝" title="Quoi poster">
          <ul className="space-y-3">
            {current.formats.map((f, i) => (
              <li key={i}>
                <div className="text-sm font-semibold text-ink">{f.name}</div>
                <div className="text-sm text-muted">{f.why}</div>
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard icon="🪝" title="Comment capter l'attention">
          <ul className="space-y-3">
            {current.hooks.map((h, i) => (
              <li key={i}>
                <div className="text-xs font-semibold uppercase tracking-wide text-primary">{h.type}</div>
                <div className="mt-0.5 text-sm text-ink/80">« {h.example} »</div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      {/* SaaS techniques */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">🚀</span>
          <h2 className="font-display text-base font-semibold">Techniques de mise en avant SaaS</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {current.techniques.map((t, i) => (
            <div key={i} className="card flex flex-col">
              <h3 className="font-display text-base font-semibold text-ink">{t.title}</h3>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
              <div className="mt-3 rounded-lg bg-canvas px-3 py-2 text-sm italic text-ink/70">« {t.example} »</div>
              <Link href={studioHref(current.network, t)} className="btn-secondary mt-4 !py-2 text-sm">
                Créer un contenu basé sur cette technique
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* What to avoid */}
      <SectionCard icon="⛔" title="Ce qu'il faut éviter">
        <ul className="space-y-2">
          {current.avoid.map((a, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink/80">
              <span className="mt-0.5 text-danger">✕</span>
              <span>{a}</span>
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  badge,
  className = "",
  children,
}: {
  icon: string;
  title: string;
  badge?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`card ${className}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-canvas text-base">{icon}</span>
          <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
        </div>
        {badge && <span className="chip border-primary/20 bg-primary/5 text-primary">{badge}</span>}
      </div>
      {children}
    </section>
  );
}
