"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";

export default function AuthForm({
  mode,
  notice,
}: {
  mode: "login" | "signup";
  notice?: string; // one-time success banner (e.g. after a password reset)
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isSignup = mode === "signup";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Une erreur est survenue.");
        return;
      }
      // New users go to onboarding; returning users to their dashboard.
      router.push(isSignup ? "/onboarding" : "/dashboard");
      router.refresh();
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
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            {isSignup ? "Crée ton compte LogLead" : "Bon retour sur LogLead"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {isSignup
              ? "Transforme tes réseaux en machine à prospects."
              : "Connecte-toi pour retrouver ton studio."}
          </p>
        </div>

        <form onSubmit={onSubmit} className="card space-y-4">
          {notice && (
            <p className="rounded-lg bg-success/5 px-3 py-2 text-sm text-success">
              {notice}
            </p>
          )}
          <div>
            <label className="label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="toi@startup.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="password">
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              required
              minLength={isSignup ? 8 : undefined}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isSignup ? "8 caractères minimum" : "••••••••"}
            />
            {!isSignup && (
              <p className="mt-1.5 text-right">
                <Link href="/forgot-password" className="text-xs text-muted hover:text-ink">
                  Mot de passe oublié ?
                </Link>
              </p>
            )}
          </div>

          {error && (
            <p className="rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading
              ? "…"
              : isSignup
                ? "Créer mon compte"
                : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? (
            <>
              Déjà un compte ?{" "}
              <Link href="/login" className="font-semibold text-primary">
                Se connecter
              </Link>
            </>
          ) : (
            <>
              Pas encore de compte ?{" "}
              <Link href="/signup" className="font-semibold text-primary">
                Créer un compte
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
