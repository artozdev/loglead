"use client";

import {
  ArrowBigUp,
  Bookmark,
  Heart,
  MessageCircle,
  Repeat2,
  Send,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { AlgoNetwork } from "@/lib/types";

export type PreviewScores = {
  hook: number;
  structure: number;
  voice: number;
  platform: number;
};

const LEN: Record<
  AlgoNetwork,
  { mode: "words" | "chars"; ideal: [number, number]; unit: string; platform: string }
> = {
  linkedin: { mode: "words", ideal: [120, 300], unit: "mots", platform: "LinkedIn" },
  x: { mode: "chars", ideal: [100, 270], unit: "caractères", platform: "X" },
  reddit: { mode: "words", ideal: [120, 600], unit: "mots", platform: "Reddit" },
  instagram: { mode: "words", ideal: [50, 150], unit: "mots", platform: "Instagram" },
};

function initials(s: string): string {
  const parts = s.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function handleOf(saas: string): string {
  return saas.toLowerCase().replace(/[^a-z0-9]/g, "") || "founder";
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Highlight #hashtags and links (LinkedIn blue).
function highlight(text: string): string {
  return escapeHtml(text)
    .replace(/(https?:\/\/[^\s<]+)/g, '<span style="color:#0A66C2">$1</span>')
    .replace(/(^|\s)(#[\p{L}0-9_]+)/gu, '$1<span style="color:#0A66C2">$2</span>');
}

// Lisibilité: shorter average sentence length → higher score.
function readability(text: string): number {
  const sentences = text.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean);
  if (!sentences.length) return 0;
  const avg =
    sentences.reduce((a, s) => a + s.split(/\s+/).filter(Boolean).length, 0) / sentences.length;
  return Math.max(40, Math.min(100, Math.round(100 - Math.max(0, avg - 8) * 2.5)));
}

function lengthInfo(network: AlgoNetwork, text: string) {
  const cfg = LEN[network];
  const n = cfg.mode === "words" ? text.trim().split(/\s+/).filter(Boolean).length : text.length;
  const [lo, hi] = cfg.ideal;
  const ok = n >= lo && n <= hi;
  const label = !text.trim()
    ? "—"
    : n < lo
      ? `Un peu court pour ${cfg.platform} (${n} ${cfg.unit})`
      : n > hi
        ? `Un peu long pour ${cfg.platform} (${n} ${cfg.unit})`
        : `Idéale pour ${cfg.platform} (${n} ${cfg.unit})`;
  return { ok, label };
}

export default function PostPreview({
  network,
  content,
  saas,
  firstName,
  formatLabel,
  scores,
  streaming,
}: {
  network: AlgoNetwork;
  content: string;
  saas: string;
  firstName: string;
  formatLabel: string;
  scores: PreviewScores | null;
  streaming: boolean;
}) {
  const hasContent = Boolean(content.trim());
  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border-[0.5px] border-line bg-canvas p-4 shadow-card">
        {!hasContent ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
            <p className="text-sm text-muted">
              {streaming ? "Rédaction en cours…" : "Ta prévisualisation apparaîtra ici."}
            </p>
            <p className="mt-1 text-xs text-faint">Complète l&apos;assistant puis génère ton post.</p>
          </div>
        ) : network === "x" ? (
          <XPreview content={content} saas={saas} firstName={firstName} formatLabel={formatLabel} />
        ) : network === "reddit" ? (
          <RedditPreview content={content} saas={saas} formatLabel={formatLabel} />
        ) : (
          <LinkedInPreview content={content} saas={saas} firstName={firstName} />
        )}
      </div>

      {hasContent && <QualityBars network={network} content={content} scores={scores} />}
    </div>
  );
}

function Avatar({ label, size = 44 }: { label: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-brand-gradient font-bold text-white"
      style={{ height: size, width: size, fontSize: size / 2.6 }}
    >
      {label}
    </span>
  );
}

// ----- LinkedIn --------------------------------------------------------------

function LinkedInPreview({ content, saas, firstName }: { content: string; saas: string; firstName: string }) {
  const [expanded, setExpanded] = useState(false);
  const lines = content.split("\n");
  const long = lines.length > 3;
  const shown = expanded || !long ? content : lines.slice(0, 3).join("\n");
  return (
    <div>
      <div className="flex items-center gap-2.5">
        <Avatar label={initials(firstName || saas)} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">{firstName || saas}</p>
          <p className="truncate text-xs text-muted">Fondateur · {saas}</p>
          <p className="text-[11px] text-faint">Maintenant · 🌐</p>
        </div>
      </div>
      <div
        className="mt-3 whitespace-pre-wrap break-words text-[14px] leading-[1.6] text-ink"
        dangerouslySetInnerHTML={{ __html: highlight(shown) }}
      />
      {long && (
        <button onClick={() => setExpanded(!expanded)} className="mt-0.5 text-[13px] text-muted hover:text-ink">
          {expanded ? "voir moins" : "…voir plus"}
        </button>
      )}
      <div className="mt-3 grid grid-cols-4 gap-1 border-t-[0.5px] border-line pt-2 text-[12px] text-muted">
        <Action icon={<Heart size={15} />} label="J'aime" />
        <Action icon={<MessageCircle size={15} />} label="Commenter" />
        <Action icon={<Repeat2 size={15} />} label="Republier" />
        <Action icon={<Send size={15} />} label="Envoyer" />
      </div>
    </div>
  );
}

function Action({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex items-center justify-center gap-1.5 rounded-md py-1.5 hover:bg-surface-hover">
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}

// ----- X ---------------------------------------------------------------------

function XPreview({ content, saas, firstName, formatLabel }: { content: string; saas: string; firstName: string; formatLabel: string }) {
  const isThread = /thread/i.test(formatLabel);
  const tweets = useMemo(() => {
    const parts = content
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    return isThread && parts.length > 1 ? parts : [content.trim()];
  }, [content, isThread]);
  const handle = handleOf(saas);
  return (
    <div className="space-y-3">
      {tweets.map((t, i) => (
        <div key={i} className={i > 0 ? "border-t-[0.5px] border-line pt-3" : ""}>
          <div className="flex gap-2.5">
            <Avatar label={initials(firstName || saas)} size={40} />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold text-ink">{firstName || saas}</span>{" "}
                <span className="text-muted">@{handle} · 2h</span>
                {tweets.length > 1 && <span className="ml-1 text-muted">· {i + 1}/{tweets.length}</span>}
              </p>
              <p className="mt-0.5 whitespace-pre-wrap break-words text-[14px] leading-[1.5] text-ink">{t}</p>
              <div className="mt-2 flex items-center gap-6 text-[12px] text-muted">
                <span className="flex items-center gap-1"><MessageCircle size={14} /> 12</span>
                <span className="flex items-center gap-1"><Repeat2 size={14} /> 8</span>
                <span className="flex items-center gap-1"><Heart size={14} /> 94</span>
                <span className="num">12,4k vues</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ----- Reddit ----------------------------------------------------------------

function RedditPreview({ content, saas, formatLabel }: { content: string; saas: string; formatLabel: string }) {
  const lines = content.split("\n").filter((l) => l.trim());
  const title = lines[0] ?? "";
  const body = lines.slice(1).join("\n");
  const handle = handleOf(saas);
  return (
    <div>
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-reddit/10 text-[11px] font-bold text-reddit">r/</span>
        <span className="font-semibold text-ink">r/SaaS</span>
        <span>· Posté par u/{handle}</span>
        <span className="ml-auto rounded-full bg-surface-hover px-2 py-0.5 text-[11px] font-medium text-muted">{formatLabel}</span>
      </div>
      <h3 className="mt-2 text-[15px] font-bold text-ink">{title}</h3>
      {body && <p className="mt-1.5 whitespace-pre-wrap break-words text-[13px] leading-[1.6] text-muted">{body}</p>}
      <div className="mt-3 flex items-center gap-4 border-t-[0.5px] border-line pt-2 text-[12px] text-muted">
        <span className="flex items-center gap-1"><ArrowBigUp size={16} /> 128</span>
        <span className="flex items-center gap-1"><MessageCircle size={14} /> 34 commentaires</span>
        <span className="flex items-center gap-1"><Bookmark size={14} /> Enregistrer</span>
      </div>
    </div>
  );
}

// ----- Quality indicators ----------------------------------------------------

function QualityBars({
  network,
  content,
  scores,
}: {
  network: AlgoNetwork;
  content: string;
  scores: PreviewScores | null;
}) {
  const hook = scores?.hook ?? 0;
  const engagement = scores?.structure ?? 0;
  const ai = scores?.voice ?? 0;
  const readab = readability(content);
  const len = lengthInfo(network, content);
  return (
    <div className="rounded-[12px] border-[0.5px] border-line bg-surface p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Indicateurs de qualité</p>
      <div className="space-y-2.5">
        <Bar label="Hook" value={hook} />
        <Bar label="Engagement" value={engagement} />
        <Bar label="Lisibilité" value={readab} />
        <Bar label="Score IA" value={ai} suffix="(indétectable)" />
        <div className="flex items-center justify-between pt-1 text-[13px]">
          <span className="text-muted">Longueur</span>
          <span className={len.ok ? "text-success" : "text-warning"}>
            {len.ok ? "✅ " : "⚠ "}
            {len.label}
          </span>
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  const color =
    value >= 80 ? "var(--color-success)" : value >= 60 ? "var(--color-warning)" : "var(--color-danger)";
  return (
    <div className="flex items-center gap-3">
      <span className="w-24 shrink-0 text-[13px] text-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="num w-20 shrink-0 text-right text-[12px] text-muted">
        {value}/100 {suffix && <span className="text-faint">{suffix}</span>}
      </span>
    </div>
  );
}
