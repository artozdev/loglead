"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Footer, Nav } from "./LandingV5";
import { Reveal } from "./LandingPage";
import { LangProvider } from "./lpLang";
import { FOR_NAV, type ForPage } from "@/lib/forPages";

const SIGNUP = "/signup";
const BTN = "inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_0_20px_#0051FF40] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_#0051FF70]";
const BTN_SEC = "inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#E2E8F0] px-7 py-3.5 text-[15px] text-[#475569] transition hover:border-[#0051FF60] hover:text-[#0F172A]";
const EY = "inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[12px] font-medium text-[#475569]";

function scoreColor(n: number) {
  return n > 80 ? "#10B981" : n >= 60 ? "#F59E0B" : "#EF4444";
}

// Hero demo — a static chat mockup with the query, agent reply and results.
function DemoChat({ page }: { page: ForPage }) {
  return (
    <div className="mx-auto mt-10 w-full max-w-[560px] space-y-3 text-left">
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-[14px_14px_4px_14px] bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-4 py-2.5 text-[13.5px] leading-relaxed text-white shadow-[0_10px_26px_-12px_rgba(0,81,255,0.6)]">
          {page.demoUser}
        </div>
      </div>
      <div className="rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_16px_44px_-16px_rgba(15,23,42,0.2)]">
        <div className="flex items-start gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[11px] font-bold text-white">L</span>
          <div className="text-[13.5px] leading-relaxed text-[#334155]">
            {page.demoAgent.map((l, i) => <div key={i}>{l}</div>)}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-[#EFF4FF] px-3 py-1.5 text-[12px] font-semibold text-[#0051FF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0051FF]" /> {page.demoSummary}
        </div>
        <div className="mt-3 space-y-2">
          {page.results.map((r, i) => (
            <div key={i} className="v5-rise flex items-center gap-2.5 rounded-lg border border-[#EEF2F7] bg-[#FBFCFE] px-3 py-2" style={{ animationDelay: `${i * 0.15}s` }}>
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#EFF4FF] text-[11px] font-bold text-[#0051FF]">{r.name[0]}</span>
              <span className="truncate text-[13px] font-medium text-[#0F172A]">{r.name}</span>
              <span className="hidden gap-1 sm:flex">
                {r.cols.map((c, j) => <span key={j} className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748B]">{c}</span>)}
              </span>
              {r.tag && <span className="text-[12px]">{r.tag}</span>}
              <span className="ml-auto flex shrink-0 items-center gap-1 text-[12px] font-bold text-[#0F172A]"><span className="h-2 w-2 rounded-full" style={{ background: scoreColor(r.score) }} />{r.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Sticky CTA that appears after 400px of scroll.
function StickyCta() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const on = () => setShow(window.scrollY > 400);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 transition-all duration-300 ${show ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0"}`}>
      <div className="mx-auto mb-3 flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-[#E2E8F0] bg-[#FFFFFFF2] px-4 py-3 shadow-[0_16px_44px_-14px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:mx-auto sm:w-[calc(100%-2rem)]">
        <span className="truncate text-[13px] font-medium text-[#0F172A]">LogLead — Find your ideal clients automatically.</span>
        <Link href={SIGNUP} className={`${BTN} shrink-0 !px-4 !py-2 !text-[13px]`}>Start free →</Link>
      </div>
    </div>
  );
}

export default function ForPageLayout({ page }: { page: ForPage }) {
  return (
    <LangProvider>
      <div className="min-h-screen bg-white font-sans antialiased">
        <Nav solid />

        {/* Hero */}
        <section className="relative overflow-hidden px-5 pb-20 pt-16 sm:px-6">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="v5-blob v5-blob-a" style={{ left: "10%", top: "10%", width: 380, height: 320, background: "#0051FF", opacity: 0.08 }} />
            <div className="v5-blob v5-blob-b" style={{ right: "8%", top: "4%", width: 320, height: 280, background: "#6E56FF", opacity: 0.07 }} />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            <Reveal><span className={EY}><span className="text-[#0085FF]">✦</span> {page.badge}</span></Reveal>
            <Reveal delay={80}>
              <h1 className="mx-auto mt-5 max-w-2xl text-[34px] font-bold leading-[1.06] tracking-[-0.03em] text-[#0F172A] sm:text-[50px]">
                {page.titleTop}<br /><span className="v5-gradient-text">{page.titleGradient}</span>
              </h1>
            </Reveal>
            <Reveal delay={140}><p className="mx-auto mt-5 max-w-[540px] text-[16px] leading-[1.7] text-[#475569]">{page.description}</p></Reveal>
            <Reveal delay={200}><div className="mt-7"><Link href={SIGNUP} className={BTN}>{page.heroCta}</Link></div></Reveal>
            <Reveal delay={260}><DemoChat page={page} /></Reveal>
          </div>
        </section>

        {/* The real problem */}
        <section className="bg-[#F8FAFC] px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="mx-auto max-w-2xl text-center text-[30px] font-bold leading-tight tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">{page.problemTitle}</h2>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {page.problems.map((p, i) => (
                <Reveal key={i} className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
                  <p className="flex items-start gap-2 text-[16px] font-semibold text-[#0F172A]"><span className="text-[#EF4444]">✕</span> {p.title}</p>
                  <p className="mt-2 pl-6 text-[14px] leading-relaxed text-[#475569]">{p.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <span className={EY}><span className="text-[#0085FF]">✦</span> The solution</span>
              <h2 className="mx-auto mt-5 max-w-2xl text-[30px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">{page.solutionTitle}</h2>
            </div>
            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {page.features.map((f, i) => (
                <Reveal key={i} className="flex flex-col rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-[17px] font-semibold text-[#0F172A]">{f.name}</h3>
                    {f.tag && <span className="rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-2 py-0.5 text-[10px] font-semibold text-white">{f.tag}</span>}
                  </div>
                  <p className="mt-3 flex-1 text-[14px] leading-relaxed text-[#475569]">{f.body}</p>
                  {f.signal && <p className="mt-4 rounded-lg bg-[#EFF4FF] px-3 py-2 text-[12px] font-medium text-[#0051FF]">Signal: {f.signal}</p>}
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-[#F8FAFC] px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className={EY}><span className="text-[#0085FF]">✦</span> How it works</span>
              <h2 className="mt-5 text-[30px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">Set it up once.<br /><span className="v5-gradient-text">Let it run.</span></h2>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {page.steps.map((s) => (
                <Reveal key={s.n} className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(0,81,255,0.5)]">{s.n}</span>
                  <h3 className="mt-3 text-[15px] font-semibold text-[#0F172A]">{s.title}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-[#475569]">{s.body}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center">
              <span className={EY}><span className="text-[#0085FF]">✦</span> Expected results</span>
              <h2 className="mt-5 text-[30px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">What you can expect.</h2>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {page.metrics.map((m, i) => (
                <Reveal key={i} className="rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center">
                  <p className="num text-[28px] font-bold text-[#0F172A] sm:text-[32px]">{m.big}</p>
                  <p className="mt-1.5 text-[12.5px] leading-tight text-[#475569]">{m.small}</p>
                </Reveal>
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] text-[#94A3B8]">{/* TODO: replace with real user data */}Indicative figures — replace with your real metrics.</p>
          </div>
        </section>

        {/* Testimonial */}
        <section className="bg-[#F8FAFC] px-5 py-24 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-[#F59E0B]">★★★★★</p>
            <p className="mt-4 text-[20px] font-medium leading-relaxed text-[#0F172A] sm:text-[24px]">&ldquo;{page.testimonial.quote}&rdquo;</p>
            <p className="mt-5 text-[14px] font-semibold text-[#0F172A]">{page.testimonial.name}</p>
            <p className="text-[13px] text-[#94A3B8]">{page.testimonial.role}</p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 py-28 sm:px-6" style={{ background: "linear-gradient(180deg,#0051FF08,#FFFFFF)" }}>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-[34px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F172A] sm:text-[48px]">{page.ctaTitle}</h2>
            <p className="mx-auto mt-5 max-w-lg text-[17px] text-[#475569]">{page.ctaSubtitle}</p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href={SIGNUP} className={BTN}>{page.ctaPrimary}</Link>
              <Link href={SIGNUP} className={BTN_SEC}>{page.ctaSecondary}</Link>
            </div>
          </div>
        </section>

        {/* Also built for */}
        <section className="border-t border-[#E2E8F0] px-5 py-12 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[12px] font-semibold uppercase tracking-wide text-[#94A3B8]">Also built for</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              {FOR_NAV.map((a) => a.slug === page.slug ? (
                <span key={a.slug} className="inline-flex cursor-default items-center gap-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-[14px] font-medium text-[#94A3B8]">
                  <span>{a.icon}</span> {a.label}
                </span>
              ) : (
                <Link key={a.slug} href={`/for/${a.slug}`} className="inline-flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 py-2.5 text-[14px] font-medium text-[#0F172A] transition hover:border-[#0051FF60] hover:shadow-[0_10px_28px_-14px_rgba(15,23,42,0.2)]">
                  <span>{a.icon}</span> {a.label}
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Footer showCta={false} />
        <StickyCta />
      </div>
    </LangProvider>
  );
}
