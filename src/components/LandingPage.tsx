"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import SignalNetwork from "./SignalNetwork";

// ---------------------------------------------------------------------------
// LogLead — marketing landing ("AI Growth OS pour B2B"). Intentionally a
// light-only page: colors are the spec's static hex (not the app theme tokens).
// Motion uses the project's IntersectionObserver reveal pattern (no Framer
// Motion dependency) and respects prefers-reduced-motion.
// ---------------------------------------------------------------------------

const SIGNUP = "/signup";
const LOGIN = "/login";
// No Calendly link exists in the project yet — placeholder, replace with the real one.
const DEMO_URL = "https://calendly.com/loglead/demo";

const NAV = [
  { href: "#how", label: "Comment ça marche" },
  { href: "#features", label: "Fonctionnalités" },
  { href: "#signals", label: "Signaux" },
  { href: "#pricing", label: "Tarifs" },
  { href: "#reviews", label: "Avis" },
  { href: "#faq", label: "FAQ" },
];

// ----- Primitives ----------------------------------------------------------

function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setSeen(true),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <Tag
      ref={ref as never}
      className={`reveal ${seen ? "is-visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

// Count from 0 → target once the element scrolls into view.
function CountUp({ to, suffix = "", prefix = "", duration = 1200 }: { to: number; suffix?: string; prefix?: string; duration?: number }) {
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
  return <span ref={ref}>{prefix}{v.toLocaleString("fr-FR")}{suffix}</span>;
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[13px] font-medium text-[#475569]">
      {children}
    </span>
  );
}

function SectionHeader({ eyebrow, title, sub, dark }: { eyebrow?: string; title: React.ReactNode; sub?: React.ReactNode; dark?: boolean }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      {eyebrow && (
        <p className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">{eyebrow}</p>
      )}
      <h2 className={`text-[30px] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[40px] ${dark ? "text-white" : "text-[#0F172A]"}`}>
        {title}
      </h2>
      {sub && <p className={`mt-4 text-[17px] leading-relaxed ${dark ? "text-[#94A3B8]" : "text-[#64748B]"}`}>{sub}</p>}
    </Reveal>
  );
}

const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#0051FF] px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-[#0043D4]";
const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-5 py-3 text-[15px] font-semibold text-[#0F172A] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC]";

// Small abstract "signal" logo mark.
function LogoMark() {
  return (
    <span className="flex items-center gap-2">
      <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
        <rect width="26" height="26" rx="7" fill="#0051FF" />
        <circle cx="8" cy="18" r="2.4" fill="#fff" />
        <circle cx="18" cy="8" r="2.4" fill="#fff" />
        <circle cx="18" cy="18" r="1.6" fill="#fff" fillOpacity="0.7" />
        <path d="M8 18 L18 8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M8 18 L18 18" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.7" />
      </svg>
      <span className="text-[18px] font-bold tracking-[-0.02em] text-[#0F172A]">loglead</span>
    </span>
  );
}

// ----- Page ----------------------------------------------------------------

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-[#0F172A] antialiased">
      <Navbar />
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <div id="features">
        <MarketIntel />
        <Leads />
      </div>
      <Signals />
      <ContentStudio />
      <GrowthPartner />
      <Unification />
      <BeforeAfter />
      <Pricing />
      <Comparison />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
      <CookieBanner />
    </div>
  );
}

// ----- Navbar --------------------------------------------------------------

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`sticky top-0 z-50 h-16 backdrop-blur-md transition-colors ${
        scrolled ? "border-b border-[#E2E8F0] bg-white/80" : "bg-white/60"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" aria-label="LogLead"><LogoMark /></Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-[14px] font-medium text-[#475569] transition hover:text-[#0F172A]">
              {n.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href={LOGIN} className="text-[14px] font-semibold text-[#475569] transition hover:text-[#0F172A]">Connexion</Link>
          <Link href={SIGNUP} className="rounded-lg bg-[#0051FF] px-4 py-2 text-[14px] font-semibold text-white transition hover:bg-[#0043D4]">
            Commencer gratuitement
          </Link>
        </div>

        <button onClick={() => setOpen((v) => !v)} className="lg:hidden" aria-label="Menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M6 18L18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-b border-[#E2E8F0] bg-white px-5 py-4 lg:hidden">
          <div className="flex flex-col gap-1">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2 text-[15px] font-medium text-[#334155] hover:bg-[#F8FAFC]">
                {n.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              <Link href={LOGIN} className={btnSecondary}>Connexion</Link>
              <Link href={SIGNUP} className={btnPrimary}>Commencer gratuitement</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

// ----- Hero ----------------------------------------------------------------

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-16 sm:px-6 sm:pt-24">
      {/* Discreet glows */}
      <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[560px] w-[560px] rounded-full" style={{ background: "radial-gradient(ellipse at center, rgba(0,81,255,0.10), transparent 65%)" }} />
      <div aria-hidden className="pointer-events-none absolute bottom-[-20%] left-[-10%] h-[440px] w-[440px] rounded-full" style={{ background: "radial-gradient(ellipse at center, rgba(124,58,237,0.06), transparent 65%)" }} />

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <Badge>
            <span className="h-1.5 w-1.5 rounded-full bg-[#0051FF]" /> AI Growth OS pour B2B
          </Badge>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mx-auto mt-6 max-w-4xl text-[44px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F172A] sm:text-[64px] lg:text-[72px]">
            Ne cherche plus tes prospects.<br />
            <span className="text-[#0051FF]">Détecte-les.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <p className="mx-auto mt-6 max-w-[620px] text-[18px] font-medium leading-relaxed text-[#334155]">
            LogLead est le système de croissance IA qui transforme LinkedIn en moteur d&apos;acquisition pour les entreprises B2B.
          </p>
          <p className="mx-auto mt-3 max-w-[620px] text-[16px] leading-relaxed text-[#64748B]">
            Il analyse ton marché, identifie les prospects les plus pertinents, détecte leurs signaux d&apos;intérêt et t&apos;aide à créer le contenu qui les attire.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={SIGNUP} className={btnPrimary}>Commencer gratuitement →</Link>
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className={btnSecondary}>Réserver une démo</a>
          </div>
          <p className="mt-4 text-[13px] text-[#94A3B8]">Sans carte bancaire · Installation en quelques minutes</p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <span className="text-[#F59E0B]">★★★★★</span>
            <span className="text-[13px] font-medium text-[#64748B]">Déjà utilisé par des équipes B2B</span>
          </div>
        </Reveal>
      </div>

      {/* Product visual */}
      <Reveal delay={120} className="relative mx-auto mt-14 max-w-5xl">
        <HeroDashboard />
      </Reveal>
    </section>
  );
}

function StatCard({ label, value, delta }: { label: string; value: React.ReactNode; delta?: string }) {
  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      <p className="text-[12px] font-medium text-[#64748B]">{label}</p>
      <div className="mt-1 flex items-end gap-2">
        <span className="text-[26px] font-bold tracking-[-0.02em] text-[#0F172A]">{value}</span>
        {delta && <span className="mb-1 text-[12px] font-semibold text-[#22C55E]">{delta}</span>}
      </div>
    </div>
  );
}

function SignalRow({ name, action, intent, score, delay }: { name: string; action: string; intent: "High" | "Medium"; score: number; delay: number }) {
  return (
    <Reveal delay={delay} className="flex items-center gap-3 border-t border-[#E2E8F0] px-4 py-3 first:border-t-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF4FF] text-[11px] font-bold text-[#0051FF]">
        {name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-semibold text-[#0F172A]">{name}</p>
        <p className="truncate text-[12px] text-[#64748B]">{action}</p>
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${intent === "High" ? "bg-[#0051FF]/10 text-[#0051FF]" : "bg-[#F1F5F9] text-[#64748B]"}`}>
        {intent} intent
      </span>
      <span className="num w-9 shrink-0 text-right text-[13px] font-bold" style={{ color: score >= 85 ? "#0051FF" : "#334155" }}>{score}</span>
    </Reveal>
  );
}

function HeroDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_20px_60px_-20px_rgba(15,23,42,0.18)]">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden w-52 shrink-0 flex-col border-r border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:flex">
          <LogoMark />
          <nav className="mt-6 space-y-1">
            {["Home", "AI Growth Partner", "Market Intelligence", "Leads", "Content Studio", "AI Visibility"].map((l, i) => (
              <div key={l} className={`rounded-lg px-3 py-2 text-[13px] font-medium ${i === 0 ? "bg-white text-[#0051FF] shadow-sm" : "text-[#64748B]"}`}>{l}</div>
            ))}
          </nav>
        </aside>

        {/* Main */}
        <div className="min-w-0 flex-1 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[12px] font-medium text-[#94A3B8]">AI Growth Overview</p>
              <h3 className="text-[18px] font-bold tracking-[-0.01em] text-[#0F172A]">Bon retour 👋 voici ton marché aujourd&apos;hui</h3>
            </div>
            <span className="hidden rounded-full bg-[#22C55E]/10 px-2.5 py-1 text-[11px] font-semibold text-[#16A34A] sm:inline">Live</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Signaux détectés" value={<CountUp to={12} />} />
            <StatCard label="Prospects qualifiés" value={<CountUp to={47} />} />
            <StatCard label="Opportunités actives" value={<CountUp to={23} />} />
            <StatCard label="Croissance" value={<CountUp to={34} prefix="+" suffix="%" />} delta="↑" />
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <div className="rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center justify-between px-4 py-2.5">
                <p className="text-[13px] font-semibold text-[#0F172A]">Latest Signals</p>
                <span className="text-[11px] text-[#94A3B8]">en temps réel</span>
              </div>
              <div>
                <SignalRow name="Thomas Martin" action="Viewed your profile" intent="High" score={92} delay={200} />
                <SignalRow name="Julie Bernard" action="Commented on your post" intent="High" score={88} delay={340} />
                <SignalRow name="Marc Dupont" action="Engaged with your content" intent="Medium" score={76} delay={480} />
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="px-4 py-2.5"><p className="text-[13px] font-semibold text-[#0F172A]">Signal network</p></div>
              <SignalNetwork className="h-[150px] w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----- Problem -------------------------------------------------------------

function Problem() {
  const cards = [
    { n: "01", t: "Tu prospectes à l'aveugle", d: "Tu recherches des prospects sans savoir lesquels sont réellement intéressés par ton offre." },
    { n: "02", t: "Tu publies sans savoir qui regarde", d: "Tes posts génèrent des vues et des likes, mais tu ne sais pas quelles personnes montrent un véritable intérêt." },
    { n: "03", t: "Tes données sont dispersées", d: "Prospection, contenu, enrichissement et analyse sont répartis entre plusieurs outils." },
  ];
  return (
    <section className="bg-[#F8FAFC] px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title={<>Le problème n&apos;est pas de trouver plus de personnes.</>}
          sub={<span className="font-semibold text-[#0F172A]">C&apos;est de savoir lesquelles valent vraiment ton temps.</span>}
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <Reveal key={c.n} delay={i * 100} className="rounded-xl border border-[#E2E8F0] bg-white p-6">
              <span className="text-[13px] font-bold text-[#0051FF]">{c.n}</span>
              <h3 className="mt-3 text-[18px] font-bold tracking-[-0.01em] text-[#0F172A]">{c.t}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">{c.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----- Solution ------------------------------------------------------------

function Solution() {
  const flow = ["Ton marché", "Market Intelligence", "Prospects", "Signals", "AI Analysis", "Content", "Opportunities"];
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader
          title={<>LogLead connecte enfin toutes les données.</>}
          sub="Une seule plateforme pour comprendre ton marché, identifier tes prospects et savoir quand agir."
        />
        <Reveal className="mx-auto mt-12 max-w-md">
          <ol className="relative">
            {flow.map((step, i) => (
              <li key={step} className="relative flex items-center gap-4 pb-5 last:pb-0">
                {i < flow.length - 1 && <span className="absolute left-[11px] top-6 h-full w-px bg-gradient-to-b from-[#0051FF]/40 to-[#E2E8F0]" />}
                <span className={`relative z-10 h-6 w-6 shrink-0 rounded-full border-2 ${i === 0 || i === flow.length - 1 ? "border-[#0051FF] bg-[#0051FF]" : "border-[#0051FF] bg-white"}`}>
                  {(i === 0 || i === flow.length - 1) && <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-white" />}
                </span>
                <span className={`text-[15px] font-semibold ${i === flow.length - 1 ? "text-[#0051FF]" : "text-[#0F172A]"}`}>{step}</span>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}

// ----- How it works --------------------------------------------------------

function HowItWorks() {
  const steps = [
    {
      n: "01", kicker: "Comprends ton marché", title: "Sache ce qui se passe avant tes concurrents.",
      body: "LogLead analyse les concurrents, tendances, conversations et sujets populaires pour révéler les opportunités.",
      chips: ["Concurrents", "Tendances", "Conversations", "Signaux"],
    },
    {
      n: "02", kicker: "Identifie les bons prospects", title: "Les bons prospects. Pas juste plus de prospects.",
      body: "LogLead identifie les personnes qui correspondent à ton ICP et enrichit leurs données.",
      chips: ["Entreprise", "Poste", "Email", "Téléphone", "ICP match", "Score"],
    },
    {
      n: "03", kicker: "Détecte les signaux", title: "Sache quand un prospect devient intéressant.",
      body: "LogLead suit les interactions pertinentes et les transforme en niveau d'intention.",
      chips: ["Viewed profile", "Viewed post", "Liked", "Commented", "Engaged", "Returned"],
    },
  ];
  return (
    <section id="how" className="bg-[#F8FAFC] px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader eyebrow="Comment ça marche" title="De la donnée brute à la bonne action." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 100} className="flex flex-col rounded-xl border border-[#E2E8F0] bg-white p-6">
              <span className="text-[13px] font-bold text-[#0051FF]">{s.n} — {s.kicker}</span>
              <h3 className="mt-3 text-[19px] font-bold leading-snug tracking-[-0.01em] text-[#0F172A]">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">{s.body}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.chips.map((c) => (
                  <span key={c} className="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1 text-[12px] font-medium text-[#475569]">{c}</span>
                ))}
              </div>
            </Reveal>
          ))}
        </div>

        {/* Step 04 — action, wide */}
        <Reveal delay={120} className="mt-5 grid gap-6 rounded-xl border border-[#E2E8F0] bg-white p-6 md:grid-cols-[1fr_1fr] md:p-8">
          <div>
            <span className="text-[13px] font-bold text-[#0051FF]">04 — Passe à l&apos;action</span>
            <h3 className="mt-3 text-[22px] font-bold tracking-[-0.01em] text-[#0F172A]">Agis au bon moment, avec le bon contexte.</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#64748B]">LogLead transforme les données en recommandations concrètes, priorisées par intention.</p>
          </div>
          <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5">
            <p className="text-[15px] font-bold text-[#0F172A]">Contacte Thomas aujourd&apos;hui.</p>
            <p className="mt-1 text-[13px] font-semibold text-[#64748B]">Pourquoi ?</p>
            <ul className="mt-2 space-y-1.5 text-[14px] text-[#334155]">
              <li className="flex justify-between"><span>ICP Match</span><span className="font-semibold text-[#0051FF]">96%</span></li>
              <li className="flex justify-between"><span>Intent</span><span className="font-semibold text-[#0051FF]">92%</span></li>
              <li className="flex justify-between"><span>Interactions récentes</span><span className="font-semibold text-[#0F172A]">4</span></li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ----- Market Intelligence -------------------------------------------------

function TrendRow({ label, pct, w }: { label: string; pct: string; w: number }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="w-40 shrink-0 text-[13px] text-[#334155]">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF4FF]">
        <div className="h-full rounded-full bg-[#0051FF]" style={{ width: `${w}%` }} />
      </div>
      <span className="w-12 shrink-0 text-right text-[12px] font-semibold text-[#22C55E]">↑ {pct}</span>
    </div>
  );
}

function MarketIntel() {
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">Market Intelligence</p>
          <h2 className="mt-3 text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0F172A] sm:text-[38px]">Comprends ton marché avant de le prospecter.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
            LogLead surveille ton marché LinkedIn pour identifier les tendances, conversations et opportunités qui peuvent générer du business.
          </p>
        </Reveal>
        <Reveal delay={100} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)]">
          <p className="text-[13px] font-semibold text-[#0F172A]">Trending Topics</p>
          <div className="mt-2">
            <TrendRow label="AI Recruitment" pct="42%" w={92} />
            <TrendRow label="Remote Hiring" pct="31%" w={72} />
            <TrendRow label="HR Automation" pct="28%" w={64} />
            <TrendRow label="Talent Acquisition" pct="19%" w={46} />
          </div>
          <p className="mt-5 text-[13px] font-semibold text-[#0F172A]">Competitor Activity</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {[["Competitor A", "24%"], ["Competitor B", "17%"], ["Competitor C", "12%"]].map(([c, p]) => (
              <div key={c} className="rounded-lg border border-[#E2E8F0] px-3 py-2">
                <p className="text-[12px] text-[#64748B]">{c}</p>
                <p className="text-[14px] font-bold text-[#0F172A]">↑ {p}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-[#0051FF]/20 bg-[#EEF4FF] p-3">
            <p className="text-[12px] font-semibold text-[#0051FF]">AI Insight</p>
            <p className="mt-1 text-[13px] leading-relaxed text-[#334155]">Les conversations autour de l&apos;automatisation RH augmentent fortement cette semaine.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ----- Leads ---------------------------------------------------------------

function Leads() {
  const rows = [
    { name: "Thomas Martin", company: "SaaS Corp", role: "CEO", icp: 96, intent: 92, hot: true },
    { name: "Julie Bernard", company: "TechCo", role: "HR Director", icp: 94, intent: 88, hot: true },
    { name: "Marc Dupont", company: "ScaleUp", role: "Founder", icp: 91, intent: 81, hot: false },
  ];
  return (
    <section className="bg-[#F8FAFC] px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <Reveal delay={100} className="order-2 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)] lg:order-1">
          <div className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr] gap-2 border-b border-[#E2E8F0] px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
            <span>Prospect</span><span>Role</span><span className="text-right">ICP</span><span className="text-right">Intent</span>
          </div>
          {rows.map((r, i) => (
            <Reveal key={r.name} delay={i * 120} className="grid grid-cols-[1.4fr_0.8fr_0.6fr_0.6fr] items-center gap-2 border-b border-[#E2E8F0] px-4 py-3 last:border-b-0">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-[13px] font-semibold text-[#0F172A]">{r.name}</span>
                  {r.hot && <span className="shrink-0 rounded-full bg-[#EF4444]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#EF4444]">HOT</span>}
                </div>
                <p className="truncate text-[11px] text-[#94A3B8]">{r.company}</p>
              </div>
              <span className="truncate text-[12px] text-[#64748B]">{r.role}</span>
              <span className="text-right text-[13px] font-semibold text-[#0051FF]">{r.icp}%</span>
              <span className="text-right text-[13px] font-bold text-[#0F172A]">{r.intent}</span>
            </Reveal>
          ))}
        </Reveal>
        <Reveal className="order-1 lg:order-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">Leads</p>
          <h2 className="mt-3 text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0F172A] sm:text-[38px]">Tes prospects idéaux. Identifiés automatiquement.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
            Définis ton ICP. LogLead trouve les décideurs qui correspondent et enrichit automatiquement leurs données — email, téléphone, poste, score.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

// ----- Signals (differentiator) --------------------------------------------

function Signals() {
  const events = [
    { time: "08:42", label: "Viewed your profile" },
    { time: "09:17", label: "Viewed your post" },
    { time: "10:03", label: "Liked your post" },
    { time: "11:26", label: "Viewed your profile" },
    { time: "14:12", label: "Commented" },
  ];
  return (
    <section id="signals" className="relative overflow-hidden px-5 py-20 sm:px-6 sm:py-28">
      <div aria-hidden className="pointer-events-none absolute right-[-15%] top-0 h-[500px] w-[500px] rounded-full" style={{ background: "radial-gradient(ellipse at center, rgba(0,81,255,0.07), transparent 65%)" }} />
      <div className="relative mx-auto max-w-6xl">
        <SectionHeader
          eyebrow="Signals"
          title={<>Ne regarde plus seulement qui est ton prospect.<br /><span className="text-[#0051FF]">Regarde ce qu&apos;il fait.</span></>}
          sub="Chaque interaction peut révéler une intention."
        />
        <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Timeline */}
          <Reveal className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
            <p className="text-[13px] font-semibold text-[#0F172A]">Activity timeline</p>
            <ol className="mt-4">
              {events.map((e, i) => (
                <Reveal as="li" key={i} delay={i * 140} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < events.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-[#E2E8F0]" />}
                  <span className="relative z-10 mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#0051FF]" />
                  <div>
                    <span className="num text-[12px] font-semibold text-[#94A3B8]">{e.time}</span>
                    <p className="text-[14px] font-medium text-[#0F172A]">{e.label}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </Reveal>

          {/* Score + network */}
          <Reveal delay={120} className="flex flex-col gap-4">
            <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
              <div className="flex items-center justify-between">
                <p className="text-[13px] font-semibold text-[#0F172A]">Lead Score</p>
                <span className="rounded-full bg-[#0051FF]/10 px-2.5 py-1 text-[11px] font-bold text-[#0051FF]">HIGH INTENT</span>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-[64px] font-bold leading-none tracking-[-0.03em] text-[#0F172A]"><CountUp to={92} duration={1600} /></span>
                <span className="mb-2 text-[15px] text-[#94A3B8]">/100</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#EEF4FF]">
                <div className="signal-fill h-full rounded-full bg-[#0051FF]" />
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#64748B]">Ce prospect montre maintenant plusieurs signaux d&apos;intérêt.</p>
            </div>
            <div className="relative overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-2">
              <SignalNetwork className="h-[150px] w-full" />
            </div>
            <Link href={SIGNUP} className={`${btnPrimary} w-full`}>Voir mes prospects les plus chauds →</Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ----- Content Studio ------------------------------------------------------

function ContentStudio() {
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <Reveal>
          <p className="text-[13px] font-semibold uppercase tracking-[0.08em] text-[#0051FF]">Content Studio</p>
          <h2 className="mt-3 text-[30px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0F172A] sm:text-[38px]">Crée du contenu qui attire les bons prospects.</h2>
          <p className="mt-4 text-[17px] leading-relaxed text-[#64748B]">
            LogLead utilise les données de ton marché pour identifier les sujets, angles et hooks susceptibles d&apos;intéresser ton audience.
          </p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#EEF4FF] px-3 py-1.5 text-[13px] font-semibold text-[#0051FF]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0051FF]" /> Based on market signals
          </span>
        </Reveal>
        <Reveal delay={100} className="rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)]">
          <div className="flex items-center justify-between rounded-lg bg-[#F8FAFC] px-4 py-3">
            <span className="text-[12px] font-semibold text-[#64748B]">HOOK SCORE</span>
            <span className="text-[20px] font-bold text-[#22C55E]">94<span className="text-[13px] text-[#94A3B8]"> / 100</span></span>
          </div>
          <p className="mt-4 text-[17px] font-semibold leading-snug text-[#0F172A]">
            « Pourquoi vos meilleurs prospects ne répondent plus à vos messages ? »
          </p>
          {/* LinkedIn preview */}
          <div className="mt-4 rounded-xl border border-[#E2E8F0] p-4">
            <div className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF]" />
              <div>
                <p className="text-[13px] font-semibold text-[#0F172A]">Ton nom</p>
                <p className="text-[11px] text-[#94A3B8]">Founder · maintenant</p>
              </div>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed text-[#334155]">
              Pourquoi vos meilleurs prospects ne répondent plus à vos messages ?<br /><br />
              Ce n&apos;est pas votre offre. C&apos;est le timing…
            </p>
            <div className="mt-3 flex gap-4 border-t border-[#E2E8F0] pt-2 text-[11px] text-[#94A3B8]">
              <span>👍 J&apos;aime</span><span>💬 Commenter</span><span>↻ Republier</span>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ----- AI Growth Partner ---------------------------------------------------

function GrowthPartner() {
  return (
    <section className="bg-[#F8FAFC] px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeader eyebrow="AI Growth Partner" title="Ton CMO IA travaille avec tes données." sub="Pose une question à LogLead. Il analyse tes données et te donne une recommandation basée sur ton marché, tes prospects et tes performances." />
        <Reveal delay={100} className="mt-10 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_16px_40px_-24px_rgba(15,23,42,0.2)]">
          <div className="space-y-4 p-5">
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#0051FF] px-4 py-2.5 text-[14px] text-white">
              Qui sont mes 5 prospects les plus chauds aujourd&apos;hui ?
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#334155]">
              Voici les 5 prospects qui montrent actuellement les signaux d&apos;intention les plus forts.
              <div className="mt-2 space-y-1">
                {[["Thomas Martin", 92], ["Julie Bernard", 88], ["Marc Dupont", 81], ["Sofia Leroy", 79], ["Karim Benali", 77]].map(([n, s]) => (
                  <div key={n as string} className="flex items-center justify-between rounded-lg bg-white px-3 py-1.5">
                    <span className="text-[13px] font-medium text-[#0F172A]">{n}</span>
                    <span className="text-[12px] font-bold text-[#0051FF]">{s}/100</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ml-auto max-w-[80%] rounded-2xl rounded-tr-sm bg-[#0051FF] px-4 py-2.5 text-[14px] text-white">
              Que devrais-je publier aujourd&apos;hui ?
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-[#F8FAFC] px-4 py-3 text-[14px] text-[#334155]">
              Les conversations autour de l&apos;automatisation RH sont en forte progression. Voici 3 angles adaptés à ton audience.
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// ----- Unification ---------------------------------------------------------

function Unification() {
  const before = ["LinkedIn", "Scraper", "Enrichment", "CRM", "Content Tool", "Analytics"];
  const after = ["Market Intelligence", "Leads", "Signals", "Content", "Opportunities"];
  return (
    <section className="px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader title="Un seul système. Pas six outils." sub="LogLead connecte toutes les étapes de ta croissance." />
        <div className="mt-12 grid items-center gap-6 md:grid-cols-[1fr_auto_1fr]">
          <Reveal className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6">
            <p className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-[#94A3B8]">Avant</p>
            <div className="flex flex-wrap gap-2">
              {before.map((b) => (
                <span key={b} className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-[13px] text-[#64748B]">{b}</span>
              ))}
            </div>
          </Reveal>
          <Reveal delay={100} className="mx-auto text-[#94A3B8]">
            <svg width="40" height="24" viewBox="0 0 40 24" fill="none" className="rotate-90 md:rotate-0"><path d="M2 12h32m0 0l-8-8m8 8l-8 8" stroke="#0051FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </Reveal>
          <Reveal delay={160} className="rounded-2xl border-2 border-[#0051FF] bg-[#EEF4FF] p-6">
            <p className="mb-3 text-[13px] font-bold text-[#0051FF]">LOGLEAD</p>
            <ol className="space-y-1.5">
              {after.map((a, i) => (
                <li key={a} className="flex items-center gap-2 text-[14px] font-semibold text-[#0F172A]">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#0051FF] text-[10px] font-bold text-white">{i + 1}</span>
                  {a}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ----- Before / After ------------------------------------------------------

function BeforeAfter() {
  const before = ["Tu cherches manuellement tes prospects", "Tu publies sans savoir qui est intéressé", "Tu ne vois pas les signaux", "Tes données sont dispersées", "Tu passes ton temps à changer d'outil"];
  const after = ["Tes prospects sont identifiés", "Les signaux sont visibles", "Les leads sont scorés", "Le contenu est connecté au marché", "Les opportunités sont centralisées"];
  return (
    <section className="bg-[#F8FAFC] px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title="Ton acquisition avant LogLead." />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <Reveal className="rounded-2xl border border-[#E2E8F0] bg-white p-6">
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-[#94A3B8]">Avant</p>
            <ul className="space-y-3">
              {before.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-[15px] text-[#64748B]">
                  <span className="mt-0.5 text-[#EF4444]">✕</span> {b}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120} className="rounded-2xl border-2 border-[#0051FF]/20 bg-white p-6">
            <p className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-[#0051FF]">Avec LogLead</p>
            <ul className="space-y-3">
              {after.map((a) => (
                <li key={a} className="flex items-start gap-2.5 text-[15px] font-medium text-[#0F172A]">
                  <span className="mt-0.5 text-[#22C55E]">✓</span> {a}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ----- Pricing -------------------------------------------------------------

function Pricing() {
  const [annual, setAnnual] = useState(false);
  const plans = [
    { name: "Free", price: 0, features: ["200 crédits", "Market Intelligence basique", "Post Generator"], cta: "Commencer gratuitement" },
    { name: "Starter", price: 29, features: ["2 000 crédits", "Market Intelligence", "500 leads/mois", "Content Studio", "Calendar"], cta: "Choisir Starter" },
    { name: "Growth", price: 59, popular: true, features: ["5 000 crédits", "Market Intelligence", "2 000 leads/mois", "Enrichissement automatique", "Content Studio", "Calendar"], cta: "Choisir Growth" },
    { name: "Pro", price: 99, features: ["10 000 crédits", "Leads illimités", "AI Growth Partner", "Toutes les fonctionnalités", "Support prioritaire"], cta: "Choisir Pro" },
  ];
  const price = (p: number) => (p === 0 ? "0€" : annual ? `${Math.round(p * 0.8)}€` : `${p}€`);
  return (
    <section id="pricing" className="px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <Reveal><Badge>Tarifs</Badge></Reveal>
          <SectionHeader title="Commence gratuitement. Scale quand ça marche." sub="Pas besoin de prendre un abonnement avant d'avoir compris la valeur." />
        </div>
        <Reveal className="mt-6 flex justify-center">
          <div className="inline-flex rounded-full border border-[#E2E8F0] bg-[#F8FAFC] p-1">
            {[["Mensuel", false], ["Annuel", true]].map(([l, v]) => (
              <button key={l as string} onClick={() => setAnnual(v as boolean)} className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${annual === v ? "bg-white text-[#0F172A] shadow-sm" : "text-[#64748B]"}`}>
                {l as string}{v ? " · -20%" : ""}
              </button>
            ))}
          </div>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((p, i) => (
            <Reveal key={p.name} delay={i * 80} className={`flex flex-col rounded-2xl border p-6 ${p.popular ? "border-2 border-[#0051FF] bg-[#EEF4FF]" : "border-[#E2E8F0] bg-white"}`}>
              {p.popular && <span className="mb-2 inline-flex w-fit rounded-full bg-[#0051FF] px-2.5 py-0.5 text-[11px] font-semibold text-white">Le plus populaire</span>}
              <p className="text-[13px] font-semibold uppercase tracking-wide text-[#64748B]">{p.name}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-[32px] font-bold tracking-[-0.02em] text-[#0F172A]">{price(p.price)}</span>
                <span className="text-[13px] text-[#94A3B8]">/mois</span>
              </div>
              <ul className="mt-4 flex-1 space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13px] text-[#334155]"><span className="mt-0.5 text-[#0051FF]">✓</span> {f}</li>
                ))}
              </ul>
              <Link href={SIGNUP} className={`mt-5 w-full ${p.popular ? btnPrimary : btnSecondary}`}>{p.cta}</Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ----- Comparison ----------------------------------------------------------

function Comparison() {
  const competitors = ["Taplio", "Apollo", "Clay", "Lemlist"];
  const rows = ["Market Intelligence", "Lead Discovery", "Enrichment", "Content Generation", "Lead Scoring", "Buying Signals", "AI Growth Partner", "Unified Growth OS"];
  return (
    <section className="bg-[#F8FAFC] px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <SectionHeader title={<>Les autres automatisent un workflow.<br /><span className="text-[#0051FF]">LogLead construit le système.</span></>} />
        <Reveal delay={100} className="mt-10 overflow-x-auto rounded-2xl border border-[#E2E8F0] bg-white">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-[#E2E8F0] text-[12px] text-[#64748B]">
                <th className="px-4 py-3 font-semibold">Fonctionnalité</th>
                <th className="px-4 py-3 text-center font-bold text-[#0051FF]">LogLead</th>
                {competitors.map((c) => <th key={c} className="px-4 py-3 text-center font-semibold">{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r} className="border-b border-[#E2E8F0] last:border-b-0">
                  <td className="px-4 py-3 text-[13px] font-medium text-[#0F172A]">{r}</td>
                  <td className="bg-[#EEF4FF] px-4 py-3 text-center text-[#0051FF]">✓</td>
                  {competitors.map((c) => <td key={c} className="px-4 py-3 text-center text-[#CBD5E1]">–</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <p className="mt-3 text-center text-[12px] text-[#94A3B8]">« – » : capacité non renseignée pour cet outil. Nous ne comparons que ce que nous pouvons vérifier.</p>
      </div>
    </section>
  );
}

// ----- Testimonials --------------------------------------------------------

function Testimonials() {
  const items = [
    { role: "Head of Growth", company: "SaaS B2B", result: "Résultat client à venir" },
    { role: "Founder", company: "Agence", result: "Résultat client à venir" },
    { role: "Sales Director", company: "Scale-up", result: "Résultat client à venir" },
  ];
  return (
    <section id="reviews" className="px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeader title="Les équipes B2B qui utilisent déjà LogLead." />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {items.map((t, i) => (
            <Reveal key={i} delay={i * 100} className="rounded-2xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-6">
              <span className="inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">Placeholder</span>
              <div className="mt-4 flex items-center gap-3">
                <span className="h-10 w-10 rounded-full bg-[#E2E8F0]" />
                <div>
                  <p className="text-[13px] font-semibold text-[#0F172A]">Nom du client</p>
                  <p className="text-[12px] text-[#64748B]">{t.role} · {t.company}</p>
                </div>
              </div>
              <p className="mt-4 text-[14px] italic leading-relaxed text-[#94A3B8]">« Témoignage à venir. »</p>
              <p className="mt-3 text-[13px] font-semibold text-[#0051FF]">{t.result}</p>
            </Reveal>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] text-[#94A3B8]">Emplacements réservés — les témoignages réels seront ajoutés dès qu&apos;ils seront disponibles.</p>
      </div>
    </section>
  );
}

// ----- FAQ -----------------------------------------------------------------

function FAQ() {
  const qa = [
    ["C'est quoi LogLead ?", "Un système de croissance IA qui transforme LinkedIn en moteur d'acquisition B2B : marché, prospects, signaux, contenu et opportunités dans une seule plateforme."],
    ["Pourquoi LinkedIn ?", "C'est là que se prennent les décisions B2B : les signaux d'intérêt de tes futurs clients y sont visibles."],
    ["Comment LogLead trouve-t-il mes prospects ?", "Tu définis ton ICP ; LogLead identifie les décideurs correspondants et enrichit automatiquement leurs données."],
    ["Comment fonctionnent les signaux ?", "LogLead suit les interactions pertinentes (vues, likes, commentaires, retours) et les traduit en niveau d'intention."],
    ["Comment le Lead Score est-il calculé ?", "À partir de la correspondance ICP et des signaux d'intention récents, agrégés en un score sur 100."],
    ["Comment fonctionne l'enrichissement ?", "LogLead complète email, téléphone et données firmographiques via ses sources d'enrichissement."],
    ["Le contenu est-il généré par IA ?", "Oui — à partir des données de ton marché pour proposer sujets, angles et hooks pertinents. Tu gardes le contrôle final."],
    ["Mes données sont-elles sécurisées ?", "Tes données te restent propres et sont utilisées uniquement pour piloter ta croissance."],
    ["Puis-je annuler mon abonnement ?", "Oui, à tout moment, sans engagement."],
    ["Puis-je commencer gratuitement ?", "Oui — l'offre Free inclut 200 crédits, sans carte bancaire."],
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="bg-[#F8FAFC] px-5 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeader title="Questions fréquentes" />
        <div className="mt-10 space-y-3">
          {qa.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <Reveal key={i} delay={i * 40} className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="text-[15px] font-semibold text-[#0F172A]">{q}</span>
                  <span className={`shrink-0 text-[20px] text-[#0051FF] transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>+</span>
                </button>
                <div className="grid transition-all duration-300 ease-out" style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}>
                  <div className="overflow-hidden">
                    <p className="px-5 pb-4 text-[14px] leading-relaxed text-[#64748B]">{a}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ----- Final CTA -----------------------------------------------------------

function FinalCTA() {
  return (
    <section className="relative overflow-hidden px-5 py-24 sm:px-6 sm:py-32">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: "radial-gradient(ellipse at center, rgba(0,81,255,0.10), transparent 60%)" }} />
      <div aria-hidden className="pointer-events-none absolute inset-0 mx-auto max-w-2xl opacity-60">
        <SignalNetwork className="h-full w-full" />
      </div>
      <div className="relative mx-auto max-w-2xl text-center">
        <Reveal>
          <h2 className="text-[34px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">Tes prochains clients sont déjà sur LinkedIn.</h2>
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-relaxed text-[#64748B]">
            LogLead t&apos;aide à identifier qui ils sont, comprendre leur intention et savoir quand agir.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={SIGNUP} className={btnPrimary}>Commencer gratuitement →</Link>
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className={btnSecondary}>Réserver une démo</a>
          </div>
          <p className="mt-4 text-[13px] text-[#94A3B8]">Sans carte bancaire · Sans engagement</p>
        </Reveal>
      </div>
    </section>
  );
}

// ----- Footer --------------------------------------------------------------

function Footer() {
  const cols = [
    { title: "Produit", links: ["Market Intelligence", "Leads", "Signals", "Content Studio", "AI Growth Partner"] },
    { title: "Ressources", links: ["Blog", "Guides", "Changelog"] },
    { title: "Entreprise", links: ["À propos", "Contact"] },
    { title: "Legal", links: ["Mentions légales", "Confidentialité", "CGV"] },
  ];
  return (
    <footer className="bg-[#0F172A] px-5 py-16 text-[#94A3B8] sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div>
            <span className="text-[18px] font-bold text-white">loglead</span>
            <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-[#94A3B8]">Le système de croissance IA pour les entreprises B2B.</p>
            <a href="mailto:loglead@gmail.com" className="mt-4 inline-block text-[14px] text-[#CBD5E1] hover:text-white">loglead@gmail.com</a>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <p className="text-[13px] font-semibold text-white">{c.title}</p>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l}><a href="#" className="text-[13px] text-[#94A3B8] transition hover:text-white">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-2 border-t border-white/10 pt-6 text-[12px] sm:flex-row sm:items-center">
          <p>© 2026 LogLead.</p>
          <p className="text-[#64748B]">Service indépendant, non affilié à LinkedIn Corporation.</p>
        </div>
      </div>
    </footer>
  );
}

// ----- Cookie banner -------------------------------------------------------

function CookieBanner() {
  const [show, setShow] = useState(false);
  const [prefs, setPrefs] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("loglead_cookie_consent")) setShow(true);
  }, []);
  const decide = (v: string) => {
    localStorage.setItem("loglead_cookie_consent", v);
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#E2E8F0] bg-white/95 px-5 py-4 backdrop-blur">
      <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[13px] leading-relaxed text-[#64748B]">
          Nous utilisons des cookies pour améliorer ton expérience. Tu peux accepter, refuser ou gérer tes préférences.
          {prefs && <span className="mt-1 block text-[12px] text-[#94A3B8]">Essentiels (toujours actifs) · Mesure d&apos;audience · Marketing</span>}
        </p>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button onClick={() => setPrefs((v) => !v)} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Gérer les préférences</button>
          <button onClick={() => decide("declined")} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-[13px] font-medium text-[#475569] hover:bg-[#F8FAFC]">Refuser</button>
          <button onClick={() => decide("accepted")} className="rounded-lg bg-[#0051FF] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#0043D4]">Accepter</button>
        </div>
      </div>
    </div>
  );
}
