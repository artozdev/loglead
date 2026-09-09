"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

// OAuth return page. Supabase (implicit flow) drops the access token in the URL
// hash; we read it client-side, hand it to /api/auth/google to mint the app's
// own session, then redirect where the API tells us (onboarding or dashboard).
export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let done = false;
    const supabase = supabaseBrowser();

    async function finish(accessToken: string) {
      if (done) return;
      done = true;
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
        const data = await res.json();
        if (res.ok && data.redirect) {
          window.location.href = data.redirect;
          return;
        }
        throw new Error(data.error ?? "auth_failed");
      } catch {
        setError("La connexion a échoué.");
        setTimeout(() => router.replace("/login?error=auth_failed"), 1500);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (done) return;
      if (data.session?.access_token) {
        finish(data.session.access_token);
        return;
      }
      // Session not parsed yet — wait for the auth event, with a safety timeout.
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) finish(session.access_token);
      });
      const to = setTimeout(() => {
        if (!done) {
          setError("Connexion expirée.");
          router.replace("/login?error=auth_failed");
        }
        sub.subscription.unsubscribe();
      }, 8000);
      return () => clearTimeout(to);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-b from-gray-50 to-white px-4 text-center">
      {error ? (
        <p className="text-sm text-danger">{error}</p>
      ) : (
        <>
          <Loader2 size={22} className="animate-spin text-primary" />
          <p className="text-sm text-muted">Connexion en cours…</p>
        </>
      )}
    </div>
  );
}
