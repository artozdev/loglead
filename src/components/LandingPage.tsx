"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LangProvider, useLang, useTr } from "./lpLang";
import UrlAnalyzer from "./UrlAnalyzer";

// ---------------------------------------------------------------------------
// LogLead — landing v4. White base with sections alternating light / dark
// "bands" for a modern feel. Tone is set per <section> via .lp-light / .lp-dark
// (globals.css); inner elements read CSS vars so they flip with the tone.
// Motion via IntersectionObserver + CSS (no Framer Motion); custom canvas
// particles; all gated by prefers-reduced-motion.
// ---------------------------------------------------------------------------

const SIGNUP = "/signup";

const NAV = [
  { href: "/#features", en: "Product", fr: "Produit" },
  { href: "/pricing", en: "Pricing", fr: "Tarifs" },
  { href: "/#tools", en: "Free Tools", fr: "Outils gratuits" },
  { href: "/affiliate", en: "Affiliate", fr: "Affiliation" },
];

// Tone helpers for inner elements.
const FG = "text-[color:var(--lp-fg)]";
const MUTED = "text-[color:var(--lp-muted)]";
const FAINT = "text-[color:var(--lp-faint)]";
const CARD = "bg-[color:var(--lp-card)]";
const SURFACE = "bg-[color:var(--lp-surface)]";
const BORDER = "border-[color:var(--lp-border)]";

// ----- Primitives ----------------------------------------------------------

