"use client";

import { useState } from "react";

const STEPS = [
  { title: "Partage ton lien", desc: "Envoie ton lien de parrainage à d'autres founders et créateurs." },
  { title: "Ils s'abonnent", desc: "Dès qu'un filleul passe sur une offre payante, tu es crédité." },
  { title: "Tu gagnes 40 % à vie", desc: "40 % de commission récurrente, chaque mois, tant qu'il reste client." },
];

export default function AffiliationView({ referralLink }: { referralLink: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <span className="chip border-success/20 bg-success/5 text-success">Programme d&apos;affiliation</span>
        <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
          Gagne <span className="text-success">40 % à vie</span> sur chaque filleul
        </h1>
        <span className="lead-rule" />
        <p className="mt-3 max-w-lg text-muted">
          Recommande LogLead aux founders de ton réseau. Pour chaque personne qui
          s&apos;abonne via ton lien, tu touches 40 % de son abonnement — chaque
          mois, aussi longtemps qu&apos;elle reste cliente.
        </p>
      </div>

      {/* Referral link */}
      <div className="card">
        <label className="label">Ton lien de parrainage</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly value={referralLink} className="input flex-1 !bg-canvas" />
          <button onClick={copy} className="btn-primary shrink-0">
            {copied ? "Lien copié ✓" : "Copier le lien"}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">
          Partage-le sur LinkedIn, X, ta newsletter ou en DM.
        </p>
      </div>

      {/* How it works */}
      <div className="grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
              {i + 1}
            </span>
            <h3 className="mt-3 font-display text-base font-semibold text-ink">{s.title}</h3>
            <p className="mt-1 text-sm text-muted">{s.desc}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">
        Les commissions sont versées mensuellement dès 50 € de gains cumulés. Le
        suivi détaillé de tes filleuls arrive bientôt.
      </p>
    </div>
  );
}
