"use client";

import {
  Bold,
  Check,
  Copy,
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LANGUAGES } from "@/lib/types";
import { useLocale } from "./LocaleProvider";

type Brand = { saas: string; icp: string; niche: string; tone: string };

const LINKEDIN_FORMAT = "Post texte";

const IMPROVE_TOOLS = [
  { icon: "✏️", key: "postgen.tool.expand", tool: "expand" },
  { icon: "⚡", key: "postgen.tool.hook", tool: "hook" },
  { icon: "✂️", key: "postgen.tool.concise", tool: "concise" },
  { icon: "🎯", key: "postgen.tool.optimise", tool: "optimise" },
  { icon: "✔️", key: "postgen.tool.grammar", tool: "grammar" },
  { icon: "🔥", key: "postgen.tool.punchy", tool: "optimise" },
] as const;

function initials(s: string): string {
  const p = s.trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || (s[0] ?? "?").toUpperCase();
}

export default function StudioAssistant({
  brand,
  initialAngle,
  initialGenerated,
  firstName,
}: {
  brand: Brand;
  initialAngle?: string;
  initialGenerated?: boolean; // loaded an existing post → open as an editable result
  firstName: string;
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

  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-grow the editor.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(140, ta.scrollHeight)}px`;
  }, [text]);

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
      if (!res.ok) return setError(data.error ?? "Génération impossible.");
      const v = data.variants?.[0];
      if (v) {
        setText(v.content);
        setGenerated(true);
        setExpanded(false);
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

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">{t("postgen.title")}</h1>
        <span className="lead-rule" />
        <p className="mt-2 text-muted">{t("postgen.subtitle")}</p>
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

          <button onClick={generate} disabled={busy || !text.trim()} className="btn-primary w-full !py-2.5 text-sm disabled:opacity-50">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {busy ? t("postgen.generating") : t("postgen.generate")}
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
    </div>
  );
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
