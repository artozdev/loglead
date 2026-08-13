"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type WorkspaceRef = { id: string; name: string };

// Workspace switcher shown under the logo. Switch between workspaces
// (POST /api/workspaces/active) or create a new one (POST /api/workspaces).
export default function WorkspaceSwitcher({
  workspaces,
  activeWorkspaceId,
  collapsed,
  onNavigate,
}: {
  workspaces: WorkspaceRef[];
  activeWorkspaceId: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const active = workspaces.find((w) => w.id === activeWorkspaceId) ?? workspaces[0];
  if (!active) return null;
  const badge = (name: string) => name.charAt(0).toUpperCase();

  async function switchTo(id: string) {
    if (id === activeWorkspaceId) return setOpen(false);
    setBusy(true);
    try {
      await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: id }),
      });
      setOpen(false);
      onNavigate?.();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  if (collapsed) {
    return (
      <div className="flex justify-center px-2 py-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-xs font-bold text-canvas">
          {badge(active.name)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative px-2.5 py-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition hover:bg-surface-hover"
      >
        <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded bg-ink text-[9px] font-bold text-canvas">
          {badge(active.name)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink">
          {active.name}
        </span>
        <ChevronsUpDown size={12} strokeWidth={1.5} className="shrink-0 text-muted" />
      </button>

      {open && (
        <>
          <button
            aria-hidden
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-2.5 right-2.5 top-full z-20 mt-1 rounded-xl border border-line bg-surface p-1 shadow-pop">
            <div className="px-2 pb-1 pt-1.5 text-[10px] font-medium uppercase tracking-wide text-faint">
              Changer de workspace
            </div>
            {workspaces.map((w) => (
              <button
                key={w.id}
                type="button"
                onClick={() => switchTo(w.id)}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] transition hover:bg-surface-hover disabled:opacity-50"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-ink text-[10px] font-bold text-canvas">
                  {badge(w.name)}
                </span>
                <span className="flex-1 truncate text-ink">{w.name}</span>
                {w.id === activeWorkspaceId && <Check size={14} className="shrink-0 text-primary" />}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium text-primary transition hover:bg-surface-hover"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center">
                <Plus size={15} strokeWidth={2} />
              </span>
              Créer un workspace
            </button>
          </div>
        </>
      )}

      {createOpen && (
        <CreateWorkspaceModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            onNavigate?.();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

// Create a new workspace (= a new company/startup).
function CreateWorkspaceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Échec de la création.");
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
      <button aria-label="Fermer" onClick={onClose} className="modal-overlay absolute inset-0 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-pop">
        <h3 className="font-display text-lg font-semibold text-ink">Créer un workspace</h3>
        <p className="mt-1 text-sm text-muted">
          Chaque workspace correspond à une entreprise, avec ses propres contenus et leads.
        </p>
        <form onSubmit={create} className="mt-4 space-y-3">
          <div>
            <label className="label">Nom de l&apos;entreprise</label>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="Ex : Acme"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn-secondary">
              Annuler
            </button>
            <button type="submit" disabled={busy || !name.trim()} className="btn-primary">
              {busy ? "…" : "Créer le workspace"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
