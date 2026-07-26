import Link from "next/link";
import type { Plan } from "@/lib/types";

export default function LeadsUpsell({ currentPlan }: { currentPlan: Plan }) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-lg flex-col items-center justify-center text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-white">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" />
        </svg>
      </span>
      <span className="chip border-primary/20 bg-primary/5 text-primary">Growth · Pro</span>
      <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight">
        Tes leads, centralisés
      </h1>
      <p className="mt-2 text-muted">
        Tous les prospects générés par ton contenu — Reddit, LinkedIn, X,
        Instagram, site web — dans une liste unique, enrichie et actionnable. Le
        module Leads est disponible à partir de l&apos;offre <strong>Growth</strong>.
      </p>
      <Link href="/settings" className="btn-primary mt-6">
        Passer à Growth
      </Link>
      <p className="mt-3 text-xs text-muted">
        Plan actuel : {currentPlan}. (Démo : change ton plan dans Paramètres.)
      </p>
    </div>
  );
}
