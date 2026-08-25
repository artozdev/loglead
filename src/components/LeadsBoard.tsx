"use client";

import Link from "next/link";
import { Download, Search, Sparkles, Upload, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import type { Prospect } from "@/lib/types";

// Leads module — the intelligent prospect database. All prospects found by
// LogAgent land here, scored and enriched. Reads the `prospects` model.

const TABS = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot 🔥" },
  { id: "new", label: "New" },
  { id: "enriched", label: "Enriched" },
  { id: "archived", label: "Archived" },
] as const;

const SOURCE_BADGE: Record<string, { label: string; cls: string }> = {
  linkedin_jobs: { label: "LinkedIn", cls: "bg-[#0A66C2]/10 text-[#0A66C2]" },
  linkedin_company: { label: "LinkedIn", cls: "bg-[#0A66C2]/10 text-[#0A66C2]" },
  google_maps: { label: "Google Maps", cls: "bg-emerald-500/10 text-emerald-600" },
  google_search: { label: "Google", cls: "bg-slate-500/10 text-slate-600" },
  reddit: { label: "Reddit", cls: "bg-orange-500/10 text-orange-600" },
  instagram: { label: "Instagram", cls: "bg-pink-500/10 text-pink-600" },
  tiktok: { label: "TikTok", cls: "bg-slate-900/10 text-slate-800" },
  facebook: { label: "Facebook", cls: "bg-[#1877F2]/10 text-[#1877F2]" },
  twitter: { label: "X", cls: "bg-slate-900/10 text-slate-800" },
  manual: { label: "Manual", cls: "bg-slate-500/10 text-slate-600" },
};

function FitBars({ score }: { score: number }) {
  const v = Math.round(score / 10); // 0-10
  const color = v > 8 ? "bg-emerald-500" : v >= 5 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-end gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className={`w-[3px] rounded-full ${i < v ? color : "bg-surface-hover"}`} style={{ height: 6 + i }} />
        ))}
      </div>
      <span className="num text-[12px] font-semibold text-ink">{v}</span>
    </div>
  );
}

function relative(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (d < 1) return "aujourd'hui";
  if (d < 7) return `il y a ${Math.floor(d)}j`;
  return `il y a ${Math.floor(d / 7)} sem`;
}

export default function LeadsBoard({ prospects }: { prospects: Prospect[] }) {
  const [tab, setTab] = useState<string>("all");
  const [q, setQ] = useState("");

  const metrics = useMemo(() => {
    const total = prospects.length;
    const hot = prospects.filter((p) => p.fitScore > 80).length;
    const week = prospects.filter((p) => (Date.now() - new Date(p.createdAt).getTime()) / 86400000 < 7).length;
    const enriched = prospects.filter((p) => p.enrichedAt).length;
    return { total, hot, week, enriched };
  }, [prospects]);

  const rows = useMemo(() => {
    let list = prospects;
    if (tab === "hot") list = list.filter((p) => p.fitScore > 80);
    else if (tab === "new") list = list.filter((p) => (Date.now() - new Date(p.createdAt).getTime()) / 86400000 < 7);
    else if (tab === "enriched") list = list.filter((p) => p.enrichedAt);
    else if (tab === "archived") list = list.filter((p) => p.stage === "archived");
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((p) => (p.contactName ?? "").toLowerCase().includes(s) || (p.companyName ?? "").toLowerCase().includes(s));
    }
    return list;
  }, [prospects, tab, q]);

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink">Leads</h1>
          <p className="text-[13px] text-muted">Your qualified prospects — found and scored by AI.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/logagent" className="btn-primary !py-2 text-[13px]"><Zap size={14} /> New search</Link>
          <button className="btn-secondary !py-2 text-[13px]"><Upload size={14} /> Import CSV</button>
          <button className="btn-secondary !py-2 text-[13px]"><Download size={14} /> Export</button>
        </div>
      </div>

      {/* Metrics */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "Total Leads", v: metrics.total, s: `+${metrics.week} this week` },
          { k: "Hot 🔥", v: metrics.hot, s: "Score > 80" },
          { k: "New this week", v: metrics.week, s: "last 7 days" },
          { k: "Enriched", v: `${metrics.enriched} / ${metrics.total}`, s: `${metrics.total ? Math.round((metrics.enriched / metrics.total) * 100) : 0}% enriched` },
        ].map((c) => (
          <div key={c.k} className="card !p-4">
            <p className="text-[12px] font-medium text-muted">{c.k}</p>
            <p className="num mt-1 text-[24px] font-semibold text-ink">{c.v}</p>
            <p className="mt-0.5 text-[11px] text-faint">{c.s}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-1 border-b border-line">
        {TABS.map((tt) => (
          <button
            key={tt.id}
            onClick={() => setTab(tt.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] transition ${tab === tt.id ? "border-primary font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {tt.label}
          </button>
        ))}
        <Link href="/contact" className="-mb-px ml-auto border-b-2 border-transparent px-3 py-2 text-[13px] text-primary hover:underline">To contact →</Link>
      </div>

      {/* Search */}
      <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
        <Search size={15} className="text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search leads…" className="flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-faint" />
      </div>

      {/* Table / empty state */}
      {rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
          <Sparkles size={26} className="text-primary" />
          <p className="mt-3 text-[15px] font-medium text-ink">No leads yet</p>
          <p className="mt-1 max-w-sm text-[13px] text-muted">Décris ton prospect idéal dans LogAgent et LogLead le trouve. Tes leads apparaîtront ici, scorés et enrichis.</p>
          <Link href="/logagent" className="btn-primary mt-5 !py-2 text-[13px]"><Zap size={14} /> Lancer une recherche</Link>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-hover/40 text-left text-[11px] font-semibold uppercase tracking-wide text-muted">
                <th className="px-4 py-2.5">Fit</th><th className="px-4 py-2.5">Lead</th><th className="px-4 py-2.5">Company</th>
                <th className="px-4 py-2.5">Email</th><th className="px-4 py-2.5">Phone</th><th className="px-4 py-2.5">Source</th>
                <th className="px-4 py-2.5">Signal</th><th className="px-4 py-2.5">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => {
                const src = SOURCE_BADGE[p.source] ?? SOURCE_BADGE.manual;
                return (
                  <tr key={p.id} className="hover:bg-surface-hover/40">
                    <td className="px-4 py-3"><FitBars score={p.fitScore} /></td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-ink">{p.contactName ?? "—"}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{p.companyName}</td>
                    <td className="px-4 py-3">{p.contactEmail ? <span className="text-primary">{p.contactEmail}</span> : <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">Find email</span>}</td>
                    <td className="px-4 py-3">{p.contactPhone ? <span className="text-ink">{p.contactPhone}</span> : <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">Find phone</span>}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${src.cls}`}>{src.label}</span></td>
                    <td className="px-4 py-3 text-muted">{p.signalDescription ?? "—"}</td>
                    <td className="px-4 py-3 text-faint">{relative(p.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
