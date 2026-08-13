"use client";

import {
  ArrowRight,
  Check,
  CheckCheck,
  ChevronDown,
  Circle,
  Clock,
  Copy,
  ExternalLink,
  Mail,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Smile,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EMOJIS } from "@/lib/emojis";
import {
  LEAD_CHANNELS,
  LEAD_STATUSES,
  type ConversationStatus,
  type InboxMessage,
  type LeadChannel,
  type LeadStatus,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// LogReach Inbox v2 — 3 columns: conversation list · active conversation ·
// lead detail. Channel tabs (by acquisition channel), AI reply generation, and
// a Claude-style channel switch. Email is the functional send channel in V1.
// ---------------------------------------------------------------------------

type Evt = { label: string; at: string };
type ConvLead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  linkedinUrl: string | null;
  channel: LeadChannel;
  status: LeadStatus;
  notes: string;
  sector: string | null;
  sourceTitle: string | null;
  segment: { id: string; name: string } | null;
  events: Evt[];
};
type Conv = {
  id: string;
  channel: "email" | "linkedin" | "reddit";
  status: ConversationStatus;
  lastMessageAt: string | null;
  createdAt: string;
  unread: boolean;
  lead: ConvLead;
  messages: InboxMessage[];
  preview: string | null;
};
type InboxData = {
  conversations: Conv[];
  channelCounts: Record<string, number>;
  unreadTotal: number;
  quota: number | null;
  contactableLeads: { id: string; firstName: string; lastName: string; email: string | null; company: string | null }[];
};

// Messaging channels for the composer switch — all active in V1. Email delivers
// via Resend; the others are recorded pending real delivery. Each channel drives
// the composer (placeholder, character limit, subject field, warning).
// V1 outreach channels: LinkedIn DM + Email only (X / Reddit / WhatsApp removed).
type MsgChannel = "linkedin" | "email";
const MSG_CHANNELS: {
  value: MsgChannel;
  label: string;
  placeholder: string;
  limit: number | null; // null = unlimited (Email)
  needsSubject: boolean;
  warning?: string;
}[] = [
  { value: "linkedin", label: "LinkedIn DM", placeholder: "Écris ton message LinkedIn…", limit: 1900, needsSubject: false },
  { value: "email", label: "Email", placeholder: "Écris ton email…", limit: null, needsSubject: true },
];

// Interest signals detected in the lead's last inbound message.
const POSITIVE = ["intéress", "en savoir plus", "quand peut", "dispo", "ok pour", "carré", "partant", "volontiers", "avec plaisir", "super", "top"];
const NEGATIVE = ["pas intéress", "non merci", "no merci", "pas le moment", "stop", "désabonn"];

function relTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "hier";
  if (d < 7) return `${d}j`;
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}
function daysSince(iso: string | null): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}
function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86_400_000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return "Aujourd'hui";
  if (same(d, yest)) return "Hier";
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}
function avatarHue(name: string): number {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const h = avatarHue(name);
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.34, backgroundColor: `hsl(${h} 60% 50% / 0.14)`, color: `hsl(${h} 60% 45%)` }}
    >
      {initials}
    </span>
  );
}
function ChannelDot({ channel }: { channel: LeadChannel }) {
  const c = LEAD_CHANNELS.find((x) => x.value === channel);
  if (!c) return null;
  return <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.dot }} title={c.label} />;
}
function StatusBadge({ status }: { status: LeadStatus }) {
  const s = LEAD_STATUSES.find((x) => x.value === status)!;
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full border-[0.5px] px-2 py-0.5 text-[10px] font-medium ${s.cls}`}>{s.label}</span>;
}

export default function InboxModule({ founderFirstName }: { founderFirstName: string }) {
  const [data, setData] = useState<InboxData | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [channelTab, setChannelTab] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Composer
  const [draft, setDraft] = useState("");
  const [draftIsAi, setDraftIsAi] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [variant, setVariant] = useState(0);
  const [sending, setSending] = useState(false);
  const [msgChannel, setMsgChannel] = useState<MsgChannel>("linkedin"); // LinkedIn DM by default
  const [subject, setSubject] = useState("");
  const [switchOpen, setSwitchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [emojiQuery, setEmojiQuery] = useState("");
  const [note, setNote] = useState("");
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/inbox");
    if (res.ok) setData(await res.json());
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const active = data?.conversations.find((c) => c.id === activeId) ?? null;

  useEffect(() => {
    setDraft("");
    setDraftIsAi(false);
    setVariant(0);
    setError(null);
    setNote(active?.lead.notes ?? "");
  }, [activeId, active?.lead.notes]);
  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [activeId, active?.messages.length]);

  const list = useMemo(() => {
    if (!data) return [];
    let l = data.conversations;
    if (channelTab !== "all") l = l.filter((c) => c.lead.channel === channelTab);
    if (unreadOnly) l = l.filter((c) => c.unread);
    if (starredOnly) l = l.filter((c) => starred.has(c.id));
    const q = search.toLowerCase().trim();
    if (q) l = l.filter((c) => `${c.lead.firstName} ${c.lead.lastName} ${c.lead.company ?? ""}`.toLowerCase().includes(q));
    return l;
  }, [data, channelTab, unreadOnly, starredOnly, starred, search]);

  const filteredEmojis = useMemo(() => {
    const q = emojiQuery.toLowerCase().trim();
    return q ? EMOJIS.filter((e) => e.keywords.includes(q)) : EMOJIS;
  }, [emojiQuery]);

  const chan = MSG_CHANNELS.find((m) => m.value === msgChannel)!;
  const draftLen = draft.length;
  const overLimit = chan.limit !== null && draftLen > chan.limit;

  // Pre-fill a subject when switching to a channel that needs one (Email/Reddit).
  useEffect(() => {
    if (chan.needsSubject && !subject && active) {
      setSubject(active.lead.sourceTitle ? `Suite à « ${active.lead.sourceTitle} »` : `Échange avec ${founderFirstName}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [msgChannel, activeId]);

  async function openConversation(leadId: string) {
    setError(null);
    const res = await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId }),
    });
    const d = await res.json();
    if (!res.ok) return setError(d.error ?? "Impossible d'ouvrir la conversation.");
    setPickerOpen(false);
    await load();
    setActiveId(d.conversation.id);
  }

  async function generate() {
    if (!active || generating) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/inbox/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: active.id, variant, channel: chan.label }),
      });
      const d = await res.json();
      if (!res.ok) return setError(d.error ?? "La génération a échoué.");
      setDraft(d.message);
      setDraftIsAi(true);
      setVariant(variant + 1);
      taRef.current?.focus();
    } finally {
      setGenerating(false);
    }
  }

  async function send() {
    if (!active || sending || draft.trim().length < 2) return;
    if (chan.needsSubject && msgChannel === "email" && !subject.trim()) {
      return setError("L'objet est obligatoire pour un email.");
    }
    if (overLimit) return setError(`Message trop long pour ${chan.label} (max ${chan.limit}).`);
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: active.id,
          content: draft.trim(),
          channel: msgChannel,
          subject: chan.needsSubject ? subject.trim() || undefined : undefined,
          isAiGenerated: draftIsAi,
        }),
      });
      const d = await res.json();
      if (!res.ok) return setError(d.error ?? "L'envoi a échoué.");
      setDraft("");
      setDraftIsAi(false);
      setVariant(0);
      await load();
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: LeadStatus) {
    if (!active) return;
    await fetch(`/api/leads/${active.lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }
  async function setConvStatus(status: ConversationStatus) {
    if (!active) return;
    setMenuOpen(false);
    await fetch(`/api/inbox/${active.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await load();
  }
  async function saveNote() {
    if (!active || note === active.lead.notes) return;
    await fetch(`/api/leads/${active.lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: note }),
    });
    void load();
  }

  function insertEmoji(ch: string) {
    const ta = taRef.current;
    if (!ta) { setDraft((d) => d + ch); return; }
    const s = ta.selectionStart;
    setDraft((d) => d.slice(0, s) + ch + d.slice(ta.selectionEnd));
    setEmojiOpen(false);
    setEmojiQuery("");
  }
  function toggleStar(id: string) {
    setStarred((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }

  // Interest signal from the lead's last inbound message.
  const lastInbound = active ? [...active.messages].reverse().find((m) => m.direction === "inbound") : null;
  const interest = lastInbound
    ? NEGATIVE.some((k) => lastInbound.content.toLowerCase().includes(k))
      ? "negative"
      : POSITIVE.some((k) => lastInbound.content.toLowerCase().includes(k))
        ? "positive"
        : null
    : null;
  const silentDays = active?.status === "waiting" ? daysSince(active.lastMessageAt) : 0;

  const isEmpty = data && data.conversations.length === 0 && data.contactableLeads.length === 0;

  const CHANNEL_TABS = [
    { value: "all", label: "Tous", count: data?.conversations.length ?? 0 },
    ...LEAD_CHANNELS.filter((c) => (data?.channelCounts[c.value] ?? 0) > 0 || c.value === "linkedin").map((c) => ({
      value: c.value,
      label: c.label,
      count: data?.channelCounts[c.value] ?? 0,
    })),
  ];

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-medium tracking-tight">LogReach</h1>
          <p className="mt-0.5 text-sm text-muted">Contacte tes leads directement depuis LogLead.</p>
        </div>
        <button onClick={() => setPickerOpen(true)} className="btn-primary !py-2 text-[13px]">
          <Plus size={14} /> Nouveau message
        </button>
      </div>

      {error && !active && <p className="text-sm text-danger">{error}</p>}

      {isEmpty ? (
        <EmptyState />
      ) : (
        data && (
          <div className="flex min-h-[560px] flex-1 overflow-hidden rounded-xl border-[0.5px] border-line bg-surface">
            {/* LEFT — conversation list */}
            <div className={`flex w-full flex-col border-r-[0.5px] border-line lg:w-[300px] ${active ? "hidden lg:flex" : ""}`}>
              {/* Channel tabs */}
              <div className="flex gap-1 overflow-x-auto border-b-[0.5px] border-line px-2 pt-2">
                {CHANNEL_TABS.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setChannelTab(t.value)}
                    className={`flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-[13px] transition ${
                      channelTab === t.value ? "border-primary font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    {t.value !== "all" && <ChannelDot channel={t.value as LeadChannel} />}
                    {t.label}
                    {t.count > 0 && t.value !== "all" && <span className="text-[10px] text-faint">{t.count}</span>}
                  </button>
                ))}
              </div>

              {/* Search + filters */}
              <div className="flex items-center gap-2 border-b-[0.5px] border-line p-2.5">
                <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-line bg-canvas px-2.5 py-1.5">
                  <Search size={13} className="shrink-0 text-muted" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher…" className="w-full bg-transparent text-[13px] outline-none placeholder:text-faint" />
                </div>
                <button onClick={() => setUnreadOnly((v) => !v)} title="Non lus" aria-label="Non lus" className={`flex h-8 w-8 items-center justify-center rounded-lg border ${unreadOnly ? "border-primary bg-primary/[0.06] text-primary" : "border-line text-muted hover:bg-surface-hover"}`}>
                  <Circle size={13} fill={unreadOnly ? "currentColor" : "none"} />
                </button>
                <button onClick={() => setStarredOnly((v) => !v)} title="Favoris" aria-label="Favoris" className={`flex h-8 w-8 items-center justify-center rounded-lg border ${starredOnly ? "border-primary bg-primary/[0.06] text-primary" : "border-line text-muted hover:bg-surface-hover"}`}>
                  <Star size={13} fill={starredOnly ? "currentColor" : "none"} />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                {list.map((c) => {
                  const name = `${c.lead.firstName} ${c.lead.lastName}`.trim();
                  const wDays = c.status === "waiting" ? daysSince(c.lastMessageAt) : 0;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`flex w-full items-start gap-2 border-b-[0.5px] border-line px-3 py-2.5 text-left transition ${
                        c.id === activeId ? "border-l-[3px] border-l-primary bg-primary/[0.06]" : "hover:bg-surface-hover"
                      }`}
                    >
                      {c.unread && <span className="mt-4 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      <Avatar name={name} size={36} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <ChannelDot channel={c.lead.channel} />
                            <span className={`truncate text-[13px] ${c.unread ? "font-semibold text-ink" : "font-medium text-ink"}`}>{name}</span>
                          </span>
                          <span className="shrink-0 text-[11px] text-faint">{relTime(c.lastMessageAt ?? c.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted">{c.preview ?? "Aucun message"}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <StatusBadge status={c.lead.status} />
                          {wDays >= 3 && (
                            <span className="rounded-full bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold text-warning">À relancer</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
                {list.length === 0 && <p className="p-6 text-center text-sm text-muted">Aucune conversation.</p>}
              </div>
            </div>

            {/* CENTER — active conversation */}
            <div className={`flex w-full flex-col lg:flex-1 ${active ? "flex" : "hidden lg:flex"}`}>
              {!active ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted">
                  Sélectionne une conversation à gauche, ou « Nouveau message ».
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b-[0.5px] border-line p-3">
                    <button onClick={() => setActiveId(null)} aria-label="Retour" className="text-muted hover:text-ink lg:hidden">←</button>
                    <Avatar name={`${active.lead.firstName} ${active.lead.lastName}`} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{active.lead.firstName} {active.lead.lastName}</p>
                      <p className="truncate text-xs text-muted">
                        {active.lead.company ?? "—"} · {LEAD_CHANNELS.find((x) => x.value === active.lead.channel)?.label}
                      </p>
                    </div>
                    <button onClick={() => toggleStar(active.id)} aria-label="Favori" className="rounded-lg p-1.5 text-muted hover:bg-surface-hover">
                      <Star size={16} fill={starred.has(active.id) ? "currentColor" : "none"} className={starred.has(active.id) ? "text-warning" : ""} />
                    </button>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(!menuOpen)} aria-label="Actions" className="rounded-lg p-1.5 text-muted hover:bg-surface-hover">
                        <MoreHorizontal size={16} />
                      </button>
                      {menuOpen && (
                        <>
                          <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setMenuOpen(false)} />
                          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-[10px] border border-line bg-surface p-1 shadow-pop">
                            <MenuBtn label="Marquer comme lu" onClick={() => setConvStatus("replied")} />
                            <MenuBtn label="Archiver" onClick={() => setConvStatus("resolved")} />
                            <Link href="/leads" className="block rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink hover:bg-surface-hover">Voir la fiche lead</Link>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Thread */}
                  <div ref={threadRef} className="flex-1 space-y-3 overflow-y-auto bg-canvas p-4">
                    {active.messages.length === 0 && (
                      <p className="py-8 text-center text-sm text-muted">Aucun message — écris le premier, ou laisse l&apos;IA le rédiger. ✨</p>
                    )}
                    {active.messages.map((m, i) => {
                      const prev = active.messages[i - 1];
                      const newDay = !prev || dayLabel(prev.sentAt) !== dayLabel(m.sentAt);
                      const mine = m.direction === "outbound";
                      return (
                        <div key={m.id}>
                          {newDay && (
                            <div className="my-3 flex items-center gap-3 text-[11px] text-faint">
                              <span className="h-px flex-1 bg-line" />{dayLabel(m.sentAt)}<span className="h-px flex-1 bg-line" />
                            </div>
                          )}
                          <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className="max-w-[78%]">
                              <div className={mine
                                ? "whitespace-pre-wrap rounded-xl rounded-br-[4px] bg-primary px-3.5 py-2.5 text-[13px] leading-relaxed text-white"
                                : "whitespace-pre-wrap rounded-xl rounded-bl-[4px] border border-line bg-surface px-3.5 py-2.5 text-[13px] leading-relaxed text-ink"}>
                                {m.content}
                              </div>
                              <p className={`mt-1 flex items-center gap-1 text-[11px] text-faint ${mine ? "justify-end" : ""}`}>
                                {new Date(m.sentAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                {mine && (m.readAt ? <CheckCheck size={12} className="text-primary" /> : <Check size={12} />)}
                                {m.isAiGenerated && " · ✨"}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Interest signal */}
                    {interest && (
                      <div className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] ${interest === "positive" ? "border-success/25 bg-success/5 text-success" : "border-danger/20 bg-danger/5 text-danger"}`}>
                        <span>{interest === "positive" ? "Ce lead semble intéressé" : "Ce lead ne semble pas intéressé"}</span>
                        <button onClick={() => setStatus(interest === "positive" ? "in_discussion" : "lost")} className="font-medium underline">
                          Mettre à jour le statut
                        </button>
                      </div>
                    )}
                    {/* Follow-up reminder */}
                    {silentDays >= 3 && !interest && (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-warning/25 bg-warning/5 px-3.5 py-2.5 text-[13px] text-warning">
                        <span className="flex items-center gap-2"><Clock size={14} /> Pas de réponse depuis {silentDays} jours</span>
                        <button onClick={() => void generate()} className="font-medium underline">Envoyer une relance</button>
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <div className="border-t-[0.5px] border-line p-3">
                    <div className="rounded-xl border border-line bg-canvas p-2">
                      {/* Subject line — Email */}
                      {chan.needsSubject && (
                        <input
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="Objet…"
                          className="mb-1.5 w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] font-medium outline-none placeholder:font-normal placeholder:text-faint focus:border-primary"
                        />
                      )}
                      <div className="flex items-start gap-2">
                        <button
                          onClick={() => void generate()}
                          disabled={generating}
                          title="Générer une réponse IA"
                          className={`flex shrink-0 items-center gap-1 rounded-lg border border-[#C7D7FF] bg-[#EEF4FF] px-2.5 py-1.5 text-[13px] font-medium text-primary transition hover:bg-primary/10 disabled:opacity-60 ${generating ? "animate-pulse" : ""}`}
                        >
                          <Sparkles size={14} /> {generating ? "…" : draftIsAi ? "Régénérer" : "IA"}
                        </button>
                        <textarea
                          ref={taRef}
                          value={draft}
                          onChange={(e) => { setDraft(e.target.value); setDraftIsAi(false); }}
                          rows={2}
                          placeholder={chan.placeholder}
                          className="min-h-[40px] flex-1 resize-y bg-transparent py-1.5 text-[13px] leading-relaxed outline-none placeholder:text-faint"
                        />
                        {/* Channel switch — all channels active */}
                        <div className="relative shrink-0">
                          <button onClick={() => setSwitchOpen(!switchOpen)} className="flex items-center gap-1 rounded-lg border border-line px-2 py-1.5 text-[13px] text-ink hover:bg-surface-hover">
                            {chan.label} <ChevronDown size={13} />
                          </button>
                          {switchOpen && (
                            <>
                              <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setSwitchOpen(false)} />
                              <div className="absolute bottom-full right-0 z-20 mb-1 w-[220px] rounded-xl border border-line bg-surface p-1 shadow-pop">
                                <p className="px-2.5 py-1.5 text-[11px] font-medium text-muted">Répondre via</p>
                                {MSG_CHANNELS.map((m) => {
                                  const on = m.value === msgChannel;
                                  return (
                                    <button
                                      key={m.value}
                                      onClick={() => { setMsgChannel(m.value); setSwitchOpen(false); }}
                                      className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink transition hover:bg-surface-hover"
                                    >
                                      <span className="flex items-center gap-2">
                                        {on ? <Check size={13} className="text-primary" /> : <span className="w-[13px]" />}
                                        {m.label}
                                      </span>
                                      {on && <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-semibold text-success">Actif</span>}
                                    </button>
                                  );
                                })}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      {error && <p className="mt-1 px-1 text-xs text-danger">{error}</p>}
                      {/* Toolbar */}
                      <div className="relative mt-1 flex items-center gap-1 border-t border-line pt-1.5">
                        {msgChannel === "email" && (
                          <button title="Joindre un fichier" aria-label="Joindre" onClick={() => alert("Pièce jointe — PDF/image sur Email.")} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface-hover">
                            <Paperclip size={15} />
                          </button>
                        )}
                        <button title="Emoji" aria-label="Emoji" onClick={() => setEmojiOpen((v) => !v)} className={`flex h-8 w-8 items-center justify-center rounded-lg ${emojiOpen ? "bg-primary/10 text-primary" : "text-muted hover:bg-surface-hover"}`}>
                          <Smile size={15} />
                        </button>
                        <span className={`num ml-2 text-[11px] ${overLimit ? "font-semibold text-danger" : "text-faint"}`}>
                          {chan.limit === null ? `${draftLen} · illimité` : `${draftLen} / ${chan.limit}`}
                        </span>
                        <button onClick={() => void send()} disabled={sending || draft.trim().length < 2 || overLimit} className="btn-primary ml-auto !py-1.5 text-[13px]">
                          {sending ? "…" : <><Send size={13} /> Envoyer</>}
                        </button>
                        {emojiOpen && (
                          <div className="absolute bottom-[46px] left-0 z-30 w-[300px] rounded-xl border-[0.5px] border-line bg-surface p-2.5 shadow-pop">
                            <input autoFocus value={emojiQuery} onChange={(e) => setEmojiQuery(e.target.value)} placeholder="Rechercher…" className="mb-2 w-full rounded-lg border-[1.5px] border-primary px-2.5 py-1.5 text-[13px] outline-none" />
                            <div className="grid max-h-40 grid-cols-8 gap-1 overflow-y-auto">
                              {filteredEmojis.map((e) => (
                                <button key={e.char} onClick={() => insertEmoji(e.char)} className="rounded-md p-1 text-lg hover:bg-surface-hover">{e.char}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* RIGHT — lead detail */}
            {active && (
              <div className="hidden w-[280px] shrink-0 flex-col overflow-y-auto border-l-[0.5px] border-line bg-surface p-4 xl:flex">
                <div className="flex flex-col items-center text-center">
                  <Avatar name={`${active.lead.firstName} ${active.lead.lastName}`} size={48} />
                  <p className="mt-2 text-sm font-semibold text-ink">{active.lead.firstName} {active.lead.lastName}</p>
                  <p className="text-xs text-muted">{active.lead.company ?? "—"}</p>
                  {active.lead.sourceTitle && <p className="mt-1 text-[11px] text-faint">Venu depuis : « {active.lead.sourceTitle} »</p>}
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-[11px] font-medium text-muted">Statut</label>
                  <select value={active.lead.status} onChange={(e) => void setStatus(e.target.value as LeadStatus)} className="input !py-1.5 text-[13px]">
                    {LEAD_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <Section title="Contact">
                  <Row label="Email" value={active.lead.email} copyable />
                  <Row label="LinkedIn" value={active.lead.linkedinUrl} link />
                  <Row label="Téléphone" value={active.lead.phone} />
                </Section>

                {active.lead.segment && (
                  <Section title="Segment">
                    <Link href={`/leads/segments/${active.lead.segment.id}`} className="inline-flex rounded-full bg-primary/[0.06] px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10">
                      {active.lead.segment.name}
                    </Link>
                  </Section>
                )}

                <Section title="Note">
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveNote} rows={2} placeholder="Ajouter une note…" className="w-full resize-y rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-[13px] outline-none placeholder:text-faint focus:border-primary" />
                </Section>

                <Section title="Historique">
                  <ol className="space-y-1.5">
                    {active.lead.events.map((e, i) => (
                      <li key={i} className="flex gap-2 text-[12px]">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                        <span className="text-ink/80">{e.label}<span className="ml-1 text-faint">· {new Date(e.at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span></span>
                      </li>
                    ))}
                    {active.lead.events.length === 0 && <li className="text-xs text-muted">Aucun événement.</li>}
                  </ol>
                </Section>

                <Link href="/leads" className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-line py-2 text-[13px] text-muted hover:bg-surface-hover hover:text-ink">
                  Voir la fiche complète <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        )
      )}

      {/* New message picker */}
      {pickerOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button aria-label="Fermer" onClick={() => setPickerOpen(false)} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
          <div className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-line bg-surface p-5 shadow-pop">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold">Nouveau message</h2>
              <button onClick={() => setPickerOpen(false)} aria-label="Fermer" className="text-muted hover:text-ink"><X size={16} /></button>
            </div>
            <p className="mt-1 text-[13px] text-muted">Choisis le lead à contacter (email requis).</p>
            <div className="mt-3 flex-1 divide-y divide-line overflow-y-auto">
              {data.contactableLeads.map((l) => {
                const name = `${l.firstName} ${l.lastName}`.trim();
                return (
                  <button key={l.id} onClick={() => void openConversation(l.id)} className="flex w-full items-center gap-2.5 px-1 py-2.5 text-left hover:bg-surface-hover">
                    <Avatar name={name} size={32} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-ink">{name}</span>
                      <span className="block truncate text-xs text-muted">{l.company ? `${l.company} · ` : ""}{l.email}</span>
                    </span>
                  </button>
                );
              })}
              {data.contactableLeads.length === 0 && (
                <p className="py-6 text-center text-sm text-muted">Tous tes leads avec email ont déjà une conversation. <Link href="/leads" className="font-medium text-primary">Ajouter un lead →</Link></p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return <button onClick={onClick} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink hover:bg-surface-hover">{label}</button>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 border-t-[0.5px] border-line pt-3">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">{title}</p>
      {children}
    </div>
  );
}

function Row({ label, value, copyable, link }: { label: string; value: string | null; copyable?: boolean; link?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 py-0.5 text-[12px]">
      <span className="text-muted">{label}</span>
      {value ? (
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate text-ink">{link ? value.replace(/^https?:\/\//, "") : value}</span>
          {copyable && (
            <button onClick={() => navigator.clipboard.writeText(value)} aria-label="Copier" className="shrink-0 text-faint hover:text-ink"><Copy size={11} /></button>
          )}
          {link && (
            <a href={value.startsWith("http") ? value : `https://${value}`} target="_blank" rel="noreferrer" aria-label="Ouvrir" className="shrink-0 text-faint hover:text-ink"><ExternalLink size={11} /></a>
          )}
        </span>
      ) : (
        <span className="text-faint">—</span>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-xl border-[0.5px] border-line bg-surface px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/[0.07] text-primary"><Mail size={24} /></span>
      <p className="mt-4 font-display text-base font-semibold text-ink">Aucun lead à contacter</p>
      <p className="mt-1 max-w-md text-sm text-muted">Tes prospects apparaîtront ici dès qu&apos;ils interagissent avec ton contenu.</p>
      <Link href="/studio" className="btn-primary mt-5 text-[13px]">Ouvrir le Studio IA <ArrowRight size={13} /></Link>
    </div>
  );
}
