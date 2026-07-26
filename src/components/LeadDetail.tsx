"use client";

import {
  Archive,
  ArrowLeft,
  Calendar,
  Copy,
  ExternalLink,
  Info,
  Mail,
  MoreHorizontal,
  Pencil,
  Plus,
  Radio,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LEAD_CHANNELS,
  LEAD_STATUSES,
  leadChannelLabel,
  leadStatusLabel,
  SCORE_CRITERIA,
  scoreColorVar,
  scoreLabel,
  type Lead,
  type LeadEvent,
  type LeadScoreWeights,
  type LeadStatus,
  type RecommendedAction,
} from "@/lib/types";
import LeadEmailModal from "./LeadEmailModal";
import ScoreConfigModal from "./ScoreConfigModal";

type ContentRef = { id: string; title: string };

function initials(l: Lead) {
  return `${l.firstName[0] ?? ""}${l.lastName[0] ?? ""}`.toUpperCase() || "?";
}

function avatarHue(l: Lead): number {
  const name = `${l.firstName} ${l.lastName}`;
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function eventText(e: LeadEvent): string {
  const d = e.data as Record<string, string>;
  switch (e.type) {
    case "added":
      return d.channel ? `Lead capté depuis ${leadChannelLabel(d.channel as never)}` : "Lead capté";
    case "status_changed":
      return `Statut : ${leadStatusLabel(d.from as never)} → ${leadStatusLabel(d.to as never)}`;
    case "note_added":
      return "Note ajoutée";
    case "email_sent":
      return "Message envoyé";
    case "enriched":
      return "Profil enrichi par l'IA";
    case "scored":
      return d.total ? `Score recalculé : ${d.total}/100` : "Score recalculé";
    default:
      return e.type;
  }
}

const EVENT_DOT: Record<string, string> = {
  added: "var(--color-primary)",
  status_changed: "var(--color-info)",
  note_added: "var(--text-muted)",
  email_sent: "var(--color-secondary)",
  enriched: "var(--color-success)",
  scored: "var(--color-warning)",
};

export default function LeadDetail({
  leadId,
  isPro,
  contents,
}: {
  leadId: string;
  isPro: boolean;
  contents: ContentRef[];
}) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [weights, setWeights] = useState<LeadScoreWeights | null>(null);
  const [tab, setTab] = useState<"info" | "signals">("info");
  const [busy, setBusy] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteText, setNoteText] = useState("");

  async function load() {
    const res = await fetch(`/api/leads/${leadId}`);
    if (res.ok) {
      const d = await res.json();
      setLead(d.lead);
      setEvents(d.events);
      setWeights(d.weights);
    }
  }
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  // Lazy backfill: score a lead that was never qualified when the sheet opens.
  useEffect(() => {
    if (lead && lead.score === undefined && !scoring) void recalc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead?.id]);

  async function patch(partial: Partial<Lead>) {
    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
    if (res.ok) await load();
  }

  async function recalc() {
    setScoring(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/score`, { method: "POST" });
      if (res.ok) await load();
    } finally {
      setScoring(false);
    }
  }

  async function enrich() {
    setBusy(true);
    try {
      await fetch(`/api/leads/${leadId}/enrich`, { method: "POST" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, { method: "DELETE" });
      if (res.ok) router.push("/leads");
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    const text = noteText.trim();
    if (!text) {
      setAddingNote(false);
      return;
    }
    const combined = lead?.notes ? `${lead.notes}\n\n${text}` : text;
    await patch({ notes: combined });
    setNoteText("");
    setAddingNote(false);
  }

  function runAction(a: RecommendedAction) {
    if (a.ctaKind === "message") {
      setEmailOpen(true);
    } else {
      router.push(`/studio?brief=${encodeURIComponent(a.brief ?? a.description)}`);
    }
  }

  if (!lead) {
    return <div className="py-16 text-center text-sm text-muted">Chargement…</div>;
  }

  const sourceTitle = lead.sourceContentId
    ? contents.find((c) => c.id === lead.sourceContentId)?.title
    : undefined;
  const score = lead.score ?? 0;
  const hue = avatarHue(lead);

  return (
    <div className="space-y-5">
      {/* Back */}
      <Link
        href="/leads"
        className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink"
      >
        <ArrowLeft size={15} strokeWidth={1.5} /> Retour aux leads
      </Link>

      {/* Header card */}
      <div className="rounded-[12px] border-[0.5px] border-line bg-surface">
        <div className="flex flex-col gap-4 border-b-[0.5px] border-line p-5 sm:flex-row sm:items-start">
          {/* Identity */}
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold"
            style={{
              backgroundColor: `hsl(${hue} 60% 50% / 0.14)`,
              color: `hsl(${hue} 60% 45%)`,
            }}
          >
            {initials(lead)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-medium tracking-tight">
              {lead.firstName} {lead.lastName}
            </h1>
            <p className="text-sm text-muted">
              {[lead.jobTitle, lead.company].filter(Boolean).join(" · ") || "Poste non renseigné"}
            </p>
            <div className="mt-1 flex items-center gap-1.5 text-[13px] text-faint">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: LEAD_CHANNELS.find((c) => c.value === lead.channel)?.dot }}
              />
              {leadChannelLabel(lead.channel)} · Capté le{" "}
              {new Date(lead.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
            </div>
          </div>

          {/* Score gauge */}
          <div className="sm:w-56">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                Score de qualification
              </span>
              {scoring && <RefreshCw size={12} className="animate-spin text-muted" />}
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="num text-3xl font-bold leading-none" style={{ color: scoreColorVar(score) }}>
                {score}
              </span>
              <span className="text-sm text-muted">/100</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-hover">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${score}%`, backgroundColor: scoreColorVar(score) }}
              />
            </div>
            <p className="mt-1.5 text-[13px] font-medium" style={{ color: scoreColorVar(score) }}>
              {scoreLabel(score)}
            </p>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap items-center gap-2 p-4">
          <button onClick={() => setEmailOpen(true)} className="btn-primary !py-2 text-[13px]">
            <Mail size={14} strokeWidth={1.5} /> Contacter
          </button>
          <Link href="/calendar" className="btn-secondary !py-2 text-[13px]">
            <Calendar size={14} strokeWidth={1.5} /> Planifier un suivi
          </Link>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Plus d'actions"
              className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line text-muted hover:bg-surface-hover hover:text-ink"
            >
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </button>
            {menuOpen && (
              <>
                <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 w-52 rounded-[10px] border border-line bg-surface p-1 shadow-pop">
                  <MenuItem icon={Pencil} label="Modifier" onClick={() => { setMenuOpen(false); setTab("info"); }} />
                  <Link href="/leads" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted hover:bg-surface-hover hover:text-ink">
                    <Archive size={14} strokeWidth={1.5} /> Déplacer / segments
                  </Link>
                  <MenuItem
                    icon={Trash2}
                    label="Supprimer"
                    danger
                    onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  />
                </div>
              </>
            )}
          </div>
          <div className="ml-auto">
            <select
              value={lead.status}
              onChange={(e) => patch({ status: e.target.value as LeadStatus })}
              aria-label="Statut du lead"
              className="rounded-lg border border-line bg-surface px-2.5 py-2 text-[13px] text-ink outline-none focus:border-primary"
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {confirmDelete && (
        <div className="rounded-[10px] border-[0.5px] border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-danger">Supprimer définitivement ce lead ? (RGPD — action irréversible)</p>
          <div className="mt-2 flex gap-2">
            <button onClick={remove} disabled={busy} className="btn-primary !bg-none !bg-danger !py-1.5 text-sm">Supprimer</button>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost !py-1.5 text-sm">Annuler</button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b-[0.5px] border-line">
        <Tab icon={Info} label="Informations" active={tab === "info"} onClick={() => setTab("info")} />
        <Tab icon={Radio} label="Signaux" active={tab === "signals"} onClick={() => setTab("signals")} />
      </div>

      {tab === "info" ? (
        <InfoTab
          lead={lead}
          sourceTitle={sourceTitle}
          isPro={isPro}
          busy={busy}
          events={events}
          addingNote={addingNote}
          noteText={noteText}
          onEnrich={enrich}
          onPatch={patch}
          onStartNote={() => setAddingNote(true)}
          onNoteText={setNoteText}
          onSaveNote={saveNote}
          onCancelNote={() => { setAddingNote(false); setNoteText(""); }}
        />
      ) : (
        <SignalsTab
          lead={lead}
          scoring={scoring}
          onRecalc={recalc}
          onConfigure={() => setConfigOpen(true)}
          onAction={runAction}
        />
      )}

      {emailOpen && (
        <LeadEmailModal
          lead={lead}
          sourceTitle={sourceTitle}
          isPro={isPro}
          onClose={() => setEmailOpen(false)}
          onSent={() => { setEmailOpen(false); void load(); }}
        />
      )}
      {configOpen && weights && (
        <ScoreConfigModal
          weights={weights}
          onClose={() => setConfigOpen(false)}
          onSaved={() => { setConfigOpen(false); void load(); }}
        />
      )}
    </div>
  );
}

