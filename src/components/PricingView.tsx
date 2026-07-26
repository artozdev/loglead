"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Billing = "monthly" | "annual";

type Plan = {
  id: string;
  name: string;
  monthly: number;
  annual: number; // per-month price when billed annually
  tagline: string;
  cta: string;
  href: string;
  featured?: boolean;
  trial?: boolean;
  badge?: string;
  highlights: string[];
};

const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    monthly: 29,
    annual: 23,
    tagline: "Pour démarrer sa présence réseaux sociaux",
    cta: "Commencer gratuitement",
    href: "/signup?plan=starter",
    highlights: [
      "30 générations de contenu / mois",
      "1 plateforme connectée",
      "Calendrier éditorial",
      "10 templates disponibles",
      "Analytics basiques (30 jours)",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 59,
    annual: 47,
    tagline: "Pour transformer ses réseaux en machine à leads",
    cta: "Démarrer l'essai gratuit 14 jours",
    href: "/signup?plan=growth",
    featured: true,
    trial: true,
    badge: "Le plus populaire",
    highlights: [
      "100 générations de contenu / mois",
      "4 plateformes connectées",
      "Clonage de structure virale",
      "Bibliothèque de templates complète + lead magnets",
      "Publication automatique + Analytics complets (6 mois)",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthly: 99,
    annual: 79,
    tagline: "Pour déléguer entièrement à l'IA",
    cta: "Démarrer l'essai gratuit 14 jours",
    href: "/signup?plan=pro",
    trial: true,
    highlights: [
      "Générations illimitées",
      "5 workspaces (startups)",
      "Agent IA autonome (V1.2)",
      "Rapport mensuel automatique",
      "Analytics illimités + support dédié",
    ],
  },
];

const INCLUDED_ALL = [
  "Onboarding IA (analyse URL de ton SaaS)",
  "Calendrier éditorial",
  "Score de contenu IA",
  "Profil de personnalisation (ton, ICP, concurrents)",
  "Support par email",
];

type Cell = boolean | string;
type Section = { title: string; rows: { label: string; cells: [Cell, Cell, Cell] }[] };

const SECTIONS: Section[] = [
  {
    title: "Studio IA",
    rows: [
      { label: "Générations de contenu / mois", cells: ["30", "100", "Illimitées"] },
      { label: "Variantes générées par contenu", cells: ["1", "3", "5"] },
      { label: "Types de contenu (post, reel, story, script)", cells: ["Posts uniquement", "Tous les formats", "Tous les formats"] },
      { label: "Clonage de structure virale", cells: [false, true, true] },
      { label: "Historique & versioning des contenus", cells: [false, true, true] },
    ],
  },
  {
    title: "Calendrier & publication",
    rows: [
      { label: "Calendrier éditorial", cells: [true, true, true] },
      { label: "Plateformes connectées", cells: ["1", "3", "3"] },
      { label: "Publication automatique", cells: [false, true, true] },
      { label: "Programmation avancée (heure optimale IA)", cells: [false, false, true] },
    ],
  },
  {
    title: "Templates & ressources",
    rows: [
      { label: "Bibliothèque de templates", cells: ["10 templates", "Complète (30+)", "Complète (30+)"] },
      { label: "Types de templates (post, reel, story, guide)", cells: ["Posts uniquement", "Tous les formats", "Tous les formats"] },
      { label: "Lead magnets prêts à poster", cells: [false, true, true] },
      { label: "Mise à jour mensuelle des templates", cells: [false, true, true] },
    ],
  },
  {
    title: "Analytics",
    rows: [
      { label: "Dashboard analytics", cells: ["Basique", "Complet", "Complet"] },
      { label: "Métriques suivies (vues, likes, engagement, partages)", cells: ["3 métriques", "Toutes", "Toutes"] },
      { label: "Historique des données", cells: ["30 jours", "6 mois", "Illimité"] },
      { label: "Répartition par plateforme et type de contenu", cells: [false, true, true] },
      { label: "Top contenus performants", cells: [false, true, true] },
      { label: "Rapport mensuel automatique (PDF)", cells: [false, false, true] },
    ],
  },
  {
    title: "Workspaces & collaboration",
    rows: [
      { label: "Workspaces (startups gérées)", cells: ["1", "2", "5"] },
      { label: "Membres par workspace", cells: ["1", "1", "3"] },
      { label: "Mode collaboration (inviter un assistant)", cells: [false, false, true] },
    ],
  },
  {
    title: "Intelligence artificielle",
    rows: [
      { label: "Personnalisation IA (ton, ICP, concurrents)", cells: [true, true, true] },
      { label: "Score de contenu IA", cells: [true, true, true] },
      { label: "Clonage de structure virale", cells: [false, true, true] },
      { label: "Programmation à l'heure optimale (IA)", cells: [false, false, true] },
      { label: "Agent IA autonome (V1.2)", cells: [false, false, true] },
    ],
  },
  {
    title: "Support",
    rows: [
      { label: "Support email", cells: [true, true, true] },
      { label: "Support prioritaire", cells: [false, true, true] },
      { label: "Support dédié (account manager)", cells: [false, false, true] },
      { label: "Onboarding personnalisé", cells: [false, false, true] },
    ],
  },
];

