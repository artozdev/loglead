"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { hasGoogleAuth, supabaseBrowser } from "@/lib/supabase-browser";

// Google sign-in / sign-up. Kicks off Supabase OAuth (Google) and returns to
// /auth/callback, which exchanges the identity for the app's own session cookie.
// Renders nothing when Google auth isn't configured, so the email form still works.
export default function GoogleAuthButton({
  mode,
  lang = "en",
}: {
  mode: "login" | "signup";
  lang?: "en" | "fr";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = (en: string, fr: string) => (lang === "fr" ? fr : en);

  if (!hasGoogleAuth()) return null;

  async function onClick() {
    setLoading(true);
    setError(null);
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: { access_type: "offline", prompt: "select_account" },
        },
      });
      if (error) {
        setLoading(false);
        setError(t("Google sign-in failed. Try again.", "Connexion Google impossible. Réessaie."));
      }
      // On success the browser navigates to Google — keep loading = true.
    } catch {
      setLoading(false);
      setError(t("Google sign-in failed. Try again.", "Connexion Google impossible. Réessaie."));
    }
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line bg-surface px-5 py-3 text-sm font-medium text-ink transition hover:bg-surface-hover disabled:opacity-60"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92A8.78 8.78 0 0 0 17.64 9.2z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" fill="#34A853" />
            <path d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" fill="#FBBC05" />
            <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
          </svg>
        )}
        {loading
          ? t("Redirecting…", "Redirection…")
          : mode === "signup"
            ? t("Sign up with Google", "S'inscrire avec Google")
            : t("Continue with Google", "Continuer avec Google")}
      </button>
      {error && <p className="mt-2 text-center text-xs text-danger">{error}</p>}
      <div className="mt-4 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" />
        <span>{t("or with your email", "ou avec ton email")}</span>
        <span className="h-px flex-1 bg-line" />
      </div>
    </div>
  );
}