// ----- Informations tab ------------------------------------------------------

function InfoTab({
  lead,
  sourceTitle,
  isPro,
  busy,
  events,
  addingNote,
  noteText,
  onEnrich,
  onPatch,
  onStartNote,
  onNoteText,
  onSaveNote,
  onCancelNote,
}: {
  lead: Lead;
  sourceTitle?: string;
  isPro: boolean;
  busy: boolean;
  events: LeadEvent[];
  addingNote: boolean;
  noteText: string;
  onEnrich: () => void;
  onPatch: (p: Partial<Lead>) => void;
  onStartNote: () => void;
  onNoteText: (v: string) => void;
  onSaveNote: () => void;
  onCancelNote: () => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Contact */}
      <Section title="Contact">
        <ContactRow label="Email" value={lead.email} kind="copy" onAdd={() => onPatch({ email: "" })} />
        <ContactRow label="Téléphone" value={lead.phone} kind="copy" onAdd={() => onPatch({ phone: "" })} />
        <ContactRow label="LinkedIn" value={lead.linkedinUrl} kind="open" />
        <ContactRow label="Site web" value={lead.siteUrl} kind="open" />
      </Section>

      {/* Company & role */}
      <Section
        title="Entreprise & Poste"
        action={
          isPro ? (
            <button onClick={onEnrich} disabled={busy} className="inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline disabled:opacity-50">
              <Sparkles size={13} strokeWidth={1.5} /> {busy ? "Enrichissement…" : "Enrichir"}
            </button>
          ) : undefined
        }
      >
        <InfoRow label="Entreprise" value={lead.company} />
        <InfoRow label="Secteur" value={lead.sector} />
        <InfoRow label="Taille" value={lead.companySize} />
        <InfoRow label="Poste" value={lead.jobTitle} />
      </Section>

      {/* Interests */}
      <Section title="Centres d'intérêt détectés">
        {lead.interests?.length ? (
          <div className="flex flex-wrap gap-2">
            {lead.interests.map((t) => (
              <span key={t} className="chip border-line bg-surface-hover text-muted">{t}</span>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-faint">
            Aucun centre d&apos;intérêt détecté. {isPro ? "Lance l'enrichissement pour en générer." : "Réservé au plan Pro."}
          </p>
        )}
      </Section>

      {/* Origin */}
      <Section title="Origine & Canal">
        <InfoRow label="Canal" value={leadChannelLabel(lead.channel)} />
        {sourceTitle ? (
          <div className="flex items-start justify-between gap-3 py-1.5">
            <span className="text-xs text-muted">Contenu source</span>
            <Link
              href={`/studio?content=${lead.sourceContentId}`}
              className="inline-flex items-center gap-1 text-right text-[13px] text-primary hover:underline"
            >
              {sourceTitle} <ExternalLink size={12} strokeWidth={1.5} />
            </Link>
          </div>
        ) : (
          <InfoRow label="Contenu source" value={undefined} />
        )}
        <InfoRow label="Date" value={fmtDateTime(lead.createdAt)} />
      </Section>

      {/* Timeline — full width */}
      <div className="lg:col-span-2">
        <Section title="Historique du suivi">
          <ol className="space-y-3 border-l border-line pl-4">
            {events.map((e) => (
              <li key={e.id} className="relative text-sm">
                <span
                  className="absolute -left-[1.34rem] top-1.5 h-2 w-2 rounded-full ring-2 ring-surface"
                  style={{ backgroundColor: EVENT_DOT[e.type] ?? "var(--text-muted)" }}
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-ink">{eventText(e)}</span>
                  <span className="num text-xs text-faint">
                    {new Date(e.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                </div>
              </li>
            ))}
            {events.length === 0 && <li className="text-[13px] text-faint">Aucune interaction pour l&apos;instant.</li>}
          </ol>

          {addingNote ? (
            <div className="mt-3 space-y-2">
              <textarea
                autoFocus
                rows={3}
                value={noteText}
                onChange={(e) => onNoteText(e.target.value)}
                placeholder="Ta note…"
                className="input"
              />
              <div className="flex gap-2">
                <button onClick={onSaveNote} className="btn-primary !py-1.5 text-sm">Enregistrer</button>
                <button onClick={onCancelNote} className="btn-ghost !py-1.5 text-sm">Annuler</button>
              </div>
            </div>
          ) : (
            <button onClick={onStartNote} className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-primary hover:underline">
              <Plus size={14} strokeWidth={1.5} /> Ajouter une note
            </button>
          )}
        </Section>
      </div>
    </div>
  );
}

// ----- Signaux tab -----------------------------------------------------------

function SignalsTab({
  lead,
  scoring,
  onRecalc,
  onConfigure,
  onAction,
}: {
  lead: Lead;
  scoring: boolean;
  onRecalc: () => void;
  onConfigure: () => void;
  onAction: (a: RecommendedAction) => void;
}) {
  const score = lead.score ?? 0;
  const breakdown = lead.scoreBreakdown;
  const signals = lead.signals;
  const actions = lead.recommendedActions ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-semibold">Détail du score</h2>
        <div className="flex items-center gap-2">
          <button onClick={onRecalc} disabled={scoring} className="btn-ghost !py-1.5 text-[13px]">
            <RefreshCw size={13} strokeWidth={1.5} className={scoring ? "animate-spin" : ""} /> Recalculer
          </button>
          <button onClick={onConfigure} className="btn-secondary !py-1.5 text-[13px]">
            <Settings size={13} strokeWidth={1.5} /> Configurer le score
          </button>
        </div>
      </div>

      {/* Score breakdown */}
      <div className="rounded-[10px] border-[0.5px] border-line bg-surface p-5">
        {breakdown ? (
          <div className="space-y-4">
            {SCORE_CRITERIA.map((c) => {
              const b = breakdown[c.value];
              if (!b) return null;
              // Bars are drawn on a 20-pt visual scale (the default per-criterion max).
              const pct = Math.min(100, (b.score / 20) * 100);
              return (
                <div key={c.value}>
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink">{c.label}</span>
                    <span className="num text-muted">{b.score} pts</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: scoreColorVar(score) }} />
                  </div>
                  <p className="mt-1 text-xs text-muted">→ {b.reason}</p>
                </div>
              );
            })}
            <div className="border-t-[0.5px] border-line pt-3 text-sm font-semibold">
              TOTAL : <span style={{ color: scoreColorVar(score) }}>{score}/100</span> — {scoreLabel(score)}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-faint">
            {scoring ? "Calcul du score en cours…" : "Score non encore calculé. Clique sur « Recalculer »."}
          </p>
        )}
      </div>

      {/* Signals */}
      {signals && (
        <div className="space-y-4">
          <SignalGroup title="Signaux chauds" emoji="🔥" items={signals.hot} tone="hot" />
          <SignalGroup title="Signaux tièdes" emoji="🟡" items={signals.warm} tone="warm" />
          <SignalGroup title="Signaux froids" emoji="⚪" items={signals.cold} tone="cold" />
        </div>
      )}

      {/* Recommended actions */}
      {actions.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-display text-base font-semibold">Actions recommandées</h2>
          {actions.map((a, i) => (
            <div key={i} className="rounded-[10px] border-[0.5px] border-line bg-surface p-4">
              <p className="text-[13px] font-semibold text-ink">💡 {a.title}</p>
              <p className="mt-1 text-[13px] text-muted">{a.description}</p>
              <button onClick={() => onAction(a)} className="btn-secondary mt-3 !py-1.5 text-[13px]">
                {a.ctaKind === "message" ? <Mail size={13} strokeWidth={1.5} /> : <Pencil size={13} strokeWidth={1.5} />}
                {a.ctaLabel} →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SignalGroup({
  title,
  emoji,
  items,
  tone,
}: {
  title: string;
  emoji: string;
  items: { text: string; hint: string }[];
  tone: "hot" | "warm" | "cold";
}) {
  if (!items?.length) return null;
  const cls =
    tone === "hot"
      ? "border-signal-hot/30 bg-signal-hot-bg"
      : tone === "warm"
        ? "border-signal-warm/40 bg-signal-warm-bg"
        : "border-line bg-surface";
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {emoji} {title}
      </p>
      <div className="space-y-2">
        {items.map((s, i) => (
          <div key={i} className={`rounded-[10px] border-[0.5px] p-3 ${cls}`}>
            <p className="text-[13px] font-medium text-ink">{s.text}</p>
            <p className="mt-0.5 text-xs text-muted">→ {s.hint}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ----- Small building blocks -------------------------------------------------

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[10px] border-[0.5px] border-line bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
        {action}
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5">
      <span className="text-xs text-muted">{label}</span>
      <span className={`text-right text-[13px] ${value ? "text-ink" : "text-faint"}`}>
        {value || "Non renseigné"}
      </span>
    </div>
  );
}

function ContactRow({
  label,
  value,
  kind,
  onAdd,
}: {
  label: string;
  value?: string | null;
  kind: "copy" | "open";
  onAdd?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  if (!value) {
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-xs text-muted">{label}</span>
        {onAdd ? (
          <button onClick={onAdd} className="text-[13px] text-primary hover:underline">+ Ajouter</button>
        ) : (
          <span className="text-[13px] text-faint">Non renseigné</span>
        )}
      </div>
    );
  }
  const href = kind === "open" ? (value.startsWith("http") ? value : `https://${value}`) : undefined;
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-xs text-muted">{label}</span>
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="truncate text-[13px] text-ink">{value}</span>
        {kind === "copy" ? (
          <button
            aria-label={`Copier ${label}`}
            title="Copier"
            onClick={() => { void navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1200); }}
            className="shrink-0 rounded p-1 text-faint hover:bg-surface-hover hover:text-ink"
          >
            <Copy size={13} strokeWidth={1.5} />
          </button>
        ) : (
          <a href={href} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${label}`} title="Ouvrir" className="shrink-0 rounded p-1 text-faint hover:bg-surface-hover hover:text-ink">
            <ExternalLink size={13} strokeWidth={1.5} />
          </a>
        )}
        {copied && <span className="text-[11px] text-success">Copié</span>}
      </span>
    </div>
  );
}

function Tab({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-[0.5px] inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-[13px] font-medium transition ${
        active ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
      }`}
    >
      <Icon size={15} strokeWidth={1.5} />
      {label}
    </button>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] hover:bg-surface-hover ${
        danger ? "text-danger" : "text-muted hover:text-ink"
      }`}
    >
      <Icon size={14} strokeWidth={1.5} />
      {label}
    </button>
  );
}