export function Reveal({ children, className = "", delay = 0, as: Tag = "div", style, id }: {
  children: React.ReactNode; className?: string; delay?: number; as?: "div" | "section" | "li" | "tr"; style?: React.CSSProperties; id?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setSeen(true), { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag ref={ref as never} id={id} className={`reveal ${seen ? "is-visible" : ""} ${className}`} style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

export function CountUp({ to, suffix = "", prefix = "", duration = 1200 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [v, setV] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setV(to);
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        setV(Math.round((1 - Math.pow(1 - p, 3)) * to));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [to, duration]);
  return <span ref={ref}>{prefix}{v.toLocaleString("en-US")}{suffix}</span>;
}

export const BTN_P = "lp-btn-primary inline-flex items-center justify-center gap-1.5 rounded-xl px-5 py-2.5 text-[14px] font-semibold";

// Text-roll on hover (see .lp-roll in globals.css).
export function Roll({ children }: { children: React.ReactNode }) {
  return (
    <span className="lp-roll"><span>{children}</span><span aria-hidden>{children}</span></span>
  );
}

// Official LogLead logo — dark variant (white wordmark) on dark backgrounds,
// light variant (dark wordmark) on light ones. Both preloaded to avoid a flash.
function LogoMark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loglead-logo.svg" alt="LogLead" draggable={false} className={`h-7 w-auto ${dark ? "hidden" : "block"}`} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/loglead-logo-appicon.svg" alt="LogLead" draggable={false} className={`h-7 w-auto ${dark ? "block" : "hidden"}`} />
    </span>
  );
}

export function SectionTitle({ badge, title, sub, className = "" }: { badge?: string; title: React.ReactNode; sub?: React.ReactNode; className?: string }) {
  return (
    <Reveal className={`mx-auto max-w-2xl text-center ${className}`}>
      {badge && <span className="mb-4 inline-flex rounded-full bg-[#0051FF10] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">{badge}</span>}
      <h2 className={`text-[32px] font-extrabold leading-[1.03] tracking-[-0.04em] sm:text-[46px] ${FG}`}>{title}</h2>
      {sub && <p className={`mt-4 text-[17px] leading-relaxed ${MUTED}`}>{sub}</p>}
    </Reveal>
  );
}

// ----- Page ----------------------------------------------------------------

export default function LandingPage() {
  return (
    <LangProvider>
      <div className="min-h-screen bg-white font-sans antialiased">
        <LandingNavbar />
        <Hero />
        <Problem />
        <Process />
        <Comparison />
        <Testimonials />
        {/* From the FAQ down: everything is black. The white Testimonials above has
            a rounded bottom and sits over this black region for the white→black seam. */}
        <div className="relative z-0 -mt-10 bg-[#0A0A0A]">
          <FAQ tone="dark" />
          <FinalCTA />
          <LandingFooter tone="dark" />
        </div>
        <CookieBanner />
      </div>
    </LangProvider>
  );
}

// ----- Navbar (shared, light) ----------------------------------------------

export function LandingNavbar() {
  const [tone, setTone] = useState<"light" | "dark">("dark"); // hero is dark
  const [open, setOpen] = useState(false);
  const { lang, setLang } = useLang();
  const t = useTr();

  // Marketing pages use a white base; restore on leave (app is theme-driven).
  useEffect(() => {
    const pb = document.body.style.backgroundColor, ph = document.documentElement.style.backgroundColor;
    document.body.style.backgroundColor = "#FFFFFF";
    document.documentElement.style.backgroundColor = "#FFFFFF";
    return () => { document.body.style.backgroundColor = pb; document.documentElement.style.backgroundColor = ph; };
  }, []);

  // Adapt the pill's colours to the section currently behind it.
  useEffect(() => {
    const update = () => {
      const el = document.elementFromPoint(window.innerWidth / 2, 92) as HTMLElement | null;
      const sec = el?.closest?.(".lp-dark, .lp-light");
      if (sec) setTone(sec.classList.contains("lp-dark") ? "dark" : "light");
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, []);

  const dark = tone === "dark";
  // Fully transparent bar (no fill, no blur) — only the text/button colours
  // adapt to the section behind it. The mobile dropdown keeps a solid panel.
  const panel = dark ? "bg-[#0A0A0A]/90 backdrop-blur-lg" : "bg-white/90 backdrop-blur-lg";
  const login = dark
    ? "border border-[#2A2A2A] text-white hover:bg-[#141414]"
    : "border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC]";
  const cta = dark ? "bg-white text-[#0A0A0A] hover:bg-[#EAEAEA]" : "bg-[#0A0A0A] text-white hover:bg-[#1A1A1A]";

  return (
    <header
      className="sticky top-0 z-50 w-full bg-transparent backdrop-blur-md transition-colors duration-300"
      style={{ color: dark ? "#F0F4FF" : "#0F172A" }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" aria-label="Loglead"><LogoMark dark={dark} /></Link>

        <div className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="lp-navlink rounded-lg px-3 py-2 text-[14px] font-medium text-current opacity-75 transition hover:opacity-100">
              <Roll>{t(n.en, n.fr)}</Roll>
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          <Link href="/login" className={`lp-navcta inline-flex items-center justify-center rounded-xl px-4 py-2 text-[13px] font-semibold transition ${login}`}>
            <Roll>{t("Log in", "Se connecter")}</Roll>
          </Link>
          <Link href={SIGNUP} className={`lp-navcta inline-flex items-center justify-center rounded-xl px-4 py-2 text-[13px] font-semibold transition ${cta}`}>
            <Roll>{t("Start for free", "Commencer gratuitement")}</Roll>
          </Link>
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            aria-label="Change language"
            className={`inline-flex items-center justify-center rounded-xl px-3 py-2 text-[13px] font-semibold transition ${login}`}
          >
            {lang === "fr" ? "FR" : "ENG"}
          </button>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="text-current lg:hidden" aria-label="Menu">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className={`px-5 py-4 lg:hidden ${panel}`}>
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-[15px] font-medium text-current opacity-80 hover:opacity-100">{t(n.en, n.fr)}</a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link href="/login" onClick={() => setOpen(false)} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[14px] font-semibold ${login}`}>{t("Log in", "Se connecter")}</Link>
              <Link href={SIGNUP} onClick={() => setOpen(false)} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[14px] font-semibold ${cta}`}>{t("Start for free", "Commencer gratuitement")}</Link>
              <button onClick={() => setLang(lang === "fr" ? "en" : "fr")} className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-[14px] font-semibold ${login}`}>{lang === "fr" ? "Passer en anglais (ENG)" : "Switch to French (FR)"}</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ----- Hero (dark band) ----------------------------------------------------

function Hero() {
  const t = useTr();
  return (
    <section
      className="lp-dark relative -mt-16 overflow-hidden px-5 pb-44 pt-28 sm:px-6 sm:pt-32"
      style={{
        background: "#2475F5 url('/hero-bg.svg') center top / cover no-repeat",
      }}
    >
      {/* Bottom fade into the white section */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 py-1 pl-1 pr-3.5 text-[13px] font-medium text-white backdrop-blur-sm">
            <span className="rounded-full bg-white px-2 py-0.5 text-[12px] font-semibold text-[#1D4ED8]">New</span>
            {t("AI-Powered · LinkedIn Growth Platform", "Plateforme de croissance LinkedIn dopée à l'IA")}
          </span>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mx-auto mt-8 max-w-3xl text-[36px] font-extrabold leading-[1.03] tracking-[-0.045em] text-white sm:text-[54px] lg:text-[62px]">
            {t(<>Make LinkedIn your<br />growth engine.</>, <>Faites de LinkedIn votre<br />moteur de croissance.</>)}
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-[520px] text-[16px] leading-[1.7] text-white/80">
            {t("The AI solution to turn your enterprise into a lead machine on LinkedIn.", "La solution IA qui transforme votre entreprise en machine à leads sur LinkedIn.")}
          </p>
        </Reveal>
        <Reveal delay={240} id="tools" className="mt-8"><UrlAnalyzer /></Reveal>
        <Reveal delay={320}>
          <div className="mt-7 flex items-center justify-center gap-3">
            <div className="flex -space-x-2">
              {["#0051FF", "#00A3FF", "#4F8BFF", "#00D4FF", "#1A6BFF"].map((c, i) => (
                <span key={i} className="h-8 w-8 rounded-full border-2 border-white" style={{ background: c }} />
              ))}
            </div>
            <span className="text-[13px] font-medium text-[#475569]">{t("500+ B2B teams growing with LogLead", "500+ équipes B2B en croissance avec LogLead")}</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ----- Process (light band) ------------------------------------------------

function Process() {
  const t = useTr();
  const steps = [
    { n: "01", feature: t("Market Intelligence", "Veille marché"), head: t("Know what's happening before your competitors.", "Sachez ce qui se passe avant vos concurrents."), body: t("LogLead scans LinkedIn in real time to detect trends, competitor activity and buying signals in your market — so you're always one step ahead.", "LogLead scanne LinkedIn en temps réel pour détecter les tendances, l'activité des concurrents et les signaux d'achat de votre marché — pour toujours avoir un coup d'avance."), visual: <MiniMarket /> },
    { n: "02", feature: t("Lead Intelligence", "Détection de prospects"), head: t("Your ideal customers, found and scored by AI.", "Vos clients idéaux, trouvés et notés par l'IA."), body: t("LogLead identifies decision-makers matching your ICP, enriches their data automatically and scores each prospect from 0 to 10 based on buying signals.", "LogLead identifie les décideurs correspondant à votre ICP, enrichit automatiquement leurs données et note chaque prospect de 0 à 10 selon les signaux d'achat."), visual: <MiniLeads /> },
    { n: "03", feature: t("Content Studio", "Studio de contenu"), head: t("LinkedIn content in your voice. Not AI's.", "Du contenu LinkedIn dans votre voix. Pas celle d'une IA."), body: t("The Content Studio generates posts based on real market trends and your prospects' pain points. Every post sounds exactly like you.", "Le Studio de contenu génère des posts à partir des vraies tendances du marché et des problèmes de vos prospects. Chaque post vous ressemble exactement."), visual: <MiniContent /> },
    { n: "04", feature: t("Signals & Opportunities", "Signaux & Opportunités"), head: t("Every interaction becomes a sales opportunity.", "Chaque interaction devient une opportunité commerciale."), body: t("LogLead detects who engaged with your content, qualifies each profile and tells you exactly who to contact, when and what to say.", "LogLead détecte qui a interagi avec votre contenu, qualifie chaque profil et vous dit exactement qui contacter, quand et quoi dire."), visual: <MiniLead /> },
  ];
  return (
    <section id="features" className="lp-light px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionTitle badge={t("Features", "Fonctionnalités")} title={t(<>Everything you need to grow.<br /><span className="text-[#0051FF]">In one system.</span></>, <>Tout ce qu'il faut pour croître.<br /><span className="text-[#0051FF]">Dans un seul système.</span></>)} sub={t("Market intelligence, leads, content and signals — connected, not scattered across six tools.", "Veille marché, prospects, contenu et signaux — connectés, pas éparpillés dans six outils.")} />

        <div className="mt-16 space-y-14 md:space-y-20">
          {steps.map((s, i) => (
            <Reveal key={s.n} className="grid items-center gap-8 md:grid-cols-2 md:gap-14">
              {/* Content */}
              <div className={i % 2 ? "md:order-2" : ""}>
                <span className="inline-flex rounded-lg bg-[#0051FF10] px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">{s.feature}</span>
                <h3 className={`mt-4 text-[26px] font-extrabold leading-[1.08] tracking-[-0.035em] ${FG}`}>{s.head}</h3>
                <p className={`mt-3 text-[16px] leading-relaxed ${MUTED}`}>{s.body}</p>
                {s.n === "02" && (
                  <div className="mt-4 inline-flex flex-col rounded-xl border border-[#0051FF30] bg-[#0051FF0A] px-4 py-3">
                    <p className="text-[26px] font-bold text-[#0051FF]"><CountUp to={47} /> {t("qualified prospects", "prospects qualifiés")}</p>
                    <p className={`text-[13px] ${MUTED}`}>{t("found in 23 seconds", "trouvés en 23 secondes")}</p>
                  </div>
                )}
                {s.n === "04" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[t("ICP 96%", "ICP 96%"), t("Intent 92%", "Intention 92%"), t("4 recent signals", "4 signaux récents")].map((chip, ci) => (
                      <span key={ci} className="rounded-full bg-[#0051FF10] px-3 py-1 text-[12px] font-semibold text-[#0051FF]">{chip}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Framed product screenshot */}
              <div className={`group ${i % 2 ? "md:order-1" : ""}`}>
                <div className="overflow-hidden rounded-2xl border border-[#E9EDF3] bg-white shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)] transition duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_34px_70px_-24px_rgba(0,81,255,0.35)]">
                  <div className="flex items-center gap-1.5 border-b border-[#EEF2F7] px-4 py-2.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#E2E8F0]" />
                  </div>
                  <div className="p-4">{s.visual}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Action-driving CTA — dark card with a soft blue glow */}
        <Reveal className="relative mt-20 overflow-hidden rounded-[28px] px-6 py-14 text-center sm:px-10 sm:py-16" style={{ background: "#0A0A0A" }}>
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-[-10%] h-[340px] w-[620px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(ellipse at center, #0051FF40, transparent 68%)" }} />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-20%] mx-auto h-[220px] w-[420px] rounded-full" style={{ background: "radial-gradient(ellipse at center, #0051FF22, transparent 70%)" }} />
          <div className="relative">
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#6A7690]">{t("Turn LinkedIn activity into pipeline", "Transformer l'activité LinkedIn en pipeline")}</p>
            <h3 className="mx-auto mt-4 max-w-2xl text-[30px] font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-[44px]">{t("See your first qualified leads in minutes.", "Vos premiers prospects qualifiés en quelques minutes.")}</h3>
            <p className="mx-auto mt-4 max-w-md text-[16px] leading-relaxed text-[#8B9EC4]">{t("Connect LinkedIn, set your niche — LogLead surfaces the prospects worth your time.", "Connectez LinkedIn, définissez votre niche — LogLead fait remonter les prospects qui comptent.")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href={SIGNUP} className={`${BTN_P} !px-6 !py-3 !text-[14px]`} style={{ boxShadow: "0 0 34px #0051FF60" }}><Roll>{t("Start for free", "Commencer gratuitement")}</Roll></Link>
              <a href="#" className="lp-navcta inline-flex items-center justify-center rounded-xl border border-[#2A2A2A] px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-[#141414]"><Roll>{t("See LogLead in action", "Découvrez LogLead en action")}</Roll></a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function MiniCard({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
function Bar({ label, w, pct }: { label: string; w: number; pct: string }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-[12px]">
      <span className={`w-28 shrink-0 ${MUTED}`}>{label}</span>
      <div className={`h-1.5 flex-1 overflow-hidden rounded-full ${CARD}`}><div className="h-full rounded-full" style={{ width: `${w}%`, background: "linear-gradient(135deg,#0051FF,#00D4FF)" }} /></div>
      <span className="w-10 shrink-0 text-right text-[#16A34A]">↑{pct}</span>
    </div>
  );
}
function MiniMarket() { return <MiniCard><p className={`mb-2 text-[13px] font-semibold ${FG}`}>Trending topics</p><Bar label="AI Recruitment" w={92} pct="42%" /><Bar label="HR Automation" w={64} pct="28%" /><Bar label="Remote Hiring" w={72} pct="31%" /></MiniCard>; }
function MiniLeads() {
  return <MiniCard>{[["Thomas M.", "CEO", 9], ["Julie B.", "HR Director", 8], ["Marc D.", "Founder", 8]].map(([n, r, s]) => (
    <div key={n as string} className={`flex items-center gap-3 border-b ${BORDER} py-2 last:border-b-0`}>
      <span className="h-7 w-7 rounded-full" style={{ background: "linear-gradient(135deg,#0051FF,#00D4FF)" }} />
      <div className="min-w-0 flex-1"><p className={`truncate text-[12px] font-medium ${FG}`}>{n}</p><p className={`text-[11px] ${MUTED}`}>{r}</p></div>
      <span className="rounded-md bg-[#0051FF20] px-1.5 py-0.5 text-[11px] font-bold text-[#0051FF]">{s}/10 🔥</span>
    </div>
  ))}</MiniCard>;
}
function MiniContent() { return <MiniCard><div className={`flex items-center justify-between rounded-lg ${CARD} px-3 py-2`}><span className={`text-[11px] ${MUTED}`}>HOOK SCORE</span><span className="text-[16px] font-bold text-[#16A34A]">94/100</span></div><p className={`mt-3 text-[13px] font-medium leading-snug ${FG}`}>&quot;Why do your best prospects stop replying to your messages?&quot;</p></MiniCard>; }
function MiniLead() { return <MiniCard><div className="flex items-center gap-3"><span className="h-9 w-9 rounded-full" style={{ background: "linear-gradient(135deg,#0051FF,#00D4FF)" }} /><div><p className={`text-[13px] font-semibold ${FG}`}>Thomas R.</p><p className={`text-[11px] ${MUTED}`}>Founder · BuildFast</p></div><span className="ml-auto text-[16px] font-bold text-[#0051FF]">🔥 94</span></div><p className={`mt-3 rounded-lg ${CARD} px-3 py-2 text-[12px] ${MUTED}`}>Signal: liked your last 3 posts</p></MiniCard>; }

// ----- Comparison: Loglead vs a marketing team (light band) ----------------

function Comparison() {
  const t = useTr();
  const left = [
    { icon: "🔎", t: t("Market research", "Étude de marché"), day: t("Day 1", "Jour 1"), tag: t("By hand", "À la main") },
    { icon: "👥", t: t("Finding prospects", "Trouver des prospects"), day: t("Day 4", "Jour 4"), tag: t("Separate tool", "Outil séparé") },
    { icon: "✍️", t: t("Writing content", "Rédiger le contenu"), day: t("Day 8", "Jour 8"), tag: t("Separate tool", "Outil séparé") },
  ];
  const right = [
    { icon: "🔎", t: t("Market research", "Étude de marché"), day: t("Day 1", "Jour 1"), tag: t("Automatic", "Automatique") },
    { icon: "👥", t: t("Finding prospects", "Trouver des prospects"), day: t("Day 1", "Jour 1"), tag: t("Same system", "Même système") },
    { icon: "✍️", t: t("Writing content", "Rédiger le contenu"), day: t("Day 1", "Jour 1"), tag: t("Same system", "Même système") },
  ];
  return (
    <section id="compare" className="lp-light px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionTitle
          badge={t("How it works", "Comment ça marche")}
          title={t(<>Loglead <span className="text-[color:var(--lp-faint)]">vs</span> <span className="lp-gradient-text">a marketing team</span></>, <>Loglead <span className="text-[color:var(--lp-faint)]">vs</span> <span className="lp-gradient-text">une équipe marketing</span></>)}
          sub={t("One goal. The same journey. See how each approach handles it.", "Un objectif. Le même parcours. Voyez comment chaque approche s'en sort.")}
        />

        <Reveal className={`mt-14 grid overflow-hidden rounded-[20px] border ${BORDER} md:grid-cols-2`}>
          {/* Left — marketing team */}
          <div className={`border-b ${BORDER} p-6 md:border-b-0 md:border-r`}>
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 items-center justify-center rounded-full border ${BORDER} text-[12px] ${MUTED}`}>✕</span>
              <span className={`text-[15px] font-semibold ${MUTED}`}>{t("A marketing team", "Une équipe marketing")}</span>
            </div>
            <p className={`mt-1 text-[13px] ${FAINT}`}>{t("Every step by hand, no unified view", "Chaque étape à la main, aucune vue d'ensemble")}</p>
            <div className="mt-5 space-y-3">
              {left.map((r, ri) => (
                <div key={ri} className="flex items-center gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${SURFACE} text-[15px] opacity-60`}>{r.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[14px] font-medium ${MUTED}`}>{r.t}</p>
                    <p className={`text-[12px] ${FAINT}`}>{r.day}</p>
                  </div>
                  <span className={`shrink-0 rounded-md ${SURFACE} px-2 py-1 text-[11px] font-medium ${FAINT}`}>{r.tag}</span>
                </div>
              ))}
            </div>
            <p className={`mt-6 border-t ${BORDER} pt-4 text-[12px] ${FAINT}`}>{t("Scattered tools · No unified view · No attribution", "Outils éparpillés · Aucune vue d'ensemble · Aucune attribution")}</p>
          </div>

          {/* Right — Loglead */}
          <div className="p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0051FF] text-[12px] text-white">✓</span>
              <span className="text-[15px] font-semibold text-[#0051FF]">Loglead</span>
            </div>
            <p className={`mt-1 text-[13px] ${MUTED}`}>{t("One unified system — one journey per prospect", "Un système unifié — un parcours par prospect")}</p>
            <div className="mt-5 space-y-3">
              {right.map((r, ri) => (
                <div key={ri} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0051FF15] text-[15px]">{r.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[14px] font-medium ${FG}`}>{r.t}</p>
                    <p className={`text-[12px] ${MUTED}`}>{r.day}</p>
                  </div>
                  <span className="shrink-0 rounded-md bg-[#0051FF15] px-2 py-1 text-[11px] font-semibold text-[#0051FF]">{r.tag}</span>
                </div>
              ))}
              {/* Conversion row */}
              <div className="flex items-center gap-3 rounded-xl bg-[#0051FF10] px-3 py-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0051FF] text-[14px] font-bold text-white">$</span>
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-[14px] font-bold ${FG}`}>{t("Booked call — €2,497", "Rendez-vous réservé — 2 497 €")}</p>
                  <p className={`text-[12px] ${MUTED}`}>{t("Day 3 · Attributed to the full journey", "Jour 3 · Attribué au parcours complet")}</p>
                </div>
              </div>
            </div>
            <p className="mt-6 border-t border-[#0051FF20] pt-4 text-[12px] font-semibold text-[#0051FF]">{t("One system · Full journey · Exact attribution", "Un système · Parcours complet · Attribution exacte")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ----- Problem (light) -----------------------------------------------------

function Problem() {
  const t = useTr();
  const cards = [
    { t: t("The “what do I post today?”", "Le « je poste quoi aujourd'hui ? »"), d: t("Coming up with a relevant angle every morning, 365 days a year. It's not a skill problem — it's a daily creative drain.", "Trouver un angle pertinent chaque matin, 365 jours par an. Ce n'est pas la compétence qui manque — c'est l'énergie créative quotidienne.") },
    { t: t("Prospecting eats your hours", "La prospection dévore vos heures"), d: t("Finding the right decision-makers by hand takes hours you don't have — for a handful of maybes and cold outreach.", "Trouver les bons décideurs à la main prend des heures que vous n'avez pas — pour une poignée de peut-être et du démarchage à froid.") },
    { t: t("Views, not clients", "Des vues, pas des clients"), d: t("Without market signals and a real journey, your posts get likes, not booked calls. And you never know what's blocking.", "Sans signaux de marché ni vrai parcours, vos posts font des likes, pas des rendez-vous. Et vous ne savez jamais ce qui coince.") },
    { t: t("Improvised, scattered growth", "Une croissance improvisée et éclatée"), d: t("Six disconnected tools, no unified view, no attribution. Your pipeline swings up and down, week after week.", "Six outils déconnectés, aucune vue d'ensemble, aucune attribution. Votre pipeline monte et descend, semaine après semaine.") },
  ];
  return (
    <section id="problem" className="lp-light px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionTitle badge={t("The real problem", "Le vrai problème")} title={t(<>You know LinkedIn sells.<br />Doing it by hand <span className="lp-gradient-text">drains you</span>.</>, <>Vous savez que LinkedIn vend.<br />Le faire à la main <span className="lp-gradient-text">vous épuise</span>.</>)} sub={t("You post. You get some clients. You think it worked. But the truth is hidden.", "Vous postez. Vous obtenez des clients. Vous pensez que ça a marché. Mais la vérité est cachée.")} />
        <div className="mt-14 grid gap-4 md:grid-cols-2">
          {cards.map((c, i) => (
            <Reveal key={i} delay={i * 100} className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex items-start gap-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EF4444]/10 text-[15px] font-bold text-[#EF4444]">✕</span>
                <div>
                  <h3 className="text-[17px] font-bold text-[#0F172A]">{c.t}</h3>
                  <p className={`mt-2 text-[15px] leading-relaxed ${MUTED}`}>{c.d}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120} className="mt-10 text-center text-[18px] font-bold text-[#0F172A] sm:text-[22px]">
          {t(<>Result: every month you lose <span className="text-[#EF4444]">15–30% of your pipeline</span>.</>, <>Résultat : chaque mois vous perdez <span className="text-[#EF4444]">15–30% de votre pipeline</span>.</>)}
        </Reveal>
      </div>
    </section>
  );
}

// ----- Testimonials (dark band) --------------------------------------------

function Testimonials() {
  const t = useTr();
  const items = [
    {
      badge: t("Finally consistent", "Enfin régulier"),
      q: t("I never followed up with my LinkedIn leads — no time, and honestly a bit of laziness. I finally fixed that.", "Je ne suivais jamais mes leads LinkedIn, par manque de temps et un peu de flemme. J'ai enfin réglé le problème."),
      name: "Thomas B.", role: t("Founder", "Fondateur"), grad: "linear-gradient(135deg,#0051FF,#00D4FF)",
    },
    {
      badge: t("+40 qualified leads", "+40 leads qualifiés"),
      q: t("In my first weeks I got more qualified conversations than in the whole past year of manual prospecting. Since LogLead, that problem is gone.", "En quelques semaines, j'ai eu plus de conversations qualifiées que sur toute l'année précédente à prospecter à la main. Depuis LogLead, ce problème n'existe plus."),
      name: "Julie Bernard", role: "Head of Growth", grad: "linear-gradient(135deg,#7C3AED,#00D4FF)",
    },
    {
      badge: "1h → 10 min",
      q: t("I used to spend an hour a day on LinkedIn. Now it's 10 minutes — and it converts better.", "Je passais 1h par jour sur LinkedIn. Là c'est 10 minutes et ça convertit mieux."),
      name: "Marc D.", role: t("Sales Director", "Directeur commercial"), grad: "linear-gradient(135deg,#0051FF,#0EA5E9)",
    },
  ];
  return (
    <section className="lp-light relative z-10 overflow-hidden rounded-b-[40px] px-5 pb-24 pt-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTitle
          badge={t("They love it", "Ils adorent")}
          title={t(<>They love it. Why not you?</>, <>Ils adorent. Pourquoi pas toi ?</>)}
          sub={t("Join the B2B teams turning LinkedIn into pipeline — without spending their days on it.", "Rejoins les équipes B2B qui transforment LinkedIn en pipeline, sans y passer leurs journées.")}
        />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((it, i) => (
            <Reveal key={i} delay={i * 100} className="flex flex-col rounded-2xl border border-[#E9EDF3] bg-white p-6 shadow-[0_16px_40px_-30px_rgba(15,23,42,0.25)]">
              <p className="text-[15px] tracking-widest text-[#F59E0B]">★★★★★</p>
              <span className="mt-4 inline-flex w-fit rounded-full bg-[#0051FF10] px-3 py-1 text-[13px] font-semibold text-[#0051FF]">{it.badge}</span>
              <p className={`mt-4 flex-1 text-[15px] leading-relaxed ${MUTED}`}>&laquo;&nbsp;{it.q}&nbsp;&raquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white" style={{ background: it.grad }}>
                  {it.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                </span>
                <div>
                  <p className={`text-[14px] font-bold ${FG}`}>{it.name}</p>
                  <p className={`text-[12px] ${FAINT}`}>{it.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={120} className="mt-12 text-center">
          <Link href={SIGNUP} className={BTN_P}><Roll>{t("Start for free", "Commencer gratuitement")}</Roll></Link>
        </Reveal>
      </div>
    </section>
  );
}

// ----- FAQ (shared) --------------------------------------------------------

export function FAQ({ items, badge = "FAQ", title, tone = "dark" }: { items?: [string, string][]; badge?: string; title?: string; tone?: "light" | "dark" }) {
  const t = useTr();
  const DEFAULT: [string, string][] = [
    [t("What is LogLead exactly?", "C'est quoi LogLead exactement ?"), t("LogLead is an AI-powered growth engine for B2B companies. It analyzes your LinkedIn market, finds qualified prospects, generates content that attracts them and turns every interaction into a sales opportunity — from one unified platform.", "LogLead est un moteur de croissance IA pour les entreprises B2B. Il analyse votre marché LinkedIn, trouve des prospects qualifiés, génère le contenu qui les attire et transforme chaque interaction en opportunité commerciale — depuis une seule plateforme.")],
    [t("Why is it focused on LinkedIn?", "Pourquoi se concentrer sur LinkedIn ?"), t("LinkedIn is where B2B decisions happen. 80% of B2B social media leads come from LinkedIn. We go deep on one channel rather than shallow on many — so you get real results, not average performance everywhere.", "C'est sur LinkedIn que se prennent les décisions B2B. 80% des leads B2B issus des réseaux viennent de LinkedIn. On va en profondeur sur un canal plutôt qu'en surface sur plusieurs — pour de vrais résultats.")],
    [t("How quickly will I see results?", "En combien de temps vais-je voir des résultats ?"), t("Most users detect their first qualified leads within minutes of connecting LinkedIn. Building a consistent pipeline takes 2 to 4 weeks as the AI learns your market and audience.", "La plupart des utilisateurs détectent leurs premiers prospects qualifiés en quelques minutes après avoir connecté LinkedIn. Construire un pipeline régulier prend 2 à 4 semaines, le temps que l'IA apprenne votre marché.")],
    [t("Will the content sound AI-generated?", "Le contenu aura-t-il l'air généré par une IA ?"), t("No. LogLead analyzes your writing style and generates content in your voice — no corporate filler, no generic phrases. Every post is indistinguishable from something you wrote yourself.", "Non. LogLead analyse votre style d'écriture et génère du contenu dans votre voix — pas de blabla corporate, pas de phrases génériques. Chaque post est indiscernable de ce que vous auriez écrit.")],
    [t("What happens when my trial credits run out?", "Que se passe-t-il quand mes crédits d'essai sont épuisés ?"), t("You'll be prompted to choose a plan. 500 additional credits cost €5 — or you can upgrade to a plan with a higher monthly credit allowance. Your data and leads are always preserved.", "On vous invite à choisir une offre. 500 crédits supplémentaires coûtent 5 € — ou vous passez à une offre avec un quota mensuel plus élevé. Vos données et prospects sont toujours conservés.")],
    [t("Can I cancel anytime?", "Puis-je annuler à tout moment ?"), t("Yes, no commitment. Cancel from Settings → Subscription in one click. Your data is kept for 30 days after cancellation.", "Oui, sans engagement. Annulez depuis Réglages → Abonnement en un clic. Vos données sont conservées 30 jours après l'annulation.")],
  ];
  const qa = items ?? DEFAULT;
  const heading = title ?? t("Frequently asked questions", "Les questions fréquentes");
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className={`${tone === "dark" ? "lp-dark" : "lp-light"} px-5 py-24 sm:px-6`}>
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        {/* Left — heading (static, not sticky) */}
        <Reveal>
          <p className="text-[13px] font-semibold tracking-wide text-[#0051FF]">[ {badge} ]</p>
          <h2 className={`mt-4 text-[28px] font-extrabold leading-[1.05] tracking-[-0.035em] sm:text-[36px] ${FG}`}>{heading}</h2>
          <p className={`mt-5 max-w-sm text-[15px] leading-relaxed ${MUTED}`}>
            {t("Can't find the answer to your question? Reach us by ", "Vous ne trouvez pas la réponse à votre question ? Contactez-nous en ")}
            <a href="mailto:loglead@gmail.com" className="text-[color:var(--lp-fg)] underline underline-offset-2">{t("clicking here", "cliquant ici")}</a>.
          </p>
        </Reveal>

        {/* Right — accordion */}
        <Reveal delay={80}>
          {qa.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-dashed border-[color:var(--lp-border)]">
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className={`text-[16px] font-medium ${FG}`}>{q}</span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 text-[color:var(--lp-muted)] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
                </button>
                <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden"><p className={`pb-5 text-[14px] leading-relaxed ${MUTED}`}>{a}</p></div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}

// ----- Affiliate (used on /affiliate only) ---------------------------------

export function AffiliateSection({ tone = "dark" }: { tone?: "light" | "dark" }) {
  const [referrals, setReferrals] = useState(10);
  const [plan, setPlan] = useState(59);
  const planName = plan === 29 ? "Starter" : plan === 99 ? "Pro" : "Growth";
  const monthly = Math.round(referrals * plan * 0.4 * 100) / 100;
  const perRef = Math.round(plan * 0.4 * 100) / 100;
  const fmt = (n: number) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 0 });
  const examples: [string, string][] = [
    ["1 referral (Starter)", "€11.60/mo"],
    ["1 referral (Growth)", "€23.60/mo"],
    ["1 referral (Pro)", "€39.60/mo"],
    ["10 referrals (Growth)", "€236/mo"],
    ["50 referrals (Growth)", "€1,180/mo"],
    ["100 referrals (Growth)", "€2,360/mo"],
  ];

  return (
    <section id="affiliate" className={`${tone === "dark" ? "lp-dark" : "lp-light"} px-5 pt-16 pb-10 sm:px-6`}>
      <div className="mx-auto max-w-xl">
        <SectionTitle
          badge="Affiliate Program"
          title={<>Earn <span className="text-[#0051FF]">40%</span> on each<br />generated subscription.</>}
          sub="A link to share, a recurring commission of 40% of your referral's subscription — every month, for as long as they stay subscribed."
        />

        {/* Revenue simulator — the aha moment */}
        <Reveal delay={80} className={`mt-8 rounded-[16px] border border-[#0051FF40] ${CARD} p-5 text-center sm:p-6`}>
          <p className={`text-[11px] font-semibold uppercase tracking-wide ${FAINT}`}>Revenue simulator</p>
          <p className="mt-2 text-[38px] font-bold leading-none text-[#0051FF] sm:text-[44px]">~€{fmt0(monthly)}<span className="text-[17px] font-semibold text-[color:var(--lp-muted)]">/month</span></p>
          <p className={`mt-2 text-[13px] ${MUTED}`}>with {referrals} referral{referrals > 1 ? "s" : ""} on {planName} plan</p>

          <input type="range" min={1} max={500} value={referrals} onChange={(e) => setReferrals(Number(e.target.value))} className="credit-slider mt-5 w-full" />
          <div className={`mt-1 flex justify-between text-[11px] ${FAINT}`}><span>1</span><span>{referrals} referrals</span><span>500</span></div>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[["Starter", 29], ["Growth", 59], ["Pro", 99]].map(([l, v]) => (
              <button key={l as string} onClick={() => setPlan(v as number)} className={`rounded-full px-4 py-2 text-[13px] font-medium transition ${plan === v ? "border-2 border-[#0051FF] bg-[#0051FF15] text-[#0051FF]" : `border ${BORDER} ${MUTED}`}`}>{l} €{v as number}</button>
            ))}
          </div>

          <div className={`mt-6 space-y-2 border-t ${BORDER} pt-5 text-left text-[14px]`}>
            {[["Per referral", `€${fmt(perRef)}/month`], ["Monthly total", `€${fmt0(monthly)}/month`], ["Annual total", `€${fmt0(Math.round(monthly * 12))}/year`]].map(([l, v]) => (
              <div key={l} className="flex items-center justify-between">
                <span className={MUTED}>{l}</span><span className={`font-semibold ${FG}`}>{v}</span>
              </div>
            ))}
          </div>

          <Link href={SIGNUP} className={`${BTN_P} mt-6 w-full`}><Roll>→ Apply now — It&apos;s free</Roll></Link>
        </Reveal>

        {/* Quick examples 2×3 */}
        <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map(([l, v]) => (
            <div key={l} className={`flex items-center justify-between rounded-[10px] border ${BORDER} ${SURFACE} px-3 py-2 text-[13px]`}>
              <span className={MUTED}>{l}</span><span className={`font-semibold ${FG}`}>{v}</span>
            </div>
          ))}
        </div>
        <p className={`mt-4 text-center text-[12px] ${FAINT}`}>
          Estimation: 40% of the amount paid monthly by each referral. Real amounts vary by plan. Payment stops if a referral cancels — past payments are always kept.
        </p>

        {/* How it works */}
        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {[
            ["01", "You share your link", "A unique link, not a code. Attribution is automatic, even if signup comes later."],
            ["02", "They sign up & pay", "As soon as a referral goes paid, they're attributed to your link — whatever plan they choose."],
            ["03", "You earn 40%, for life", "40% of their subscription every month, as long as they stay paid. Past months are always yours."],
          ].map(([n, t, d]) => (
            <Reveal key={n} className={`rounded-xl border ${BORDER} ${CARD} p-4`}>
              <span className="text-[18px] font-bold text-[#0051FF]">{n}</span>
              <p className={`mt-2 text-[14px] font-semibold ${FG}`}>{t}</p>
              <p className={`mt-1 text-[12px] leading-relaxed ${MUTED}`}>{d}</p>
            </Reveal>
          ))}
        </div>

        {/* Per-referral table */}
        <Reveal className={`mt-6 overflow-hidden rounded-2xl border ${BORDER}`}>
          {[["Starter · €29/mo", "€11.60/mo per referral"], ["Growth · €59/mo", "€23.60/mo per referral"], ["Pro · €99/mo", "€39.60/mo per referral"]].map(([l, v]) => (
            <div key={l} className={`flex items-center justify-between border-b ${BORDER} px-5 py-3.5 text-[14px] last:border-b-0`}>
              <span className={FG}>{l}</span><span className="font-semibold text-[#0051FF]">{v}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

// ----- Pricing (dark marketing page) ---------------------------------------

export function PricingLanding() {
  const [annual, setAnnual] = useState(false);
  const price = (p: number) => (p === 0 ? 0 : annual ? Math.round(p * 12 * 0.83) / 12 : p);
  const plans = [
    { name: "Starter", price: 29, desc: "You're starting to generate leads on LinkedIn and want real results.", credits: "2,000 credits/month · 500 leads/month", features: ["Market Intelligence", "Post Generator", "Content Calendar", "Basic enrichment", "Email support", "6 months of history"] },
    { name: "Growth", price: 59, popular: true, desc: "You manage LinkedIn seriously and want a pipeline that grows every week.", credits: "5,000 credits/month · 2,000 leads/month", features: ["Everything in Starter", "Full enrichment (email + phone)", "Competitor tracking", "Buying signal detection", "Priority support", "1 year of history"] },
    { name: "Pro", price: 99, desc: "Your product is serious. You want AI to run your growth.", credits: "10,000 credits/month · Unlimited leads", features: ["Everything in Growth", "AI Growth Partner [Beta]", "5 workspaces", "Dedicated support", "3 years of history"] },
  ];
  const steps = [
    {
      n: "01", title: "Create your account", desc: "Sign up in 30 seconds. No credit card, no setup, no sales call.",
      icon: <path d="M16 11a4 4 0 100-8 4 4 0 000 8zM6 21v-1a5 5 0 015-5h1M17.5 15.5v5M20 18h-5" />,
    },
    {
      n: "02", title: "Choose your plan", desc: "7 days of full access to test everything — decide once you've seen the results.",
      icon: <path d="M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4" />,
    },
    {
      n: "03", title: "Launch your growth", desc: "Real prospects, signals and content from day one. LogLead runs the engine.",
      icon: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
    },
  ];
  return (
    <section className="lp-dark px-5 pt-20 pb-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionTitle badge="Pricing" title={<>Choose your plan.<br /><span className="text-[#0051FF]">Start for free.</span></>} sub="Stop letting opportunities slip by. Turn your LinkedIn visibility into growth." />

        <Reveal className="mt-8 flex justify-center">
          <div className={`inline-flex rounded-full border ${BORDER} ${SURFACE} p-1`}>
            {[["Monthly", false], ["Annual · 2 months free", true]].map(([l, v]) => (
              <button key={l as string} onClick={() => setAnnual(v as boolean)} className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${annual === v ? "bg-[#0051FF] text-white" : MUTED}`}>{l as string}</button>
            ))}
          </div>
        </Reveal>

        {/* 3 plans */}
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 80} className={`relative flex flex-col rounded-[20px] border p-6 ${p.popular ? "border-2 border-[#0051FF]" : `${BORDER} ${CARD}`}`} style={p.popular ? { background: "linear-gradient(180deg,#0D2060,#0A0A0A)", boxShadow: "0 0 60px #0051FF20" } : undefined}>
              {p.popular && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#0051FF] px-3 py-1 text-[11px] font-semibold text-white">Recommended</span>}
              <p className={`text-[15px] font-bold ${FG}`}>{p.name}</p>
              <p className={`mt-1 text-[13px] leading-relaxed ${MUTED}`}>{p.desc}</p>
              <p className={`mt-4 text-[30px] font-bold ${FG}`}>€{price(p.price) % 1 === 0 ? price(p.price) : price(p.price).toFixed(0)}<span className={`text-[13px] font-normal ${FAINT}`}>/month</span></p>
              <p className="mt-1 text-[12px] font-medium text-[#0051FF]">{p.credits}</p>
              <ul className={`mt-4 flex-1 space-y-2 text-[13px] ${MUTED}`}>
                {p.features.map((f) => <li key={f} className="flex items-start gap-2"><span className="text-[#0051FF]">✓</span>{f}</li>)}
              </ul>
              <Link href={SIGNUP} className={`${BTN_P} mt-6 w-full`}><Roll>Start 7-day trial</Roll></Link>
            </Reveal>
          ))}
        </div>

        {/* How it works — get-started process in 3 steps */}
        <div className="mt-28 text-center">
          <span className="inline-flex rounded-full bg-[#0051FF15] px-3 py-1 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">How it works</span>
          <h3 className={`mt-4 text-[28px] font-extrabold tracking-[-0.035em] sm:text-[36px] ${FG}`}>From signup to pipeline<br className="hidden sm:block" /> in minutes.</h3>
          <p className={`mx-auto mt-3 max-w-md text-[15px] leading-relaxed ${MUTED}`}>Three steps. No credit card. You only decide once you&apos;ve seen the results.</p>
        </div>

        <div className="relative mt-16 grid gap-5 lg:grid-cols-3">
          {/* connecting path behind the cards (desktop) */}
          <div aria-hidden className="pointer-events-none absolute inset-x-[16%] top-9 hidden h-px bg-gradient-to-r from-[#0051FF00] via-[#0051FF66] to-[#0051FF00] lg:block" />
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 100} className="group relative">
              {/* arrow between cards (desktop) */}
              {i < steps.length - 1 && (
                <span aria-hidden className="absolute -right-3.5 top-9 z-10 hidden -translate-y-1/2 text-[#0051FF] lg:block">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              )}
              <div className={`flex h-full flex-col items-center rounded-2xl border ${BORDER} ${CARD} px-6 pb-7 pt-8 text-center transition duration-300 hover:-translate-y-1 hover:border-[#0051FF60] hover:shadow-[0_24px_60px_-30px_rgba(0,81,255,0.7)]`}>
                <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-2xl text-white shadow-[0_14px_36px_-10px_rgba(0,81,255,0.7)]" style={{ background: "linear-gradient(135deg,#0051FF,#00A3FF)" }}>
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-[#0051FF40] bg-[#0A0A0A] text-[11px] font-bold text-[#0051FF]">{s.n}</span>
                </span>
                <p className={`mt-5 text-[17px] font-bold ${FG}`}>{s.title}</p>
                <p className={`mt-2 text-[13px] leading-relaxed ${MUTED}`}>{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center gap-3">
          <Link href={SIGNUP} className={BTN_P}><Roll>Start your 7-day trial</Roll></Link>
          <p className="text-[12px] text-[#6A7690]">No credit card · Cancel anytime · Setup in 2 minutes</p>
        </div>
      </div>
    </section>
  );
}

// ----- Final CTA (dark, with screen mockup) --------------------------------

function FinalCTA() {
  const t = useTr();
  return (
    <section className="lp-dark relative overflow-hidden px-5 pt-28 sm:px-6" style={{ background: "#0A0A0A" }}>
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.14]" style={{ backgroundImage: "radial-gradient(#ffffff22 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-16 h-[360px] w-[620px] -translate-x-1/2 rounded-full" style={{ background: "radial-gradient(ellipse at center, #0051FF40, transparent 70%)" }} />

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <h2 className="text-[34px] font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-[50px]">
            {t(<>Your next clients are<br />already on <span className="text-[#0051FF]">LinkedIn</span>.</>, <>Vos prochains clients sont<br />déjà sur <span className="text-[#0051FF]">LinkedIn</span>.</>)}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] text-[#8B9EC4]">
            {t("LogLead tells you who they are, what they want, and exactly when to reach out.", "LogLead vous dit qui ils sont, ce qu'ils veulent, et exactement quand les contacter.")}
          </p>
          <Link href={SIGNUP} className={`${BTN_P} mx-auto mt-8 !px-8 !py-3.5 !text-[15px]`} style={{ boxShadow: "0 0 44px #0051FF80" }}>
            <Roll>{t("Start for free", "Commencer gratuitement")}</Roll>
          </Link>
          <p className="mt-4 text-[12px] text-[#6A7690]">{t("7-day free trial · No credit card · Setup in 2 minutes", "Essai gratuit 7 jours · Sans carte bancaire · Installation en 2 minutes")}</p>
        </Reveal>
      </div>

      {/* Dashboard on a screen mockup (cut off at the bottom) */}
      <Reveal delay={120} className="relative mx-auto mt-16 max-w-5xl">
        <div className="overflow-hidden rounded-t-2xl border border-[#2A2A2A] bg-[#0A0A0A] shadow-[0_-8px_60px_#0051FF25]">
          <div className="flex items-center gap-2 border-b border-[#2A2A2A] px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="h-3 w-3 rounded-full bg-[#28c840]" />
            <span className="mx-auto rounded-full bg-[#141414] px-3 py-1 text-[11px] text-[#6A7690]">app.loglead.io/dashboard</span>
          </div>
          <MockDashboard />
        </div>
      </Reveal>
    </section>
  );
}

function MockDashboard() {
  return (
    <div className="flex text-left">
      <div className="hidden w-40 shrink-0 flex-col gap-1 border-r border-[#2A2A2A] p-4 sm:flex">
        <div className="flex items-center gap-2 pb-3">
          <span className="h-5 w-5 rounded-md" style={{ background: "linear-gradient(135deg,#0051FF,#0085FF)" }} />
          <span className="text-[13px] font-bold text-white">Loglead</span>
        </div>
        {["Home", "Market Intelligence", "Leads", "Content Studio", "Analytics"].map((l, i) => (
          <div key={l} className={`rounded-lg px-3 py-2 text-[12px] ${i === 0 ? "bg-[#141414] text-white" : "text-[#8B9EC4]"}`}>{l}</div>
        ))}
      </div>
      <div className="min-w-0 flex-1 p-5">
        <p className="text-[12px] text-[#6A7690]">AI Growth Overview</p>
        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {[["Signals", "12"], ["Prospects", "47"], ["Opportunities", "23"], ["Growth", "+34%"]].map(([l, v]) => (
            <div key={l} className="rounded-lg border border-[#2A2A2A] bg-[#141414] p-3">
              <p className="text-[10px] text-[#6A7690]">{l}</p>
              <p className="text-[18px] font-bold text-white">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-[#2A2A2A]">
          {[["Thomas Martin", "Viewed your profile", 92], ["Julie Bernard", "Commented on your post", 88], ["Marc Dupont", "Engaged with your content", 76]].map(([n, a, s]) => (
            <div key={n as string} className="flex items-center gap-3 border-b border-[#2A2A2A] px-3 py-2.5 last:border-b-0">
              <span className="h-7 w-7 shrink-0 rounded-full" style={{ background: "linear-gradient(135deg,#0051FF,#00D4FF)" }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-white">{n}</p>
                <p className="truncate text-[11px] text-[#8B9EC4]">{a}</p>
              </div>
              <span className="text-[12px] font-bold text-[#4F8BFF]">{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ----- Footer (shared, dark) -----------------------------------------------

export function LandingFooter({ tone = "light" }: { tone?: "light" | "dark" }) {
  const t = useTr();
  const { lang, setLang } = useLang();
  const cols = [
    { title: t("Product", "Produit"), links: ["Market", "Post Generator", "Pipeline", "Enrich Leads", "Inbox delivery"] },
    { title: "Solutions", links: [t("Startup founder", "Fondateur de startup"), t("B2B sales", "Ventes B2B"), t("Agency", "Agence")] },
    { title: t("Comparison", "Comparaison"), links: ["LogLead vs Lemlist", "LogLead vs Apollo", "LogLead vs Instantly", "LogLead vs Clay"] },
    { title: t("Resources", "Ressources"), links: [t("Tools", "Outils"), "Blog", t("Affiliate", "Affiliation")] },
  ];
  const socials = [
    { label: "X", icon: <path d="M18.9 2H22l-7.6 8.7L23.3 22h-6.9l-5.4-7-6.2 7H1.7l8.1-9.3L1 2h7.1l4.9 6.4L18.9 2zm-1.2 18h1.9L6.4 4H4.4l13.3 16z" /> },
    { label: "LinkedIn", icon: <path d="M4.98 3.5a2.5 2.5 0 11-.02 5.02A2.5 2.5 0 014.98 3.5zM3 9h4v12H3V9zm7 0h3.8v1.7h.05c.53-.95 1.83-1.95 3.75-1.95 4 0 4.75 2.5 4.75 5.8V21h-4v-5.4c0-1.3 0-2.95-1.8-2.95s-2.1 1.4-2.1 2.85V21H10V9z" /> },
    { label: "Discord", icon: <path d="M20 5.3A17 17 0 0015.7 4l-.2.4a15.6 15.6 0 014 2 15.5 15.5 0 00-13-1.4c.5-.2 1-.4 1.6-.6L7.9 4A17 17 0 003.7 5.3C1 9.3.3 13.2.6 17a17 17 0 005.2 2.6l.4-.7c-.7-.3-1.4-.6-2-1l.5-.4a11 11 0 009.6 0l.5.4c-.6.4-1.3.7-2 1l.4.7A17 17 0 0023.4 17c.4-4.5-.7-8.4-3.4-11.7zM8.9 14.6c-1 0-1.9-.9-1.9-2s.8-2 1.9-2 1.9 1 1.9 2-.8 2-1.9 2zm6.2 0c-1 0-1.9-.9-1.9-2s.8-2 1.9-2 1.9 1 1.9 2-.8 2-1.9 2z" /> },
    { label: "Reddit", icon: <path d="M22 12a2 2 0 00-3.4-1.4 10 10 0 00-5-1.5l.9-4 2.8.6a1.5 1.5 0 101.5-1.6 1.5 1.5 0 00-1.3.8l-3.2-.7-1.1 5a10 10 0 00-5 1.5A2 2 0 106 14.3a4 4 0 000 .7c0 2.8 3.1 5 7 5s7-2.2 7-5a4 4 0 000-.7A2 2 0 0022 12zm-13 1.5a1.3 1.3 0 112.6 0 1.3 1.3 0 01-2.6 0zm7 3.4c-.9.9-2.6 1-3 1s-2.1-.1-3-1a.4.4 0 01.5-.5c.6.5 1.7.7 2.5.7s1.9-.2 2.5-.7a.4.4 0 01.5.5zm-.3-2.1a1.3 1.3 0 110-2.6 1.3 1.3 0 010 2.6z" /> },
  ];
  return (
    <footer className={`${tone === "dark" ? "lp-dark" : "lp-light"} relative overflow-hidden border-t border-[color:var(--lp-border)] px-5 pt-16 sm:px-6`}>
      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <LogoMark dark={tone === "dark"} />
            <p className={`mt-4 max-w-xs text-[14px] leading-relaxed ${MUTED}`}>{t("The AI platform that turns your business into a lead generation machine.", "La plateforme IA qui transforme votre entreprise en machine à générer des leads.")}</p>
            <div className="mt-6 flex items-center gap-4">
              {socials.map((s) => (
                <a key={s.label} href="#" aria-label={s.label} className={`${MUTED} transition hover:text-[color:var(--lp-fg)]`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>{s.icon}</svg>
                </a>
              ))}
            </div>
          </div>
          {cols.map((c, ci) => (
            <div key={ci}>
              <p className={`text-[14px] font-bold ${FG}`}>{c.title}</p>
              <ul className="mt-4 space-y-3">{c.links.map((l) => <li key={l}><a href="#" className={`text-[14px] ${MUTED} transition hover:text-[color:var(--lp-fg)]`}>{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
        <div className={`mt-12 flex flex-wrap items-center justify-between gap-2 border-t ${BORDER} pt-6 pb-8 text-[12px] ${FAINT}`}>
          <p>{t("© 2026 LogLead — All rights reserved.", "© 2026 LogLead — Tous droits réservés.")} {t("Not affiliated with LinkedIn Corporation.", "Non affilié à LinkedIn Corporation.")} · SIRET 104 040 456 00014</p>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/terms" className="transition hover:text-[color:var(--lp-fg)]">{t("Terms of Sale", "CGV")}</Link>
            <span>·</span>
            <Link href="/privacy" className="transition hover:text-[color:var(--lp-fg)]">{t("Privacy Policy", "Confidentialité")}</Link>
            <span>·</span>
            <button onClick={() => setLang("fr")} className={lang === "fr" ? `font-semibold ${FG}` : ""}>Français</button>
            <span>·</span>
            <button onClick={() => setLang("en")} className={lang === "en" ? `font-semibold ${FG}` : ""}>English</button>
            <span>·</span>
            <span>loglead.io</span>
          </div>
        </div>
      </div>

      {/* Giant faint wordmark at the bottom */}
      <span aria-hidden className="pointer-events-none absolute inset-x-0 bottom-[-0.22em] select-none whitespace-nowrap text-center text-[26vw] font-extrabold leading-[0.7] tracking-[-0.05em] text-[color:var(--lp-fg)] opacity-[0.05]">loglead</span>
    </footer>
  );
}

// ----- Cookie banner -------------------------------------------------------

function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { if (!localStorage.getItem("loglead_cookie_consent")) setShow(true); }, []);
  const decide = (v: string) => { localStorage.setItem("loglead_cookie_consent", v); setShow(false); };
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#E2E8F0] bg-white px-5 py-4">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-[#64748B]">Nous utilisons des cookies pour améliorer ton expérience. Tu peux accepter ou refuser.</p>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => decide("declined")} className="rounded-[10px] border border-[#E2E8F0] px-3 py-2 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A]">Refuser</button>
          <button onClick={() => decide("accepted")} className={`${BTN_P} !px-4 !py-2 !text-[13px]`}><Roll>Accept</Roll></button>
        </div>
      </div>
    </div>
  );
}
