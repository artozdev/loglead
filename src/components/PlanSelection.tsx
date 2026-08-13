"use client";

import { Check, Loader2, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Logo from "./Logo";
import { PLAN_CARDS, type PlanCard } from "@/lib/credits";
import type { Plan } from "@/lib/types";

export default function PlanSelection() {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(plan: Plan) {
    if (busy) return;
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Impossible de démarrer l'essai.");
        setBusy(null);
        return;
      }
      // Full reload so the plan gate re-evaluates and the header picks up credits.
      window.location.href = "/dashboard?trial_started=1";
    } catch {
      setError("Impossible de démarrer l'essai. Réessaie.");
      setBusy(null);
    }
  }

  // €/mo shown; annual applies a 20% discount visually.
  const price = (p: PlanCard) =>
    billing === "annual" ? Math.round(p.priceMonthly * 0.8) : p.priceMonthly;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-white">
      <div className="mx-auto flex min-h-full max-w-5xl flex-col items-center px-4 py-10 sm:py-14">
        <Logo size={30} withWordmark className="[&_.logo-light]:!block [&_.logo-dark]:!hidden" />

        <h1 className="mt-8 text-center font-display text-[28px] font-semibold tracking-tight text-slate-900 sm:text-[32px]">
          Choose your plan to start your free trial
        </h1>
        <p className="mt-2 text-center text-[15px] text-slate-500">
          7 days free on any plan. No credit card required to start.
        </p>

        {/* Billing toggle */}
        <div className="mt-6 inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-1">
          {(["monthly", "annual"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
                billing === b ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {b === "monthly" ? "Monthly" : "Annual — save 20%"}
            </button>
          ))}
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {/* Plan cards */}
        <div className="mt-8 grid w-full gap-4 md:grid-cols-3">
          {PLAN_CARDS.map((p) => {
            const popular = p.popular;
            return (
              <div
                key={p.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 transition ${
                  popular
                    ? "border-[#0051FF] shadow-[0_8px_30px_rgba(0,81,255,0.12)] md:-translate-y-2"
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-full bg-[#0051FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                    <Star size={12} fill="currentColor" /> Most popular
                  </span>
                )}

                <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{p.name}</p>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-[34px] font-bold leading-none text-slate-900">€{price(p)}</span>
                  <span className="text-[14px] text-slate-500">/mo</span>
                </div>
                <p className="mt-1 text-[12px] font-medium text-[#0051FF]">Try free 7 days</p>

                <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px]">
                  <p className="font-semibold text-slate-900">200 trial credits</p>
                  <p className="text-slate-500">Then {p.monthly.toLocaleString("en-US")}/mo</p>
                </div>

                <ul className="mt-4 flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <Check size={15} className="mt-0.5 shrink-0 text-[#0051FF]" strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => choose(p.id)}
                  disabled={busy !== null}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                    popular
                      ? "bg-[#0051FF] text-white hover:bg-[#0041cc]"
                      : "border border-slate-300 text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {busy === p.id ? <Loader2 size={16} className="animate-spin" /> : null}
                  Start free trial
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[13px] text-slate-500">
          200 trial credits included with every plan. No credit card required for the trial.
        </p>
      </div>
    </div>
  );
}
