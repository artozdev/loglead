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
  Plus,
  Search,
  Share2,
  SlidersHorizontal,
  Sparkles,
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
  scoreColorVar,
  scoreLabel,
  type Lead,
  type LeadChannel,
  type LeadStatus,
} from "@/lib/types";
import LeadAddModal from "./LeadAddModal";
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
};

const PERIODS = [
  { value: "all", label: "Toute période" },
  { value: "7d", label: "7 derniers jours" },
  { value: "30d", label: "30 derniers jours" },
  { value: "3m", label: "3 derniers mois" },
];
const SORTS = [
  { value: "recent", label: "Plus récent" },
  { value: "name", label: "Nom" },
  { value: "status", label: "Statut" },
  { value: "channel", label: "Canal" },
];
const PAGE_SIZES = [10, 25, 50, 100];

function pctChange(cur: number, prev: number): number {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
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
  const [seeding, setSeeding] = useState(false);
  const [shared, setShared] = useState(false);
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

  async function setLeadStatus(id: string, s: LeadStatus) {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: s }),
    });
    refresh();
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
            Rechercher
            <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] text-faint">
              ⌘F
            </kbd>
          </button>
          <button onClick={share} className="btn-secondary !py-2 text-[13px]">
            <Share2 size={14} strokeWidth={1.5} />
            {shared ? "Lien copié !" : "Partager"}
          </button>
        </div>
      </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 border-y-[0.5px] border-line py-3">
        <button onClick={() => setAddOpen(true)} className="btn-secondary !py-2 text-[13px]">
          <Plus size={14} strokeWidth={1.5} /> Ajouter un lead
        </button>
        <button onClick={() => setImportOpen(true)} className="btn-secondary !py-2 text-[13px]">
          <Upload size={14} strokeWidth={1.5} /> Importer CSV
        </button>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Select
            value={channel}
            onChange={(v) => { setChannel(v); setPage(1); }}
            options={[{ value: "all", label: "Tous les canaux" }, ...LEAD_CHANNELS.map((c) => ({ value: c.value, label: c.label }))]}
          />
          <Select
            value={status}
            onChange={(v) => { setStatus(v); setPage(1); }}
            options={[{ value: "all", label: "Tous les statuts" }, ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
          />
          <Select
            value={period}
            onChange={(v) => { setPeriod(v); setPage(1); }}
            options={PERIODS}
          />
        </div>
      </div>

      {/* Metric cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Users}
            label="Total leads"
            value={stats.total}
            pct={pctChange(stats.addedThisWeek, stats.addedPrevWeek)}
            sub={`${stats.addedThisWeek >= 0 ? "+" : ""}${stats.addedThisWeek} vs semaine dernière`}
          />
          <MetricCard
            icon={Sparkles}
            label="Nouveaux leads"
            value={stats.newThisMonth}
            pct={pctChange(stats.addedThisWeek, stats.addedPrevWeek)}
            sub={`${stats.addedThisWeek - stats.addedPrevWeek >= 0 ? "+" : ""}${stats.addedThisWeek - stats.addedPrevWeek} vs semaine dernière`}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Leads qualifiés"
            value={stats.qualified}
            pct={pctChange(stats.qualifiedWeek.thisWeek, stats.qualifiedWeek.prevWeek)}
            sub={`${stats.qualifiedShare.toFixed(0)} % du total`}
          />
          <MetricCard
            icon={XCircle}
            label="Leads perdus"
            value={stats.lost}
            pct={pctChange(stats.lostWeek.thisWeek, stats.lostWeek.prevWeek)}
            invert
            sub={`${stats.lostWeek.thisWeek - stats.lostWeek.prevWeek >= 0 ? "+" : ""}${stats.lostWeek.thisWeek - stats.lostWeek.prevWeek} vs semaine dernière`}
          />
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
        <div className="rounded-[10px] border-[0.5px] border-line bg-surface">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-2 p-3">
            <div className="flex min-w-[180px] items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 focus-within:border-primary sm:w-64">
              <Search size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
              <input
                ref={searchRef}
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
                placeholder="Rechercher un lead…"
                className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
              />
            </div>
            <div className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-[13px] text-muted">
              <ArrowUpDown size={13} strokeWidth={1.5} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Trier"
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
              <button onClick={() => setAddOpen(true)} className="btn-primary !py-2 text-[13px]">
                <Plus size={14} strokeWidth={1.5} /> Ajouter un lead
              </button>
              <button onClick={exportCsv} className="btn-secondary !py-2 text-[13px]">
                Export CSV
              </button>
            </div>
          </div>

          {/* Desktop table */}
          <table className="hidden w-full border-collapse text-[13px] md:table">
            <thead>
              <tr>
                <Th className="w-10">#</Th>
                <Th>Lead</Th>
                <Th>SaaS/Entreprise</Th>
                <Th>Email</Th>
                <Th>Canal</Th>
                {!segmentId && <Th>Segment</Th>}
                <Th>Score</Th>
                <Th>Statut</Th>
                <Th>Ajouté le</Th>
              </tr>
            </thead>
            <tbody>
              {leadsList.map((l, i) => (
                <tr
                  key={l.id}
                  onClick={() => router.push(`/leads/${l.id}`)}
                  className="group cursor-pointer border-b-[0.5px] border-line last:border-b-0 hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 text-xs text-faint">{rangeStart + i}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar lead={l} />
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">
                          {l.firstName} {l.lastName}
                        </p>
                        <p className="truncate text-xs text-muted">{l.email || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink">{l.company || "—"}</td>
                  <td className="px-4 py-3">
                    {l.email ? (
                      <span className="flex items-center gap-1.5 text-muted">
                        <span className="truncate">{l.email}</span>
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
                    ) : (
                      <span className="text-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ChannelBadge channel={l.channel} />
                  </td>
                  {!segmentId && (
                    <td className="px-4 py-3">
                      {l.segment ? (
                        <Link
                          href={`/leads/segments/${l.segment.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/[0.06] px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                        >
                          {l.segment.name}
                        </Link>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <ScorePill score={l.score} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusMenu lead={l} onChange={(s) => setLeadStatus(l.id, s)} />
                  </td>
                  <td className="num whitespace-nowrap px-4 py-3 text-muted">
                    {fmtDate(l.createdAt)}
                  </td>
                </tr>
              ))}
              {leadsList.length === 0 && (
                <tr>
                  <td colSpan={segmentId ? 8 : 9} className="px-4 py-10 text-center text-sm text-muted">
                    Aucun lead ne correspond à ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

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
                Aucun lead ne correspond à ces filtres.
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
                  <option key={n} value={n}>{n} par page</option>
                ))}
              </select>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="num text-xs text-muted">
                {rangeStart}–{rangeEnd} sur {total}
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
    </div>
  );
}

// ----- Metric card -----------------------------------------------------------

function MetricCard({
  icon: Icon,
  label,
  value,
  pct,
  sub,
  invert,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  value: number;
  pct: number;
  sub: string;
  invert?: boolean; // for "lost": a decrease is good news
}) {
  const up = pct >= 0;
  const good = invert ? !up : up;
  return (
    <div className="rounded-[10px] border-[0.5px] border-line bg-surface">
      <div className="flex items-center gap-2 border-b-[0.5px] border-line px-4 py-3">
        <Icon size={15} strokeWidth={1.5} className="text-muted" />
        <span className="text-[13px] font-medium text-ink">{label}</span>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="num text-[32px] font-bold leading-none tracking-tight text-ink">
              {value}
            </span>
            <span className="text-[13px] text-muted">leads</span>
          </div>
          <span
            className={`num inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
              good ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
            }`}
          >
            {up ? "↑" : "↓"} {Math.abs(pct).toFixed(1).replace(/\.0$/, "")} %
          </span>
        </div>
        <p className="num mt-2 text-xs text-muted">{sub}</p>
      </div>
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
function ScorePill({ score }: { score?: number }) {
  if (score === undefined) return <span className="text-faint">—</span>;
  return (
    <span
      className="num inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border-[0.5px] border-line px-2 py-1 text-xs font-semibold"
      title={scoreLabel(score)}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: scoreColorVar(score) }} />
      <span style={{ color: scoreColorVar(score) }}>{score}</span>
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
        Filtrer
        {active && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
      </button>
      {open && (
        <>
          <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-64 space-y-3 rounded-[10px] border border-line bg-surface p-3 shadow-pop">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">Contenu source</label>
              <select
                value={source}
                onChange={(e) => onSource(e.target.value)}
                className="w-full rounded-lg border border-line bg-canvas px-2 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
              >
                <option value="all">Tout contenu</option>
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
              Réinitialiser les filtres
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
    <div className="flex flex-col items-center rounded-[10px] border-[0.5px] border-line bg-surface px-6 py-16 text-center">
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
      <p className="font-display text-base font-semibold text-ink">Aucun lead pour l&apos;instant</p>
      <p className="mt-1 max-w-md text-sm text-muted">
        Publie du contenu sur tes réseaux — tes premiers prospects apparaîtront ici
        automatiquement.
      </p>
      <div className="mt-5 flex items-center gap-2">
        <button onClick={onAdd} className="btn-secondary text-[13px]">
          <Plus size={14} strokeWidth={1.5} /> Ajouter manuellement
        </button>
        <button onClick={onSeed} disabled={seeding} className="btn-ghost text-[13px]">
          {seeding ? "Chargement…" : "Charger des exemples"}
        </button>
      </div>
    </div>
  );
}
