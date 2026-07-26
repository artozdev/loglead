"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Workspace } from "@/lib/types";

export default function AccountSettings({
  email,
  userId,
  workspaces,
  activeId,
}: {
  email: string;
  userId: string;
  workspaces: Workspace[];
  activeId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // new workspace
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function switchTo(id: string) {
    if (id === activeId) return;
    setBusy(true);
    try {
      await fetch("/api/workspaces/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: id }),
      });
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function leave(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMsg(null);
        alert(data.error ?? "Impossible de quitter cette startup.");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (res.ok) {
        router.push("/onboarding");
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPwMsg({ ok: false, text: data.error ?? "Échec." });
        return;
      }
      setPwMsg({ ok: true, text: "Mot de passe mis à jour." });
      setCurrentPassword("");
      setNewPassword("");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Account */}
      <section className="card space-y-1">
        <h2 className="text-base font-semibold">Compte</h2>
        <p className="text-sm text-muted">Email</p>
        <p className="font-medium text-ink">{email}</p>
      </section>

      {/* Workspaces */}
      <section className="card space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Mes startups</h2>
          {!creating && (
            <button
              onClick={() => setCreating(true)}
              className="btn-secondary !py-1.5"
            >
              + Nouvelle startup
            </button>
          )}
        </div>

        {creating && (
          <form onSubmit={createWorkspace} className="flex items-center gap-2">
            <input
              autoFocus
              className="input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nom de la startup"
            />
            <button type="submit" disabled={busy} className="btn-primary">
              Créer
            </button>
            <button
              type="button"
              onClick={() => {
                setCreating(false);
                setNewName("");
              }}
              className="btn-ghost"
            >
              Annuler
            </button>
          </form>
        )}

        <ul className="divide-y divide-line">
          {workspaces.map((w) => {
            const isActive = w.id === activeId;
            const isOwner = w.ownerId === userId;
            return (
              <li
                key={w.id}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-ink">
                      {w.name}
                    </span>
                    {isActive && (
                      <span className="chip border-primary/20 bg-primary/5 text-primary">
                        Actif
                      </span>
                    )}
                    {isOwner && (
                      <span className="chip border-line text-muted">
                        Propriétaire
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isActive && (
                    <button
                      onClick={() => switchTo(w.id)}
                      disabled={busy}
                      className="btn-secondary !py-1.5"
                    >
                      Activer
                    </button>
                  )}
                  {workspaces.length > 1 && (
                    <button
                      onClick={() => leave(w.id)}
                      disabled={busy}
                      className="text-sm text-muted hover:text-danger"
                    >
                      Quitter
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Password */}
      <section className="card space-y-4">
        <h2 className="text-base font-semibold">Mot de passe</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="label" htmlFor="cur">
              Mot de passe actuel
            </label>
            <input
              id="cur"
              type="password"
              autoComplete="current-password"
              className="input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="label" htmlFor="new">
              Nouveau mot de passe
            </label>
            <input
              id="new"
              type="password"
              autoComplete="new-password"
              minLength={8}
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          {pwMsg && (
            <p
              className={`text-sm ${
                pwMsg.ok ? "text-success" : "text-danger"
              }`}
            >
              {pwMsg.text}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn-primary">
            Mettre à jour
          </button>
        </form>
      </section>

      {/* Session */}
      <section className="card flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Session</h2>
          <p className="text-sm text-muted">Se déconnecter de LogLead.</p>
        </div>
        <button onClick={logout} className="btn-secondary">
          Déconnexion
        </button>
      </section>
    </div>
  );
}
