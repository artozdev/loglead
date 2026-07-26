"use client";

import {
  ArrowUp,
  AudioLines,
  Clock,
  ExternalLink,
  ImageIcon,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type AgentMessage, type AgentPayload } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

const SUGGESTION_KEYS = [
  "agent.suggest.prospects",
  "agent.suggest.strategy",
  "agent.suggest.message",
  "agent.suggest.pipeline",
];
import Logo from "./Logo";

// ---------------------------------------------------------------------------
// LogAgent — full-width conversational CMO. Empty state (logo + greeting +
// suggestion pills + composer), then the conversation view. Structured payloads
// (leads / messages / content / report) render as cards under the reply.
// ---------------------------------------------------------------------------

type HistoryItem = { id: string; title: string; preview: string; updatedAt: string };
export type Attachment = { name: string; dataUrl: string };

const nf = new Intl.NumberFormat("fr-FR");

export default function LogAgentBoard({
  firstName,
  initialCredits,
}: {
  firstName: string;
  initialCredits: { used: number; quota: number };
}) {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [credits, setCredits] = useState(initialCredits);
  const { t } = useLocale();
  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "agent.morning" : hour < 18 ? "agent.afternoon" : "agent.evening";
  const [error, setError] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [image, setImage] = useState<Attachment | null>(null);
  // Thumbnails of images the founder attached, keyed by message id (session-only).
  const [sentImages, setSentImages] = useState<Record<string, string>>({});
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const started = messages.length > 0 || thinking;

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  async function send(text: string) {
    const typed = text.trim();
    if ((!typed && !image) || thinking) return;
    // The image travels as a mention so the agent can acknowledge it.
    const content = image ? `${typed || "Analyse cette image"} [Image jointe : ${image.name}]` : typed;
    const tmpId = `tmp-${Date.now()}`;
    setError(null);
    setInput("");
    if (image) setSentImages((s) => ({ ...s, [tmpId]: image.dataUrl }));
    setImage(null);
    // Optimistic user bubble.
    setMessages((m) => [
      ...m,
      { id: tmpId, conversationId: conversationId ?? "", role: "user", content, credits: 0, createdAt: new Date().toISOString() },
    ]);
    setThinking(true);
    try {
      const res = await fetch("/api/logagent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: content }),
      });
      const d = await res.json();
      if (!res.ok) {
        setError(d.error ?? "LogAgent n'a pas pu répondre.");
        if (d.credits) setCredits(d.credits);
        return;
      }
      setConversationId(d.conversationId);
      setMessages((m) => [...m, d.message]);
      setCredits(d.credits);
    } catch {
      setError("Connexion impossible. Réessaie.");
    } finally {
      setThinking(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setConversationId(null);
    setInput("");
    setError(null);
    taRef.current?.focus();
  }

  async function openHistory() {
    setHistoryOpen(true);
    const res = await fetch("/api/logagent");
    if (res.ok) {
      const d = await res.json();
      setHistory(d.conversations ?? []);
      setCredits(d.credits);
    }
  }

  async function loadConversation(id: string) {
    const res = await fetch(`/api/logagent?conversationId=${id}`);
    if (!res.ok) return;
    const d = await res.json();
    setMessages(d.messages);
    setConversationId(id);
    setHistoryOpen(false);
  }

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col bg-canvas">
      {/* Header — credits + actions */}
      <div className="flex flex-wrap items-center justify-end gap-2 px-2 py-2">
        <span className="num mr-1 text-[12px] text-muted">
          {t("agent.credits", { used: nf.format(credits.used), quota: nf.format(credits.quota) })}
        </span>
        <button
          onClick={newConversation}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink transition hover:bg-surface-hover"
        >
          <Plus size={13} /> {t("agent.newConversation")}
        </button>
        <button
          onClick={openHistory}
          className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] text-ink transition hover:bg-surface-hover"
        >
          <Clock size={13} /> {t("agent.history")}
        </button>
      </div>

      {/* Body */}
      {!started ? (
        /* ----- Empty state ----- */
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <Logo size={56} className="rounded-[12px]" />
          <h1 className="mt-4 text-center font-display text-[21px] font-medium tracking-tight text-ink">
            {t(greetingKey)}, {firstName}.
          </h1>
          <p className="mt-1 text-center text-[15px] text-muted">{t("agent.growPrompt")}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {SUGGESTION_KEYS.map((k) => (
              <button
                key={k}
                onClick={() => { setInput(t(k)); taRef.current?.focus(); }}
                className="rounded-full border-[0.5px] border-line bg-surface px-3 py-1 text-[12px] text-ink transition hover:bg-surface-hover"
              >
                {t(k)}
              </button>
            ))}
          </div>
          <div className="mt-5 w-full max-w-[680px]">
            <Composer
              value={input}
              onChange={setInput}
              onSend={() => send(input)}
              disabled={thinking}
              taRef={taRef}
              image={image}
              onImage={setImage}
              onClearImage={() => setImage(null)}
            />
            {error && <p className="mt-2 text-center text-sm text-danger">{error}</p>}
          </div>
        </div>
      ) : (
        /* ----- Conversation ----- */
        <>
          <div ref={threadRef} className="flex-1 overflow-y-auto px-4">
            <div className="mx-auto max-w-[680px] space-y-5 py-4">
              {messages.map((m) =>
                m.role === "user" ? (
                  <div key={m.id} className="flex justify-end">
                    <div className="max-w-[80%] rounded-xl rounded-br-[4px] border-[0.5px] border-line bg-surface px-3 py-2 text-[13.5px] text-ink">
                      {sentImages[m.id] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={sentImages[m.id]} alt="Image jointe" className="mb-1.5 max-h-40 rounded-lg object-cover" />
                      )}
                      {m.content.replace(/\s*\[Image jointe : [^\]]+\]/, "")}
                    </div>
                  </div>
                ) : (
                  <div key={m.id} className="flex gap-2.5">
                    <Logo size={28} className="mt-0.5 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-2.5">
                      {m.reasoning && <Reasoning text={m.reasoning} />}
                      {m.payload && <PayloadCard payload={m.payload} />}
                      <div className="whitespace-pre-wrap text-[13.5px] leading-[1.65] text-ink">
                        {renderBold(m.content)}
                      </div>
                    </div>
                  </div>
                ),
              )}
              {thinking && (
                <div className="flex gap-2.5">
                  <Logo size={28} className="mt-0.5 shrink-0 rounded-lg" />
                  <p className="pt-0.5 text-[13.5px] text-muted">
                    Réflexion en cours<span className="animate-pulse">…</span>
                  </p>
                </div>
              )}
              {error && <p className="text-sm text-danger">{error}</p>}
            </div>
          </div>
          {/* Compact composer, pinned at the bottom */}
          <div className="px-4 pb-3">
            <div className="mx-auto w-full max-w-[680px]">
              <Composer
                value={input}
                onChange={setInput}
                onSend={() => send(input)}
                disabled={thinking}
                taRef={taRef}
                compact
                image={image}
                onImage={setImage}
                onClearImage={() => setImage(null)}
              />
            </div>
          </div>
        </>
      )}

      {/* History drawer */}
      {historyOpen && (
        <div className="fixed inset-0 z-50">
          <button aria-label="Fermer" onClick={() => setHistoryOpen(false)} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-line bg-surface shadow-pop">
            <div className="flex items-center justify-between border-b-[0.5px] border-line px-5 py-4">
              <h2 className="font-display text-base font-semibold">Historique</h2>
              <button onClick={() => setHistoryOpen(false)} aria-label="Fermer" className="text-muted hover:text-ink">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 divide-y divide-line overflow-y-auto">
              {history.map((h) => (
                <button
                  key={h.id}
                  onClick={() => loadConversation(h.id)}
                  className="block w-full px-5 py-3 text-left transition hover:bg-surface-hover"
                >
                  <span className="block text-[11px] text-faint">
                    {new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }).format(new Date(h.updatedAt))}
                  </span>
                  <span className="mt-0.5 block truncate text-[13px] text-ink">{h.preview}</span>
                </button>
              ))}
              {history.length === 0 && <p className="p-6 text-center text-sm text-muted">Aucune conversation.</p>}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// ----- Composer ---------------------------------------------------------------

