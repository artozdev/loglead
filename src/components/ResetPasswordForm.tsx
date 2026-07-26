"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

type Strength = "weak" | "medium" | "strong";

// faible < 8 chars · moyen = 8+ · fort = 8+ avec majuscule + chiffre/symbole
function strengthOf(pw: string): Strength {
  if (pw.length < 8) return "weak";
  const complex = /[A-Z]/.test(pw) && /[\d\W]/.test(pw);
  return complex ? "strong" : "medium";
}

const STRENGTH_META: Record<Strength, { label: string; cls: string; width: string }> = {
  weak: { label: "Faible", cls: "bg-danger", width: "33%" },
  medium: { label: "Moyen", cls: "bg-warning", width: "66%" },
  strong: { label: "Fort", cls: "bg-success", width: "100%" },
};

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [expired, setExpired] = useState(false);

  const strength = strengthOf(password);
  const meta = STRENGTH_META[strength];

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      return setError("Le mot de passe doit faire au moins 8 caractères.");
    }
    if (password !== confirm) {
      return setError("Les deux mots de passe ne correspondent pas.");
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.expired) setExpired(true);
        else setError(data.error ?? "Une erreur est survenue. Réessaie.");
        return;
      }
      setDone(true);
    } catch {
      setError("Connexion impossible. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={48} />
          {!done && !expired && (
            <h1 className="mt-4 font-display text-lg font-medium tracking-tight">
              Crée ton nouveau mot de passe
            </h1>
          )}
        </div>

        {expired ? (
          <div className="card text-center">
            <p className="font-display text-base font-semibold text-ink">❌ Ce lien a expiré</p>
            <p className="mt-2 text-sm text-muted">
              Les liens de réinitialisation sont valables 1 heure.
            </p>
            <Link href="/forgot-password" className="btn-primary mt-5 inline-flex">
              Demander un nouveau lien →
            </Link>
          </div>
        ) : done ? (
          <div className="card text-center">
            <p className="font-display text-base font-semibold text-ink">
              ✅ Mot de passe mis à jour !
            </p>
            <p className="mt-2 text-sm text-muted">
              Tu peux maintenant te connecter avec ton nouveau mot de passe.
            </p>
            <Link
              href="/login?message=password_updated"
              className="btn-primary mt-5 inline-flex"
            >
              Se connecter →
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="card space-y-4">
            <div>
              <label className="label" htmlFor="password">
                Nouveau mot de passe
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 caractères minimum"
              />
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 overflow-hidden rounded-full bg-surface-hover">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${meta.cls}`}
                      style={{ width: meta.width }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    Force : <span className="font-medium text-ink">{meta.label}</span>
                    {strength !== "strong" && " — ajoute une majuscule et un chiffre ou symbole"}
                  </p>
                </div>
              )}
            </div>
            <div>
              <label className="label" htmlFor="confirm">
                Confirmer le mot de passe
              </label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                className="input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
              {confirm.length > 0 && confirm !== password && (
                <p className="mt-1 text-xs text-danger">
                  Les deux mots de passe ne correspondent pas.
                </p>
              )}
            </div>
            {error && (
              <p className="rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "…" : "Réinitialiser mon mot de passe →"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
