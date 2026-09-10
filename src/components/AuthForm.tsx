"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import GoogleAuthButton from "./GoogleAuthButton";
import Logo from "./Logo";

type Lang = "en" | "fr";

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

  // FR/EN — auto-detected from the visitor's region, then remembered. Shares the
  // same localStorage key as the landing so the choice carries across.
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("loglead_lang");
      if (saved === "fr" || saved === "en") {
        setLang(saved);
        return;
      }
    } catch {
      /* ignore */
    }
    const nav = (navigator.languages?.[0] || navigator.language || "en").toLowerCase();
    setLang(nav.startsWith("fr") ? "fr" : "en");
  }, []);
  const t = (en: string, fr: string) => (lang === "fr" ? fr : en);
  function switchLang(l: Lang) {
    setLang(l);
    try {
      localStorage.setItem("loglead_lang", l);
    } catch {
      /* ignore */
    }
  }

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
        setError(data.error ?? t("Something went wrong.", "Une erreur est survenue."));
        return;
      }
      // New users go to onboarding; returning users to their dashboard.
      router.push(isSignup ? "/onboarding" : "/dashboard");
      router.refresh();
    } catch {
      setError(t("Connection failed. Try again.", "Connexion impossible. Réessaie."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      {/* Language toggle — top right, with flags */}
      <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-line bg-surface p-0.5 text-[12px] font-semibold">
        {([["en", "🇺🇸", "EN"], ["fr", "🇫🇷", "FR"]] as const).map(([l, flag, code]) => (
          <button
            key={l}
            type="button"
            onClick={() => switchLang(l)}
            aria-pressed={lang === l}
            className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition ${lang === l ? "bg-ink text-canvas" : "text-muted hover:text-ink"}`}
          >
            <span aria-hidden>{flag}</span> {code}
          </button>
        ))}
      </div>

      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={48} />
          <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            {isSignup
              ? t("Create your LogLead account", "Crée ton compte LogLead")
              : t("Welcome back to LogLead", "Bon retour sur LogLead")}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {isSignup
              ? t("Turn your network into a prospecting machine.", "Transforme tes réseaux en machine à prospects.")
              : t("Log in to get back to your studio.", "Connecte-toi pour retrouver ton studio.")}
          </p>
        </div>

        <div className="card">
          <GoogleAuthButton mode={mode} lang={lang} />
          <form onSubmit={onSubmit} className="space-y-4">
            {notice && (
              <p className="rounded-lg bg-success/5 px-3 py-2 text-sm text-success">
                {notice}
              </p>
            )}
            <div>
              <label className="label" htmlFor="email">
                {t("Email", "Email")}
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("you@company.com", "toi@startup.com")}
              />
            </div>
            <div>
              <label className="label" htmlFor="password">
                {t("Password", "Mot de passe")}
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
                placeholder={isSignup ? t("8 characters minimum", "8 caractères minimum") : "••••••••"}
              />
              {!isSignup && (
                <p className="mt-1.5 text-right">
                  <Link href="/forgot-password" className="text-xs text-muted hover:text-ink">
                    {t("Forgot password?", "Mot de passe oublié ?")}
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
                  ? t("Create my account", "Créer mon compte")
                  : t("Log in", "Se connecter")}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          {isSignup ? (
            <>
              {t("Already have an account?", "Déjà un compte ?")}{" "}
              <Link href="/login" className="font-semibold text-primary">
                {t("Log in", "Se connecter")}
              </Link>
            </>
          ) : (
            <>
              {t("No account yet?", "Pas encore de compte ?")}{" "}
              <Link href="/signup" className="font-semibold text-primary">
                {t("Create one", "Créer un compte")}
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
