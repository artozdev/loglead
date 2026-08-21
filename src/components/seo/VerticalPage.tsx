import Link from "next/link";
import { Check, X } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { BTN_P, LandingFooter, LandingNavbar } from "@/components/LandingPage";
import { LangProvider } from "@/components/lpLang";
import { VERTICALS, type Vertical } from "@/lib/verticals";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import Breadcrumb from "./Breadcrumb";

const TILES = [
  { v: "4-in-1", l: "Market · Leads · Content · AI visibility" },
  { v: "100", l: "Free credits to start" },
  { v: "€0", l: "No credit card required" },
  { v: "Minutes", l: "Setup, works out of the box" },
];

export default function VerticalPage({ v }: { v: Vertical }) {
  const path = `/for/${v.slug}`;
  const trail = [
    { name: "Home", path: "/" },
    { name: "Solutions", path: "/for/saas-founders" },
    { name: v.h1, path },
  ];
  const related = VERTICALS.filter((x) => x.slug !== v.slug).slice(0, 4);

  return (
    <LangProvider>
      <div className="min-h-screen bg-white font-sans antialiased">
        <LandingNavbar />
        <JsonLd data={faqSchema(v.faq)} />
        <JsonLd data={breadcrumbSchema(trail)} />

        <section className="lp-light px-5 pb-16 pt-28 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <Breadcrumb trail={trail} />
            <span className="inline-flex rounded-full bg-[#0051FF10] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">
              For {v.name}
            </span>
            <h1 className="mt-4 max-w-3xl text-[36px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[48px]">
              {v.h1}
            </h1>
            <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-slate-600">{v.intro}</p>
            <div className="mt-7">
              <Link href="/signup" className={BTN_P}>{v.ctaLabel}</Link>
              <p className="mt-2 text-[13px] text-slate-400">Free to start · 100 credits · no credit card required.</p>
            </div>

            {/* Honest capability tiles (no fabricated results). */}
            <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {TILES.map((t) => (
                <div key={t.l} className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-[24px] font-bold text-slate-900">{t.v}</div>
                  <div className="mt-1 text-[12px] text-slate-500">{t.l}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Problem */}
        <section className="lp-light px-5 pb-4 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-[26px] font-bold tracking-tight text-slate-900">{v.problem.title}</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {v.problem.points.map((p) => (
                <div key={p} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <X size={17} className="mt-0.5 shrink-0 text-red-500" strokeWidth={2.5} />
                  <p className="text-[14px] leading-relaxed text-slate-600">{p}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="lp-light px-5 py-14 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-[26px] font-bold tracking-tight text-slate-900">How LogLead solves it</h2>
            <div className="mt-6 space-y-4">
              {v.solutions.map((s, i) => (
                <div key={s.feature} className="flex gap-4 rounded-2xl border border-slate-200 p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0051FF] text-[15px] font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-[17px] font-bold text-slate-900">{s.feature}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-600">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-2xl border border-[#0051FF]/20 bg-[#0051FF08] p-5">
              <Check size={20} className="mt-0.5 shrink-0 text-[#0051FF]" strokeWidth={2.5} />
              <p className="text-[15px] font-medium text-slate-800">{v.fit}</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="lp-light px-5 pb-16 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-[26px] font-bold tracking-tight text-slate-900">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {v.faq.map((f) => (
                <details key={f.q} className="px-4 py-3">
                  <summary className="cursor-pointer list-none text-[15px] font-semibold text-slate-800">{f.q}</summary>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>

            {/* Final CTA */}
            <div className="mt-12 rounded-2xl bg-slate-900 p-8 text-center">
              <h2 className="text-[24px] font-bold text-white">{v.ctaLabel}</h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-slate-300">
                Start free with 100 credits — market intelligence, content and warm leads in one place.
              </p>
              <Link href="/signup" className={`${BTN_P} mt-5`}>{v.ctaLabel}</Link>
            </div>

            {/* Internal linking */}
            <h2 className="mt-14 text-[18px] font-bold text-slate-900">LogLead for other teams</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/for/${r.slug}`}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-[13px] text-slate-600 transition hover:border-[#0051FF]/40 hover:text-slate-900"
                >
                  For {r.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <div className="bg-[#0A0A0A]">
          <LandingFooter tone="dark" />
        </div>
      </div>
    </LangProvider>
  );
}
