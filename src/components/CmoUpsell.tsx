import Link from "next/link";
import type { Plan } from "@/lib/types";

export default function CmoUpsell({ currentPlan }: { currentPlan: Plan }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-lg flex-col items-center justify-center text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="10" width="16" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      </span>
      <span className="chip border-primary/20 bg-primary/5 text-primary">Pro</span>
      <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
        Loger, ton CMO IA
      </h1>
      <p className="mt-2 text-muted">
        Un directeur marketing IA qui analyse, décide et te prépare ton contenu —
        tu valides en 30 secondes. Loger est réservé à l&apos;offre{" "}
        <strong>Pro</strong>.
      </p>
      <Link href="/settings" className="btn-primary mt-6">
        Passer à Pro
      </Link>
      <p className="mt-3 text-xs text-muted">
        Plan actuel : {currentPlan}. (Démo : change ton plan dans Paramètres.)
      </p>
    </div>
  );
}
