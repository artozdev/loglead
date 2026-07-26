"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CAMPAIGN_CHANNELS, type CampaignChannel } from "@/lib/types";

// "Transformer en campagne" — decline a core message onto the selected channels.
// Shared by the Studio assistant (prefilled with the generated post) and the
// campaigns list ("Nouvelle campagne", blank).
export default function CampaignCreateModal({
  initialMessage = "",
  onClose,
}: {
  initialMessage?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [message, setMessage] = useState(initialMessage);
  const [channels, setChannels] = useState<CampaignChannel[]>(["linkedin", "x", "reddit", "email"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(c: CampaignChannel) {
    setChannels((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  async function launch(only?: CampaignChannel) {
    const chosen = only ? [only] : channels;
    if (!message.trim() || chosen.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coreMessage: message, channels: chosen }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Création impossible.");
        return;
      }
      router.push(`/campagnes/${data.campaign.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-[14px] border border-line bg-surface p-6 shadow-pop">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <Sparkles size={18} className="text-primary" /> Transformer en campagne
        </h2>
        <p className="mt-1 text-sm text-muted">
          LogLead décline ce message central sur tous tes canaux — chacun adapté à sa plateforme,
          planifié aux créneaux recommandés par l&apos;Algo Insider.
        </p>

        <label className="mt-4 block text-[13px] font-medium text-ink">Message central</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          placeholder="Le message que tu veux distribuer partout…"
          className="input mt-1.5"
        />

        <p className="mt-4 text-[13px] font-medium text-ink">Canaux</p>
        <div className="mt-2 space-y-1.5">
          {CAMPAIGN_CHANNELS.map((c) => (
            <label
              key={c.value}
              className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-line px-3 py-2.5 hover:bg-surface-hover"
            >
              <input
                type="checkbox"
                checked={channels.includes(c.value)}
                onChange={() => toggle(c.value)}
                className="h-4 w-4 accent-primary"
              />
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.dot }} />
              <span className="text-[13px] font-medium text-ink">{c.label}</span>
              <span className="text-[12px] text-muted">{c.format}</span>
            </label>
          ))}
          <div className="flex items-center gap-2.5 rounded-[10px] border border-dashed border-line px-3 py-2.5 opacity-50">
            <span className="h-2.5 w-2.5 rounded-full bg-[#25D366]" />
            <span className="text-[13px] font-medium">WhatsApp</span>
            <span className="ml-auto rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">Bientôt</span>
          </div>
        </div>

        <p className="mt-3 text-[11px] text-faint">
          Chaque variante est planifiée dans ton calendrier éditorial LogLead. La publication directe
          sur les réseaux arrive avec la connexion des canaux.
        </p>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <button
            onClick={() => launch("linkedin")}
            disabled={busy || !message.trim()}
            className="btn-ghost !py-2 text-[13px] disabled:opacity-40"
          >
            Publier sur LinkedIn uniquement
          </button>
          <button
            onClick={() => launch()}
            disabled={busy || !message.trim() || channels.length === 0}
            className="btn-primary !py-2 text-sm disabled:opacity-50"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {busy ? "Déclinaison…" : "Lancer la campagne →"}
          </button>
        </div>
      </div>
    </div>
  );
}
