"use client";

import { ArrowLeft, Copy, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CampaignLeadRollup } from "@/lib/campaign";
import {
  CAMPAIGN_CHANNELS,
  campaignChannelLabel,
  type Campaign,
  type CampaignChannel,
  type CampaignPublication,
} from "@/lib/types";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}
function fmtSlot(date: string | null, time: string | null): string {
  if (!date) return "Non planifié";
  const d = new Date(`${date}T${time ?? "09:00"}`);
  return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" }) + ` · ${time ?? ""}`;
}
function channelDot(c: CampaignChannel): string {
  return CAMPAIGN_CHANNELS.find((x) => x.value === c)?.dot ?? "#888";
}
function num(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(n);
}

export default function CampaignDetail({
  campaign,
  rollup,
}: {
  campaign: Campaign;
  rollup: CampaignLeadRollup;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<CampaignChannel>(campaign.publications[0]?.channel ?? "linkedin");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const pub = campaign.publications.find((p) => p.channel === tab);
  const totalViews = campaign.publications.reduce((a, p) => a + p.views, 0);
  const totalEng = campaign.publications.reduce((a, p) => a + p.likes + p.comments, 0);
  const engRate = totalViews ? ((totalEng / totalViews) * 100).toFixed(1) : "0";

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
      if (res.ok) router.push("/campagnes");
    } finally {
      setBusy(false);
    }
  }

  function copy(text: string) {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-5">
      <Link href="/campagnes" className="inline-flex items-center gap-2 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={15} strokeWidth={1.5} /> Campagnes
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold tracking-tight">{campaign.name}</h1>
          <p className="mt-0.5 text-[13px] text-muted">
            Créée le {fmtDate(campaign.createdAt)} · {campaign.publications.length} canaux actifs
          </p>
        </div>
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line text-muted hover:bg-surface-hover hover:text-danger"
          aria-label="Supprimer la campagne"
        >
          <Trash2 size={15} strokeWidth={1.5} />
        </button>
      </div>

      {confirmDelete && (
        <div className="rounded-[10px] border-[0.5px] border-danger/30 bg-danger/5 p-4">
          <p className="text-sm text-danger">
            Supprimer cette campagne et ses {campaign.publications.length} contenus planifiés ?
          </p>
          <div className="mt-2 flex gap-2">
            <button onClick={remove} disabled={busy} className="btn-primary !bg-none !bg-danger !py-1.5 text-sm">Supprimer</button>
            <button onClick={() => setConfirmDelete(false)} className="btn-ghost !py-1.5 text-sm">Annuler</button>
          </div>
        </div>
      )}

      {/* Performance summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Vues (est.)" value={num(totalViews)} />
        <Stat label="Engagement" value={`${engRate}%`} />
        <Stat label="Leads captés" value={String(rollup.total)} />
        <Stat label="Score moyen" value={rollup.avgScore ? `${rollup.avgScore}/100` : "—"} />
      </div>

      {/* Core message */}
      <section className="rounded-[12px] border-[0.5px] border-line bg-surface p-4">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Message central</h3>
          <button onClick={() => copy(campaign.coreMessage)} className="text-[12px] text-muted hover:text-ink">
            <Copy size={12} className="mr-1 inline" /> {copied ? "Copié" : "Copier"}
          </button>
        </div>
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink">{campaign.coreMessage}</p>
      </section>

      {/* Channel declinations */}
      <div>
        <div className="flex flex-wrap gap-1 border-b-[0.5px] border-line">
          {campaign.publications.map((p) => (
            <button
              key={p.id}
              onClick={() => setTab(p.channel)}
              className={`-mb-[0.5px] flex items-center gap-1.5 border-b-2 px-3 py-2 text-[13px] font-medium transition ${
                tab === p.channel ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: channelDot(p.channel) }} />
              {campaignChannelLabel(p.channel)}
            </button>
          ))}
        </div>
        {pub && <ChannelPanel pub={pub} leads={rollup.perChannel[pub.channel] ?? 0} onCopy={copy} />}
      </div>

      {/* Leads captured */}
      <section className="rounded-[12px] border-[0.5px] border-line bg-surface">
        <div className="border-b-[0.5px] border-line px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">
            Leads captés par cette campagne ({rollup.total})
          </h3>
        </div>
        {rollup.leads.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-faint">
            Aucun lead attribué pour l&apos;instant. Les prospects captés via ces contenus apparaîtront ici.
          </p>
        ) : (
          <table className="w-full text-[13px]">
            <tbody>
              {rollup.leads.map((l) => (
                <tr key={l.id} className="border-b-[0.5px] border-line last:border-b-0">
                  <td className="px-4 py-2.5 font-medium text-ink">{l.name}</td>
                  <td className="px-4 py-2.5">
                    <span className="flex items-center gap-1.5 text-muted">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: channelDot(l.channel) }} />
                      {campaignChannelLabel(l.channel)}
                    </span>
                  </td>
                  <td className="num px-4 py-2.5 text-right text-muted">{l.score}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function ChannelPanel({
  pub,
  leads,
  onCopy,
}: {
  pub: CampaignPublication;
  leads: number;
  onCopy: (t: string) => void;
}) {
  const published = pub.status === "published";
  return (
    <div className="mt-4 rounded-[12px] border-[0.5px] border-line bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full border-[0.5px] px-2 py-0.5 text-[11px] font-medium ${
          published ? "border-success/25 bg-success/10 text-success" : "border-primary/20 bg-primary/[0.06] text-primary"
        }`}>
          {published ? "✅ Publié" : `⏰ Planifié · ${fmtSlot(pub.scheduledDate, pub.scheduledTime)}`}
        </span>
        <div className="flex items-center gap-2">
          {pub.contentItemId && (
            <Link href={`/post-generator?content=${pub.contentItemId}`} className="text-[12px] text-muted hover:text-ink">
              <ExternalLink size={12} className="mr-1 inline" /> Modifier
            </Link>
          )}
          <button onClick={() => onCopy(pub.content)} className="text-[12px] text-muted hover:text-ink">
            <Copy size={12} className="mr-1 inline" /> Copier
          </button>
        </div>
      </div>

      {pub.subject && (
        <p className="mt-3 text-[13px]">
          <span className="text-muted">Objet : </span>
          <span className="font-medium text-ink">{pub.subject}</span>
        </p>
      )}
      <div className="mt-2 rounded-[10px] border-[0.5px] border-line bg-canvas p-3 text-[13px] leading-relaxed">
        <p className="whitespace-pre-wrap text-ink">{pub.content}</p>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted">
        <span>{num(pub.views)} vues{published ? "" : " (est.)"}</span>
        <span>{num(pub.likes)} likes</span>
        <span>{num(pub.comments)} commentaires</span>
        <span>Leads : <span className="font-semibold text-ink">{leads}</span></span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[10px] border-[0.5px] border-line bg-surface px-4 py-3">
      <p className="num text-xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[12px] text-muted">{label}</p>
    </div>
  );
}
