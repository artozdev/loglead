"use client";

import {
  ArrowUpRight,
  Check,
  Copy,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Lead, LeadEvent } from "@/lib/types";

// ---------------------------------------------------------------------------
// Lead detail drawer. Everything shown comes from the real lead record and its
// event timeline. LinkedIn-native activity ("liked your post") and scraped
// buying signals aren't in our data model, so those are honest empty states —
// never faked.
// ---------------------------------------------------------------------------

function scoreColor(score?: number): string {
  if (score == null) return "text-faint";
  if (score >= 80) return "text-success";
  if (score >= 60) return "text-warning";
  return "text-danger";
}
function scoreBar(score?: number): string {
  if (score == null) return "bg-faint";
  if (score >= 80) return "bg-success";
  if (score >= 60) return "bg-warning";
  return "bg-danger";
}

const EVENT_META: Record<
  LeadEvent["type"],
  { label: string; tint: string; icon: typeof Check }
> = {
  added: { label: "Lead ajouté", tint: "bg-primary/[0.08] text-primary", icon: Sparkles },
  status_changed: { label: "Statut changé", tint: "bg-success/10 text-success", icon: Check },
  note_added: { label: "Note ajoutée", tint: "bg-primary/[0.08] text-primary", icon: MessageSquare },
  email_sent: { label: "Email envoyé", tint: "bg-warning/10 text-warning", icon: Mail },
  enriched: { label: "Lead enrichi", tint: "bg-primary/[0.08] text-primary", icon: Sparkles },
  scored: { label: "Score recalculé", tint: "bg-success/10 text-success", icon: Check },
};

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InfoCell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-r-[0.5px] border-line px-3 py-2.5 last:border-r-0">
      <p className="text-[11px] text-faint">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-medium text-ink">{value}</p>
    </div>
  );
}

