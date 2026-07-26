"use client";

import {
  CalendarDays,
  Check,
  ChevronDown,
  Home,
  Lightbulb,
  Link2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

// ---------------------------------------------------------------------------
// Dashboard getting-started checklist. Steps complete automatically (derived
// or marked server-side); the block hides itself for good once everything is
// done, or when the user dismisses it (retrievable from Paramètres).
// ---------------------------------------------------------------------------

type StepIcon = React.ComponentType<{ size?: number; strokeWidth?: number }>;

type Step = {
  id: string;
  icon: StepIcon;
  tone: string; // icon tile classes
  title: string;
  optional?: boolean;
  text: string;
  cta: string;
  href: string;
};

const STEPS: Step[] = [
  {
    id: "profile",
    icon: Home,
    tone: "bg-primary/10 text-primary",
    title: "Complète ton profil SaaS",
    text: "Ton profil SaaS permet à LogLead de personnaliser toutes tes recommandations et contenus. Plus il est précis, meilleurs sont les résultats.",
    cta: "Compléter mon profil",
    href: "/settings?tab=saas",
  },
  {
    id: "algo_insider",
    icon: Lightbulb,
    tone: "bg-violet-100 text-violet-600",
    title: "Découvre les recommandations de ta niche",
    text: "L'Algo Insider analyse les algorithmes de LinkedIn, X, Instagram et Reddit selon ta niche. Il te dit exactement quoi poster, quand et dans quel format pour être vu par les bonnes personnes.",
    cta: "Ouvrir l'Algo Insider",
    href: "/algo-insider",
  },
  {
    id: "studio",
    icon: Sparkles,
    tone: "bg-sky-100 text-sky-600",
    title: "Génère ton premier contenu",
    text: "Le Studio IA génère des posts LinkedIn, scripts de Reels, threads X et légendes Instagram en quelques secondes — dans ta voix, pour ton audience. Choisis un format, donne un sujet ou colle un lien viral, et c'est parti.",
    cta: "Ouvrir le Studio IA",
    href: "/studio",
  },
  {
    id: "calendar",
    icon: CalendarDays,
    tone: "bg-emerald-100 text-emerald-600",
    title: "Planifie ta première publication",
    text: "Place ton premier contenu dans le calendrier éditorial. LogLead affiche les créneaux optimaux pour ta niche directement dans la grille. Un contenu planifié a 3x plus de chances d'être publié qu'un contenu en brouillon.",
    cta: "Ouvrir le calendrier",
    href: "/calendar",
  },
  {
    id: "connections",
    icon: Link2,
    tone: "bg-surface-hover text-muted",
    title: "Connecte tes réseaux sociaux",
    optional: true,
    text: "Connecte LinkedIn, X, Instagram ou Reddit pour publier automatiquement depuis LogLead sans jamais ouvrir l'application du réseau. Facultatif — tu peux aussi copier-coller manuellement dans un premier temps.",
    cta: "Connecter mes réseaux",
    href: "/settings?tab=connexions",
  },
];

async function persist(body: Record<string, unknown>) {
  try {
    await fetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    /* best effort */
  }
}

export default function OnboardingChecklist({ completed }: { completed: string[] }) {
  const done = new Set(completed);
  const allDone = STEPS.every((s) => done.has(s.id));
  const count = STEPS.filter((s) => done.has(s.id)).length;

  const firstOpen = STEPS.findIndex((s) => !done.has(s.id));
  const [open, setOpen] = useState<number | null>(firstOpen === -1 ? null : firstOpen);
  const [congrats, setCongrats] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);

  // Completion sequence: green bar → congrats after 1s → fade-out + persist
  // after 3s. Runs when the dashboard loads with every step checked.
  useEffect(() => {
    if (!allDone) return;
    const t1 = setTimeout(() => setCongrats(true), 1000);
    const t2 = setTimeout(() => {
      setLeaving(true);
      void persist({ dismissed: true });
    }, 3000);
    const t3 = setTimeout(() => setHidden(true), 3400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [allDone]);

  function dismiss() {
    if (!window.confirm("Masquer ce guide ? Tu pourras le retrouver dans les Paramètres.")) return;
    setLeaving(true);
    void persist({ dismissed: true });
    setTimeout(() => setHidden(true), 320);
  }

  if (hidden) return null;

  return (
    <div
      className={`rounded-xl border border-line bg-canvas px-6 py-5 transition-all duration-300 ease-out ${
        leaving ? "-translate-y-2 opacity-0" : "opacity-100"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-medium text-ink">
            Démarrez avec LogLead et générez vos premiers leads
          </h2>
          <p className="mt-0.5 text-[13px] text-muted">
            Suivez ces étapes pour configurer votre compte et publier votre premier contenu.
          </p>
        </div>
        <button onClick={dismiss} className="shrink-0 text-[12px] text-faint transition hover:text-ink">
          Masquer
        </button>
      </div>

      {/* Progress */}
      <div className="mt-4 flex items-center gap-3">
        <span className={`num shrink-0 text-[13px] ${allDone ? "font-medium text-success" : "text-muted"}`}>
          {allDone ? "Tout est prêt ! 🎉" : `${count} sur ${STEPS.length} étapes terminées`}
        </span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-hover">
          <div
            className={`h-full rounded-full transition-[width] duration-[400ms] ease-out ${allDone ? "bg-success" : "bg-primary"}`}
            style={{ width: `${(count / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {congrats ? (
        <div className="py-8 text-center">
          <p className="text-[15px] font-medium text-ink">
            🎉 Tu es prêt à transformer ton SaaS en machine à leads !
          </p>
          <p className="mt-1 text-[13px] text-muted">Tout est configuré. LogLead va faire le reste.</p>
        </div>
      ) : (
        <div className="mt-2">
          {STEPS.map((s, i) => {
            const isDone = done.has(s.id);
            const isOpen = open === i;
            const I = s.icon;
            return (
              <div key={s.id} className="border-b border-line last:border-b-0">
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 py-3.5 text-left"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                      isDone ? "bg-success/10 text-success" : s.tone
                    }`}
                  >
                    {isDone ? <Check size={16} strokeWidth={2.5} /> : <I size={15} strokeWidth={1.5} />}
                  </span>
                  <span
                    className={`flex-1 text-[14px] ${
                      isDone ? "text-faint line-through" : "text-ink"
                    }`}
                  >
                    {s.title}
                    {s.optional && <span className="ml-2 text-[11px] font-normal text-faint no-underline">Facultatif</span>}
                  </span>
                  <span className={`shrink-0 text-faint transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                    <ChevronDown size={15} strokeWidth={1.5} />
                  </span>
                </button>

                {/* Accordion body — CSS grid-rows height animation */}
                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                    isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="pb-4 pl-11 pr-2 text-[13px] leading-relaxed text-muted">
                      {s.text}
                      <div className="mt-3">
                        <Link href={s.href} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:underline">
                          {s.cta} →
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
