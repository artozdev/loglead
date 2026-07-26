"use client";

import { ChevronDown, Loader2, Plus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { InboxPreviewItem, RecentLead } from "@/lib/home";
import { LEAD_CHANNELS, LEAD_STATUSES, type LeadChannel } from "@/lib/types";

// ---------------------------------------------------------------------------
// Dashboard acquisition row: "Inbox & DM" (60%) with an inline quick-reply bar,
// and "Leads récents" (40%). Both read real data; the quick reply hits the same
// LogReach endpoints as the full inbox.
// ---------------------------------------------------------------------------

const MSG_CHANNELS: { value: string; label: string }[] = [
  { value: "linkedin", label: "LinkedIn DM" },
  { value: "email", label: "Email" },
  { value: "x", label: "X DM" },
  { value: "reddit", label: "Reddit DM" },
  { value: "whatsapp", label: "WhatsApp" },
];

function channelColor(c: LeadChannel): string {
  return LEAD_CHANNELS.find((x) => x.value === c)?.dot ?? "#0051FF";
}

function avatarHue(name: string): number {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const h = avatarHue(name);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.36, backgroundColor: `hsl(${h} 60% 50% / 0.14)`, color: `hsl(${h} 60% 45%)` }}
    >
      {initials}
    </span>
  );
}

