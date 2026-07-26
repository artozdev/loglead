"use client";

import { useState } from "react";
import {
  DEFAULT_SCORE_WEIGHTS,
  SCORE_CRITERIA,
  type LeadScoreWeights,
} from "@/lib/types";

// Sliders to tune the qualification weighting. Saving re-scores every lead in
// the workspace (handled server-side by PUT /api/leads/score-config).
export default function ScoreConfigModal({
  weights,
  onClose,
  onSaved,
}: {
  weights: LeadScoreWeights;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [w, setW] = useState<LeadScoreWeights>(weights);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = SCORE_CRITERIA.reduce((s, c) => s + w[c.value], 0);

  async function save() {
    if (total <= 0) {
      setError("Au moins un critère doit avoir un poids supérieur à 0.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/leads/score-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(w),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => null);
        setError(d?.error ?? "Enregistrement impossible.");
        return;
      }
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="absolute inset-0 modal-overlay backdrop-blur-sm" />
      <div className="relative w-full max-w-lg rounded-[14px] border border-line bg-surface p-6 shadow-pop">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Configurer mon score de qualification
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ajuste l&apos;importance de chaque critère. Le score de tous tes leads est
          recalculé après enregistrement.
        </p>

        <div className="mt-5 space-y-4">
          {SCORE_CRITERIA.map((c) => (
            <div key={c.value}>
              <div className="flex items-center justify-between">
                <label className="text-[13px] font-medium text-ink">{c.label}</label>
                <span className="num text-xs text-muted">{w[c.value]} pts max</span>
              </div>
              <input
                type="range"
                min={0}
                max={40}
                step={1}
                value={w[c.value]}
                onChange={(e) => setW({ ...w, [c.value]: Number(e.target.value) })}
                className="mt-1.5 w-full accent-primary"
                aria-label={c.label}
              />
              <p className="mt-0.5 text-xs text-faint">{c.hint}</p>
            </div>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setW(DEFAULT_SCORE_WEIGHTS)}
            className="text-sm text-muted hover:text-ink"
          >
            Réinitialiser
          </button>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="btn-ghost !py-2 text-sm">
              Annuler
            </button>
            <button onClick={save} disabled={busy} className="btn-primary !py-2 text-sm">
              {busy ? "Recalcul…" : "Enregistrer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
