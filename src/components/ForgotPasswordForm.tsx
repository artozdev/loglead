"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "./Logo";

// /forgot-password — same centered card as the login page. After submit the
// confirmation replaces the form in place (no reload), and is identical
// whether or not the email exists (anti user-enumeration).
export default function ForgotPasswordForm({ initialEmail }: { initialEmail: string }) {
  const [email, setEmail] = useState(initialEmail);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Une erreur est survenue. Réessaie.");
        return;
      }
      setSent(true);
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
          <h1 className="mt-4 font-display text-lg font-medium tracking-tight">
            Mot de passe oublié
          </h1>
          {!sent && (
            <p className="mt-1.5 text-sm text-muted">
              Entre ton email et on t&apos;envoie un lien pour réinitialiser ton mot de
              passe.
            </p>
          )}
        </div>

        {sent ? (
          <div className="card text-center">
            <p className="font-display text-base font-semibold text-ink">✅ Email envoyé</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Si un compte existe avec cette adresse, tu recevras un lien de
              réinitialisation dans les prochaines minutes.
            </p>
            <p className="mt-2 text-sm text-muted">Vérifie aussi tes spams.</p>
            <Link href="/login" className="mt-5 inline-block text-sm font-semibold text-primary">
              ← Retour à la connexion
            </Link>
          </div>
        ) : (
          <>
            <form onSubmit={onSubmit} className="card space-y-4">
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
              {error && (
                <p className="rounded-lg bg-danger/5 px-3 py-2 text-sm text-danger">{error}</p>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? "…" : "Envoyer le lien →"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted">
              <Link href="/login" className="font-semibold text-primary">
                ← Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