function Composer({
  value,
  onChange,
  onSend,
  disabled,
  taRef,
  compact = false,
  image,
  onImage,
  onClearImage,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
  taRef: React.RefObject<HTMLTextAreaElement | null>;
  compact?: boolean; // bottom bar during a conversation — tighter
  image: Attachment | null;
  onImage: (a: Attachment) => void;
  onClearImage: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { listening, supported, toggle } = useDictation(
    (text) => onChange(value ? `${value} ${text}` : text),
  );

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onImage({ name: file.name, dataUrl: String(reader.result) });
    reader.readAsDataURL(file);
    e.target.value = ""; // allow re-picking the same file
  }

  return (
    <div className={`rounded-[12px] border border-line bg-surface shadow-sm ${compact ? "p-2.5" : "p-3.5"}`}>
      {/* Attached image preview */}
      {image && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-line bg-canvas p-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.dataUrl} alt={image.name} className="h-10 w-10 rounded object-cover" />
          <span className="min-w-0 flex-1 truncate text-[12px] text-muted">{image.name}</span>
          <button onClick={onClearImage} aria-label="Retirer l'image" className="text-muted hover:text-ink">
            <X size={14} />
          </button>
        </div>
      )}
      <textarea
        ref={taRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSend();
          }
        }}
        rows={compact ? 1 : 2}
        placeholder={listening ? "Parle, je t'écoute…" : "Saisisez votre demande ..."}
        className={`w-full resize-none bg-transparent leading-relaxed outline-none placeholder:text-faint ${
          compact ? "min-h-[28px] text-[14px]" : "min-h-[42px] text-[14px]"
        }`}
      />
      <div className="mt-1 flex items-center">
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          title="Joindre une image"
          aria-label="Joindre une image"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-surface-hover hover:text-ink"
        >
          <ImageIcon size={16} />
        </button>
        <span className="ml-auto flex items-center gap-1">
          <button
            onClick={toggle}
            title={supported ? (listening ? "Arrêter la dictée" : "Dicter") : "Dictée non supportée par ce navigateur"}
            aria-label="Dicter"
            aria-pressed={listening}
            className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
              listening ? "animate-pulse bg-danger/10 text-danger" : "text-muted hover:bg-surface-hover hover:text-ink"
            } ${supported ? "" : "opacity-40"}`}
          >
            <AudioLines size={16} />
          </button>
          <button
            onClick={onSend}
            disabled={disabled || (!value.trim() && !image)}
            aria-label="Envoyer"
            className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white transition hover:brightness-110 disabled:opacity-40"
          >
            {disabled ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={15} />}
          </button>
        </span>
      </div>
    </div>
  );
}

// ----- Speech-to-text (Web Speech API) ----------------------------------------

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function useDictation(onText: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    setSupported(Boolean(w.SpeechRecognition || w.webkitSpeechRecognition));
  }, []);

  function toggle() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      alert("La dictée vocale n'est pas supportée par ce navigateur (essaie Chrome).");
      return;
    }
    if (listening) {
      recRef.current?.stop();
      setListening(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = "fr-FR";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = Array.from({ length: e.results.length }, (_, i) => e.results[i][0].transcript)
        .join(" ")
        .trim();
      if (transcript) onText(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  return { listening, supported, toggle };
}

// ----- Agent reflection -------------------------------------------------------

// Shown above every answer: what the agent actually looked at to reply.
function Reasoning({ text }: { text: string }) {
  return (
    <p className="flex items-start gap-1.5 rounded-lg border-[0.5px] border-line bg-canvas px-2.5 py-1.5 text-[11.5px] leading-snug text-muted">
      <Sparkles size={12} className="mt-0.5 shrink-0 text-primary" />
      <span>{text}</span>
    </p>
  );
}

// ----- Structured payload cards -----------------------------------------------

function PayloadCard({ payload }: { payload: AgentPayload }) {
  if (!payload) return null;

  if (payload.kind === "leads" || payload.kind === "messages") {
    const href = payload.kind === "messages" ? "/inbox" : "/leads";
    return (
      <div className="overflow-hidden rounded-[10px] border-[0.5px] border-line bg-surface">
        {payload.items.map((it, i) => (
          <div key={it.id} className={`flex items-center gap-3 px-3.5 py-3 ${i > 0 ? "border-t-[0.5px] border-line" : ""}`}>
            <Avatar name={it.name} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="truncate text-[13px] font-medium text-ink">{it.name}</span>
                {it.unread > 0 && (
                  <span className="rounded-full bg-[#1A1A1A] px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {it.unread} non lu
                  </span>
                )}
              </div>
              <p className="truncate text-[13px] text-muted">{it.subtitle}</p>
            </div>
            <span className="shrink-0 whitespace-nowrap text-[11px] text-faint">{it.date}</span>
            <Link href={href} aria-label="Ouvrir" className="shrink-0 text-muted hover:text-ink">
              <ExternalLink size={16} />
            </Link>
          </div>
        ))}
      </div>
    );
  }

  if (payload.kind === "content") {
    return (
      <div className="rounded-[10px] border-[0.5px] border-line bg-surface p-4">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-faint">{payload.platform}</p>
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{payload.body}</p>
        <div className="mt-3 flex flex-wrap gap-2 border-t-[0.5px] border-line pt-3">
          <Link href="/studio" className="btn-secondary !py-1.5 text-[13px]">Modifier</Link>
          <Link href="/calendar" className="btn-secondary !py-1.5 text-[13px]">Ajouter au calendrier</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border-[0.5px] border-line bg-surface">
      {payload.rows.map((r, i) => (
        <div key={r.label} className={`flex items-center justify-between gap-3 px-3.5 py-2.5 ${i > 0 ? "border-t-[0.5px] border-line" : ""}`}>
          <span className="text-[13px] text-muted">{r.label}</span>
          <span className="num text-[13px] font-medium text-ink">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360;
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold"
      style={{ backgroundColor: `hsl(${h} 60% 50% / 0.14)`, color: `hsl(${h} 60% 45%)` }}
    >
      {initials}
    </span>
  );
}

// Render **bold** segments from the agent's markdown-ish output.
function renderBold(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i} className="font-semibold text-ink">{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  );
}