export default function PricingView() {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [mobilePlan, setMobilePlan] = useState(1); // Growth by default on mobile
  const [showSticky, setShowSticky] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = cardsRef.current;
      if (el) setShowSticky(el.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const price = (p: Plan) => (billing === "monthly" ? p.monthly : p.annual);
  const growth = PLANS[1];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      {/* Bloc 1 — header */}
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Choisissez votre offre
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Tout ce dont un founder SaaS a besoin pour transformer ses réseaux en machine à prospects.
        </p>
        <BillingToggle billing={billing} setBilling={setBilling} />
      </div>

      {/* Bloc 2 — cards */}
      <div
        ref={cardsRef}
        className="mt-10 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:items-start md:overflow-visible md:pb-0"
      >
        {PLANS.map((p) => (
          <PlanCard key={p.id} plan={p} price={price(p)} billing={billing} />
        ))}
      </div>

      {/* Bloc 3 — comparison table */}
      <div className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold tracking-tight">
          Comparez les fonctionnalités en détail
        </h2>

        {/* Mobile plan selector */}
        <div className="mt-6 flex justify-center md:hidden">
          <div className="inline-flex rounded-xl border border-line bg-surface p-1">
            {PLANS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setMobilePlan(i)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  mobilePlan === i ? "bg-primary/10 text-primary" : "text-muted"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        {/* Included in all plans */}
        <div className="mt-6 rounded-2xl border border-success/30 bg-success/[0.06] p-5">
          <div className="flex items-center gap-2">
            <CheckIcon className="text-success" />
            <span className="font-display text-sm font-semibold text-ink">Inclus dans tous les plans</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {INCLUDED_ALL.map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 text-sm text-ink/70">
                <CheckIcon className="text-muted/70" small />
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-line">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="w-2/5 px-4 py-4 text-left" />
                {PLANS.map((p, i) => (
                  <th
                    key={p.id}
                    className={`px-4 py-4 text-center align-top ${colCls(i, mobilePlan)} ${
                      p.featured ? "bg-primary/[0.05]" : ""
                    }`}
                  >
                    <div className={`font-display text-base font-semibold ${p.featured ? "text-primary" : "text-ink"}`}>
                      {p.name}
                    </div>
                    <div className="num mt-0.5 text-xs font-medium text-muted">{price(p)} € / mois</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section) => (
                <FeatureSection key={section.title} section={section} mobilePlan={mobilePlan} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom CTAs */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {PLANS.map((p) => (
            <Link
              key={p.id}
              href={p.href}
              className={`text-center ${p.featured ? "btn-primary" : "btn-secondary"}`}
            >
              {p.cta}
            </Link>
          ))}
        </div>
      </div>

      {/* Sticky bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur transition-transform duration-300 ease-smooth ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <span className="font-display text-sm font-semibold text-ink">{growth.name}</span>
            <span className="chip ml-2 border-primary/20 bg-primary/5 text-primary">{growth.badge}</span>
            <span className="num ml-2 hidden text-sm text-muted sm:inline">
              {price(growth)} € / mois
            </span>
          </div>
          <Link href={growth.href} className="btn-primary shrink-0 !py-2 text-sm">
            Démarrer l&apos;essai gratuit
          </Link>
        </div>
      </div>
    </div>
  );
}

function BillingToggle({ billing, setBilling }: { billing: Billing; setBilling: (b: Billing) => void }) {
  return (
    <div className="mt-6 inline-flex items-center gap-2 rounded-xl border border-line bg-surface p-1">
      <button
        onClick={() => setBilling("monthly")}
        className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
          billing === "monthly" ? "bg-primary/10 text-primary" : "text-muted"
        }`}
      >
        Mensuel
      </button>
      <button
        onClick={() => setBilling("annual")}
        className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-medium transition ${
          billing === "annual" ? "bg-primary/10 text-primary" : "text-muted"
        }`}
      >
        Annuel
        <span className="chip border-success/20 bg-success/10 text-success">-20 %</span>
      </button>
    </div>
  );
}

function PlanCard({ plan, price, billing }: { plan: Plan; price: number; billing: Billing }) {
  return (
    <div
      className={`relative flex w-[86%] shrink-0 snap-center flex-col rounded-2xl border bg-surface p-6 md:w-auto ${
        plan.featured
          ? "border-2 border-primary shadow-pop md:-mt-3 md:pb-8"
          : "border-line"
      }`}
    >
      {plan.badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-gradient px-3 py-1 text-xs font-semibold text-white shadow-soft">
          {plan.badge}
        </span>
      )}
      <div className="font-display text-lg font-semibold text-ink">{plan.name}</div>
      <p className="mt-1 min-h-[40px] text-sm text-muted">{plan.tagline}</p>

      <div className="mt-4 flex items-baseline gap-1.5">
        <span className="num font-display text-[28px] font-bold tracking-tight text-ink">{price} €</span>
        <span className="text-sm text-muted">/mois</span>
      </div>
      <p className="mt-1 text-xs text-muted">
        {billing === "monthly"
          ? `ou ${plan.annual} €/mois facturé annuellement`
          : `soit ${plan.annual * 12} € facturé annuellement`}
      </p>

      <Link
        href={plan.href}
        className={`mt-5 w-full text-center ${plan.featured ? "btn-primary" : "btn-secondary"}`}
      >
        {plan.cta}
      </Link>
      {plan.trial && (
        <p className="mt-2 text-center text-xs text-muted">14 jours gratuits · Sans carte bancaire</p>
      )}

      <ul className="mt-6 space-y-2.5">
        {plan.highlights.map((h) => (
          <li key={h} className="flex items-start gap-2 text-sm text-ink/80">
            <CheckIcon className="mt-0.5 shrink-0 text-primary" small />
            <span>{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FeatureSection({ section, mobilePlan }: { section: Section; mobilePlan: number }) {
  return (
    <>
      <tr>
        <td colSpan={4} className="bg-canvas px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">
          {section.title}
        </td>
      </tr>
      {section.rows.map((row, ri) => (
        <tr key={row.label} className="group border-b border-line/70 last:border-0 hover:bg-primary/[0.03]">
          <td className={`px-4 py-3 text-ink/80 ${ri % 2 === 1 ? "bg-[#FAFBFD] group-hover:bg-transparent" : ""}`}>
            {row.label}
          </td>
          {row.cells.map((c, i) => (
            <td
              key={i}
              className={`px-4 py-3 text-center ${colCls(i, mobilePlan)} ${
                i === 1 ? "bg-primary/[0.04] group-hover:bg-primary/[0.06]" : ri % 2 === 1 ? "bg-[#FAFBFD] group-hover:bg-transparent" : ""
              }`}
            >
              <CellValue v={c} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function CellValue({ v }: { v: Cell }) {
  if (v === true) return <CheckIcon className="mx-auto text-success" />;
  if (v === false) return <span className="text-muted/50">—</span>;
  return <span className="text-sm font-medium text-ink/80">{v}</span>;
}

function CheckIcon({ className = "", small = false }: { className?: string; small?: boolean }) {
  const s = small ? 15 : 18;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className={`inline-block ${className}`}>
      <path d="m5 12 5 5 9-11" />
    </svg>
  );
}

// Column visibility: on mobile show only the selected plan column; all on md+.
function colCls(i: number, mobilePlan: number) {
  return i === mobilePlan ? "" : "hidden md:table-cell";
}
