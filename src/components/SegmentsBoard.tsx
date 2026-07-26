"use client";

import {
  Download,
  FolderOpen,
  Layers,
  Loader2,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LEAD_CHANNELS,
  LEAD_STATUSES,
  SEGMENT_SECTORS,
  SEGMENT_TYPE_META,
  type LeadChannel,
  type LeadStatus,
  type Segment,
  type SegmentCriteria,
  type SegmentType,
} from "@/lib/types";

type SegMetrics = { leads: number; enriched: number; enrichedPct: number; contacted: number; qualified: number };
type Row = { segment: Segment; metrics: SegMetrics };
type Totals = { segments: number; active: number; totalLeads: number; archived: number };

const SCORE_OPTIONS = [
  { label: "Tous", value: 0 },
  { label: ">50", value: 50 },
  { label: ">75", value: 75 },
  { label: ">90", value: 90 },
];

function TypeIcon({ type }: { type: SegmentType }) {
  if (type === "auto") return <Sparkles size={18} className="text-primary" />;
  if (type === "competitor_audience") return <Users size={18} className="text-[#C13584]" />;
  return <FolderOpen size={18} className="text-faint" />;
}

// Recommended next action, derived from the segment's metrics.
function recommendedAction(m: SegMetrics): { label: string; hint: string; cls: string } {
  if (m.leads === 0) return { label: "Ouvrir", hint: "Voir les leads", cls: "bg-primary/10 text-primary" };
  if (m.contacted === 0) return { label: "Contacter", hint: "Envoyer un premier message", cls: "bg-success/10 text-success" };
  if (m.leads > 10 && m.qualified < m.leads / 2)
    return { label: "Prioriser", hint: "Trier par score", cls: "bg-[#C13584]/10 text-[#C13584]" };
  return { label: "Ouvrir", hint: "Voir les prochaines actions", cls: "bg-primary/10 text-primary" };
}

export default function SegmentsBoard() {
  const [rows, setRows] = useState<Row[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Segment | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/segments");
    if (res.ok) {
      const d = await res.json();
      setRows(d.segments);
      setTotals(d.totals);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    let r = rows;
    if (!showArchived) r = r.filter((x) => !x.segment.isArchived);
    const query = q.toLowerCase().trim();
    if (query) r = r.filter((x) => x.segment.name.toLowerCase().includes(query));
    return r;
  }, [rows, q, showArchived]);

  async function patch(id: string, body: Record<string, unknown>) {
    await fetch(`/api/segments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    void load();
  }
  async function remove(id: string) {
    if (!window.confirm("Supprimer ce segment ? (les leads ne sont pas supprimés)")) return;
    await fetch(`/api/segments/${id}`, { method: "DELETE" });
    void load();
  }
  async function duplicate(s: Segment) {
    await fetch("/api/segments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${s.name} (copie)`, description: s.description, type: s.type, criteria: s.criteria }),
    });
    void load();
  }

  return (
    <div className="space-y-5">
      {/* Metric cards */}
      {totals && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard icon={<Layers size={16} className="text-primary" />} label="Segments" value={totals.segments} />
          <MetricCard icon={<Sparkles size={16} className="text-success" />} label="Actifs" value={totals.active} />
          <MetricCard icon={<Users size={16} className="text-[#C13584]" />} label="Total leads" value={totals.totalLeads} />
          <MetricCard icon={<FolderOpen size={16} className="text-faint" />} label="Archivés" value={totals.archived} />
        </div>
      )}

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 border-y-[0.5px] border-line py-3">
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 sm:max-w-xs">
          <Search size={14} strokeWidth={1.5} className="shrink-0 text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un segment…"
            className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[13px] text-muted">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          Archivés
        </label>
        <div className="ml-auto flex items-center gap-2">
          <a href="/api/leads/export" className="btn-secondary !py-2 text-[13px]">
            <Download size={14} strokeWidth={1.5} /> CSV
          </a>
          <button
            onClick={() => { setEditing(null); setModalOpen(true); }}
            className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#0F172A] px-3 py-2 text-[13px] font-medium text-white hover:opacity-90"
          >
            <Plus size={14} strokeWidth={2} /> Nouveau segment
          </button>
        </div>
      </div>

      {/* Segments table */}
      <div className="overflow-x-auto rounded-xl border-[0.5px] border-line bg-surface">
        <table className="w-full min-w-[860px] border-collapse text-[13px]">
          <thead>
            <tr className="text-left text-xs font-normal text-faint">
              <th className="w-12 px-4 py-2.5" />
              <th className="px-4 py-2.5 font-normal">Segment</th>
              <th className="px-4 py-2.5 font-normal">Action recommandée</th>
              <th className="px-4 py-2.5 font-normal">Leads</th>
              <th className="px-4 py-2.5 font-normal">Enrichissement</th>
              <th className="px-4 py-2.5 font-normal">LogReach</th>
              <th className="w-12 px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visible.map(({ segment, metrics }) => (
              <SegmentRow
                key={segment.id}
                segment={segment}
                metrics={metrics}
                onEdit={() => { setEditing(segment); setModalOpen(true); }}
                onDuplicate={() => duplicate(segment)}
                onArchive={() => patch(segment.id, { isArchived: !segment.isArchived })}
                onDelete={() => remove(segment.id)}
                onLink={() => patch(segment.id, { logreachLinked: !segment.logreachLinked })}
              />
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted">
                  Aucun segment. Crée ton premier segment pour organiser tes leads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <SegmentModal
          editing={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); void load(); }}
        />
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border-[0.5px] border-line bg-surface px-4 py-3.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-hover">{icon}</span>
      <div>
        <div className="num text-2xl font-semibold text-ink">{value}</div>
        <div className="text-xs text-muted">{label}</div>
      </div>
    </div>
  );
}

