"use client";

import { Check, Loader2, Star } from "lucide-react";
import { useState } from "react";
import Logo from "./Logo";
import { PLAN_CARDS, type PlanCard } from "@/lib/credits";
import type { Plan } from "@/lib/types";

export default function PlanSelection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [busy, setBusy] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Paid plan → Stripe subscription checkout (redirect to Stripe / demo).
  async function subscribe(plan: Plan) {
    if (busy) return;
    setBusy(plan);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error ?? "Le paiement n'a pas pu démarrer.");
        setBusy(null);
        return;
      }
      window.location.href = data.url; // Stripe Checkout, or demo success redirect
    } catch {
      setError("Le paiement n'a pas pu démarrer. Réessaie.");
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
          Choisis ton plan
        </h1>
        <p className="mt-2 text-center text-[15px] text-slate-500">
          Ta première recherche est prête. Choisis un plan pour voir tes résultats.
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
                <p className="mt-1 text-[11px] text-slate-400">TVA 20% incluse</p>
                <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-[13px]">
                  <p className="font-semibold text-slate-900">{p.monthly.toLocaleString("fr-FR")} crédits/mois</p>
                  <p className="text-slate-500">Renouvelés chaque mois</p>
                </div>

                <ul className="mt-4 flex-1 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
                      <Check size={15} className="mt-0.5 shrink-0 text-[#0051FF]" strokeWidth={2.5} /> {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => subscribe(p.id)}
                  disabled={busy !== null}
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${
                    popular
                      ? "bg-[#0051FF] text-white hover:bg-[#0041cc]"
                      : "border border-slate-300 text-slate-900 hover:bg-slate-50"
                  }`}
                >
                  {busy === p.id ? <Loader2 size={16} className="animate-spin" /> : null}
                  Commencer
                </button>
              </div>
            );
          })}
        </div>

        <p className="mt-6 text-center text-[13px] text-slate-500">
          Prix TTC · TVA 20% incluse · Les entreprises peuvent renseigner leur n° de TVA au paiement · Annulable à tout moment
        </p>
      </div>
    </div>
  );
}
