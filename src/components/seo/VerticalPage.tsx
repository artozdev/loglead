"use client";

import Link from "next/link";
import { Check, X } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { BTN_P, LandingFooter, LandingNavbar } from "@/components/LandingPage";
import { LangProvider, useTr } from "@/components/lpLang";
import { VERTICALS, type Vertical } from "@/lib/verticals";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import Breadcrumb from "./Breadcrumb";

export default function VerticalPage({ v }: { v: Vertical }) {
  return (
    <LangProvider>
      <Body v={v} />
    </LangProvider>
  );
}

function Body({ v }: { v: Vertical }) {
  const t = useTr();
  const path = `/for/${v.slug}`;
  const tiles = [
    { val: "4-in-1", label: t("Market · Leads · Content · AI visibility", "Marché · Leads · Contenu · Visibilité IA") },
    { val: "100", label: t("Free credits to start", "Crédits gratuits pour démarrer") },
    { val: "€0", label: t("No credit card required", "Sans carte bancaire") },
    { val: t("Minutes", "Minutes"), label: t("Setup, works out of the box", "Prêt à l'emploi") },
  ];
  const trail = [
    { name: t("Home", "Accueil"), path: "/" },
    { name: "Solutions", path: "/for/saas-founders" },
    { name: t(v.h1.en, v.h1.fr), path },
  ];
  const schemaTrail = [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/for/saas-founders" },
    { name: v.h1.en, path },
  ];
  const related = VERTICALS.filter((x) => x.slug !== v.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <LandingNavbar />
      <JsonLd data={faqSchema(v.faq.map((f) => ({ q: f.q.en, a: f.a.en })))} />
      <JsonLd data={breadcrumbSchema(schemaTrail)} />

      <section className="lp-light px-5 pb-16 pt-28 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <Breadcrumb trail={trail} />
          <span className="inline-flex rounded-full bg-[#0051FF10] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">
            {t("For", "Pour")} {t(v.name.en, v.name.fr)}
          </span>
          <h1 className="mt-4 max-w-3xl text-[36px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[48px]">
            {t(v.h1.en, v.h1.fr)}
          </h1>
          <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-600">{t(v.intro.en, v.intro.fr)}</p>
          <div className="mt-7">
            <Link href="/signup" className={BTN_P}>{t(v.ctaLabel.en, v.ctaLabel.fr)}</Link>
            <p className="mt-2 text-[13px] text-slate-400">{t("Free to start · 100 credits · no credit card required.", "Gratuit au départ · 100 crédits · sans carte bancaire.")}</p>
          </div>

          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {tiles.map((tile) => (
              <div key={String(tile.val) + String(tile.label)} className="rounded-2xl border border-slate-200 p-4">
                <div className="text-[24px] font-bold text-slate-900">{tile.val}</div>
                <div className="mt-1 text-[12px] text-slate-500">{tile.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-light px-5 pb-4 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[26px] font-bold tracking-tight text-slate-900">{t(v.problem.title.en, v.problem.title.fr)}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {v.problem.points.map((p) => (
              <div key={p.en} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <X size={17} className="mt-0.5 shrink-0 text-red-500" strokeWidth={2.5} />
                <p className="text-[14px] leading-relaxed text-slate-600">{t(p.en, p.fr)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-light px-5 py-14 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[26px] font-bold tracking-tight text-slate-900">{t("How LogLead solves it", "Comment LogLead résout ça")}</h2>
          <div className="mt-6 space-y-4">
            {v.solutions.map((s, i) => (
              <div key={s.feature.en} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0051FF] text-[15px] font-bold text-white">{i + 1}</span>
                <div>
                  <h3 className="text-[17px] font-bold text-slate-900">{t(s.feature.en, s.feature.fr)}</h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{t(s.desc.en, s.desc.fr)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#0051FF]/20 bg-[#0051FF08] p-5">
            <Check size={20} className="mt-0.5 shrink-0 text-[#0051FF]" strokeWidth={2.5} />
            <p className="text-[15px] font-medium text-slate-800">{t(v.fit.en, v.fit.fr)}</p>
          </div>
        </div>
      </section>

      <section className="lp-light px-5 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-[26px] font-bold tracking-tight text-slate-900">{t("Frequently asked questions", "Questions fréquentes")}</h2>
          <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {v.faq.map((f) => (
              <details key={f.q.en} className="px-4 py-3">
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-slate-800">{t(f.q.en, f.q.fr)}</summary>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{t(f.a.en, f.a.fr)}</p>
              </details>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-slate-900 p-8 text-center">
            <h2 className="text-[24px] font-bold text-white">{t(v.ctaLabel.en, v.ctaLabel.fr)}</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-slate-300">{t("Start free with 100 credits — market intelligence, content and warm leads in one place.", "Commence gratuitement avec 100 crédits — veille marché, contenu et leads chauds au même endroit.")}</p>
            <Link href="/signup" className={`${BTN_P} mt-5`}>{t(v.ctaLabel.en, v.ctaLabel.fr)}</Link>
          </div>

          <h2 className="mt-14 text-[18px] font-bold text-slate-900">{t("LogLead for other teams", "LogLead pour d'autres équipes")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/for/${r.slug}`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] text-slate-600 transition hover:border-[#0051FF]/40 hover:text-slate-900"
              >
                {t("For", "Pour")} {t(r.name.en, r.name.fr)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-[#0A0A0A]">
        <LandingFooter tone="dark" />
      </div>
    </div>
  );
}
