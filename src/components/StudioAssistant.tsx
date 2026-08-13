"use client";

import {
  Bold,
  CalendarClock,
  CalendarPlus,
  Check,
  Clock,
  Copy,
  ExternalLink,
  History,
  Image as ImageIcon,
  List,
  Loader2,
  RotateCcw,
  Shuffle,
  Smile,
  Sparkles,
  ThumbsUp,
  MessageSquare,
  Repeat2,
  Send,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

type Brand = { saas: string; icp: string; niche: string; tone: string };

type HistoryItem = {
  id: string;
  title: string;
  body: string;
  status: "draft" | "scheduled" | "published";
  scheduledDate: string | null;
  scheduledTime: string | null;
  createdAt: string;
};

const LINKEDIN_FORMAT = "Post texte";

const IMPROVE_TOOLS = [
  { icon: "✏️", key: "postgen.tool.expand", tool: "expand" },
  { icon: "⚡", key: "postgen.tool.hook", tool: "hook" },
  { icon: "✂️", key: "postgen.tool.concise", tool: "concise" },
  { icon: "🎯", key: "postgen.tool.optimise", tool: "optimise" },
  { icon: "✔️", key: "postgen.tool.grammar", tool: "grammar" },
  { icon: "🔥", key: "postgen.tool.punchy", tool: "optimise" },
] as const;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Soonest future slot among the recommended publish hours (Algo heuristic).
function nextOptimal(): { date: string; time: string } {
  const now = new Date();
  for (const h of [8, 12, 18]) {
    if (now.getHours() < h) return { date: ymd(now), time: `${pad(h)}:00` };
  }
  const t = new Date(now);
  t.setDate(t.getDate() + 1);
  return { date: ymd(t), time: "08:00" };
}

function initials(s: string): string {
  const p = s.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || (s[0] ?? "?").toUpperCase();
}

export default function StudioAssistant({
  brand,
  initialAngle,
  initialGenerated,
  firstName,
  editingId,
  history,
}: {
  brand: Brand;
  initialAngle?: string;
  initialGenerated?: boolean; // loaded an existing post → open as an editable result
  firstName: string;
  editingId?: string | null;
  history?: HistoryItem[];
}) {
  const { t } = useLocale();

  const [text, setText] = useState(initialAngle ?? "");
  const [brief, setBrief] = useState(initialGenerated ? initialAngle ?? "" : "");
  const [language, setLanguage] = useState("fr");
  const [generated, setGenerated] = useState(Boolean(initialGenerated));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [improveOpen, setImproveOpen] = useState(false);

  // Scheduling + history
  const [currentId, setCurrentId] = useState<string | null>(editingId ?? null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const opt = nextOptimal();
  const [date, setDate] = useState(opt.date);
  const [time, setTime] = useState(opt.time);
  const [saved, setSaved] = useState<{ msg: string; cal: boolean } | null>(null);

  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the editor.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(140, ta.scrollHeight)}px`;
  }, [text]);

  // Close overlays on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setScheduleOpen(false);
        setHistOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function insertAtCursor(before: string, after = "") {
    const ta = taRef.current;
    if (!ta) return setText((v) => v + before + after);
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const next = text.slice(0, s) + before + text.slice(s, e) + after + text.slice(e);
    setText(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(s + before.length, e + before.length);
    });
  }

  async function generate() {
    if (busy || !text.trim()) return;
    const b = generated ? brief : text;
    setBrief(b);
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: "linkedin", format: LINKEDIN_FORMAT, topic: b, language }),
      });
      const data = await res.json();
      if (res.status === 402) {
        window.dispatchEvent(
          new CustomEvent("loglead:insufficient-credits", {
            detail: { needed: data.needed, balance: data.balance, action: data.action },
          }),
        );
        return;
      }
      if (!res.ok) return setError(data.error ?? "Génération impossible.");
      const v = data.variants?.[0];
      if (v) {
        setText(v.content);
        setGenerated(true);
        setExpanded(false);
        setCurrentId(null); // a fresh generation is a new post until saved
        setSaved(null);
        window.dispatchEvent(new CustomEvent("loglead:credits-changed"));
      }
    } catch {
      setError("Génération impossible. Réessaie.");
    } finally {
      setBusy(false);
    }
  }

  async function otherAngle() {
    if (busy || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: "linkedin", format: LINKEDIN_FORMAT, topic: brief, content: text, mode: "angle" }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Impossible de proposer un autre angle.");
      if (data.variant) setText(data.variant.content);
    } finally {
      setBusy(false);
    }
  }

  async function improve(tool: string) {
    setImproveOpen(false);
    if (busy || !text.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/studio/tool", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, tool, network: "linkedin", format: LINKEDIN_FORMAT }),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "Retouche impossible.");
      if (data.content) setText(data.content);
    } finally {
      setBusy(false);
    }
  }

  // Save the current post to the editorial calendar (or as a draft).
  // Re-uses the same content row across schedules so the calendar never
  // fills up with duplicates of the same post.
  async function saveContent(status: "draft" | "scheduled", d?: string, ti?: string) {
    if (busy || !text.trim()) return;
    const title = (text.trim().split("\n").find((l) => l.trim()) || "Post LinkedIn").slice(0, 80);
    setBusy(true);
    setError(null);
    try {
      const common = {
        title,
        body: text,
        status,
        scheduledDate: status === "scheduled" ? d ?? date : null,
        scheduledTime: status === "scheduled" ? ti ?? time : null,
      };
      const res = currentId
        ? await fetch(`/api/content/${currentId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(common),
          })
        : await fetch("/api/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "linkedin_post", platform: "linkedin", source: "brief", ...common }),
          });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? t("postgen.scheduleErr"));
      if (data.item?.id) setCurrentId(data.item.id);
      setScheduleOpen(false);
      setSaved({ msg: status === "scheduled" ? t("postgen.scheduledOk") : t("postgen.draftSavedOk"), cal: status === "scheduled" });
    } catch {
      setError(t("postgen.scheduleErr"));
    } finally {
      setBusy(false);
    }
  }

  function copy() {
    if (!text.trim()) return;
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const chars = text.length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const quality =
    chars > 3000 ? { key: "postgen.len.long", cls: "text-danger", ok: "⚠" }
    : words < 50 ? { key: "postgen.len.short", cls: "text-warning", ok: "⚠" }
    : { key: "postgen.len.ideal", cls: "text-success", ok: "✅" };

  const lines = text.split("\n");
  const long = lines.length > 3 || chars > 240;
  const shownBody = expanded || !long ? text : lines.slice(0, 3).join("\n");

  // Quick 1-click slots.
  const now = new Date();
  const tmr = new Date(now);
  tmr.setDate(tmr.getDate() + 1);
  const presets: { key: string; date: string; time: string; icon: React.ReactNode }[] = [
    { key: "postgen.today18", date: ymd(now), time: "18:00", icon: <Clock size={14} /> },
    { key: "postgen.tomorrow8", date: ymd(tmr), time: "08:00", icon: <Clock size={14} /> },
    { key: "postgen.tomorrow12", date: ymd(tmr), time: "12:00", icon: <Clock size={14} /> },
    { key: "postgen.optimal", date: opt.date, time: opt.time, icon: <Zap size={14} /> },
  ];

  const hist = history ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        {/* History — top-left of the page */}
        <button
          onClick={() => setHistOpen(true)}
          title={t("postgen.history")}
          aria-label={t("postgen.history")}
          className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-line bg-surface text-muted transition hover:border-primary/40 hover:text-primary"
        >
          <History size={17} strokeWidth={1.6} />
          {hist.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {hist.length}
            </span>
          )}
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{t("postgen.title")}</h1>
          <span className="lead-rule" />
          <p className="mt-2 text-muted">{t("postgen.subtitle")}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[55fr_45fr]">
        {/* LEFT — assistant + integrated editor */}
        <div className="space-y-3">
          {/* Step ① — editor */}
          <section className="rounded-[12px] border-[0.5px] border-line bg-surface p-4">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <StepNum n={1} />
                <h3 className="text-[13px] font-semibold text-ink">
                  {generated ? t("postgen.result") : t("postgen.step1")}
                </h3>
                {generated && <span className="text-[12px] text-muted">• {t("postgen.forLinkedin")}</span>}
              </div>
              {generated && (
                <div className="flex items-center gap-1">
                  <IconBtn onClick={copy} title={copied ? t("postgen.copied") : t("postgen.copy")}>
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                  </IconBtn>
                  <IconBtn onClick={otherAngle} title={t("postgen.otherAngle")}><Shuffle size={13} /></IconBtn>
                  <IconBtn onClick={generate} title={t("postgen.regenerate")}><RotateCcw size={13} /></IconBtn>
                </div>
              )}
            </div>

            <textarea
              ref={taRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("postgen.placeholder")}
              className="w-full resize-none rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-[14px] leading-[1.6] text-ink outline-none focus:border-primary"
              style={{ minHeight: 140 }}
            />

            {/* Toolbar */}
            <div className="relative mt-2.5 flex items-center justify-between">
              <div className="flex items-center gap-0.5">
                <IconBtn onClick={() => insertAtCursor("**", "**")} title="Gras"><Bold size={16} /></IconBtn>
                <IconBtn onClick={() => insertAtCursor("\n- ")} title="Liste"><List size={16} /></IconBtn>
                <IconBtn onClick={() => alert("Ajout d'image — bientôt.")} title="Image"><ImageIcon size={16} /></IconBtn>
                <IconBtn onClick={() => insertAtCursor("🙂")} title="Emoji"><Smile size={16} /></IconBtn>
              </div>
              <div className="relative">
                <button
                  onClick={() => setImproveOpen((v) => !v)}
                  disabled={busy || !text.trim()}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-[5px] text-[12px] font-medium text-white transition hover:bg-primary-hover disabled:opacity-50"
                >
                  {busy ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} {t("postgen.improve")}
                </button>
                {improveOpen && (
                  <>
                    <button aria-hidden className="fixed inset-0 z-10 cursor-default" onClick={() => setImproveOpen(false)} />
                    <div className="absolute bottom-full right-0 z-20 mb-1.5 w-56 rounded-[10px] border border-line bg-surface p-1 shadow-pop">
                      {IMPROVE_TOOLS.map((it) => (
                        <button
                          key={it.key}
                          onClick={() => improve(it.tool)}
                          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] text-ink hover:bg-surface-hover"
                        >
                          <span>{it.icon}</span> {t(it.key)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Step ② — language */}
          <section className="rounded-[12px] border-[0.5px] border-line bg-surface p-4">
            <div className="mb-2.5 flex items-center gap-2.5">
              <StepNum n={2} />
              <h3 className="text-[13px] font-semibold text-ink">{t("postgen.lang")}</h3>
            </div>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input" aria-label="Langue">
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.flag} {l.label}{l.value === "fr" ? " (défaut)" : ""}</option>
              ))}
            </select>
          </section>

          {error && <p className="rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>}

          {saved && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-success/25 bg-success/5 px-3 py-2.5 text-sm text-success">
              <span className="flex items-center gap-2 font-medium"><Check size={15} /> {saved.msg}</span>
              {saved.cal && (
                <Link href="/calendar" className="inline-flex shrink-0 items-center gap-1 font-semibold underline-offset-2 hover:underline">
                  {t("postgen.viewCalendar")} <ExternalLink size={13} />
                </Link>
              )}
            </div>
          )}

          {/* Primary CTA: generate, then schedule once generated */}
          {generated && (
            <button
              onClick={() => setScheduleOpen(true)}
              disabled={busy || !text.trim()}
              className="btn-primary w-full !py-2.5 text-sm disabled:opacity-50"
            >
              <CalendarClock size={16} /> {t("postgen.scheduleOn")}
            </button>
          )}
          <button
            onClick={generate}
            disabled={busy || !text.trim()}
            className={`${generated ? "btn-secondary" : "btn-primary"} w-full !py-2.5 text-sm disabled:opacity-50`}
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {busy ? t("postgen.generating") : generated ? t("postgen.regenerate") : t("postgen.generate")}
          </button>
        </div>

        {/* RIGHT — dynamic LinkedIn preview */}
        <div>
          <div className="lg:sticky lg:top-4">
            <p className="mb-2 text-[12px] text-muted">{t("postgen.preview")}</p>
            {!text.trim() ? (
              <div className="rounded-[12px] border-[0.5px] border-line bg-canvas p-4 opacity-40">
                <div className="flex items-center gap-2.5">
                  <span className="h-10 w-10 rounded-full bg-surface-hover" />
                  <div className="space-y-1.5">
                    <span className="block h-2.5 w-28 rounded bg-surface-hover" />
                    <span className="block h-2 w-20 rounded bg-surface-hover" />
                  </div>
                </div>
                <p className="mt-4 text-[13px] text-muted">{t("postgen.previewEmpty")}</p>
              </div>
            ) : (
              <div className="animate-[fadein_200ms_ease-in] rounded-[12px] border-[0.5px] border-line bg-canvas p-4 shadow-card">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-gradient text-[13px] font-bold text-white">
                    {initials(firstName)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-semibold text-ink">{firstName}</p>
                    <p className="truncate text-[12px] text-muted">{t("postgen.role", { saas: brand.saas })}</p>
                    <p className="text-[12px] text-muted">• {t("postgen.now")}</p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-ink">{shownBody}</p>
                {long && (
                  <button onClick={() => setExpanded(!expanded)} className="mt-0.5 text-[13px] text-muted hover:text-ink">
                    {expanded ? "—" : t("postgen.seeMore")}
                  </button>
                )}
                <div className="mt-3 grid grid-cols-4 gap-1 border-t-[0.5px] border-line pt-2 text-[12px] text-muted">
                  <Action icon={<ThumbsUp size={15} />} />
                  <Action icon={<MessageSquare size={15} />} />
                  <Action icon={<Repeat2 size={15} />} />
                  <Action icon={<Send size={15} />} />
                </div>
              </div>
            )}

            {text.trim() && (
              <p className="mt-2 text-[12px]">
                <span className="num text-muted">{t("postgen.chars", { n: chars })}</span>
                <span className="text-muted"> · </span>
                <span className={quality.cls}>{quality.ok} {t(quality.key)}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule modal — 1-click presets + custom slot */}
      {scheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button className="absolute inset-0 modal-overlay backdrop-blur-sm" aria-label="Fermer" onClick={() => setScheduleOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-5 shadow-pop">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <CalendarPlus size={18} strokeWidth={1.7} />
                </span>
                <div>
                  <h2 className="font-display text-base font-semibold text-ink">{t("postgen.scheduleTitle")}</h2>
                  <p className="text-[12px] text-muted">{t("postgen.forLinkedin")}</p>
                </div>
              </div>
              <button onClick={() => setScheduleOpen(false)} className="text-muted hover:text-ink" aria-label="Fermer"><X size={18} /></button>
            </div>

            {/* 1-click presets */}
            <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("postgen.oneClick")}</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => (
                <button
                  key={p.key}
                  onClick={() => saveContent("scheduled", p.date, p.time)}
                  disabled={busy}
                  className="flex items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-left text-[13px] font-medium text-ink transition hover:border-primary hover:bg-primary/5 disabled:opacity-50"
                >
                  <span className="text-primary">{p.icon}</span> {t(p.key)}
                </button>
              ))}
            </div>

            {/* Custom slot */}
            <p className="mt-4 mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">{t("postgen.orPickDate")}</p>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" value={date} min={ymd(new Date())} onChange={(e) => setDate(e.target.value)} className="input !py-2" aria-label="Date" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input !py-2" aria-label="Heure" />
            </div>

            <button
              onClick={() => saveContent("scheduled", date, time)}
              disabled={busy || !text.trim()}
              className="btn-primary mt-4 w-full !py-2.5 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CalendarClock size={16} />} {t("postgen.confirmSchedule")}
            </button>
            <button
              onClick={() => saveContent("draft")}
              disabled={busy || !text.trim()}
              className="btn-ghost mt-1.5 w-full !py-2 text-[13px] text-muted disabled:opacity-50"
            >
              {t("postgen.saveDraft")}
            </button>
          </div>
        </div>
      )}

      {/* History drawer */}
      {histOpen && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 modal-overlay backdrop-blur-sm" aria-label="Fermer" onClick={() => setHistOpen(false)} />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-pop">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
                <History size={18} /> {t("postgen.history")}
              </h2>
              <button onClick={() => setHistOpen(false)} className="text-muted hover:text-ink" aria-label="Fermer"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {hist.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                  <span className="text-3xl">🗂️</span>
                  <p className="mt-3 max-w-xs text-sm text-muted">{t("postgen.historyEmpty")}</p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {hist.map((h) => (
                    <li key={h.id} className="rounded-xl border border-line p-3 transition hover:border-primary/40">
                      <div className="flex items-center justify-between gap-2">
                        <StatusChip status={h.status} t={t} />
                        <span className="num text-[11px] text-muted">
                          {h.status === "scheduled" && h.scheduledDate
                            ? `${h.scheduledDate} · ${h.scheduledTime ?? "09:00"}`
                            : new Date(h.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </span>
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink">{h.title}</p>
                      <div className="mt-2 flex items-center justify-end">
                        <Link
                          href={`/post-generator?content=${h.id}`}
                          onClick={() => setHistOpen(false)}
                          className="inline-flex items-center gap-1 rounded-lg border border-line px-2.5 py-1 text-[12px] font-medium text-ink transition hover:border-primary hover:text-primary"
                        >
                          {t("postgen.loadPost")} <ExternalLink size={12} />
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="border-t border-line px-5 py-3">
              <Link href="/calendar" className="btn-secondary w-full !py-2 text-sm">
                <CalendarClock size={15} /> {t("postgen.viewCalendar")}
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function StatusChip({ status, t }: { status: HistoryItem["status"]; t: (k: string) => string }) {
  const map = {
    draft: { cls: "bg-surface-hover text-muted", key: "postgen.statusDraft" },
    scheduled: { cls: "bg-primary/10 text-primary", key: "postgen.statusScheduled" },
    published: { cls: "bg-success/10 text-success", key: "postgen.statusPublished" },
  } as const;
  const m = map[status];
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.cls}`}>{t(m.key)}</span>;
}

function StepNum({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white">
      {n}
    </span>
  );
}

function IconBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} aria-label={title} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-surface-hover hover:text-ink">
      {children}
    </button>
  );
}

function Action({ icon }: { icon: React.ReactNode }) {
  return <span className="flex items-center justify-center rounded-md py-1.5 hover:bg-surface-hover">{icon}</span>;
}
