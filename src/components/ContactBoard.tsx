"use client";

import Link from "next/link";
import { Info, Send, Sparkles, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import MessageComposer from "./MessageComposer";
import type { ContactStatus, Prospect } from "@/lib/types";

// Contact module — the prospects the user wants to reach out to. Not a full
// CRM: outreach tracking only. AI writes the message, user sends manually.

const STATUS_TABS: { id: ContactStatus; label: string }[] = [
  { id: "to_contact", label: "To contact" },
  { id: "message_sent", label: "Message sent" },
  { id: "replied", label: "Replied 💬" },
  { id: "meeting_booked", label: "Meeting booked" },
  { id: "converted", label: "Converted ✅" },
  { id: "not_interested", label: "Not interested" },
];

function heat(score: number) {
  if (score > 80) return { label: "Hot 🔥", cls: "bg-red-500/10 text-red-600" };
  if (score >= 60) return { label: "Warm", cls: "bg-amber-500/10 text-amber-600" };
  return { label: "Cold", cls: "bg-slate-500/10 text-slate-500" };
}

export default function ContactBoard({ prospects }: { prospects: Prospect[] }) {
  const [status, setStatus] = useState<ContactStatus>("to_contact");
  const [data, setData] = useState<Prospect[]>(prospects);
  const [openId, setOpenId] = useState<string | null>(null);

  const metrics = useMemo(() => ({
    toContact: data.filter((p) => (p.contactStatus ?? "to_contact") === "to_contact").length,
    contacted: data.filter((p) => p.contactStatus === "message_sent").length,
    replied: data.filter((p) => p.contactStatus === "replied").length,
    converted: data.filter((p) => p.contactStatus === "converted").length,
  }), [data]);

  const items = useMemo(
    () => data.filter((p) => (p.contactStatus ?? "to_contact") === status).sort((a, b) => b.fitScore - a.fitScore),
    [data, status],
  );

  async function markSent(id: string) {
    try {
      const res = await fetch(`/api/prospects/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contactStatus: "message_sent" }) });
      if (res.ok) {
        setData((list) => list.map((p) => (p.id === id ? { ...p, contactStatus: "message_sent" } : p)));
        setOpenId(null);
      }
    } catch { /* ignore */ }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-6 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-semibold text-ink">Contact</h1>
          <p className="text-[13px] text-muted">Leads you&apos;re ready to reach out to.</p>
        </div>
        <Link href="/leads" className="btn-secondary !py-2 text-[13px]">+ Add from Leads</Link>
      </div>

      {/* Metrics */}
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { k: "To contact", v: metrics.toContact },
          { k: "Contacted", v: metrics.contacted },
          { k: "Replied", v: metrics.replied },
          { k: "Converted", v: metrics.converted },
        ].map((c) => (
          <div key={c.k} className="card !p-4">
            <p className="text-[12px] font-medium text-muted">{c.k}</p>
            <p className="num mt-1 text-[24px] font-semibold text-ink">{c.v}</p>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-surface-hover/40 px-4 py-3 text-[13px] text-muted">
        <Info size={15} className="mt-0.5 shrink-0 text-primary" />
        <p>LogLead génère le message parfait. Tu l&apos;envoies depuis LinkedIn, Email ou WhatsApp. <span className="text-faint">L&apos;envoi automatique arrive en V1.2.</span></p>
      </div>

      {/* Status tabs */}
      <div className="mt-5 flex flex-wrap gap-1 border-b border-line">
        {STATUS_TABS.map((tt) => (
          <button
            key={tt.id}
            onClick={() => setStatus(tt.id)}
            className={`-mb-px border-b-2 px-3 py-2 text-[13px] transition ${status === tt.id ? "border-primary font-medium text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {tt.label}
          </button>
        ))}
      </div>

      {/* List / empty */}
      {items.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-line py-16 text-center">
          <Send size={24} className="text-primary" />
          <p className="mt-3 text-[15px] font-medium text-ink">Aucun prospect à contacter</p>
          <p className="mt-1 max-w-sm text-[13px] text-muted">Ajoute des prospects depuis Leads (« Add to Contact ») pour préparer ta prise de contact et générer des messages personnalisés.</p>
          <Link href="/leads" className="btn-primary mt-5 !py-2 text-[13px]"><Zap size={14} /> Voir mes leads</Link>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((p) => {
            const h = heat(p.fitScore);
            return (
              <div key={p.id} className="rounded-2xl border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-ink">{p.contactName ?? p.companyName}</div>
                    <div className="text-[12px] text-muted">{p.contactName ? p.companyName : p.companySector}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num text-[12px] font-semibold text-ink">● {p.fitScore}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${h.cls}`}>{h.label}</span>
                  </div>
                </div>
                {p.signalDescription && <p className="mt-2 text-[13px] text-muted">Signal : {p.signalDescription}</p>}
                {openId === p.id ? (
                  <div className="mt-3">
                    <MessageComposer prospectId={p.id} name={p.contactName ?? p.companyName} onMarkSent={() => markSent(p.id)} />
                  </div>
                ) : (
                  <div className="mt-3">
                    <button onClick={() => setOpenId(p.id)} className="btn-primary !py-1.5 text-[12px]"><Sparkles size={13} /> Generate message</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
