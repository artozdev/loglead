"use client";

import Link from "next/link";
import { ArrowRight, Plus, Sparkles, Users, Zap } from "lucide-react";
import { useState } from "react";
import type { Prospect, Search as SearchType } from "@/lib/types";

function Spark() {
  // Decorative mini-sparkline (not real historical data).
  return (
    <svg width="60" height="18" viewBox="0 0 60 18" fill="none" className="text-primary/40">
      <path d="M0 14 L12 9 L22 12 L34 5 L44 8 L60 2" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function rel(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  return d < 1 ? "aujourd'hui" : d < 7 ? `il y a ${Math.floor(d)}j` : `il y a ${Math.floor(d / 7)} sem`;
}

export default function HomeBoard({
  firstName,
  credits,
  prospects,
  searches,
}: {
  firstName: string;
  credits: number;
  prospects: Prospect[];
  searches: SearchType[];
}) {
  const [added, setAdded] = useState<Set<string>>(new Set());
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const date = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const total = prospects.length;
  const hot = prospects.filter((p) => p.fitScore > 80).length;
  const week = searches.filter((s) => (Date.now() - new Date(s.createdAt).getTime()) / 86400000 < 7).length;
  const top3 = [...prospects].sort((a, b) => b.fitScore - a.fitScore).slice(0, 3);

  async function addToContact(id: string) {
    setAdded((s) => new Set(s).add(id));
    try {
      await fetch(`/api/prospects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inContact: true }) });
    } catch { /* ignore */ }
  }

  const cards = [
    { k: "Total Prospects", v: total, sub: `${week} recherches cette semaine`, spark: true },
    { k: "Hot 🔥", v: hot, sub: "Score > 80", spark: true },
    { k: "Searches this week", v: week, spark: true },
    { k: "Credits remaining", v: credits.toLocaleString("fr-FR"), buy: true },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">{greet}, {firstName}.</h1>
          <p className="text-[13px] capitalize text-muted">{date}</p>
        </div>
        <Link href="/logagent" className="btn-primary !py-2 text-[13px]"><Zap size={15} /> Nouvelle recherche</Link>
      </div>

      {/* Metrics */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div key={c.k} className="card !p-4">
            <div className="flex items-start justify-between">
              <p className="text-[12px] font-medium text-muted">{c.k}</p>
              {c.spark && <Spark />}
            </div>
            <p className="num mt-1 text-[26px] font-semibold text-ink">{c.v}</p>
            {c.sub && <p className="mt-0.5 text-[11px] text-faint">{c.sub}</p>}
            {c.buy && (
              <button onClick={() => window.dispatchEvent(new CustomEvent("loglead:open-credits"))} className="mt-1 text-[12px] font-medium text-primary hover:underline">
                Buy more →
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent searches */}
        <div>
          <h2 className="font-display text-[16px] font-semibold text-ink">Dernières recherches</h2>
          {searches.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
              Aucune recherche. <Link href="/logagent" className="text-primary hover:underline">Lance ta première recherche →</Link>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {searches.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-[14px] font-medium text-ink">{s.title || s.query}</div>
                    <div className="text-[12px] text-muted">{s.totalResults} leads · {s.totalResults ? Math.round((s.qualifiedResults / s.totalResults) * 100) : 0}% qualifiés · {rel(s.createdAt)}</div>
                  </div>
                  <Link href={`/logagent?q=${encodeURIComponent(s.query)}`} className="btn-secondary shrink-0 !py-1.5 text-[12px]">Reopen <ArrowRight size={13} /></Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top prospects */}
        <div>
          <h2 className="font-display text-[16px] font-semibold text-ink">Top prospects de la semaine</h2>
          {top3.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[13px] text-muted">
              <Sparkles size={20} className="mx-auto text-primary" />
              <p className="mt-2">Tes meilleurs prospects apparaîtront ici après ta première recherche.</p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {top3.map((p) => {
                const color = p.fitScore > 80 ? "#10B981" : p.fitScore >= 60 ? "#F59E0B" : "#EF4444";
                const done = added.has(p.id) || p.inContact;
                return (
                  <div key={p.id} className="flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-bold text-primary">{p.companyName.charAt(0).toUpperCase()}</span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[14px] font-medium text-ink">{p.contactName ?? p.companyName}</div>
                      <div className="truncate text-[12px] text-muted">{p.contactName ? p.companyName : (p.signalDescription ?? "")}</div>
                    </div>
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-ink"><span className="h-2 w-2 rounded-full" style={{ background: color }} />{p.fitScore}</span>
                    <button onClick={() => addToContact(p.id)} disabled={done} className="btn-secondary shrink-0 !py-1.5 text-[12px] disabled:opacity-50">
                      {done ? <Users size={13} /> : <Plus size={13} />} {done ? "Added" : "Contact"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
