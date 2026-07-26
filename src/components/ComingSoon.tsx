"use client";

import { useState } from "react";

// Shared "coming soon" page shell used by Analytics and Leads. All colors come
// from theme variables (no hardcoded hex) so it works in light and dark.
export default function ComingSoon({
  feature,
  email,
  alreadySubscribed,
  title,
  subtitle,
  progress,
  illustration,
  preview,
  features,
}: {
  feature: string; // waitlist key, e.g. "leads"
  email: string;
  alreadySubscribed: boolean;
  title: string;
  subtitle: string;
  progress: number;
  illustration: React.ReactNode;
  preview: React.ReactNode; // grid of teaser cards (blurred by this shell)
  features?: string[];
}) {
  const [value, setValue] = useState(email);
  const [state, setState] = useState<"idle" | "loading" | "done" | "already">(
    alreadySubscribed ? "already" : "idle",
  );

  async function notify(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading" || state === "done" || state === "already") return;
    setState("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature, email: value }),
      });
      const data = await res.json().catch(() => ({}));
      setState(data.already ? "already" : "done");
    } catch {
      setState("done");
    }
  }

  const confirmed = state === "done" || state === "already";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 text-center">
      {illustration}

      <h1 className="mt-6 font-display text-[22px] font-medium tracking-tight text-ink">
        {title}
      </h1>
      <p className="mt-2 max-w-[420px] text-sm text-muted">{subtitle}</p>

      {/* Cosmetic progress bar */}
      <div className="mt-8 w-full max-w-md">
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-muted">
          <span>Progression du développement</span>
          <span className="num text-ink">{progress} %</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-hover">
          <div
            className="h-full rounded-full bg-brand-gradient transition-[width] duration-700 ease-smooth"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-faint">Lancement prévu dans les prochaines semaines.</p>
      </div>

      {/* Notify form */}
      <form onSubmit={notify} className="mt-8 w-full max-w-md text-left">
        <label htmlFor="notify-email" className="mb-1.5 block text-[13px] font-medium text-ink/80">
          Sois notifié en premier dès que c&apos;est disponible
        </label>
        {confirmed ? (
          <div className="rounded-[8px] border border-success/20 bg-success/5 px-3.5 py-3 text-sm font-medium text-success">
            {state === "already"
              ? "✅ Tu es déjà sur la liste — on te prévient dès que c'est prêt."
              : "✅ Tu seras parmi les premiers informés."}
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              id="notify-email"
              type="email"
              required
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="ton@email.com"
              className="input flex-1"
            />
            <button type="submit" disabled={state === "loading"} className="btn-primary shrink-0">
              {state === "loading" ? "…" : "M'avertir"}
            </button>
          </div>
        )}
      </form>

      {/* Planned features checklist */}
      {features && features.length > 0 && (
        <ul className="mt-8 w-full max-w-md space-y-2 text-left">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-sm text-muted">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-line-strong text-[10px] text-faint">
                ○
              </span>
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Blurred teaser preview */}
      <div className="relative mt-12 w-full">
        <div className="pointer-events-none select-none opacity-40 blur-[3px]" aria-hidden>
          {preview}
        </div>
        <div className="pointer-events-none absolute inset-x-0 -bottom-2 flex justify-center">
          <span className="chip border-line bg-surface text-muted shadow-soft">
            Aperçu — bientôt disponible
          </span>
        </div>
      </div>
    </div>
  );
}
