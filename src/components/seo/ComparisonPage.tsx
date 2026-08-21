import Link from "next/link";
import { Check } from "lucide-react";
import JsonLd from "@/components/JsonLd";
import { BTN_P, LandingFooter, LandingNavbar } from "@/components/LandingPage";
import { LangProvider } from "@/components/lpLang";
import { COMPETITORS, type Competitor } from "@/lib/competitors";
import { breadcrumbSchema, faqSchema } from "@/lib/schema";
import Breadcrumb from "./Breadcrumb";

// Reusable template for /vs/loglead-vs-<slug> and /alternative/<slug>-alternative.
export default function ComparisonPage({ c, mode }: { c: Competitor; mode: "vs" | "alternative" }) {
  const isVs = mode === "vs";
  const h1 = isVs ? `LogLead vs ${c.name}` : `The best ${c.name} alternative`;
  const crumbTop = isVs
    ? { name: "Compare", path: "/vs/loglead-vs-lemlist" }
    : { name: "Alternatives", path: "/alternative/lemlist-alternative" };
  const currentPath = isVs ? `/vs/loglead-vs-${c.slug}` : `/alternative/${c.slug}-alternative`;
  const trail = [
    { name: "Home", path: "/" },
    crumbTop,
    { name: isVs ? `vs ${c.name}` : `${c.name} alternative`, path: currentPath },
  ];

  // Internal links to the other comparison pages (topic cluster).
  const related = COMPETITORS.filter((x) => x.slug !== c.slug).slice(0, 4);

  return (
    <LangProvider>
      <div className="min-h-screen bg-white font-sans antialiased">
        <LandingNavbar />
        <JsonLd data={faqSchema(c.faq)} />
        <JsonLd data={breadcrumbSchema(trail)} />

        <section className="lp-light px-5 pb-16 pt-28 sm:px-6">
          <article className="mx-auto max-w-3xl">
            <Breadcrumb trail={trail} />

            <span className="inline-flex rounded-full bg-[#0051FF10] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">
              {isVs ? "Honest comparison" : `${c.name} alternative`}
            </span>
            <h1 className="mt-4 text-[34px] font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-[44px]">
              {h1}
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-slate-600">
              {isVs
                ? `A factual, side-by-side look at how LogLead and ${c.name} approach B2B growth — so you can pick the right tool for your motion.`
                : `Looking for a ${c.name} alternative? Here is an honest comparison and why B2B teams choose LogLead for LinkedIn-led growth.`}
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-slate-500">
              <strong className="text-slate-700">What {c.name} is:</strong> {c.intro}
            </p>

            <div className="mt-7">
              <Link href="/signup" className={BTN_P}>See why companies choose LogLead</Link>
              <p className="mt-2 text-[13px] text-slate-400">Free to start · 100 credits · no credit card required.</p>
            </div>

            {/* Comparison table */}
            <h2 className="mt-14 text-[24px] font-bold tracking-tight text-slate-900">
              LogLead vs {c.name}: side by side
            </h2>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full border-collapse text-[14px]">
                <thead>
                  <tr className="bg-slate-50 text-left">
                    <th className="px-4 py-3 font-semibold text-slate-500">Feature</th>
                    <th className="px-4 py-3 font-semibold text-[#0051FF]">LogLead</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">{c.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {c.rows.map((r) => (
                    <tr key={r.feature} className="border-t border-slate-100">
                      <td className="px-4 py-3 font-medium text-slate-700">{r.feature}</td>
                      <td className="px-4 py-3 text-slate-800">{r.loglead}</td>
                      <td className="px-4 py-3 text-slate-600">{r.them}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Why LogLead */}
            <h2 className="mt-14 text-[24px] font-bold tracking-tight text-slate-900">Why B2B teams choose LogLead</h2>
            <ul className="mt-4 space-y-3">
              {c.whyLoglead.map((w) => (
                <li key={w} className="flex items-start gap-3 text-[15px] leading-relaxed text-slate-600">
                  <Check size={18} className="mt-0.5 shrink-0 text-[#0051FF]" strokeWidth={2.5} />
                  {w}
                </li>
              ))}
            </ul>

            {/* Honesty: when the competitor is better */}
            <h2 className="mt-14 text-[24px] font-bold tracking-tight text-slate-900">When {c.name} is the better choice</h2>
            <p className="mt-2 text-[15px] text-slate-500">{c.name} is a strong fit if:</p>
            <ul className="mt-3 space-y-2">
              {c.whenThem.map((w) => (
                <li key={w} className="flex items-start gap-2 text-[15px] leading-relaxed text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" /> {w}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[14px] text-slate-500">
              {c.name} is best for {c.bestFor}
            </p>

            {/* FAQ */}
            <h2 className="mt-14 text-[24px] font-bold tracking-tight text-slate-900">Frequently asked questions</h2>
            <div className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {c.faq.map((f) => (
                <details key={f.q} className="group px-4 py-3">
                  <summary className="cursor-pointer list-none text-[15px] font-semibold text-slate-800 marker:hidden">
                    {f.q}
                  </summary>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{f.a}</p>
                </details>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-14 rounded-2xl bg-slate-900 p-8 text-center">
              <h2 className="text-[24px] font-bold text-white">Turn LinkedIn into your #1 acquisition channel</h2>
              <p className="mx-auto mt-2 max-w-md text-[15px] text-slate-300">
                Find warm prospects, generate content in your voice, and track your AI visibility — start free.
              </p>
              <Link href="/signup" className={`${BTN_P} mt-5`}>See why companies choose LogLead</Link>
            </div>

            {/* Internal linking (topic cluster) */}
            <h2 className="mt-14 text-[18px] font-bold text-slate-900">More comparisons</h2>
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
    </LangProvider>
  );
}