function SegmentRow({
  segment,
  metrics,
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onLink,
}: {
  segment: Segment;
  metrics: SegMetrics;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onLink: () => void;
}) {
  const [menu, setMenu] = useState(false);
  const meta = SEGMENT_TYPE_META[segment.type];
  const action = recommendedAction(metrics);
  const pct = metrics.enrichedPct;
  const enrichLabel = pct === 100 ? "Terminé" : pct === 0 ? "À enrichir" : "En cours";
  const enrichColor = pct === 100 ? "text-success" : pct === 0 ? "text-muted" : "text-primary";
  const barColor = pct === 100 ? "bg-success" : "bg-primary";

  return (
    <tr className="border-t-[0.5px] border-line hover:bg-surface-hover">
      <td className="px-4 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-hover">
          <TypeIcon type={segment.type} />
        </span>
      </td>
      <td className="px-4 py-3.5">
        <Link href={`/leads/segments/${segment.id}`} className="block">
          <span className="text-[14px] font-medium text-ink hover:text-primary">{segment.name}</span>
          {segment.description && <span className="block text-xs text-muted">{segment.description}</span>}
          <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badgeCls}`}>
            {meta.label}
          </span>
          {segment.isArchived && <span className="ml-1 text-[10px] text-faint">· Archivé</span>}
        </Link>
      </td>
      <td className="px-4 py-3.5">
        <Link
          href={action.label === "Contacter" ? "/inbox" : `/leads/segments/${segment.id}`}
          title={action.hint}
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${action.cls}`}
        >
          {action.label}
        </Link>
      </td>
      <td className="px-4 py-3.5">
        <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink">
          <Users size={13} className="text-muted" /> {metrics.leads}
        </span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center justify-between text-[11px]">
          <span className={enrichColor}>{enrichLabel}</span>
          <span className="num text-muted">{metrics.enriched}/{metrics.leads}</span>
        </div>
        <div className="mt-1 h-1.5 w-40 overflow-hidden rounded-full bg-surface-hover">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </td>
      <td className="px-4 py-3.5">
        {segment.logreachLinked ? (
          <span className="flex items-center gap-2">
            <span className="text-xs text-success">Lié</span>
            <Link href="/inbox" className="rounded-lg border border-line px-2 py-1 text-xs text-muted hover:bg-surface-hover">
              Gérer
            </Link>
          </span>
        ) : (
          <button onClick={onLink} className="rounded-lg border border-line px-2.5 py-1 text-xs text-muted hover:bg-surface-hover hover:text-ink">
            Lier
          </button>
        )}
      </td>
      <td className="px-4 py-3.5 text-right">
        <div className="relative inline-block">
          <button onClick={() => setMenu(!menu)} aria-label="Actions" className="rounded-lg p-1.5 text-muted hover:bg-surface-hover hover:text-ink">
            <MoreHorizontal size={16} />
          </button>
          {menu && (
            <>
              <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-[10px] border border-line bg-surface p-1 text-left shadow-pop">
                <MenuItem label="Modifier" onClick={() => { setMenu(false); onEdit(); }} />
                <MenuItem label="Dupliquer" onClick={() => { setMenu(false); onDuplicate(); }} />
                <MenuItem label={segment.isArchived ? "Désarchiver" : "Archiver"} onClick={() => { setMenu(false); onArchive(); }} />
                <MenuItem label="Supprimer" danger onClick={() => { setMenu(false); onDelete(); }} />
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuItem({ label, onClick, danger }: { label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-hover ${danger ? "text-danger" : "text-ink"}`}
    >
      {label}
    </button>
  );
}

// ----- Create / edit modal ----------------------------------------------------

function SegmentModal({
  editing,
  onClose,
  onSaved,
}: {
  editing: Segment | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(editing?.name ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [type, setType] = useState<SegmentType>(editing?.type ?? "manual");
  const [sectors, setSectors] = useState<string[]>(editing?.criteria.sectors ?? []);
  const [channel, setChannel] = useState<LeadChannel | "">(editing?.criteria.channels?.[0] ?? "");
  const [status, setStatus] = useState<LeadStatus | "">(editing?.criteria.statuses?.[0] ?? "");
  const [minScore, setMinScore] = useState<number>(editing?.criteria.minScore ?? 0);
  const [preview, setPreview] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const criteria: SegmentCriteria = useMemo(
    () => ({
      sectors: sectors.length ? sectors : undefined,
      channels: channel ? [channel] : undefined,
      statuses: status ? [status] : undefined,
      minScore: minScore || undefined,
    }),
    [sectors, channel, status, minScore],
  );

  // Debounced live preview of matching leads.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const res = await fetch("/api/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(criteria),
      });
      if (res.ok) setPreview((await res.json()).count);
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [criteria]);

  function toggleSector(s: string) {
    setSectors((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  async function save() {
    if (!name.trim()) return setError("Le nom du segment est requis.");
    setError(null);
    setSaving(true);
    try {
      const body = JSON.stringify({ name, description: description || undefined, type, criteria });
      const res = editing
        ? await fetch(`/api/segments/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body })
        : await fetch("/api/segments", { method: "POST", headers: { "Content-Type": "application/json" }, body });
      if (!res.ok) {
        setError((await res.json()).error ?? "Échec de l'enregistrement.");
        return;
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
      <div className="relative flex max-h-[90vh] w-full max-w-[520px] flex-col rounded-2xl border border-line bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b-[0.5px] border-line px-5 py-4">
          <h2 className="font-display text-base font-semibold">{editing ? "Modifier le segment" : "Créer un segment"}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-muted hover:text-ink"><X size={18} /></button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <label className="label">Nom du segment <span className="text-danger">*</span></label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Agences marketing Paris" />
          </div>
          <div>
            <label className="label">Description <span className="font-normal text-muted">(optionnel)</span></label>
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex : Leads du secteur agences ayant commenté sur LinkedIn" />
          </div>
          <div>
            <label className="label">Type de segment</label>
            <div className="flex flex-wrap gap-2">
              {(["auto", "manual", "competitor_audience"] as SegmentType[]).map((t) => {
                const on = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`rounded-lg border px-3 py-1.5 text-[13px] font-medium transition ${on ? "border-primary bg-primary/[0.06] text-primary" : "border-line text-muted hover:bg-surface-hover"}`}
                  >
                    {t === "auto" ? "🤖 IA Auto" : t === "manual" ? "✋ Manuel" : "👤 Audience concurrent"}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border-[0.5px] border-line p-3">
            <p className="text-xs font-medium text-muted">Critères de segmentation</p>
            <div>
              <label className="mb-1 block text-xs text-muted">Secteur d&apos;activité</label>
              <div className="flex flex-wrap gap-1.5">
                {SEGMENT_SECTORS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => toggleSector(s.value)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition ${sectors.includes(s.value) ? "border-primary bg-primary text-white" : "border-line text-muted hover:bg-surface-hover"}`}
                  >
                    {s.value}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-muted">Canal d&apos;acquisition</label>
                <select className="input !py-2" value={channel} onChange={(e) => setChannel(e.target.value as LeadChannel | "")}>
                  <option value="">Tous</option>
                  {LEAD_CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Statut des leads</label>
                <select className="input !py-2" value={status} onChange={(e) => setStatus(e.target.value as LeadStatus | "")}>
                  <option value="">Tous</option>
                  {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Score de qualification</label>
              <div className="flex gap-1.5">
                {SCORE_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    onClick={() => setMinScore(o.value)}
                    className={`rounded-lg border px-3 py-1 text-xs transition ${minScore === o.value ? "border-primary bg-primary/[0.06] text-primary" : "border-line text-muted hover:bg-surface-hover"}`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-primary/[0.05] px-3 py-2.5 text-[13px] text-primary">
            → <span className="num font-semibold">{preview ?? "…"}</span> lead{(preview ?? 0) > 1 ? "s" : ""} correspond{(preview ?? 0) > 1 ? "ent" : ""} à ces critères
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t-[0.5px] border-line px-5 py-4">
          <button onClick={onClose} className="btn-ghost">Annuler</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? <Loader2 size={15} className="animate-spin" /> : null}
            {editing ? "Enregistrer" : "Créer le segment"}
          </button>
        </div>
      </div>
    </div>
  );
}
