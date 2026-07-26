"use client";

import { useState } from "react";
import {
  algoNetworkLabel,
  contentTypeLabel,
  NETWORK_LIMITS,
  platformLabel,
  type AlgoNetwork,
  type ContentSource,
  type ContentType,
  type Platform,
} from "@/lib/types";

type Props = {
  index?: number;
  defaultTitle: string;
  initialText: string;
  type: ContentType;
  platform: Platform;
  source: ContentSource;
  hookScore?: number;
  hookReason?: string;
  angle?: string;
  whyNiche?: string;
  network?: AlgoNetwork; // drives the length indicator
};

function hookBand(s: number) {
  if (s >= 75) return "text-success";
  if (s >= 45) return "text-warning";
  return "text-danger";
}

function lengthHint(network: AlgoNetwork, len: number) {
  const { max, ideal } = NETWORK_LIMITS[network];
  const label = algoNetworkLabel(network);
  if (len > max) return { ok: false, msg: `Trop long pour ${label} (${len}/${max})` };
  if (len < ideal[0]) return { ok: false, msg: `Un peu court pour ${label}` };
  if (len > ideal[1]) return { ok: false, msg: `Un peu long — vise ~${ideal[1]} caractères` };
  return { ok: true, msg: `Longueur idéale pour ${label}` };
}

export default function ResultCard({
  index,
  defaultTitle,
  initialText,
  type,
  platform,
  source,
  hookScore,
  hookReason,
  angle,
  whyNiche,
  network,
}: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [text, setText] = useState(initialText);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hint = network ? lengthHint(network, text.length) : null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Copie impossible.");
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          platform,
          title: title.slice(0, 120) || "Sans titre",
          body: text,
          source,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Enregistrement impossible.");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {typeof index === "number" && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
              {index + 1}
            </span>
          )}
          {angle && <span className="chip border-primary/20 bg-primary/5 text-primary">{angle}</span>}
          <span className="chip border-line text-muted">
            {platformLabel(platform)} · {contentTypeLabel(type)}
          </span>
        </div>
        {typeof hookScore === "number" && (
          <span className={`num inline-flex items-center gap-1 text-sm font-bold ${hookBand(hookScore)}`} title="Score d'accroche (0-100)">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 2 2.6 6.3L21 9l-5 4.1L17.5 20 12 16.4 6.5 20 8 13.1 3 9l6.4-.7z" />
            </svg>
            {hookScore}<span className="text-xs font-medium text-muted">/100</span>
          </span>
        )}
      </div>

      {typeof hookScore === "number" && hookReason && (
        <div className="rounded-lg bg-canvas px-3 py-2 text-xs text-muted">
          <span className="font-semibold text-ink/70">Score d&apos;accroche :</span> {hookReason}
        </div>
      )}
      {whyNiche && (
        <div className="rounded-lg border border-success/20 bg-success/5 px-3 py-2 text-xs text-ink/70">
          <span className="font-semibold text-success">Adapté à ta niche :</span> {whyNiche}
        </div>
      )}

      <input
        className="input font-medium"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Titre interne"
      />

      <textarea
        className="input min-h-[200px] leading-relaxed"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="num text-muted">{text.length} caractères</span>
        {hint && (
          <span className={hint.ok ? "text-success" : "text-warning"}>
            {hint.ok ? "✅" : "⚠️"} {hint.msg}
          </span>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button onClick={copy} className="btn-secondary">
          {copied ? "Copié ✓" : "Copier"}
        </button>
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "…" : saved ? "Enregistré ✓" : "Ajouter au calendrier"}
        </button>
      </div>
    </div>
  );
}
