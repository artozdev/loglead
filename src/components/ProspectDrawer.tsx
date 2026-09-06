"use client";

import { ArrowUpRight, Check, ChevronDown, Copy, Loader2, Sparkles, X } from "lucide-react";
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

// ----- Copy formatters -----------------------------------------------------
function formatProfileText(p: Prospect): string {
  const line = "─".repeat(30);
  const rows = [
    p.contactName ?? p.companyName,
    p.contactName ? p.companyName : p.companySector ?? "",
    line,
    p.contactEmail ? `Email      : ${p.contactEmail}` : "",
    p.contactPhone ? `Phone      : ${p.contactPhone}` : "",
    p.contactLinkedinUrl ? `LinkedIn   : ${p.contactLinkedinUrl}` : "",
    p.companyDomain ? `Website    : ${p.companyDomain}` : "",
    line,
    `Company    : ${p.companyName}`,
    p.companySector ? `Sector     : ${p.companySector}` : "",
    p.companySize ? `Size       : ${p.companySize}` : "",
    p.companyLocation ? `Location   : ${p.companyLocation}` : "",
    line,
    `Fit Score  : ${p.fitScore}/100`,
    p.signalDescription ? `Signal     : ${p.signalDescription}` : "",
    `Source     : ${SOURCE_LABEL[p.source] ?? p.source}`,
    `Found      : ${new Date(p.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}`,
    line,
    "Found by LogLead · loglead.io",
  ];
  return rows.filter((r) => r.trim() !== "").join("\n");
}
function formatProfileCSV(p: Prospect): string {
  const headers = ["Name", "Email", "Phone", "Company", "LinkedIn", "Website", "City", "Sector", "Size", "Fit Score", "Signal", "Source", "Found Date"];
  const row = [
    p.contactName ?? p.companyName ?? "", p.contactEmail ?? "", p.contactPhone ?? "", p.companyName ?? "",
    p.contactLinkedinUrl ?? "", p.companyDomain ?? "", p.companyLocation ?? "", p.companySector ?? "",
    p.companySize ?? "", String(p.fitScore ?? ""), p.signalDescription ?? "", SOURCE_LABEL[p.source] ?? p.source,
    new Date(p.createdAt).toLocaleDateString("fr-FR"),
  ];
  const esc = (r: string[]) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",");
  return `${esc(headers)}\n${esc(row)}`;
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const scoreColor = p.fitScore > 80 ? "#10B981" : p.fitScore >= 60 ? "#F59E0B" : "#EF4444";

  async function copy(text: string, id?: string, toastMsg = "Copié !") {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    if (id) { setCopiedId(id); setTimeout(() => setCopiedId((c) => (c === id ? null : c)), 1500); }
    setToast(toastMsg);
    setTimeout(() => setToast((t) => (t === toastMsg ? null : t)), 1600);
  }

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

  const menu: { label: string; icon: string; run: () => void; disabled?: boolean }[] = [
    { label: "Copier le profil (texte)", icon: "📋", run: () => copy(formatProfileText(p), undefined, "Profil copié !") },
    { label: "Copier en tableau (CSV)", icon: "📊", run: () => copy(formatProfileCSV(p), undefined, "CSV copié !") },
    { label: "Copier le LinkedIn", icon: "🔗", run: () => copy(p.contactLinkedinUrl ?? "", undefined, "LinkedIn copié !"), disabled: !p.contactLinkedinUrl },
    { label: "Copier l'email", icon: "✉️", run: () => copy(p.contactEmail ?? "", undefined, "Email copié !"), disabled: !p.contactEmail },
    { label: "Copier le téléphone", icon: "📱", run: () => copy(p.contactPhone ?? "", undefined, "Téléphone copié !"), disabled: !p.contactPhone },
  ];

  return (
    <div className="fixed inset-0 z-[70]">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[420px] flex-col overflow-y-auto border-l border-line bg-surface shadow-pop">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Fermer"><X size={18} /></button>
          <div className="flex items-center gap-2">
            <div className="relative">
              <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-1 rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[12px] font-medium text-ink transition hover:bg-surface-hover">
                <Copy size={13} /> Copy <ChevronDown size={12} />
              </button>
              {menuOpen && (
                <>
                  <button className="fixed inset-0 z-[75] cursor-default" aria-hidden onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-[76] mt-1 w-56 rounded-xl border border-line bg-surface p-1 shadow-pop">
                    {menu.map((m) => (
                      <button key={m.label} disabled={m.disabled} onClick={() => { setMenuOpen(false); m.run(); }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-ink transition hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40">
                        <span>{m.icon}</span> {m.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {!p.inContact ? (
              <button onClick={() => patch({ inContact: true }, "contact")} disabled={busy === "contact"} className="btn-primary !py-1.5 text-[12px] disabled:opacity-60">
                {busy === "contact" ? <Loader2 size={13} className="animate-spin" /> : null} Add to Contact →
              </button>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success"><Check size={12} /> In Contact</span>
            )}
          </div>
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
              <ContactRow label="Email" value={p.contactEmail} onEnrich={enrich} busy={busy === "enrich"} enrichLabel="Find email" copiedId={copiedId} onCopy={copy} fieldId="email" />
              <ContactRow label="Phone" value={p.contactPhone} onEnrich={enrich} busy={busy === "enrich"} enrichLabel="Find phone" copiedId={copiedId} onCopy={copy} fieldId="phone" />
              {p.contactLinkedinUrl && (
                <div className="group/row flex items-center justify-between">
                  <span className="text-muted">Profil</span>
                  <span className="flex items-center gap-1">
                    <CopyBtn text={p.contactLinkedinUrl} id="linkedin" copiedId={copiedId} onCopy={copy} />
                    <a href={p.contactLinkedinUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary">Ouvrir <ArrowUpRight size={13} /></a>
                  </span>
                </div>
              )}
              {p.companyDomain && (
                <div className="group/row flex items-center justify-between">
                  <span className="text-muted">Website</span>
                  <span className="flex items-center gap-1">
                    <CopyBtn text={p.companyDomain} id="website" copiedId={copiedId} onCopy={copy} />
                    <a href={`https://${p.companyDomain}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary">{p.companyDomain} <ArrowUpRight size={13} /></a>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Company</p>
            <div className="mt-2 space-y-1.5 text-[13px]">
              <Row k="Company" v={p.companyName} id="company" copiedId={copiedId} onCopy={copy} />
              {p.companySector && <Row k="Sector" v={p.companySector} id="sector" copiedId={copiedId} onCopy={copy} />}
              {p.companySize && <Row k="Size" v={p.companySize} id="size" copiedId={copiedId} onCopy={copy} />}
              {p.companyLocation && <Row k="Location" v={p.companyLocation} id="location" copiedId={copiedId} onCopy={copy} />}
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
            <button onClick={() => copy(formatProfileText(p), undefined, "Profil copié !")} className="btn-secondary !py-2 text-[13px]"><Copy size={14} /> Copy profile</button>
          </div>
          {showComposer && <MessageComposer prospectId={p.id} name={p.contactName ?? p.companyName} />}
        </div>
      </aside>

      {/* Toast */}
      {toast && (
        <div className="pointer-events-none fixed bottom-5 right-5 z-[80] flex items-center gap-2 rounded-xl border border-[#22C55E]/40 bg-[#0D1526] px-3.5 py-2.5 text-[13px] font-medium text-[#22C55E] shadow-pop">
          <Check size={15} /> {toast}
        </div>
      )}
    </div>
  );
}

function CopyBtn({ text, id, copiedId, onCopy }: { text: string; id: string; copiedId: string | null; onCopy: (t: string, id?: string) => void }) {
  const done = copiedId === id;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onCopy(text, id); }}
      title="Copier"
      aria-label="Copier"
      className={`transition ${done ? "text-success opacity-100" : "text-faint opacity-0 hover:text-ink group-hover/row:opacity-100"}`}
    >
      {done ? <Check size={13} /> : <Copy size={13} />}
    </button>
  );
}

function Row({ k, v, id, copiedId, onCopy }: { k: string; v: string; id: string; copiedId: string | null; onCopy: (t: string, id?: string) => void }) {
  return (
    <div className="group/row flex items-center justify-between">
      <span className="text-muted">{k}</span>
      <span className="flex items-center gap-1.5"><CopyBtn text={v} id={id} copiedId={copiedId} onCopy={onCopy} /><span className="text-ink">{v}</span></span>
    </div>
  );
}

function ContactRow({ label, value, onEnrich, busy, enrichLabel, copiedId, onCopy, fieldId }: { label: string; value?: string | null; onEnrich: () => void; busy: boolean; enrichLabel: string; copiedId: string | null; onCopy: (t: string, id?: string) => void; fieldId: string }) {
  return (
    <div className="group/row flex items-center justify-between">
      <span className="text-muted">{label}</span>
      {value ? (
        <span className="flex items-center gap-1.5">
          <CopyBtn text={value} id={fieldId} copiedId={copiedId} onCopy={onCopy} />
          <span className="text-primary">{value}</span>
          <Check size={13} className="text-success" />
        </span>
      ) : (
        <button onClick={onEnrich} disabled={busy} className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-medium text-muted transition hover:border-primary/40 hover:text-ink disabled:opacity-60">
          {busy ? <Loader2 size={11} className="animate-spin" /> : enrichLabel}
        </button>
      )}
    </div>
  );
}