function ActionBtn({
  label,
  onClick,
  href,
  children,
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
}) {
  const cls =
    "flex h-9 w-9 items-center justify-center rounded-lg border border-line text-muted transition hover:bg-surface-hover hover:text-ink";
  if (href) {
    return (
      <Link href={href} title={label} aria-label={label} className={cls}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" title={label} aria-label={label} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export default function LeadDrawer({
  lead,
  onClose,
  onUpdated,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdated?: () => void;
}) {
  const [events, setEvents] = useState<LeadEvent[] | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(lead.notes ?? "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [savingNote, setSavingNote] = useState(false);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch the real event timeline for this lead.
  useEffect(() => {
    let alive = true;
    fetch(`/api/leads/${lead.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setEvents(d?.events ?? []))
      .catch(() => alive && setEvents([]));
    return () => {
      alive = false;
    };
  }, [lead.id]);

  const copy = (text: string, key: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied((k) => (k === key ? null : k)), 1200);
  };

  const saveNote = async () => {
    setSavingNote(true);
    await fetch(`/api/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: noteDraft }),
    });
    setNotes(noteDraft);
    setSavingNote(false);
    setNoteOpen(false);
    onUpdated?.();
  };

  const initials = `${lead.firstName?.[0] ?? ""}${lead.lastName?.[0] ?? ""}`.toUpperCase() || "?";
  const signals = lead.signals;
  const signalCount =
    (signals?.hot.length ?? 0) + (signals?.warm.length ?? 0) + (signals?.cold.length ?? 0);

  return (
    <>
      <div className="fixed inset-0 z-[499] bg-black/20" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-label="Détail du lead"
        className="animate-drawer-in fixed right-0 top-0 z-[500] flex h-screen w-full flex-col overflow-y-auto border-l-[0.5px] border-line bg-canvas shadow-pop sm:w-[420px]"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b-[0.5px] border-line bg-canvas px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover"
            >
              <X size={17} strokeWidth={1.5} />
            </button>
            <span className="text-[15px] font-medium text-ink">Détail du lead</span>
          </div>
          <Link
            href={`/leads/${lead.id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-canvas hover:opacity-90"
          >
            Profil complet
            <ArrowUpRight size={14} strokeWidth={2} />
          </Link>
        </div>

        <div className="space-y-6 p-4">
          {/* Section 1 — Identity */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/[0.08] font-display text-lg font-bold text-primary">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-[22px] font-semibold leading-tight text-ink">
                  {lead.firstName} {lead.lastName}
                </p>
                <p className="truncate text-[13px] text-muted">{lead.email || "Pas d'email"}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <ActionBtn label="Message (Outreach)" href="/inbox">
              <MessageSquare size={16} strokeWidth={1.5} />
            </ActionBtn>
            <ActionBtn
              label={lead.email ? "Écrire un email" : "Pas d'email"}
              href={lead.email ? `mailto:${lead.email}` : undefined}
              onClick={lead.email ? undefined : () => {}}
            >
              <Mail size={16} strokeWidth={1.5} />
            </ActionBtn>
            <ActionBtn
              label={lead.phone ? "Copier le numéro" : "Pas de numéro"}
              onClick={() => lead.phone && copy(lead.phone, "phone")}
            >
              {copied === "phone" ? <Check size={16} className="text-success" /> : <Phone size={16} strokeWidth={1.5} />}
            </ActionBtn>
            {lead.email && (
              <ActionBtn label="Copier l'email" onClick={() => copy(lead.email!, "email")}>
                {copied === "email" ? <Check size={16} className="text-success" /> : <Copy size={16} strokeWidth={1.5} />}
              </ActionBtn>
            )}
          </div>

          {/* Section 2 — Key info grid */}
          <div className="grid grid-cols-2 overflow-hidden rounded-lg border-[0.5px] border-line">
            <InfoCell label="Société" value={lead.company || "—"} />
            <InfoCell label="Poste" value={lead.jobTitle || "—"} />
            <div className="col-span-2 border-t-[0.5px] border-line">
              <div className="grid grid-cols-2">
                <InfoCell label="Secteur" value={lead.sector || "—"} />
                <div className="px-3 py-2.5">
                  <p className="text-[11px] text-faint">Opp. Score</p>
                  <p className={`mt-0.5 text-[13px] font-semibold ${scoreColor(lead.score)}`}>
                    {lead.score != null ? `${lead.score}/100` : "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 — Progress bar */}
          {lead.score != null && (
            <div>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="font-medium text-ink">Qualification Score</span>
                <span className="text-muted">{lead.score}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <div className={`h-full rounded-full ${scoreBar(lead.score)}`} style={{ width: `${lead.score}%` }} />
              </div>
            </div>
          )}

          {/* Section 4 — Latest activities (real event timeline) */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h3 className="text-sm font-semibold text-ink">Dernières activités</h3>
              {events && (
                <span className="rounded-full bg-surface-hover px-1.5 text-[11px] text-muted">
                  {events.length}
                </span>
              )}
            </div>
            {events === null ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-8 animate-pulse rounded bg-surface-hover" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <p className="text-[13px] text-faint">Aucune activité enregistrée.</p>
            ) : (
              <ul className="space-y-3">
                {events.slice(0, 8).map((e) => {
                  const m = EVENT_META[e.type];
                  const Icon = m.icon;
                  return (
                    <li key={e.id} className="flex gap-3">
                      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${m.tint}`}>
                        <Icon size={14} strokeWidth={1.5} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] text-ink">{m.label}</p>
                        <p className="text-[11px] text-faint">{fmtDateTime(e.createdAt)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-hover/40 px-3 py-2 text-[11px] text-faint">
              <Lock size={12} className="mt-0.5 shrink-0" />
              Les interactions LinkedIn (likes, commentaires sur tes posts) apparaîtront ici une fois la source LinkedIn branchée.
            </p>
          </div>

          {/* Section 5 — Buying signals (real: lead.signals) */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-ink">
              Signaux d&apos;achat{signalCount > 0 ? ` · ${signalCount}` : ""}
            </h3>
            {signalCount === 0 ? (
              <p className="text-[13px] text-faint">
                Aucun signal encore. Ils sont générés par la qualification IA du lead (bouton « Enrichir »).
              </p>
            ) : (
              <ul className="space-y-2">
                {signals?.hot.map((s, i) => <SignalRow key={`h${i}`} dot="bg-danger" s={s} />)}
                {signals?.warm.map((s, i) => <SignalRow key={`w${i}`} dot="bg-warning" s={s} />)}
                {signals?.cold.map((s, i) => <SignalRow key={`c${i}`} dot="bg-faint" s={s} />)}
              </ul>
            )}
          </div>

          {/* Section 6 — Notes (real: lead.notes) */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Notes</h3>
              {!noteOpen && (
                <button
                  onClick={() => {
                    setNoteDraft(notes);
                    setNoteOpen(true);
                  }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {notes ? "Modifier" : "+ Ajouter une note"}
                </button>
              )}
            </div>
            {noteOpen ? (
              <div className="space-y-2">
                <textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  rows={4}
                  autoFocus
                  placeholder={`Écris une note sur ${lead.firstName}...`}
                  className="input !py-2 text-[13px]"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setNoteOpen(false)} className="btn-secondary !py-1.5 !text-xs">
                    Annuler
                  </button>
                  <button onClick={saveNote} disabled={savingNote} className="btn-primary !py-1.5 !text-xs disabled:opacity-50">
                    {savingNote ? "…" : "Enregistrer"}
                  </button>
                </div>
              </div>
            ) : notes ? (
              <div className="rounded-lg border-[0.5px] border-line bg-surface p-3 text-[13px] leading-relaxed text-ink">
                {notes}
              </div>
            ) : (
              <p className="text-[13px] text-faint">Aucune note.</p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function SignalRow({ dot, s }: { dot: string; s: { text: string; hint: string } }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
      <div>
        <p className="text-[13px] text-ink">{s.text}</p>
        {s.hint && <p className="text-[11px] text-faint">{s.hint}</p>}
      </div>
    </li>
  );
}