export default function DashboardInbox({
  items,
  unread,
  leads,
}: {
  items: InboxPreviewItem[];
  unread: number;
  leads: RecentLead[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [channel, setChannel] = useState("linkedin");
  const [switchOpen, setSwitchOpen] = useState(false);
  const [busy, setBusy] = useState<"gen" | "send" | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const active = items.find((i) => i.id === openId) ?? null;

  function toggle(id: string) {
    setOpenId((cur) => (cur === id ? null : id));
    setDraft("");
    setError(null);
    setSent(null);
  }

  async function generate() {
    if (!active || busy) return;
    setBusy("gen");
    setError(null);
    try {
      const res = await fetch("/api/inbox/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: active.id,
          channel: MSG_CHANNELS.find((m) => m.value === channel)?.label,
        }),
      });
      const d = await res.json();
      if (!res.ok) return setError(d.error ?? "Génération impossible.");
      setDraft(d.message);
    } finally {
      setBusy(null);
    }
  }

  async function send() {
    if (!active || busy || draft.trim().length < 2) return;
    setBusy("send");
    setError(null);
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: active.id, content: draft.trim(), channel }),
      });
      const d = await res.json();
      if (!res.ok) return setError(d.error ?? "L'envoi a échoué.");
      setDraft("");
      setSent(active.leadName);
      setOpenId(null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      {/* Inbox & DM */}
      <section className="rounded-xl border-[0.5px] border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
            Inbox &amp; DM
            {unread > 0 && (
              <span className="num rounded-full bg-danger px-1.5 py-0.5 text-[10px] font-bold text-white">{unread}</span>
            )}
          </h2>
          <Link href="/inbox" className="text-xs font-medium text-primary hover:underline">Voir tout →</Link>
        </div>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Aucun message pour l&apos;instant — publie du contenu pour recevoir tes premiers leads.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-line">
            {items.map((c) => (
              <div key={c.id}>
                <button
                  onClick={() => toggle(c.id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-1 py-2.5 text-left transition hover:bg-surface-hover ${openId === c.id ? "bg-primary/[0.04]" : ""}`}
                >
                  {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: channelColor(c.channel) }} title={c.channelLabel} />
                  <Avatar name={c.leadName} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-[13px] ${c.unread ? "font-semibold text-ink" : "font-medium text-ink"}`}>{c.leadName}</span>
                      <span className="shrink-0 text-[11px] text-faint">{c.time}</span>
                    </span>
                    <span className="mt-0.5 flex items-center gap-2">
                      <span className="truncate text-xs text-muted">{c.preview}</span>
                      {c.badge === "interested" && (
                        <span className="shrink-0 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">Intéressé</span>
                      )}
                      {c.badge === "followup" && (
                        <span className="shrink-0 rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">À relancer</span>
                      )}
                    </span>
                  </span>
                </button>

                {/* Quick reply bar */}
                {openId === c.id && (
                  <div className="mb-2 ml-1 rounded-xl border border-line bg-canvas p-2">
                    <p className="px-1 pb-1.5 text-[11px] text-muted">
                      Répondre à <span className="font-medium text-ink">{c.leadName}</span> via{" "}
                      <span className="font-medium text-ink">{MSG_CHANNELS.find((m) => m.value === channel)?.label}</span>
                    </p>
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => void generate()}
                        disabled={busy !== null}
                        title="Générer une réponse IA"
                        className={`flex shrink-0 items-center gap-1 rounded-lg border border-[#C7D7FF] bg-[#EEF4FF] px-2 py-1.5 text-[13px] font-medium text-primary hover:bg-primary/10 disabled:opacity-60 ${busy === "gen" ? "animate-pulse" : ""}`}
                      >
                        <Sparkles size={13} /> {busy === "gen" ? "…" : "IA"}
                      </button>
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={2}
                        placeholder="Écris ta réponse…"
                        className="min-h-[38px] flex-1 resize-y bg-transparent py-1 text-[13px] leading-relaxed outline-none placeholder:text-faint"
                      />
                      <div className="relative shrink-0">
                        <button onClick={() => setSwitchOpen(!switchOpen)} className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[12px] text-ink hover:bg-surface-hover">
                          {MSG_CHANNELS.find((m) => m.value === channel)?.label} <ChevronDown size={12} />
                        </button>
                        {switchOpen && (
                          <>
                            <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setSwitchOpen(false)} />
                            <div className="absolute right-0 top-full z-20 mt-1 w-[180px] rounded-xl border border-line bg-surface p-1 shadow-pop">
                              {MSG_CHANNELS.map((m) => (
                                <button
                                  key={m.value}
                                  onClick={() => { setChannel(m.value); setSwitchOpen(false); }}
                                  className={`block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] hover:bg-surface-hover ${m.value === channel ? "font-medium text-primary" : "text-ink"}`}
                                >
                                  {m.label}
                                </button>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                      <button onClick={() => void send()} disabled={busy !== null || draft.trim().length < 2} className="btn-primary shrink-0 !py-1.5 text-[13px]">
                        {busy === "send" ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                      </button>
                    </div>
                    {error && <p className="mt-1 px-1 text-xs text-danger">{error}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {sent && <p className="mt-2 text-xs text-success">Message envoyé à {sent} ✓</p>}
      </section>

      {/* Leads récents */}
      <section className="rounded-xl border-[0.5px] border-line bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Leads récents</h2>
          <div className="flex items-center gap-2">
            <Link href="/leads" className="text-xs font-medium text-primary hover:underline">Voir tous →</Link>
            <Link href="/leads" className="flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs text-muted hover:bg-surface-hover hover:text-ink">
              <Plus size={12} /> Ajouter
            </Link>
          </div>
        </div>

        {leads.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">
            Tes premiers leads apparaîtront ici dès ta première publication.
          </p>
        ) : (
          <div className="mt-3 divide-y divide-line">
            {leads.map((l) => {
              const st = LEAD_STATUSES.find((s) => s.value === l.status)!;
              return (
                <Link key={l.id} href="/leads" className="flex items-center gap-2.5 rounded-lg px-1 py-2.5 transition hover:bg-surface-hover">
                  <Avatar name={l.name} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{l.name}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 rounded-full bg-surface-hover px-1.5 py-0.5 text-[10px] font-medium text-muted">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: channelColor(l.channel) }} />
                        {l.channelLabel}
                      </span>
                      <span className={`inline-flex rounded-full border-[0.5px] px-1.5 py-0.5 text-[10px] font-medium ${st.cls}`}>{l.statusLabel}</span>
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
