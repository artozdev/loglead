"use client";

import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  LayoutGrid,
  List,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Upload,
  UserRound,
  Users,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  LEAD_CHANNELS,
  LEAD_STATUSES,
  scoreLabel,
  type Lead,
  type LeadChannel,
  type LeadStatus,
} from "@/lib/types";
import LeadAddModal from "./LeadAddModal";
import LeadDrawer from "./LeadDrawer";
import LeadImportModal from "./LeadImportModal";

type ContentRef = { id: string; title: string };
type WeekSplit = { thisWeek: number; prevWeek: number };
type Stats = {
  total: number;
  addedThisWeek: number;
  addedPrevWeek: number;
  newThisMonth: number;
  qualified: number;
  qualifiedShare: number;
  qualifiedWeek: WeekSplit;
  lost: number;
  lostWeek: WeekSplit;
  hot: number;
  hotWeek: WeekSplit;
  series: { total: number[]; qualified: number[]; lost: number[]; hot: number[] };
};

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "in_discussion", label: "In discussion" },
  { value: "converted", label: "Qualified" },
  { value: "lost", label: "Lost" },
];

const PERIODS = [
  { value: "all", label: "All time" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "3m", label: "Last 3 months" },
];
const SORTS = [
  { value: "recent", label: "Most recent" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
  { value: "channel", label: "Channel" },
];
const PAGE_SIZES = [10, 25, 50, 100];

function pctChange(cur: number, prev: number): number {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

// LinkedIn "in" logo (lucide dropped brand icons; inline SVG matches the design).
function LinkedInIcon({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden focusable="false">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.8 0 0 .78 0 1.73v20.54C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.73V1.73C24 .78 23.2 0 22.22 0z" />
    </svg>
  );
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function avatarHue(l: Lead): number {
  const name = `${l.firstName} ${l.lastName}`;
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

type LeadRow = Lead & { segment?: { id: string; name: string } | null };

export default function LeadsModule({
  isPro,
  contents,
  embedded = false,
  segmentId,
}: {
  isPro: boolean;
  workspaceId: string;
  contents: ContentRef[];
  embedded?: boolean; // hide the page header when rendered inside the hub / detail
  segmentId?: string; // restrict to one segment's members
}) {
  const [leadsList, setLeadsList] = useState<LeadRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [q, setQ] = useState("");
  const [qApplied, setQApplied] = useState("");
  const [channel, setChannel] = useState("all");
  const [status, setStatus] = useState("all");
  const [period, setPeriod] = useState("all");
  const [source, setSource] = useState("all");
  const [sort, setSort] = useState("recent");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selected, setSelected] = useState<LeadRow | null>(null);
  const [enriching, setEnriching] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [view, setView] = useState<"list" | "grid">("list");
  const [seeding, setSeeding] = useState(false);
  const [shared, setShared] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectMsg, setDetectMsg] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => setQApplied(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // ⌘F / Ctrl+F focuses the lead search instead of the browser find bar.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const fetchList = useCallback(async () => {
    const p = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      q: qApplied,
      channel,
      status,
      period,
      source,
      sort,
    });
    if (segmentId) p.set("segment", segmentId);
    const res = await fetch(`/api/leads?${p}`);
    if (res.ok) {
      const d = await res.json();
      setLeadsList(d.leads);
      setTotal(d.total);
    }
  }, [page, pageSize, qApplied, channel, status, period, source, sort, segmentId]);

  const fetchStats = useCallback(async () => {
    const res = await fetch("/api/leads/stats");
    if (res.ok) setStats(await res.json());
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);
  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    void fetchList();
    void fetchStats();
  }, [fetchList, fetchStats]);

  async function seed() {
    setSeeding(true);
    try {
      await fetch("/api/leads/seed", { method: "POST" });
      refresh();
    } finally {
      setSeeding(false);
    }
  }

  // Auto-detect leads from LinkedIn post engagement (reactions + comments).
  async function detectLeads() {
    if (detecting) return;
    setDetecting(true);
    setDetectMsg(null);
    try {
      const res = await fetch("/api/leads/detect", { method: "POST" });
      const d = await res.json();
      if (res.status === 402) {
        window.dispatchEvent(
          new CustomEvent("loglead:insufficient-credits", {
            detail: { needed: d.needed, balance: d.balance, action: d.action },
          }),
        );
        return;
      }
      if (!res.ok) {
        setDetectMsg(d.error ?? "Détection impossible.");
        return;
      }
      setDetectMsg(`${d.created} lead(s) ajouté(s)${d.skipped ? ` · ${d.skipped} déjà connu(s)` : ""}`);
      window.dispatchEvent(new CustomEvent("loglead:credits-changed"));
      refresh();
    } catch {
      setDetectMsg("Connexion impossible.");
    } finally {
      setDetecting(false);
    }
  }

  async function setLeadStatus(id: string, s: LeadStatus) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    refresh();
  }

  function toggleSelect(id: string) {
    setSelectedIds((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleSelectAll() {
    setSelectedIds((s) =>
      s.size === leadsList.length ? new Set() : new Set(leadsList.map((l) => l.id)),
    );
  }

  // Bulk enrich the selected leads (sequential — avoids hammering FullEnrich).
  async function bulkEnrich() {
    setBulkBusy(true);
    for (const id of selectedIds) await enrichLead(id);
    setBulkBusy(false);
  }

  // Bulk delete the selected leads.
  async function bulkDelete() {
    if (!confirm(`Delete ${selectedIds.size} lead(s)? This action is permanent.`)) return;
    setBulkBusy(true);
    await Promise.all(
      [...selectedIds].map((id) => fetch(`/api/leads/${id}`, { method: "DELETE" })),
    );
    setSelectedIds(new Set());
    setBulkBusy(false);
    refresh();
  }

  // FIND EMAIL / FIND PHONE — runs the real enrichment (FullEnrich waterfall)
  // for one lead and patches the row in place so the found email/phone appear.
  async function enrichLead(id: string) {
    setEnriching((s) => new Set(s).add(id));
    try {
      const res = await fetch(`/api/leads/${id}/enrich`, { method: "POST" });
      if (res.status === 402) {
        const d = await res.json().catch(() => ({}));
        window.dispatchEvent(
          new CustomEvent("loglead:insufficient-credits", {
            detail: { needed: d.needed, balance: d.balance, action: d.action },
          }),
        );
      } else if (res.ok) {
        const { lead } = await res.json();
        if (lead) {
          setLeadsList((list) =>
            list.map((l) => (l.id === id ? { ...l, ...lead } : l)),
          );
          window.dispatchEvent(new CustomEvent("loglead:credits-changed"));
        }
      }
    } finally {
      setEnriching((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
    }
  }

  function exportCsv() {
    alert(
      "Rappel RGPD : tu es responsable du traitement de ces données. Ne partage cet export qu'avec les personnes autorisées.",
    );
    window.location.href = "/api/leads/export";
  }

  function share() {
    void navigator.clipboard.writeText(window.location.href);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const filtersActive =
    channel !== "all" || status !== "all" || period !== "all" || source !== "all";
  const isEmpty = total === 0 && qApplied === "" && !filtersActive;

  return (
    <div className="space-y-5">
      {/* Page header */}
      {!embedded && (
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          aria-label="Retour"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted hover:bg-surface-hover hover:text-ink"
        >
          <ArrowLeft size={15} strokeWidth={1.5} />
        </Link>
        <h1 className="font-display text-[22px] font-medium tracking-tight">Leads</h1>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCsv}
            title="Exporter en CSV"
            aria-label="Exporter en CSV"
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line text-muted hover:bg-surface-hover hover:text-ink"
          >
            <Download size={15} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => searchRef.current?.focus()}
            className="hidden items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2 text-[13px] text-muted hover:bg-surface-hover sm:flex"
          >
            <Search size={14} strokeWidth={1.5} />
            Search
            <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] text-faint">
              ⌘F
            </kbd>
          </button>
          <button
            onClick={detectLeads}
            disabled={detecting}
            title="Détecter les leads depuis les réactions/commentaires de tes posts LinkedIn — 5 crédits par nouveau lead · 1×/jour max"
            className="btn-primary !py-2 text-[13px] disabled:opacity-60"
          >
            {detecting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} strokeWidth={1.5} />}
            {detecting ? "Détection…" : "Détecter mes leads"}
          </button>
          <button onClick={share} className="btn-secondary !py-2 text-[13px]">
            <Share2 size={14} strokeWidth={1.5} />
            {shared ? "Lien copié !" : "Partager"}
          </button>
        </div>
      </div>
      )}
      {detectMsg && (
        <p className="-mt-2 mb-2 text-[12px] text-muted">{detectMsg}</p>
      )}

      {/* Metric band + sparklines */}
      {stats && (
        <div className="grid grid-cols-2 divide-x-[0.5px] divide-line overflow-hidden rounded-[10px] border-[0.5px] border-line bg-canvas md:grid-cols-4">
          <MetricCard
            label="New Leads"
            value={stats.newThisMonth}
            curWeek={stats.addedThisWeek}
            prevWeek={stats.addedPrevWeek}
            series={stats.series.total}
          />
          <MetricCard
            label="Qualified Leads"
            value={stats.qualified}
            curWeek={stats.qualifiedWeek.thisWeek}
            prevWeek={stats.qualifiedWeek.prevWeek}
            series={stats.series.qualified}
          />
          <MetricCard
            label="Hot Leads"
            value={stats.hot}
            curWeek={stats.hotWeek.thisWeek}
            prevWeek={stats.hotWeek.prevWeek}
            series={stats.series.hot}
          />
          <MetricCard
            label="Lost"
            value={stats.lost}
            curWeek={stats.lostWeek.thisWeek}
            prevWeek={stats.lostWeek.prevWeek}
            series={stats.series.lost}
            invert
          />
        </div>
      )}

      {/* Quick filter tabs */}
      {!isEmpty && (
        <div className="flex gap-6 overflow-x-auto border-b border-line">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setStatus(t.value);
                setPage(1);
              }}
              className={`-mb-px shrink-0 border-b-2 px-1 py-2.5 text-[13px] transition ${
                status === t.value
                  ? "border-primary font-medium text-primary"
                  : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Table card / empty state */}
      {isEmpty ? (
        <EmptyState
          onAdd={() => setAddOpen(true)}
          onSeed={seed}
          seeding={seeding}
        />
      ) : (
        <div className="rounded-[10px] border-[0.5px] border-line bg-canvas">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-3">
            <div className="flex min-w-[180px] items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 focus-within:border-primary sm:w-64">
              <Search size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Search"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[13px] text-muted">
              <ArrowUpDown size={13} strokeWidth={1.5} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort"
                className="bg-transparent text-ink outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <FilterMenu
              source={source}
              contents={contents}
              active={filtersActive}
              onSource={(v) => { setSource(v); setPage(1); }}
              onReset={() => {
                setChannel("all");
                setStatus("all");
                setPeriod("all");
                setSource("all");
                setPage(1);
              }}
            />
            <div className="ml-auto flex items-center gap-2">
              <div className="hidden items-center gap-0.5 rounded-lg border border-line p-0.5 md:flex">
                <button
                  onClick={() => setView("list")}
                  aria-label="Vue liste"
                  aria-pressed={view === "list"}
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                    view === "list" ? "bg-primary/[0.08] text-primary" : "text-muted hover:text-ink"
                  }`}
                >
                  <List size={15} strokeWidth={1.5} />
                </button>
                <button
                  onClick={() => setView("grid")}
                  aria-label="Vue grille"
                  aria-pressed={view === "grid"}
                  className={`flex h-7 w-7 items-center justify-center rounded-md transition ${
                    view === "grid" ? "bg-primary/[0.08] text-primary" : "text-muted hover:text-ink"
                  }`}
                >
                  <LayoutGrid size={15} strokeWidth={1.5} />
                </button>
              </div>
              <button onClick={() => setAddOpen(true)} className="btn-primary !py-2 text-[13px]">
                <Plus size={14} strokeWidth={1.5} /> Add Lead
              </button>
              <button onClick={exportCsv} className="btn-secondary !py-2 text-[13px]">
                Export
              </button>
            </div>
          </div>

          {/* Bulk actions bar — appears when leads are selected */}
          {selectedIds.size > 0 && (
            <div className="sticky top-2 z-30 mx-2 mb-2 flex flex-wrap items-center gap-2 rounded-[10px] border border-line bg-surface px-3 py-2 shadow-pop">
              <span className="text-[13px] font-medium text-ink">
                {selectedIds.size} selected
              </span>
              <span className="mx-1 h-4 w-px bg-line" />
              <button
                onClick={bulkEnrich}
                disabled={bulkBusy}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
              >
                {bulkBusy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                Enrich
              </button>
              <button
                onClick={exportCsv}
                disabled={bulkBusy}
                className="btn-secondary !py-1.5 !text-xs disabled:opacity-50"
              >
                Export
              </button>
              <button
                onClick={bulkDelete}
                disabled={bulkBusy}
                className="inline-flex items-center gap-1.5 rounded-full border-[0.5px] border-danger/40 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/5 disabled:opacity-50"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-xs text-muted hover:text-ink"
              >
                Clear
              </button>
            </div>
          )}

          {/* Desktop table (list view) */}
          <table className={`w-full border-collapse text-[13px] [&_td]:border-r-[0.5px] [&_td]:border-line [&_th]:border-r-[0.5px] [&_th]:border-line [&_tr>*:last-child]:border-r-0 ${view === "list" ? "hidden md:table" : "hidden"}`}>
            <thead>
              <tr>
                <th className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label="Tout sélectionner"
                    checked={leadsList.length > 0 && selectedIds.size === leadsList.length}
                    ref={(el) => {
                      if (el) el.indeterminate = selectedIds.size > 0 && selectedIds.size < leadsList.length;
                    }}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 cursor-pointer accent-primary"
                  />
                </th>
                <Th>Full name</Th>
                <Th>Email</Th>
                <Th>Phone</Th>
                <Th>Company</Th>
                <Th>Job title</Th>
                <Th>Score</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {leadsList.map((l, i) => (
                <tr
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className="group cursor-pointer border-b-[0.5px] border-line last:border-b-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Sélectionner ${l.firstName} ${l.lastName}`}
                      checked={selectedIds.has(l.id)}
                      onChange={() => toggleSelect(l.id)}
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar lead={l} />
                      <span className="truncate font-medium text-ink">
                        {l.firstName} {l.lastName}
                      </span>
                      {l.linkedinUrl ? (
                        <a
                          href={l.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Voir le profil LinkedIn"
                          aria-label="Voir le profil LinkedIn"
                          className="shrink-0 transition hover:opacity-80"
                          style={{ color: "var(--color-linkedin)" }}
                        >
                          <LinkedInIcon size={15} />
                        </a>
                      ) : (
                        <span className="shrink-0 text-faint/40">
                          <LinkedInIcon size={15} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {l.email ? (
                      <span className="flex min-w-0 max-w-[210px] items-center gap-1.5 text-primary">
                        <span className="truncate">{l.email}</span>
                        <CheckCircle2 size={12} className="shrink-0 text-success" />
                        <button
                          title="Copier l'email"
                          aria-label="Copier l'email"
                          onClick={(e) => {
                            e.stopPropagation();
                            void navigator.clipboard.writeText(l.email!);
                          }}
                          className="rounded p-1 text-faint opacity-0 hover:bg-line hover:text-ink group-hover:opacity-100"
                        >
                          <Copy size={12} strokeWidth={1.5} />
                        </button>
                      </span>
                    ) : enriching.has(l.id) ? (
                      <span className="flex items-center gap-1.5 text-[11px] text-faint">
                        <Loader2 size={12} className="animate-spin" /> Scraping LinkedIn infos…
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void enrichLead(l.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-line px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted transition hover:border-primary/40 hover:text-primary"
                      >
                        <Mail size={11} strokeWidth={1.5} /> Find email
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {l.phone ? (
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="truncate">{l.phone}</span>
                        <CheckCircle2 size={12} className="shrink-0 text-success" />
                        <button
                          title="Copier le numéro"
                          aria-label="Copier le numéro"
                          onClick={(e) => {
                            e.stopPropagation();
                            void navigator.clipboard.writeText(l.phone!);
                          }}
                          className="rounded p-1 text-faint opacity-0 hover:bg-line hover:text-ink group-hover:opacity-100"
                        >
                          <Copy size={12} strokeWidth={1.5} />
                        </button>
                      </span>
                    ) : enriching.has(l.id) ? (
                      <span className="flex items-center gap-1.5 text-[11px] text-faint">
                        <Loader2 size={12} className="animate-spin" /> Scraping…
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void enrichLead(l.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-line px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted transition hover:border-primary/40 hover:text-primary"
                      >
                        <Phone size={11} strokeWidth={1.5} /> Find phone
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <div className="max-w-[150px] truncate">{l.company || <span className="text-faint">—</span>}</div>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    <div className="max-w-[150px] truncate">{l.jobTitle || <span className="text-faint">—</span>}</div>
                  </td>
                  <td className="px-4 py-3">
                    <ScorePill score={l.score} />
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <StatusMenu lead={l} onChange={(s) => setLeadStatus(l.id, s)} />
                  </td>
                </tr>
              ))}
              {leadsList.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                    No leads match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Desktop grid (grid view) */}
          {view === "grid" && (
            <div className="hidden gap-3 p-3 md:grid md:grid-cols-2 xl:grid-cols-3">
              {leadsList.map((l) => (
                <div
                  key={l.id}
                  onClick={() => setSelected(l)}
                  className="group relative cursor-pointer rounded-xl border border-line bg-surface p-4 transition hover:border-primary/30 hover:shadow-card"
                >
                  <input
                    type="checkbox"
                    aria-label={`Sélectionner ${l.firstName} ${l.lastName}`}
                    checked={selectedIds.has(l.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleSelect(l.id)}
                    className="absolute right-3 top-3 h-3.5 w-3.5 cursor-pointer accent-primary"
                  />
                  <div className="flex items-center gap-3 pr-6">
                    <Avatar lead={l} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate font-medium text-ink">
                          {l.firstName} {l.lastName}
                        </span>
                        {l.linkedinUrl ? (
                          <a
                            href={l.linkedinUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            aria-label="Voir le profil LinkedIn"
                            className="shrink-0 transition hover:opacity-80"
                            style={{ color: "var(--color-linkedin)" }}
                          >
                            <LinkedInIcon size={14} />
                          </a>
                        ) : (
                          <span className="shrink-0 text-faint/40">
                            <LinkedInIcon size={14} />
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted">
                        {[l.jobTitle, l.company].filter(Boolean).join(" · ") || "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 text-[13px]">
                    {/* Email */}
                    {l.email ? (
                      <div className="flex items-center gap-1.5 text-primary">
                        <Mail size={12} className="shrink-0 text-faint" />
                        <span className="truncate">{l.email}</span>
                        <CheckCircle2 size={12} className="shrink-0 text-success" />
                      </div>
                    ) : enriching.has(l.id) ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-faint">
                        <Loader2 size={12} className="animate-spin" /> Scraping LinkedIn infos…
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void enrichLead(l.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-line px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted transition hover:border-primary/40 hover:text-primary"
                      >
                        <Mail size={11} strokeWidth={1.5} /> Find email
                      </button>
                    )}
                    {/* Phone */}
                    {l.phone ? (
                      <div className="flex items-center gap-1.5 text-muted">
                        <Phone size={12} className="shrink-0 text-faint" />
                        <span className="truncate">{l.phone}</span>
                        <CheckCircle2 size={12} className="shrink-0 text-success" />
                      </div>
                    ) : enriching.has(l.id) ? (
                      <div className="flex items-center gap-1.5 text-[11px] text-faint">
                        <Loader2 size={12} className="animate-spin" /> Scraping…
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void enrichLead(l.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-full border-[0.5px] border-line px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted transition hover:border-primary/40 hover:text-primary"
                      >
                        <Phone size={11} strokeWidth={1.5} /> Find phone
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t-[0.5px] border-line pt-3" onClick={(e) => e.stopPropagation()}>
                    <StatusMenu lead={l} onChange={(s) => setLeadStatus(l.id, s)} />
                    <ScorePill score={l.score} />
                  </div>
                </div>
              ))}
              {leadsList.length === 0 && (
                <p className="col-span-full py-10 text-center text-sm text-muted">
                  No leads match these filters.
                </p>
              )}
            </div>
          )}

          {/* Mobile cards */}
          <div className="border-t-[0.5px] border-line md:hidden">
            {leadsList.map((l) => (
              <button
                key={l.id}
                onClick={() => router.push(`/leads/${l.id}`)}
                className="flex w-full flex-col gap-2 border-b-[0.5px] border-line p-4 text-left last:border-b-0 hover:bg-surface-hover"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar lead={l} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-ink">
                      {l.firstName} {l.lastName}
                    </p>
                    <p className="truncate text-xs text-muted">{l.email || l.company || "—"}</p>
                  </div>
                  <span className="num text-xs text-faint">{fmtDate(l.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ChannelBadge channel={l.channel} />
                  <StatusPill status={l.status} />
                  <ScorePill score={l.score} />
                </div>
              </button>
            ))}
            {leadsList.length === 0 && (
              <p className="p-6 text-center text-sm text-muted">
                No leads match these filters.
              </p>
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center gap-3 border-t-[0.5px] border-line p-3">
            <div className="flex items-center rounded-lg border border-line px-2 py-1 text-[13px]">
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                aria-label="Leads par page"
                className="bg-transparent text-ink outline-none"
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n}>{n} per page</option>
                ))}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="num text-xs text-muted">
                {rangeStart}–{rangeEnd} of {total}
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
        </div>
      )}

      {addOpen && <LeadAddModal contents={contents} onClose={() => setAddOpen(false)} onAdded={refresh} />}
      {importOpen && <LeadImportModal onClose={() => setImportOpen(false)} onImported={refresh} />}
      {selected && (
        <LeadDrawer lead={selected} onClose={() => setSelected(null)} onUpdated={refresh} />
      )}
    </div>
  );
}

// ----- Metric card -----------------------------------------------------------

// Minimal SVG sparkline (real 7-day series). Orange like the reference.
function Sparkline({ data }: { data: number[] }) {
  const W = 60;
  const H = 30;
  if (!data || data.length === 0) return <div style={{ width: W, height: H }} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const x = (i: number) => (data.length <= 1 ? 0 : (i / (data.length - 1)) * (W - 2) + 1);
  const y = (v: number) => H - 4 - ((v - min) / range) * (H - 8);
  const line = data.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0" aria-hidden>
      <path
        d={line}
        fill="none"
        stroke="rgb(var(--c-primary))"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MetricCard({
  label,
  value,
  curWeek,
  prevWeek,
  series,
  invert,
  suffix,
}: {
  label: string;
  value: number;
  curWeek: number; // count added this week (real)
  prevWeek: number; // count added the previous week (real)
  series: number[];
  invert?: boolean; // for "lost": a decrease is good news
  suffix?: string;
}) {
  // Honest variation: a real % only when there's a prior-week baseline; when
  // there isn't (new pipeline), show the real absolute delta instead of a
  // misleading "100%". Flat when nothing changed.
  const delta = curWeek - prevWeek;
  const hasBaseline = prevWeek > 0;
  const flat = delta === 0;
  const up = delta > 0;
  const good = invert ? !up : up;
  const variationText = hasBaseline
    ? `${Math.abs((delta / prevWeek) * 100).toFixed(0)}%`
    : `${up ? "+" : ""}${delta}`;
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[13px] text-muted">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="num text-[28px] font-semibold leading-none tracking-tight text-ink">
            {value}
            {suffix}
          </span>
          {flat ? (
            <span className="text-[13px] font-medium text-muted">→ 0</span>
          ) : (
            <span
              className={`inline-flex items-center gap-0.5 text-[13px] font-medium ${
                good ? "text-success" : "text-danger"
              }`}
            >
              {up ? <TrendingUp size={13} strokeWidth={2} /> : <TrendingDown size={13} strokeWidth={2} />}
              {variationText}
            </span>
          )}
        </div>
        <p className="num mt-1 text-[11px] text-faint">{curWeek} this week</p>
      </div>
      <Sparkline data={series} />
    </div>
  );
}

// ----- Badges ----------------------------------------------------------------

function Avatar({ lead }: { lead: Lead }) {
  const h = avatarHue(lead);
  const initials =
    `${lead.firstName[0] ?? ""}${lead.lastName[0] ?? ""}`.toUpperCase() || "?";
  return (
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold"
      style={{
        backgroundColor: `hsl(${h} 60% 50% / 0.14)`,
        color: `hsl(${h} 60% 45%)`,
      }}
    >
      {initials}
    </span>
  );
}

// Per-channel badge colors, all theme tokens (see globals.css) so they adapt
// to dark mode. Website has no brand token — success green matches the intent.
const CHANNEL_BADGE: Record<LeadChannel, { bg: string; fg: string }> = {
  linkedin: { bg: "var(--color-linkedin-bg)", fg: "var(--color-linkedin)" },
  x: { bg: "var(--color-x-bg)", fg: "var(--color-x)" },
  instagram: { bg: "var(--color-instagram-bg)", fg: "var(--color-instagram)" },
  reddit: { bg: "var(--color-reddit-bg)", fg: "var(--color-reddit)" },
  website: { bg: "var(--color-success-bg)", fg: "var(--color-success)" },
  manual: { bg: "var(--bg-surface-hover)", fg: "var(--text-secondary)" },
};

function ChannelBadge({ channel }: { channel: LeadChannel }) {
  const c = LEAD_CHANNELS.find((x) => x.value === channel)!;
  const colors = CHANNEL_BADGE[channel];
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.fg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
      {c.label}
    </span>
  );
}

// Compact score chip: colored dot (tier) + number, or a dash when unscored.
// Vertical-bar score (0–10) — 10 bars filled to the score, colored by tier.
function ScorePill({ score }: { score?: number }) {
  if (score === undefined) return <span className="text-faint">—</span>;
  const filled = Math.max(0, Math.min(10, Math.round(score / 10)));
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap" title={scoreLabel(score)}>
      <span className="flex items-end gap-[2px]" aria-hidden>
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className="h-4 w-1 rounded-[1px]"
            style={{
              // Amber → green equalizer gradient; unfilled bars stay neutral.
              backgroundColor:
                i < filled ? `hsl(${42 + (i / 9) * 98} 80% 48%)` : "var(--border)",
            }}
          />
        ))}
      </span>
      <span className="num text-xs font-medium text-muted">{filled}/10</span>
    </span>
  );
}

function StatusPill({ status }: { status: LeadStatus }) {
  const s = LEAD_STATUSES.find((x) => x.value === status)!;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border-[0.5px] px-2.5 py-1 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

// Status pill + inline dropdown to change it without opening the drawer.
function StatusMenu({ lead, onChange }: { lead: Lead; onChange: (s: LeadStatus) => void }) {
  const [open, setOpen] = useState(false);
  const s = LEAD_STATUSES.find((x) => x.value === lead.status)!;
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Changer le statut (actuellement ${s.label})`}
        className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border-[0.5px] px-2.5 py-1 text-xs font-medium ${s.cls}`}
      >
        {s.label}
        <ChevronDown size={11} strokeWidth={2} className="opacity-60" />
      </button>
      {open && (
        <>
          <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-[10px] border border-line bg-surface p-1 shadow-pop">
            {LEAD_STATUSES.map((o) => (
              <button
                key={o.value}
                onClick={() => { setOpen(false); if (o.value !== lead.status) onChange(o.value); }}
                className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-hover ${
                  o.value === lead.status ? "font-medium text-ink" : "text-muted"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full border-[0.5px] ${o.cls}`} />
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ----- Toolbar bits ----------------------------------------------------------

function FilterMenu({
  source,
  contents,
  active,
  onSource,
  onReset,
}: {
  source: string;
  contents: ContentRef[];
  active: boolean;
  onSource: (v: string) => void;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-2 text-[13px] text-muted hover:bg-surface-hover hover:text-ink"
      >
        <SlidersHorizontal size={13} strokeWidth={1.5} />
        Filter
        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </button>
      {open && (
        <>
          <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 space-y-3 rounded-[10px] border border-line bg-surface p-3 shadow-pop">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Source content</label>
              <select
                value={source}
                onChange={(e) => onSource(e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-2 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
              >
                <option value="all">All content</option>
                {contents.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { onReset(); setOpen(false); }}
              disabled={!active}
              className="w-full rounded-lg border border-line py-1.5 text-[13px] text-muted hover:bg-surface-hover hover:text-ink disabled:opacity-40"
            >
              Reset filters
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-line bg-surface px-2.5 py-2 text-[13px] text-ink outline-none focus:border-primary"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={`whitespace-nowrap border-b-[0.5px] border-line px-4 py-2.5 text-left text-xs font-normal text-faint ${className}`}
    >
      {children}
    </th>
  );
}

// ----- Empty state -----------------------------------------------------------

function EmptyState({
  onAdd,
  onSeed,
  seeding,
}: {
  onAdd: () => void;
  onSeed: () => void;
  seeding: boolean;
}) {
  return (
    <div className="flex flex-col items-center rounded-[10px] border-[0.5px] border-line bg-canvas px-6 py-16 text-center">
      <div className="relative mb-5 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
          <UserRound size={28} strokeWidth={1.5} />
        </span>
        {/* Social bubbles floating around */}
        {LEAD_CHANNELS.filter((c) => c.value !== "manual" && c.value !== "website").map(
          (c, i) => (
            <span
              key={c.value}
              className="absolute flex h-5 w-5 items-center justify-center rounded-full border-[0.5px] border-line bg-surface shadow-sm"
              style={{
                transform: `rotate(${i * 90 - 45}deg) translateY(-44px) rotate(${-(i * 90 - 45)}deg)`,
              }}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.dot }} />
            </span>
          ),
        )}
      </div>
      <p className="font-display text-base font-semibold text-ink">No leads yet</p>
      <p className="mt-1 max-w-md text-sm text-muted">
        Publish content on your networks — your first prospects will appear here
        automatically.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <button onClick={onAdd} className="btn-secondary text-[13px]">
          <Plus size={14} strokeWidth={1.5} /> Add manually
        </button>
        <button onClick={onSeed} disabled={seeding} className="btn-ghost text-[13px]">
          {seeding ? "Loading…" : "Load sample data"}
        </button>
      </div>
    </div>
  );
}
