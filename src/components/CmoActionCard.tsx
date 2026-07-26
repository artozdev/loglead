"use client";

import { useEffect, useState } from "react";
import { CMO_ACTION_META, type CmoAction } from "@/lib/types";

type Op = "approve" | "reject" | "edit" | "publish" | "cancel";

const STATUS: Record<
  CmoAction["status"],
  { label: string; cls: string }
> = {
  pending: { label: "À valider", cls: "border-warning/30 bg-warning/5 text-warning" },
  approved: { label: "Approuvé", cls: "border-primary/20 bg-primary/5 text-primary" },
  published: { label: "Publié", cls: "border-success/20 bg-success/5 text-success" },
  rejected: { label: "Ignoré", cls: "border-line text-muted" },
};

export default function CmoActionCard({
  action,
  busy,
  onAction,
}: {
  action: CmoAction;
  busy: boolean;
  onAction: (op: Op, body?: string) => void;
}) {
  const meta = CMO_ACTION_META[action.type];
  const status = STATUS[action.status];
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(action.body);
  const [remaining, setRemaining] = useState<number>(0);

  // Autopilot 30-min undo countdown.
  useEffect(() => {
    if (!action.cancelUntil) return;
    const tick = () =>
      setRemaining(
        Math.max(0, Math.floor((new Date(action.cancelUntil!).getTime() - Date.now()) / 1000)),
      );
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [action.cancelUntil]);

  const isContent = action.type === "content";
  const canCancel = action.status === "published" && remaining > 0;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-muted">
          <span aria-hidden>{meta.emoji}</span> {meta.label}
        </span>
        <span className={`chip ${status.cls}`}>{status.label}</span>
      </div>

      {/* Loger's note */}
      <div className="flex gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-gradient font-display text-xs font-bold text-white">
          L
        </span>
        <div className="min-w-0">
          <p className="font-display text-sm font-semibold text-ink">{action.title}</p>
          <p className="mt-0.5 text-sm leading-relaxed text-ink/80">{action.message}</p>
        </div>
      </div>

      {/* Body / draft */}
      {editing ? (
        <textarea
          className="input min-h-[140px]"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
      ) : (
        <div
          className={`whitespace-pre-wrap rounded-xl border border-line p-3 text-sm leading-relaxed ${
            isContent ? "bg-canvas text-ink" : "bg-canvas/60 text-muted"
          }`}
        >
          {action.body}
        </div>
      )}

      {isContent && (action.platform || action.suggestedTime) && !editing && (
        <p className="text-xs text-muted">
          {action.platform === "linkedin" ? "LinkedIn" : action.platform === "tiktok" ? "TikTok" : "Instagram"}
          {action.suggestedTime && action.suggestedTime !== "—" ? ` · ${action.suggestedTime}` : ""}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <button
              onClick={() => {
                onAction("edit", draft);
                setEditing(false);
              }}
              disabled={busy}
              className="btn-primary !py-2 text-sm"
            >
              Enregistrer
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost !py-2 text-sm">
              Annuler
            </button>
          </>
        ) : action.status === "pending" ? (
          <>
            {isContent ? (
              <button onClick={() => onAction("publish")} disabled={busy} className="btn-primary !py-2 text-sm">
                Publier
              </button>
            ) : (
              <button onClick={() => onAction("approve")} disabled={busy} className="btn-primary !py-2 text-sm">
                Approuver
              </button>
            )}
            <button onClick={() => setEditing(true)} className="btn-secondary !py-2 text-sm">
              Modifier
            </button>
            <button onClick={() => onAction("reject")} disabled={busy} className="btn-ghost !py-2 text-sm">
              Ignorer
            </button>
          </>
        ) : action.status === "approved" && isContent ? (
          <button onClick={() => onAction("publish")} disabled={busy} className="btn-primary !py-2 text-sm">
            Publier
          </button>
        ) : canCancel ? (
          <button onClick={() => onAction("cancel")} disabled={busy} className="btn-secondary !py-2 text-sm">
            <span className="num">Annuler ({mm}:{ss})</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
