"use client";

import { Lock } from "lucide-react";
import Link from "next/link";
import { VISIBILITY_LLMS, type VisibilityLLM } from "@/lib/types";

// Shared building blocks for the GEO module (board + tabs).

export function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(
    new Date(iso),
  );
}

export function fmtDateLong(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(iso),
  );
}

// Data-viz palette for competitor series (the SaaS itself uses the brand blue).
export const COMPETITOR_PALETTE = ["#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#64748B"];

export function competitorColor(index: number): string {
  return COMPETITOR_PALETTE[index % COMPETITOR_PALETTE.length];
}

// Letter tile per LLM (no external logo assets).
export function LlmLogo({ llm, size = 20 }: { llm: VisibilityLLM; size?: number }) {
  const meta = VISIBILITY_LLMS.find((x) => x.value === llm)!;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-md font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        backgroundColor: meta.chartColor,
      }}
    >
      {meta.label.charAt(0)}
    </span>
  );
}

// Progress ring + % — green when perfect, amber when partial, red when absent.
export function ScoreRing({ score }: { score: number }) {
  const color =
    score === 0
      ? "var(--color-danger)"
      : score >= 80
        ? "var(--color-success)"
        : "var(--color-warning)";
  const r = 6.5;
  const c = 2 * Math.PI * r;
  return (
    <span className="inline-flex items-center gap-1.5">
      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r={r} fill="none" stroke="var(--border)" strokeWidth="2.5" />
        <circle
          cx="8"
          cy="8"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * c} ${c}`}
          transform="rotate(-90 8 8)"
        />
      </svg>
      <span className="num text-[13px] text-ink">{score} %</span>
    </span>
  );
}

export function UpsellNote({ text }: { text: string }) {
  return (
    <p className="mt-3 flex items-center gap-2 rounded-xl border border-line px-4 py-3 text-sm text-muted">
      <Lock size={14} strokeWidth={1.5} className="shrink-0" />
      <span>
        {text}{" "}
        <Link href="/pricing" className="font-medium text-primary hover:underline">
          Voir les offres
        </Link>
      </span>
    </p>
  );
}

export function Th({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`whitespace-nowrap px-4 py-2.5 text-left text-xs font-normal text-faint ${className}`}>
      {children}
    </th>
  );
}
