import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/Logo";
import PricingView from "@/components/PricingView";

export const metadata: Metadata = {
  title: "Tarifs — LogLead",
  description:
    "Choisissez votre offre LogLead — Starter, Growth ou Pro. Essai gratuit 14 jours sans carte bancaire.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-30 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="LogLead — accueil">
            <Logo size={26} withWordmark />
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-ghost">Se connecter</Link>
            <Link href="/signup" className="btn-primary">Commencer</Link>
          </div>
        </div>
      </header>
      <PricingView />
    </div>
  );
}
