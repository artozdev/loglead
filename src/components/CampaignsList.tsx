"use client";

import { Megaphone, Plus } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import CampaignCreateModal from "./CampaignCreateModal";
import {
  CAMPAIGN_CHANNELS,
  campaignChannelLabel,
  type Campaign,
  type CampaignChannel,
  type CampaignStatus,
} from "@/lib/types";

type CampaignRow = Campaign & { leadsCount: number; avgScore: number };

const STATUS_META: Record<CampaignStatus, { label: string; cls: string }> = {
  draft: { label: "Brouillon", cls: "border-line bg-surface-hover text-muted" },
  scheduled: { label: "Planifiée", cls: "border-primary/20 bg-primary/[0.06] text-primary" },
  active: { label: "En cours", cls: "border-success/25 bg-success/10 text-success" },
  completed: { label: "Terminée", cls: "border-line bg-surface-hover text-muted" },
};

const TABS: { value: "all" | CampaignStatus; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "active", label: "En cours" },
  { value: "scheduled", label: "Planifiées" },
  { value: "completed", label: "Terminées" },
  { value: "draft", label: "Brouillons" },
];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function channelDot(c: CampaignChannel): string {
  return CAMPAIGN_CHANNELS.find((x) => x.value === c)?.dot ?? "#888";
}

export default function CampaignsList() {
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [tab, setTab] = useState<"all" | CampaignStatus>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/campaigns");
    if (res.ok) setRows((await res.json()).campaigns);
    setLoading(false);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const shown = rows.filter((c) => tab === "all" || c.status === tab);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-[22px] font-medium tracking-tight">Campagnes</h1>
        <button onClick={() => setCreateOpen(true)} className="btn-primary ml-auto !py-2 text-[13px]">
          <Plus size={14} strokeWidth={1.5} /> Nouvelle campagne
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b-[0.5px] border-line">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`-mb-[0.5px] border-b-2 px-3 py-2 text-[13px] font-medium transition ${
              tab === t.value ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="py-16 text-center text-sm text-muted">Chargement…</p>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center rounded-[12px] border-[0.5px] border-line bg-surface px-6 py-16 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/[0.07] text-primary">
            <Megaphone size={26} strokeWidth={1.5} />
          </span>
          <p className="font-display text-base font-semibold text-ink">Aucune campagne pour l&apos;instant</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Pars d&apos;un message central — LogLead le décline sur LinkedIn, X, Reddit et Email en un clic.
          </p>
          <button onClick={() => setCreateOpen(true)} className="btn-primary mt-5 !py-2 text-[13px]">
            <Plus size={14} strokeWidth={1.5} /> Nouvelle campagne
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((c) => (
            <Link
              key={c.id}
              href={`/campagnes/${c.id}`}
              className="block rounded-[12px] border-[0.5px] border-line bg-surface p-4 transition hover:bg-surface-hover"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Megaphone size={15} className="text-muted" />
                <span className="font-medium text-ink">{c.name}</span>
                <span className={`rounded-full border-[0.5px] px-2 py-0.5 text-[11px] font-medium ${STATUS_META[c.status].cls}`}>
                  {STATUS_META[c.status].label}
                </span>
                <span className="num ml-auto text-xs text-faint">Créée le {fmtDate(c.createdAt)}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                {c.publications.map((p) => (
                  <span key={p.id} className="flex items-center gap-1.5 text-[12px] text-muted">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: channelDot(p.channel) }} />
                    <span className="font-medium text-ink">{campaignChannelLabel(p.channel)}</span>
                    {p.status === "published" ? "✅ Publié" : "⏰ Planifié"}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 border-t-[0.5px] border-line pt-2 text-[12px] text-muted">
                <span>Leads captés : <span className="font-semibold text-ink">{c.leadsCount}</span></span>
                {c.avgScore > 0 && <span>Score moyen : <span className="font-semibold text-ink">{c.avgScore}/100</span></span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {createOpen && <CampaignCreateModal onClose={() => setCreateOpen(false)} />}
    </div>
  );
}
