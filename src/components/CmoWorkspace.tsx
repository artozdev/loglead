"use client";

import { useMemo, useState } from "react";
import {
  AUTONOMY_LEVELS,
  type CmoAction,
  type CmoConfig,
} from "@/lib/types";
import CmoActionCard from "./CmoActionCard";

type Filter = "all" | "pending" | "published" | "strategy";
type Op = "approve" | "reject" | "edit" | "publish" | "cancel";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "Tout" },
  { value: "pending", label: "À valider" },
  { value: "published", label: "Publiés" },
  { value: "strategy", label: "Stratégie" },
];

export default function CmoWorkspace({
  initialConfig,
  initialActions,
  workspaceName,
}: {
  initialConfig: CmoConfig;
  initialActions: CmoAction[];
  workspaceName: string;
}) {
  const [config, setConfig] = useState(initialConfig);
  const [actions, setActions] = useState(initialActions);
  const [filter, setFilter] = useState<Filter>("all");
  const [running, setRunning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("");
  const [briefing, setBriefing] = useState(false);
  const [warnAutopilot, setWarnAutopilot] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return actions;
    if (filter === "strategy") return actions.filter((a) => a.type === "strategy");
    return actions.filter((a) => a.status === filter);
  }, [actions, filter]);

  const pendingCount = actions.filter((a) => a.status === "pending").length;
  const levelLabel = AUTONOMY_LEVELS.find((l) => l.level === config.autonomyLevel)?.label ?? "";

  async function patchConfig(patch: Partial<CmoConfig>) {
    const res = await fetch("/api/cmo/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) setConfig(data.config);
  }

  async function run() {
    setRunning(true);
    try {
      const res = await fetch("/api/cmo/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) setActions(data.actions);
    } finally {
      setRunning(false);
    }
  }

  async function onAction(id: string, op: Op, body?: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/cmo/actions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op, body }),
      });
      const data = await res.json();
      if (res.ok && data.action) {
        setActions((prev) => prev.map((a) => (a.id === id ? data.action : a)));
      }
    } finally {
      setBusyId(null);
    }
  }

  async function sendBrief() {
    if (!instruction.trim()) return;
    setBriefing(true);
    try {
      const res = await fetch("/api/cmo/brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const data = await res.json();
      if (res.ok && data.action) {
        setActions((prev) => [data.action, ...prev]);
        setInstruction("");
      }
    } finally {
      setBriefing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Loger · ton CMO IA
          </h1>
          <p className="mt-1 text-muted">
            Ton directeur marketing pour {workspaceName}. Il propose, tu valides.
          </p>
        </div>
        <button onClick={run} disabled={running} className="btn-primary">
          {running ? "Loger travaille…" : "Faire travailler Loger"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        {/* Left — status & controls */}
        <aside className="space-y-4">
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted">Statut</span>
              <button
                onClick={() =>
                  patchConfig({ status: config.status === "active" ? "paused" : "active" })
                }
                className={`chip cursor-pointer ${
                  config.status === "active"
                    ? "border-success/20 bg-success/5 text-success"
                    : "border-line text-muted"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${config.status === "active" ? "bg-success" : "bg-gray-300"}`} />
                {config.status === "active" ? "Actif" : "En pause"}
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted">Autonomie</span>
                <span className="num chip border-primary/20 bg-primary/5 text-primary">
                  Niveau {config.autonomyLevel}
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={5}
                value={config.autonomyLevel}
                onChange={(e) => {
                  const lvl = Number(e.target.value);
                  if (lvl === 5 && !config.autopilot) {
                    setWarnAutopilot(true);
                  } else {
                    patchConfig({ autonomyLevel: lvl, autopilot: lvl === 5 });
                  }
                }}
                className="w-full accent-primary"
              />
              <p className="text-xs text-muted">« {levelLabel} »</p>
            </div>

            <div className="rounded-xl border border-line bg-canvas px-3 py-2">
              <p className="text-xs font-medium text-muted">Prochaine action planifiée</p>
              <p className="mt-0.5 text-sm text-ink">
                Brief quotidien demain à <span className="num">{config.briefHour}</span>
              </p>
            </div>

            {config.autopilot && (
              <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                <span className="text-xs font-medium text-primary">Pilote automatique</span>
                <button
                  onClick={() => patchConfig({ autopilot: false, autonomyLevel: 3 })}
                  className="text-xs font-medium text-muted hover:text-ink"
                >
                  Désactiver
                </button>
              </div>
            )}
          </div>

          <div className="card space-y-2">
            <span className="label">Briefer Loger</span>
            <textarea
              rows={3}
              className="input"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="ex. Cette semaine, axe sur notre nouvelle feature de facturation"
            />
            <button
              onClick={sendBrief}
              disabled={briefing || !instruction.trim()}
              className="btn-secondary w-full !py-2 text-sm"
            >
              {briefing ? "…" : "Envoyer l'instruction"}
            </button>
          </div>
        </aside>

        {/* Center — activity feed */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`chip cursor-pointer ${
                  filter === f.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-line text-muted"
                }`}
              >
                {f.label}
                {f.value === "pending" && pendingCount > 0 ? ` · ${pendingCount}` : ""}
              </button>
            ))}
          </div>

          {actions.length === 0 ? (
            <div className="card flex flex-col items-center py-12 text-center">
              <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient font-display text-base font-bold text-white">
                L
              </span>
              <p className="font-display text-base font-semibold">
                Loger est prêt à prendre les commandes
              </p>
              <p className="mt-1 max-w-sm text-sm text-muted">
                Lance-le : il analyse tes performances, ta niche et tes concurrents,
                puis te prépare un plan et ton contenu à valider.
              </p>
              <button onClick={run} disabled={running} className="btn-primary mt-4">
                {running ? "Loger travaille…" : "Faire travailler Loger"}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <p className="card text-center text-sm text-muted">
              Rien dans ce filtre.
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((a) => (
                <CmoActionCard
                  key={a.id}
                  action={a}
                  busy={busyId === a.id}
                  onAction={(op, body) => onAction(a.id, op, body)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Autopilot warning */}
      {warnAutopilot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            aria-label="Fermer"
            onClick={() => setWarnAutopilot(false)}
            className="absolute inset-0 modal-overlay backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
            <h2 className="font-display text-lg font-semibold">Activer le pilote automatique ?</h2>
            <p className="mt-2 text-sm text-muted">
              Loger publiera directement, sans validation manuelle. Chaque
              publication garde une fenêtre d&apos;annulation de 30 minutes. Tu
              gardes la responsabilité éditoriale de tout contenu publié.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setWarnAutopilot(false)} className="btn-ghost">
                Annuler
              </button>
              <button
                onClick={() => {
                  patchConfig({ autopilot: true, autonomyLevel: 5 });
                  setWarnAutopilot(false);
                }}
                className="btn-primary"
              >
                Activer le pilote automatique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
