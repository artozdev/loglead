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
  const [freeBusy, setFreeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Escape hatch: continue on the free tier (100 one-time credits) so the user
  // is never trapped behind the paid-plan wall — unlocks the dashboard.
  async function startFree() {
    if (busy || freeBusy) return;
    setFreeBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/plan", { method: "POST" });
      if (!res.ok) {
        setError("Impossible de continuer. Réessaie.");
        setFreeBusy(false);
        return;
      }
      router.push("/dashboard");
    } catch {
      setError("Impossible de continuer. Réessaie.");
      setFreeBusy(false);
    }
  }

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
        <div className="mt-6 flex flex-col items-center gap-2">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1">
            <button onClick={() => setBilling("monthly")} className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${billing === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Mensuel</button>
            <button onClick={() => setBilling("annual")} className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition ${billing === "annual" ? "bg-[#0051FF] text-white" : "text-slate-500 hover:text-slate-700"}`}>
              Annuel
              <span className="relative inline-flex overflow-hidden rounded-full bg-gradient-to-r from-[#0051FF] to-[#0085FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                <span aria-hidden data-shine className="pointer-events-none absolute inset-y-0 -inset-x-2" style={{ background: "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.85) 50%, transparent 70%)", animation: "lp-shine 2.4s ease-in-out infinite" }} />
                <span className="relative">−20% DE RÉDUCTION</span>
              </span>
            </button>
          </div>
          <p className="text-[12px] font-semibold text-[#16A34A]">{billing === "annual" ? "Tu économises 20% en facturation annuelle 🎉" : "Économise 20% — passe en facturation annuelle"}</p>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {/* Plan cards — Growth (popular) raised & framed as the special offer */}
        <div className="mt-12 grid w-full items-start gap-5 md:grid-cols-3">
          {PLAN_CARDS.map((p) => {
            const popular = p.popular;
            const saved = (p.priceMonthly - price(p)) * 12;
            const banner = billing === "annual" ? "OFFRE SPÉCIALE ANNUELLE · −20% DE RÉDUCTION" : "LE PLUS POPULAIRE";
            const cta = popular && billing === "annual" ? "Réclamez l'offre annuelle" : "Commencer";
            const inner = (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-slate-400">{p.name}</p>
                  {billing === "annual" && saved > 0 && (
                    <span className="rounded-full bg-[#0051FF]/10 px-2 py-0.5 text-[11px] font-bold text-[#0051FF]">Économisez €{saved}/an</span>
                  )}
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  {billing === "annual" && <span className="text-[16px] font-medium leading-none text-slate-400 line-through">€{p.priceMonthly}</span>}
                  <span className="text-[36px] font-extrabold leading-none text-slate-900">€{price(p)}</span>
                  <span className="text-[14px] text-slate-500">/mo</span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400">TVA 20% incluse · {billing === "annual" ? "facturé annuellement" : "facturé mensuellement"}</p>
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
                  className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${popular ? "bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-white shadow-[0_10px_24px_-10px_rgba(0,81,255,0.8)] hover:brightness-110" : "border border-slate-300 text-slate-900 hover:bg-slate-50"}`}
                >
                  {busy === p.id ? <Loader2 size={16} className="animate-spin" /> : null}
                  {cta}
                </button>
              </>
            );
            if (popular) {
              return (
                <div key={p.id} className="relative md:-translate-y-6">
                  <div className="overflow-hidden rounded-[24px] bg-gradient-to-b from-[#0051FF] to-[#0085FF] p-[3px] shadow-[0_34px_80px_-30px_rgba(0,81,255,0.7)]">
                    <div className="flex items-center justify-center gap-1.5 px-5 py-2.5 text-center text-[11px] font-bold uppercase tracking-[0.05em] text-white">
                      <Star size={12} fill="currentColor" /> {banner}
                    </div>
                    <div className="flex flex-col rounded-[21px] bg-white p-6">{inner}</div>
                  </div>
                </div>
              );
            }
            return (
              <div key={p.id} className="flex flex-col rounded-[24px] border border-slate-200 bg-white p-6 transition hover:border-slate-300">{inner}</div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            onClick={startFree}
            disabled={freeBusy || busy !== null}
            className="inline-flex items-center gap-2 text-[14px] font-medium text-slate-500 underline-offset-4 transition hover:text-slate-800 hover:underline disabled:opacity-60"
          >
            {freeBusy && <Loader2 size={15} className="animate-spin" />}
            Continuer gratuitement (100 crédits) →
          </button>
          <p className="text-center text-[13px] text-slate-500">
            Prix TTC · TVA 20% incluse · Les entreprises peuvent renseigner leur n° de TVA au paiement · Annulable à tout moment
          </p>
        </div>
      </div>
    </div>
  );
}
