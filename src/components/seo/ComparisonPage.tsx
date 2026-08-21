"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { BTN_P, LandingFooter, LandingNavbar } from "@/components/LandingPage";
import { LangProvider, useTr } from "@/components/lpLang";
import { COMPETITORS, type Competitor } from "@/lib/competitors";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import Breadcrumb from "./Breadcrumb";

export default function ComparisonPage({ c, mode }: { c: Competitor; mode: "vs" | "alternative" }) {
  return (
    <LangProvider>
      <Body c={c} mode={mode} />
    </LangProvider>
  );
}

function Body({ c, mode }: { c: Competitor; mode: "vs" | "alternative" }) {
  const t = useTr();
  const isVs = mode === "vs";
  const h1 = isVs ? `LogLead vs ${c.name}` : t(`The best ${c.name} alternative`, `La meilleure alternative à ${c.name}`);
  const currentPath = isVs ? `/vs/loglead-vs-${c.slug}` : `/alternative/${c.slug}-alternative`;
  const trail = [
    { name: t("Home", "Accueil"), path: "/" },
    isVs ? { name: t("Compare", "Comparatifs"), path: `/vs/loglead-vs-lemlist` } : { name: t("Alternatives", "Alternatives"), path: `/alternative/lemlist-alternative` },
    { name: isVs ? `vs ${c.name}` : t(`${c.name} alternative`, `Alternative à ${c.name}`), path: currentPath },
  ];
  // Schema in English (canonical SEO language).
  const schemaTrail = [
    { name: "Home", path: "/" },
    { name: isVs ? "Compare" : "Alternatives", path: isVs ? "/vs/loglead-vs-lemlist" : "/alternative/lemlist-alternative" },
    { name: isVs ? `vs ${c.name}` : `${c.name} alternative`, path: currentPath },
  ];
  const related = COMPETITORS.filter((x) => x.slug !== c.slug).slice(0, 4);

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <LandingNavbar />
      <JsonLd data={faqSchema(c.faq.map((f) => ({ q: f.q.en, a: f.a.en })))} />
      <JsonLd data={breadcrumbSchema(schemaTrail)} />

      <section className="lp-light px-5 pb-16 pt-28 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <Breadcrumb trail={trail} />

          <span className="inline-flex rounded-full bg-[#0051FF10] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">
            {isVs ? t("Honest comparison", "Comparatif honnête") : t(`${c.name} alternative`, `Alternative à ${c.name}`)}
          </span>
          <h1 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[44px]">{h1}</h1>
          <p className="mt-4 text-[17px] leading-relaxed text-slate-600">
            {isVs
              ? t(
                  `A factual, side-by-side look at how LogLead and ${c.name} approach B2B growth — so you can pick the right tool for your motion.`,
                  `Un comparatif factuel, côte à côte, de la façon dont LogLead et ${c.name} abordent la croissance B2B — pour choisir le bon outil selon ta stratégie.`,
                )
              : t(
                  `Looking for a ${c.name} alternative? Here is an honest comparison and why B2B teams choose LogLead for LinkedIn-led growth.`,
                  `Tu cherches une alternative à ${c.name} ? Voici un comparatif honnête et pourquoi les équipes B2B choisissent LogLead pour une croissance pilotée par LinkedIn.`,
                )}
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
            <strong className="text-slate-700">{t(`What ${c.name} is:`, `Ce qu'est ${c.name} :`)}</strong> {t(c.intro.en, c.intro.fr)}
          </p>

          <div className="mt-7">
            <Link href="/signup" className={BTN_P}>{t("See why companies choose LogLead", "Découvre pourquoi les entreprises choisissent LogLead")}</Link>
            <p className="mt-2 text-[13px] text-slate-400">{t("Free to start · 100 credits · no credit card required.", "Gratuit au départ · 100 crédits · sans carte bancaire.")}</p>
          </div>

          <h2 className="mt-14 text-[24px] font-bold tracking-tight text-slate-900">{t(`LogLead vs ${c.name}: side by side`, `LogLead vs ${c.name} : côte à côte`)}</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="bg-slate-50 text-left">
                  <th className="px-4 py-3 font-semibold text-slate-500">{t("Feature", "Fonctionnalité")}</th>
                  <th className="px-4 py-3 font-semibold text-[#0051FF]">LogLead</th>
                  <th className="px-4 py-3 font-semibold text-slate-700">{c.name}</th>
                </tr>
              </thead>
              <tbody>
                {c.rows.map((r) => (
                  <tr key={r.feature.en} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-700">{t(r.feature.en, r.feature.fr)}</td>
                    <td className="px-4 py-3 text-slate-800">{t(r.loglead.en, r.loglead.fr)}</td>
                    <td className="px-4 py-3 text-slate-600">{t(r.them.en, r.them.fr)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="mt-14 text-[24px] font-bold tracking-tight text-slate-900">{t("Why B2B teams choose LogLead", "Pourquoi les équipes B2B choisissent LogLead")}</h2>
          <ul className="mt-4 space-y-3">
            {c.whyLoglead.map((w) => (
              <li key={w.en} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-600">
                <Check size={18} className="mt-0.5 shrink-0 text-[#0051FF]" strokeWidth={2.5} />
                {t(w.en, w.fr)}
              </li>
            ))}
          </ul>

          <h2 className="mt-14 text-[24px] font-bold tracking-tight text-slate-900">{t(`When ${c.name} is the better choice`, `Quand ${c.name} est le meilleur choix`)}</h2>
          <p className="mt-2 text-[15px] text-slate-500">{t(`${c.name} is a strong fit if:`, `${c.name} est un bon choix si :`)}</p>
          <ul className="mt-3 space-y-2">
            {c.whenThem.map((w) => (
              <li key={w.en} className="flex items-start gap-2 text-[15px] leading-relaxed text-slate-600">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" /> {t(w.en, w.fr)}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[14px] text-slate-500">{t(`${c.name} is best for `, `${c.name} est idéal pour `)}{t(c.bestFor.en, c.bestFor.fr)}</p>

          <h2 className="mt-14 text-[24px] font-bold tracking-tight text-slate-900">{t("Frequently asked questions", "Questions fréquentes")}</h2>
          <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {c.faq.map((f) => (
              <details key={f.q.en} className="px-4 py-3">
                <summary className="cursor-pointer list-none text-[15px] font-semibold text-slate-800">{t(f.q.en, f.q.fr)}</summary>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{t(f.a.en, f.a.fr)}</p>
              </details>
            ))}
          </div>

          <div className="mt-14 rounded-2xl bg-slate-900 p-8 text-center">
            <h2 className="text-[24px] font-bold text-white">{t("Turn LinkedIn into your #1 acquisition channel", "Fais de LinkedIn ton canal d'acquisition n°1")}</h2>
            <p className="mx-auto mt-2 max-w-md text-[15px] text-slate-300">{t("Find warm prospects, generate content in your voice, and track your AI visibility — start free.", "Trouve des prospects chauds, génère du contenu dans ta voix et suis ta visibilité IA — commence gratuitement.")}</p>
            <Link href="/signup" className={`${BTN_P} mt-5`}>{t("See why companies choose LogLead", "Découvre pourquoi les entreprises choisissent LogLead")}</Link>
          </div>

          <h2 className="mt-14 text-[18px] font-bold text-slate-900">{t("More comparisons", "Plus de comparatifs")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={r.hasVs ? `/vs/loglead-vs-${r.slug}` : `/alternative/${r.slug}-alternative`}
                className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] text-slate-600 transition hover:border-[#0051FF]/40 hover:text-slate-900"
              >
                LogLead vs {r.name}
              </Link>
            ))}
          </div>
        </article>
      </section>

      <div className="bg-[#0A0A0A]">
        <LandingFooter tone="dark" />
      </div>
    </div>
  );
}
