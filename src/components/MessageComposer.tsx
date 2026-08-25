"use client";

import { Check, Copy, Loader2, RotateCcw, Sparkles } from "lucide-react";
import { useState } from "react";

type Channel = "linkedin" | "email" | "whatsapp";
const CHANNELS: { id: Channel; label: string }[] = [
  { id: "linkedin", label: "🔵 LinkedIn DM" },
  { id: "email", label: "✉️ Email" },
  { id: "whatsapp", label: "💬 WhatsApp" },
];

// Inline message composer used by the prospect drawer and the Contact list.
export default function MessageComposer({
  prospectId,
  name,
  onMarkSent,
}: {
  prospectId: string;
  name: string;
  onMarkSent?: () => Promise<void> | void;
}) {
  const [channel, setChannel] = useState<Channel>("linkedin");
  const [msg, setMsg] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function generate() {
    setBusy(true); setErr(null);
    try {
      const res = await fetch(`/api/prospects/${prospectId}/message`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channel }),
      });
      const d = await res.json();
      if (res.status === 402) { window.dispatchEvent(new CustomEvent("loglead:insufficient-credits", { detail: d })); return; }
      if (!res.ok) { setErr(d.error ?? "Génération impossible."); return; }
      setMsg(d.message); setScore(d.score); setReasons(d.reasons ?? []);
      window.dispatchEvent(new CustomEvent("loglead:credits-changed"));
    } catch { setErr("Connexion impossible."); } finally { setBusy(false); }
  }

  function copy() {
    if (!msg) return;
    navigator.clipboard?.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-line bg-canvas p-4">
      {!msg ? (
        <div className="flex flex-wrap items-center gap-2">
          <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] text-ink outline-none">
            {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <button onClick={generate} disabled={busy} className="btn-primary !py-1.5 text-[13px] disabled:opacity-60">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Generate message
          </button>
          {err && <span className="text-[12px] text-danger">{err}</span>}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[12px] font-medium text-primary"><Sparkles size={13} /> Message pour {name}</div>
            <select value={channel} onChange={(e) => setChannel(e.target.value as Channel)} className="rounded-lg border border-line bg-surface px-2 py-1 text-[12px] text-ink outline-none">
              {CHANNELS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={7} className="mt-3 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-[13px] leading-relaxed text-ink outline-none" />
          {score != null && (
            <div className="mt-2 text-[12px] text-muted">
              <span className="font-semibold text-ink">Score : {score}/100</span>
              <ul className="mt-1 space-y-0.5">{reasons.map((r, i) => <li key={i}>→ {r}</li>)}</ul>
            </div>
          )}
          {err && <p className="mt-2 text-[12px] text-danger">{err}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={copy} className="btn-secondary !py-1.5 text-[12px]">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copié" : "Copy"}</button>
            <button onClick={generate} disabled={busy} className="btn-secondary !py-1.5 text-[12px] disabled:opacity-60">{busy ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />} Regenerate</button>
            {onMarkSent && (
              <button
                onClick={async () => { setSending(true); await onMarkSent(); setSending(false); }}
                disabled={sending}
                className="btn-primary !py-1.5 text-[12px] disabled:opacity-60"
              >
                {sending ? <Loader2 size={13} className="animate-spin" /> : null} Mark as sent →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
