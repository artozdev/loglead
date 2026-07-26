"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AUTONOMY_LEVELS,
  INSTAGRAM_SOON_TOOLTIP,
  PLATFORMS,
  type Platform,
} from "@/lib/types";

export default function CmoSetup() {
  const router = useRouter();
  const [briefHour, setBriefHour] = useState("08:00");
  const [autonomy, setAutonomy] = useState(1);
  const [priorities, setPriorities] = useState(["", "", ""]);
  const [channels, setChannels] = useState<Platform[]>([]);
  const [saving, setSaving] = useState(false);

  const levelLabel =
    AUTONOMY_LEVELS.find((l) => l.level === autonomy)?.label ?? "";

  async function activate() {
    setSaving(true);
    try {
      const res = await fetch("/api/cmo/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefHour,
          autonomyLevel: autonomy,
          priorities,
          priorityChannels: channels,
        }),
      });
      if (res.ok) router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient font-display text-sm font-bold text-white">
          L
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Active Loger, ton CMO IA
          </h1>
          <p className="text-muted">
            2 minutes pour cadrer jusqu&apos;où je peux aller sans te déranger.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <section className="card space-y-2">
          <label className="label" htmlFor="hour">Heure de ton brief quotidien</label>
          <input
            id="hour"
            type="time"
            className="input max-w-[160px]"
            value={briefHour}
            onChange={(e) => setBriefHour(e.target.value)}
          />
          <p className="text-xs text-muted">
            Je te prépare le contenu du jour et te l&apos;envoie à cette heure.
          </p>
        </section>

        <section className="card space-y-3">
          <div className="flex items-center justify-between">
            <span className="label !mb-0">Niveau d&apos;autonomie</span>
            <span className="num chip border-primary/20 bg-primary/5 text-primary">
              Niveau {autonomy}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={5}
            value={autonomy}
            onChange={(e) => setAutonomy(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <p className="text-sm font-medium text-ink">« {levelLabel} »</p>
          <p className="text-xs text-muted">
            Niveau 1 recommandé pour débuter. Tu pourras passer en pilote
            automatique plus tard, à tout moment.
          </p>
        </section>

        <section className="card space-y-3">
          <span className="label">Priorités du mois (3 max)</span>
          {priorities.map((p, i) => (
            <input
              key={i}
              className="input"
              value={p}
              onChange={(e) =>
                setPriorities(priorities.map((x, j) => (j === i ? e.target.value : x)))
              }
              placeholder={
                ["ex. Lancement de la feature facturation", "ex. Générer 10 leads qualifiés", "ex. Asseoir notre expertise data"][i]
              }
            />
          ))}
        </section>

        <section className="card space-y-3">
          <span className="label">Canaux prioritaires</span>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const on = channels.includes(p.value);
              if (p.comingSoon) {
                return (
                  <span
                    key={p.value}
                    title={INSTAGRAM_SOON_TOOLTIP}
                    aria-disabled="true"
                    className="chip cursor-not-allowed border-line text-muted opacity-40"
                  >
                    {p.label}
                    <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                      Bientôt
                    </span>
                  </span>
                );
              }
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() =>
                    setChannels(
                      on ? channels.filter((x) => x !== p.value) : [...channels, p.value],
                    )
                  }
                  className={`chip cursor-pointer ${on ? "border-primary bg-primary/10 text-primary" : "border-line text-muted"}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </section>

        <div className="flex justify-end">
          <button onClick={activate} disabled={saving} className="btn-primary">
            {saving ? "Activation…" : "Activer Loger"}
          </button>
        </div>
      </div>
    </div>
  );
}
