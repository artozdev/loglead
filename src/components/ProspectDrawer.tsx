"use client";

import { ArrowUpRight, Check, Copy, Loader2, Sparkles, X } from "lucide-react";
import { useState } from "react";
import MessageComposer from "./MessageComposer";
import type { Prospect } from "@/lib/types";

const SOURCE_LABEL: Record<string, string> = {
  linkedin_jobs: "LinkedIn Jobs", linkedin_company: "LinkedIn", google_maps: "Google Maps",
  google_search: "Google", instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", twitter: "X", manual: "Manuel",
};

function rel(iso?: string) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 86400000;
  return d < 1 ? "aujourd'hui" : d < 7 ? `il y a ${Math.floor(d)}j` : `il y a ${Math.floor(d / 7)} sem`;
}

export default function ProspectDrawer({
  prospect,
  onClose,
  onUpdated,
}: {
  prospect: Prospect;
  onClose: () => void;
  onUpdated: (p: Prospect) => void;
}) {
  const p = prospect;
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const scoreColor = p.fitScore > 80 ? "#10B981" : p.fitScore >= 60 ? "#F59E0B" : "#EF4444";

  async function patch(body: Record<string, unknown>, key: string) {
    setBusy(key); setErr(null);
    try {
      const res = await fetch(`/api/prospects/${p.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const d = await res.json();
      if (res.ok) onUpdated(d.prospect); else setErr(d.error ?? "Erreur");
    } catch { setErr("Connexion impossible."); } finally { setBusy(null); }
  }

  async function enrich() {
    setBusy("enrich"); setErr(null);
    try {
      const res = await fetch(`/api/prospects/${p.id}/enrich`, { method: "POST" });
      const d = await res.json();
      if (res.status === 402) { window.dispatchEvent(new CustomEvent("loglead:insufficient-credits", { detail: d })); return; }
      if (res.ok) { onUpdated(d.prospect); window.dispatchEvent(new CustomEvent("loglead:credits-changed")); }
      else setErr(d.error ?? "Enrichissement impossible.");
    } catch { setErr("Connexion impossible."); } finally { setBusy(null); }
  }

  return (
    <div className="fixed inset-0 z-[70]">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l border-line bg-surface shadow-pop">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Fermer"><X size={18} /></button>
          <span className="text-[13px] font-medium text-ink">Prospect Detail</span>
          {!p.inContact ? (
            <button onClick={() => patch({ inContact: true }, "contact")} disabled={busy === "contact"} className="btn-primary !py-1.5 text-[12px] disabled:opacity-60">
              {busy === "contact" ? <Loader2 size={13} className="animate-spin" /> : null} Add to Contact →
            </button>
          ) : (
            <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success"><Check size={12} /> In Contact</span>
          )}
        </div>

        <div className="space-y-6 px-5 py-5">
          {/* Identity */}
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[18px] font-bold text-primary">{p.companyName.charAt(0).toUpperCase()}</span>
            <div className="min-w-0">
              <div className="truncate text-[16px] font-semibold text-ink">{p.contactName ?? p.companyName}</div>
              <div className="truncate text-[13px] text-muted">{p.contactName ? p.companyName : p.companySector ?? ""}</div>
              <div className="mt-1 text-[12px] text-faint">{SOURCE_LABEL[p.source] ?? p.source} · Added {rel(p.createdAt)}</div>
            </div>
          </div>

          {err && <p className="rounded-lg bg-danger/10 px-3 py-2 text-[12px] text-danger">{err}</p>}

          {/* Fit score */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Fit score</p>
            <div className="mt-1.5 flex items-center gap-3">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: scoreColor }} /><span className="num text-[20px] font-bold text-ink">{p.fitScore}</span><span className="text-[13px] text-muted">/ 100</span></span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-hover"><div className="h-full rounded-full" style={{ width: `${p.fitScore}%`, background: scoreColor }} /></div>
            </div>
          </div>

          {/* Signal */}
          {p.signalDescription && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Signal détecté</p>
              <p className="mt-1.5 text-[13px] text-ink">{p.signalDescription}</p>
              {p.signalDate && <p className="text-[12px] text-faint">Detected {rel(p.signalDate)}</p>}
            </div>
          )}

          {/* Why interesting */}
          {p.fitReasoning && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pourquoi ce prospect est intéressant</p>
              <p className="mt-1.5 rounded-xl border-l-[3px] border-primary bg-primary/[0.05] px-3 py-2 text-[13px] italic leading-relaxed text-ink">&ldquo;{p.fitReasoning}&rdquo;</p>
            </div>
          )}

          {/* Contact */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Contact</p>
            <div className="mt-2 space-y-2 text-[13px]">
              <ContactRow label="Email" value={p.contactEmail} onEnrich={enrich} busy={busy === "enrich"} enrichLabel="Find email" />
              <ContactRow label="Phone" value={p.contactPhone} onEnrich={enrich} busy={busy === "enrich"} enrichLabel="Find phone" />
              {p.contactLinkedinUrl && <a href={p.contactLinkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between"><span className="text-muted">Profil</span><span className="flex items-center gap-1 text-primary">Ouvrir <ArrowUpRight size={13} /></span></a>}
              {p.companyDomain && <a href={`https://${p.companyDomain}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between"><span className="text-muted">Website</span><span className="flex items-center gap-1 text-primary">{p.companyDomain} <ArrowUpRight size={13} /></span></a>}
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Company</p>
            <div className="mt-2 space-y-1.5 text-[13px]">
              {p.companySector && <Row k="Sector" v={p.companySector} />}
              {p.companySize && <Row k="Size" v={p.companySize} />}
              {p.companyLocation && <Row k="Location" v={p.companyLocation} />}
            </div>
          </div>

          {/* Signals */}
          {p.signals && p.signals.length > 0 && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Signals</p>
              <ul className="mt-2 space-y-1.5 text-[13px] text-ink">
                {p.signals.map((s, i) => <li key={i} className="flex items-center gap-2"><span>{s.level === "hot" ? "🔥" : s.level === "warm" ? "🟡" : "⚪"}</span>{s.text}</li>)}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowComposer((v) => !v)} className="btn-primary flex-1 !py-2 text-[13px]"><Sparkles size={14} /> Generate message</button>
            <button onClick={() => navigator.clipboard?.writeText(`${p.contactName ?? p.companyName} · ${p.companyDomain ?? ""} · ${p.contactEmail ?? ""}`)} className="btn-secondary !py-2 text-[13px]"><Copy size={14} /> Copy</button>
          </div>
          {showComposer && <MessageComposer prospectId={p.id} name={p.contactName ?? p.companyName} />}
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between"><span className="text-muted">{k}</span><span className="text-ink">{v}</span></div>;
}

function ContactRow({ label, value, onEnrich, busy, enrichLabel }: { label: string; value?: string | null; onEnrich: () => void; busy: boolean; enrichLabel: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted">{label}</span>
      {value ? (
        <span className="flex items-center gap-1.5 text-ink"><span className="text-primary">{value}</span><Check size={13} className="text-success" /></span>
      ) : (
        <button onClick={onEnrich} disabled={busy} className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-muted transition hover:border-primary/40 hover:text-ink disabled:opacity-60">
          {busy ? <Loader2 size={11} className="animate-spin" /> : enrichLabel}
        </button>
      )}
    </div>
  );
}
