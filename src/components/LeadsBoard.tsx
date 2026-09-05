"use client";

import Link from "next/link";
import { ChevronDown, Download, MoreHorizontal, Pencil, RefreshCw, Search, Sparkles, Telescope, Trash2, Upload, Zap } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import ProspectDrawer from "./ProspectDrawer";
import type { Prospect, Search as SearchType } from "@/lib/types";

// Leads module — the intelligent prospect database. Every Scout search becomes
// a "segment" (grouped by prospect.searchId); leads are never mixed between
// searches. A left sidebar lets you jump between segments.

const TABS = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot 🔥" },
  { id: "new", label: "New" },
  { id: "enriched", label: "Enriched" },
  { id: "archived", label: "Archived" },
] as const;

const SEGMENT_COLORS = ["#0051FF", "#22C55E", "#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#6366F1"];

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
  const v = Math.round(score / 10);
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
  if (d < 1 / 24) return "à l'instant";
  if (d < 1) return `il y a ${Math.max(1, Math.floor(d * 24))}h`;
  if (d < 2) return "hier";
  if (d < 7) return `il y a ${Math.floor(d)}j`;
  return `il y a ${Math.floor(d / 7)} sem`;
}

function toCSV(rows: Prospect[]): string {
  const headers = ["Fit Score", "Company", "Contact", "Email", "Phone", "LinkedIn", "Website", "City", "Sector", "Signal", "Source", "Added"];
  const data = rows.map((p) => [
    p.fitScore, p.companyName, p.contactName ?? "", p.contactEmail ?? "", p.contactPhone ?? "",
    p.contactLinkedinUrl ?? "", p.companyDomain ?? "", p.companyLocation ?? "", p.companySector ?? "",
    p.signalDescription ?? "", p.source, new Date(p.createdAt).toLocaleDateString("fr-FR"),
  ]);
  return [headers, ...data].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
function downloadCSV(name: string, rows: Prospect[]) {
  const blob = new Blob(["﻿" + toCSV(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `${name}.csv`; a.click();
  URL.revokeObjectURL(url);
}

type Seg = { id: string; name: string; query: string; count: number; qualified: number; createdAt: string; color: string };

export default function LeadsBoard({
  prospects,
  searches,
  openId,
  initialSegment,
}: {
  prospects: Prospect[];
  searches: SearchType[];
  openId?: string;
  initialSegment?: string;
}) {
  const [tab, setTab] = useState<string>("all");
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Prospect[]>(prospects);
  const [searchList, setSearchList] = useState<SearchType[]>(searches);
  const [segmentId, setSegmentId] = useState<string | null>(initialSegment ?? null);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [selected, setSelected] = useState<Prospect | null>(() => (openId ? prospects.find((p) => p.id === openId) ?? null : null));
  const exportRef = useRef<HTMLDivElement>(null);
  const [exportOpen, setExportOpen] = useState(false);

  // Segments = searches that have at least one prospect.
  const segments = useMemo<Seg[]>(() => {
    const counts = new Map<string, { count: number; qualified: number }>();
    for (const p of items) {
      if (!p.searchId) continue;
      const c = counts.get(p.searchId) ?? { count: 0, qualified: 0 };
      c.count++; if (p.fitScore >= 70) c.qualified++;
      counts.set(p.searchId, c);
    }
    return searchList
      .filter((s) => counts.has(s.id))
      .map((s, i) => ({
        id: s.id, name: s.title || s.query, query: s.query,
        count: counts.get(s.id)!.count, qualified: counts.get(s.id)!.qualified,
        createdAt: s.createdAt, color: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      }));
  }, [items, searchList]);

  const activeSeg = segments.find((s) => s.id === segmentId) ?? null;
  const segColor = (searchId?: string | null) => segments.find((s) => s.id === searchId)?.color;
  const segName = (searchId?: string | null) => segments.find((s) => s.id === searchId)?.name;

  const metrics = useMemo(() => {
    const base = segmentId ? items.filter((p) => p.searchId === segmentId) : items;
    const total = base.length;
    const hot = base.filter((p) => p.fitScore > 80).length;
    const week = base.filter((p) => (Date.now() - new Date(p.createdAt).getTime()) / 86400000 < 7).length;
    const enriched = base.filter((p) => p.enrichedAt).length;
    return { total, hot, week, enriched };
  }, [items, segmentId]);

  const rows = useMemo(() => {
    let list = segmentId ? items.filter((p) => p.searchId === segmentId) : items;
    if (tab === "hot") list = list.filter((p) => p.fitScore > 80);
    else if (tab === "new") list = list.filter((p) => (Date.now() - new Date(p.createdAt).getTime()) / 86400000 < 7);
    else if (tab === "enriched") list = list.filter((p) => p.enrichedAt);
    else if (tab === "archived") list = list.filter((p) => p.stage === "archived");
    if (q.trim()) {
      const s = q.toLowerCase();
      list = list.filter((p) => (p.contactName ?? "").toLowerCase().includes(s) || (p.companyName ?? "").toLowerCase().includes(s));
    }
    return list;
  }, [items, segmentId, tab, q]);

  function onUpdated(u: Prospect) {
    setItems((list) => list.map((x) => (x.id === u.id ? u : x)));
    setSelected(u);
  }

  async function renameSegment(seg: Seg) {
    setMenuFor(null);
    const name = window.prompt("Renommer le segment", seg.name);
    if (!name || name.trim() === seg.name) return;
    setSearchList((l) => l.map((s) => (s.id === seg.id ? { ...s, title: name.trim() } : s)));
    try { await fetch(`/api/searches/${seg.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: name.trim() }) }); } catch { /* ignore */ }
  }
  async function deleteSegment(seg: Seg) {
    setMenuFor(null);
    if (!window.confirm(`Supprimer « ${seg.name} » et ses ${seg.count} prospects ? Cette action est irréversible.`)) return;
    setItems((l) => l.filter((p) => p.searchId !== seg.id));
    setSearchList((l) => l.filter((s) => s.id !== seg.id));
    if (segmentId === seg.id) setSegmentId(null);
    try { await fetch(`/api/searches/${seg.id}`, { method: "DELETE" }); } catch { /* ignore */ }
  }

  const total = items.length;
  const totalHot = items.filter((p) => p.fitScore > 80).length;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Segments sidebar */}
      <aside className="hidden w-[230px] shrink-0 flex-col overflow-y-auto border-r border-line px-3 py-4 lg:flex">
        <button
          onClick={() => setSegmentId(null)}
          className={`flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${segmentId === null ? "bg-primary/10 text-primary" : "text-ink hover:bg-surface-hover"}`}
        >
          <span className="flex items-center gap-2"><Telescope size={14} /> All Leads</span>
          <span className="num text-[12px] text-muted">{total}</span>
        </button>

        <p className="mt-5 px-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Segments</p>
        <div className="mt-1.5 space-y-0.5">
          {segments.length === 0 && <p className="px-2.5 py-2 text-[12px] text-faint">Aucune recherche pour l&apos;instant.</p>}
          {segments.map((s) => (
            <div key={s.id} className={`group relative rounded-lg transition ${segmentId === s.id ? "bg-primary/10" : "hover:bg-surface-hover"}`}>
              <button onClick={() => setSegmentId(s.id)} className="flex w-full items-start gap-2 px-2.5 py-2 text-left">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-[12.5px] font-medium ${segmentId === s.id ? "text-primary" : "text-ink"}`}>{s.name}</span>
                    <span className="num shrink-0 rounded-full bg-surface px-1.5 text-[11px] text-muted">{s.count}</span>
                  </span>
                  <span className="mt-0.5 block text-[11px] text-faint">{relative(s.createdAt)}</span>
                </span>
              </button>
              <button onClick={() => setMenuFor(menuFor === s.id ? null : s.id)} aria-label="Options" className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-faint opacity-0 transition hover:bg-surface hover:text-ink group-hover:opacity-100">
                <MoreHorizontal size={15} />
              </button>
              {menuFor === s.id && (
                <div className="absolute right-1 top-8 z-20 w-48 rounded-xl border border-line bg-surface p-1 shadow-pop">
                  <button onClick={() => renameSegment(s)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink hover:bg-surface-hover"><Pencil size={14} /> Renommer</button>
                  <Link href={`/logagent?q=${encodeURIComponent(s.query)}`} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink hover:bg-surface-hover"><RefreshCw size={14} /> Relancer la recherche</Link>
                  <button onClick={() => { setMenuFor(null); downloadCSV(`loglead-${s.name}`, items.filter((p) => p.searchId === s.id)); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink hover:bg-surface-hover"><Download size={14} /> Exporter (CSV)</button>
                  <button onClick={() => deleteSegment(s)} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-red-600 hover:bg-red-500/10"><Trash2 size={14} /> Supprimer</button>
                </div>
              )}
            </div>
          ))}
        </div>

        <Link href="/logagent" className="mt-5 flex items-center gap-2 rounded-lg border border-dashed border-line px-2.5 py-2 text-[12.5px] font-medium text-muted transition hover:border-primary/40 hover:text-ink">
          <span className="text-[14px]">🔭</span> New Scout search
        </Link>
      </aside>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-[22px] font-semibold text-ink">{activeSeg ? activeSeg.name : "Leads"}</h1>
              <p className="text-[13px] text-muted">
                {activeSeg
                  ? <>{activeSeg.count} prospects · {activeSeg.count ? Math.round((activeSeg.qualified / activeSeg.count) * 100) : 0}% qualified · Found {relative(activeSeg.createdAt)}</>
                  : <>{total} prospects · {segments.length} segments · {totalHot} hot 🔥</>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/logagent" className="btn-primary !py-2 text-[13px]"><Zap size={14} /> New search</Link>
              {activeSeg && (
                <Link href={`/logagent?q=${encodeURIComponent(activeSeg.query)}`} className="btn-secondary !py-2 text-[13px]"><RefreshCw size={14} /> Re-run</Link>
              )}
              <button className="btn-secondary !py-2 text-[13px]"><Upload size={14} /> Import CSV</button>
              <div ref={exportRef} className="relative">
                <button onClick={() => setExportOpen((o) => !o)} className="btn-secondary !py-2 text-[13px]"><Download size={14} /> Export <ChevronDown size={13} /></button>
                {exportOpen && (
                  <div className="absolute right-0 z-20 mt-1 w-52 rounded-xl border border-line bg-surface p-1 shadow-pop">
                    <button onClick={() => { setExportOpen(false); downloadCSV(activeSeg ? `loglead-${activeSeg.name}` : "loglead-all-leads", rows); }} className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink hover:bg-surface-hover"><Download size={14} /> Exporter en CSV</button>
                    <button disabled className="flex w-full cursor-not-allowed items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-faint"><span>📊</span> Google Sheets <span className="ml-auto text-[10px]">bientôt</span></button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile segment selector */}
          {segments.length > 0 && (
            <div className="mt-4 lg:hidden">
              <select value={segmentId ?? "all"} onChange={(e) => setSegmentId(e.target.value === "all" ? null : e.target.value)} className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink outline-none">
                <option value="all">All Leads ({total})</option>
                {segments.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.count})</option>)}
              </select>
            </div>
          )}

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
              <button key={tt.id} onClick={() => setTab(tt.id)} className={`-mb-px border-b-2 px-3 py-2 text-[13px] transition ${tab === tt.id ? "border-primary font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}>{tt.label}</button>
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
                    <th className="px-4 py-2.5">Email</th><th className="px-4 py-2.5">Phone</th>
                    {!segmentId && <th className="px-4 py-2.5">Segment</th>}
                    <th className="px-4 py-2.5">Signal</th><th className="px-4 py-2.5">Added</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {rows.map((p) => (
                    <tr key={p.id} onClick={() => setSelected(p)} className="cursor-pointer hover:bg-surface-hover/40">
                      <td className="px-4 py-3"><FitBars score={p.fitScore} /></td>
                      <td className="px-4 py-3"><div className="font-medium text-ink">{p.contactName ?? "—"}</div></td>
                      <td className="px-4 py-3 text-muted">{p.companyName}</td>
                      <td className="px-4 py-3">{p.contactEmail ? <span className="text-primary">{p.contactEmail}</span> : <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">Find email</span>}</td>
                      <td className="px-4 py-3">{p.contactPhone ? <span className="text-ink">{p.contactPhone}</span> : <span className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">Find phone</span>}</td>
                      {!segmentId && (
                        <td className="px-4 py-3">
                          {p.searchId && segName(p.searchId) ? (
                            <button onClick={(e) => { e.stopPropagation(); setSegmentId(p.searchId!); }} className="inline-flex max-w-[160px] items-center gap-1.5 rounded-full bg-surface px-2 py-0.5 text-[11px] font-medium text-ink hover:bg-surface-hover">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: segColor(p.searchId) }} />
                              <span className="truncate">{segName(p.searchId)}</span>
                            </button>
                          ) : <span className="text-faint">—</span>}
                        </td>
                      )}
                      <td className="px-4 py-3 text-muted">{p.signalDescription ?? "—"}</td>
                      <td className="px-4 py-3 text-faint">{relative(p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {selected && <ProspectDrawer prospect={selected} onClose={() => setSelected(null)} onUpdated={onUpdated} />}
    </div>
  );
}
