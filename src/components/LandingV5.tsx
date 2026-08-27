"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./LandingPage";
import { LangProvider, useLang, useTr } from "./lpLang";

// ---------------------------------------------------------------------------
// Landing v5 — "Your AI Sales Agent for B2B". Light, self-contained (its own
// nav + footer). Bilingual FR/EN via lpLang (auto-detected from the visitor's
// region, then remembered). Uses CSS/IO animations (Reveal), no Framer.
// ---------------------------------------------------------------------------

type Tr = ReturnType<typeof useTr>;

const SIGNUP = "/signup";
const BTN = "inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_0_20px_#0051FF40] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_#0051FF70]";
const EY ="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[12px] font-medium text-[#475569]";

// A hover dropdown nav menu. Trigger inherits the nav text color; the panel is
// always a white card with dark links.
function NavMenu({ label, items, cls }: { label: string; items: [string, string][]; cls: string }) {
  return (
    <div className="group relative">
      <button className={`inline-flex items-center gap-1 ${cls}`}>
        {label}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="transition group-hover:rotate-180"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100">
        <div className="min-w-[230px] rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_16px_44px_-14px_rgba(15,23,42,0.25)]">
          {items.map(([l, h]) =>
            h.startsWith("#") ? (
              <a key={l} href={h} className="block rounded-xl px-3 py-2 text-[13px] text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]">{l}</a>
            ) : (
              <Link key={l} href={h} className="block rounded-xl px-3 py-2 text-[13px] text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]">{l}</Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}

// Product mega-menu — 3 feature cards, each with a modern mini-mockup.
function ProductMenu({ cls }: { cls: string }) {
  const t = useTr();
  const products = [
    {
      name: "Scout",
      href: "/#how",
      tag: t("Describe. LogLead finds.", "Décrivez. LogLead trouve."),
      icon: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
      art: <ScoutArt t={t} />,
    },
    {
      name: "Lead Intelligence",
      href: "/#sources",
      tag: t("Qualified, scored, enriched automatically.", "Qualifiés, scorés, enrichis automatiquement."),
      icon: <><path d="M3 3v18h18" /><path d="M7 13l3-3 3 2 5-6" /></>,
      art: <LeadIntelArt />,
    },
    {
      name: "Web Spy",
      href: "/#before",
      tag: t("Find who uses your competitors.", "Trouvez qui utilise vos concurrents."),
      icon: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
      art: <WebSpyArt t={t} />,
    },
  ];
  return (
    <div className="group relative">
      <button className={`inline-flex items-center gap-1 ${cls}`}>
        {t("Product", "Produit")}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="transition group-hover:rotate-180"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100">
        <div className="w-[720px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_16px_44px_-14px_rgba(15,23,42,0.25)]">
          <div className="grid grid-cols-3 gap-3">
            {products.map((p) => (
              <Link key={p.name} href={p.href} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition hover:border-[#0051FF60] hover:bg-white hover:shadow-[0_12px_32px_-14px_rgba(15,23,42,0.2)]">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0051FF]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{p.icon}</svg>
                  </span>
                  <span className="text-[14px] font-semibold text-[#0F172A]">{p.name}</span>
                </div>
                <p className="mt-2 text-[12px] leading-relaxed text-[#64748B]">{p.tag}</p>
                <div className="mt-3">{p.art}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Scout — a compact search-prompt mockup with a blinking cursor.
function ScoutArt({ t }: { t: Tr }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-2.5 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.25)]">
      <div className="flex items-center gap-1.5 rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <span className="text-[10px] font-medium leading-none text-[#0F172A]">{t("Web agencies hiring", "Agences web qui recrutent")}<span className="v5-blink ml-px inline-block h-2.5 w-[1.5px] translate-y-[1px] bg-[#0051FF]" /></span>
      </div>
      <div className="mt-1.5 flex gap-1">
        {["LinkedIn", "Maps", "Web"].map((s) => (
          <span key={s} className="rounded bg-[#EFF4FF] px-1.5 py-0.5 text-[8px] font-semibold text-[#0051FF]">{s}</span>
        ))}
      </div>
    </div>
  );
}

// Lead Intelligence — a compact list with scores + enrichment badges.
function LeadIntelArt() {
  const rows = [
    { n: "Pixelis", s: 94, g: "#10B981" },
    { n: "Nord Digital", s: 88, g: "#10B981" },
    { n: "Atelier Web", s: 72, g: "#F59E0B" },
  ];
  return (
    <div className="space-y-1 rounded-lg border border-[#E2E8F0] bg-white p-2 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.25)]">
      {rows.map((r) => (
        <div key={r.n} className="flex items-center justify-between rounded-md bg-[#F8FAFC] px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4 w-4 items-center justify-center rounded bg-[#EFF4FF] text-[8px] font-bold text-[#0051FF]">{r.n[0]}</span>
            <span className="text-[10px] font-medium text-[#0F172A]">{r.n}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[8px]">✉</span>
            <span className="text-[8px]">📞</span>
            <span className="flex items-center gap-0.5"><span className="h-1.5 w-1.5 rounded-full" style={{ background: r.g }} /><span className="num text-[10px] font-bold text-[#0F172A]">{r.s}</span></span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Web Spy — a "detected tech stack" card.
function WebSpyArt({ t }: { t: Tr }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-2.5 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.25)]">
      <div className="text-[8px] font-semibold uppercase tracking-wide text-[#94A3B8]">{t("Detected on acme.com", "Détecté sur acme.com")}</div>
      <div className="mt-1.5 flex flex-wrap gap-1">
        {["HubSpot", "Shopify", "Intercom"].map((s) => (
          <span key={s} className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-1.5 py-0.5 text-[8px] font-semibold text-[#334155]">{s}</span>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1 text-[9px] font-medium text-[#10B981]"><span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />{t("3 competitor tools found", "3 outils concurrents trouvés")}</div>
    </div>
  );
}

// `solid` forces the light (scrolled) styling for pages that have no dark hero
// behind the nav (e.g. /pricing, /affiliate).
export function Nav({ solid = false }: { solid?: boolean }) {
  const t = useTr();
  const { lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 60);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const light = solid || scrolled;
  const linkCls = `transition ${light ? "hover:text-[#0F172A]" : "hover:text-white"}`;

  const solution: [string, string][] = [
    [t("SaaS founders", "Fondateurs SaaS"), "/for/saas-founders"],
    [t("Agencies", "Agences"), "/for/agencies"],
    [t("Consultants", "Consultants"), "/for/consultants"],
    [t("Sales teams", "Équipes commerciales"), "/for/sales-teams"],
    [t("Startups", "Startups"), "/for/startups"],
    [t("B2B companies", "Entreprises B2B"), "/for/b2b-companies"],
  ];
  const ressources: [string, string][] = [
    ["LogLead vs Lemlist", "/vs/loglead-vs-lemlist"],
    ["LogLead vs Apollo", "/vs/loglead-vs-apollo"],
    ["LogLead vs Taplio", "/vs/loglead-vs-taplio"],
    ["LogLead vs Clay", "/vs/loglead-vs-clay"],
    [t("Affiliate program", "Programme d'affiliation"), "/affiliate"],
    [t("Privacy", "Confidentialité"), "/privacy"],
    [t("Terms", "CGU"), "/terms"],
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${light ? "border-b border-[#E2E8F0] bg-[#FFFFFFEE] backdrop-blur-xl" : "border-b border-transparent"}`}>
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" aria-label="LogLead">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={light ? "/loglead-logo.svg" : "/loglead-logo-dark.svg"} alt="LogLead" className="h-7 w-auto" />
        </Link>
        <div className={`hidden items-center gap-7 text-[14px] lg:flex ${light ? "text-[#475569]" : "text-white/85"}`}>
          <ProductMenu cls={linkCls} />
          <NavMenu label={t("Solution", "Solution")} items={solution} cls={linkCls} />
          <Link href="/pricing" className={linkCls}>{t("Pricing", "Tarifs")}</Link>
          <NavMenu label={t("Resources", "Ressources")} items={ressources} cls={linkCls} />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            aria-label={t("Switch to French", "Passer en anglais")}
            className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${light ? "border-[#E2E8F0] text-[#475569] hover:border-[#0051FF60] hover:text-[#0F172A]" : "border-white/30 text-white/85 hover:border-white hover:text-white"}`}
          >
            {lang === "fr" ? "FR" : "EN"}
          </button>
          <Link href="/login" className={`hidden text-[14px] transition sm:block ${light ? "text-[#475569] hover:text-[#0F172A]" : "text-white/85 hover:text-white"}`}>{t("Log in", "Connexion")}</Link>
          <Link href={SIGNUP} className={`${BTN} !px-5 !py-2.5 !text-[14px]`}>{t("Get started", "Commencer")}</Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const t = useTr();
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const typing = useRef(true);

  const queries = [
    t("Restaurants in Lyon with Google rating under 4 stars and no website", "Restaurants à Lyon avec une note Google sous 4 étoiles et sans site web"),
    t("Web agencies in France hiring a sales rep", "Agences web en France qui recrutent un commercial"),
    t("B2B SaaS between 20 and 200 employees in Paris", "SaaS B2B de 20 à 200 employés à Paris"),
    t("E-commerce brands with low engagement on Instagram", "Marques e-commerce avec peu d'engagement sur Instagram"),
  ];
  const queriesRef = useRef(queries);
  queriesRef.current = queries;

  // Typewriter placeholder cycling through examples. Stops once the user types.
  useEffect(() => {
    let qi = 0, ci = 0, erasing = false;
    const tick = () => {
      if (!typing.current) return;
      const pool = queriesRef.current;
      const full = pool[qi % pool.length];
      if (!erasing) {
        ci++;
        setTyped(full.slice(0, ci));
        if (ci >= full.length) { erasing = true; return void (h = setTimeout(tick, 1800)); }
      } else {
        ci -= 3;
        setTyped(full.slice(0, Math.max(0, ci)));
        if (ci <= 0) { erasing = false; ci = 0; qi = (qi + 1) % pool.length; }
      }
      h = setTimeout(tick, erasing ? 20 : 42);
    };
    let h = setTimeout(tick, 1000);
    return () => clearTimeout(h);
  }, []);

  // Auto-resize the textarea.
  useEffect(() => {
    const ta = taRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.max(44, ta.scrollHeight)}px`; }
  }, [query]);

  function onType(v: string) {
    typing.current = false;
    setQuery(v);
  }
  function find() {
    const q = query.trim();
    window.location.href = `${SIGNUP}${q ? `?q=${encodeURIComponent(q)}` : ""}`;
  }

  return (
    <section className="relative -mt-[72px] overflow-hidden px-5 pb-28 pt-[184px] sm:px-6">
      {/* Hero background image (dark navy → blue → white gradient) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: "url(/hero-bg.svg)" }}
      />
      {/* Bottom fade into the light sections below */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#F8FAFC]" />

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <h1 className="mx-auto max-w-2xl text-[32px] font-bold leading-[1.06] tracking-[-0.03em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.25)] sm:text-[48px] lg:text-[54px]">
            {t("Find your ideal clients", "Trouvez vos clients idéaux")}<br /><span className="v5-gradient-text-light">{t("before your competitors do.", "avant vos concurrents.")}</span>
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-[500px] text-[17px] leading-[1.7] text-white/85">
            {t("Describe who you're looking for. Your AI Sales Agent finds them, messages them and sends you only the hot replies.", "Décrivez qui vous cherchez. Votre agent commercial IA les trouve, les contacte et ne vous remonte que les réponses chaudes.")}
          </p>
        </Reveal>

        {/* Chat bubble */}
        <Reveal delay={200}>
          <div className="v5-chat mx-auto mt-9 w-full max-w-[620px] rounded-[20px] border border-[#E2E8F0] bg-white px-5 pb-3 pt-4 text-left shadow-[0_16px_44px_-14px_rgba(15,23,42,0.2)]">
            <textarea
              ref={taRef}
              value={query}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); find(); } }}
              placeholder={typed || t("Describe your ideal prospect…", "Décrivez votre prospect idéal…")}
              className="min-h-[44px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            {/* Bottom bar */}
            <div className="mt-2 flex items-center gap-2">
              <button title={t("Add context", "Ajouter du contexte")} aria-label={t("Add context", "Ajouter du contexte")} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] text-[18px] leading-none text-[#475569] transition hover:border-[#0051FF60] hover:text-[#0F172A]">+</button>
              <button
                onClick={find}
                disabled={!query.trim()}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_0_16px_#0051FF40] transition hover:-translate-y-0.5 hover:shadow-[0_0_28px_#0051FF70] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {t("Find them", "Trouvez-les")} <span aria-hidden>➤</span>
              </button>
            </div>
          </div>
        </Reveal>

        {/* Social proof */}
        <Reveal delay={320}>
          <div className="mt-8 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["#0051FF", "#00A3FF", "#4F8BFF", "#00D4FF", "#1A6BFF"].map((c, i) => <span key={i} className="h-7 w-7 rounded-full border-2 border-white" style={{ background: c }} />)}
              </div>
              <span className="text-[13px] text-[#475569]">{t("500+ B2B sales teams trust LogLead", "500+ équipes commerciales B2B font confiance à LogLead")}</span>
            </div>
            <p className="text-[13px] text-[#94A3B8]"><span className="text-[#F59E0B]">★★★★★</span> {t("“Like having a full-time SDR for €59/month”", "« Comme un SDR à plein temps pour 59 €/mois »")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function HowItWorks() {
  const t = useTr();
  const steps = [
    { n: "01", h: t("You describe your ideal prospect", "Vous décrivez votre prospect idéal"), d: t("\"Web agencies in France hiring a sales rep.\" One sentence. Your agent does the rest.", "« Agences web en France qui recrutent un commercial. » Une phrase. Votre agent fait le reste.") },
    { n: "02", h: t("Your agent finds them", "Votre agent les trouve"), d: t("LinkedIn · Google Maps · Reddit · Instagram · Web. Qualified, scored 0-100, enriched with email + phone.", "LinkedIn · Google Maps · Reddit · Instagram · Web. Qualifiés, scorés de 0 à 100, enrichis avec email + téléphone.") },
    { n: "03", h: t("Your agent writes personalized messages", "Votre agent rédige des messages personnalisés"), d: t("Based on each prospect's signals, industry, recent activity and your offer. Every message sounds human. Never generic.", "À partir des signaux de chaque prospect, de son secteur, de son activité récente et de votre offre. Chaque message sonne humain. Jamais générique.") },
    { n: "04", h: t("Your agent sends and follows up", "Votre agent envoie et relance"), d: t("First message → wait 3 days → follow-up → wait 5 days → last message. All automatically. All in your name.", "Premier message → attendre 3 jours → relance → attendre 5 jours → dernier message. Automatiquement. En votre nom.") },
    { n: "05", h: t("You only see the hot conversations", "Vous ne voyez que les conversations chaudes"), d: t("Your agent filters replies and surfaces only the ones worth your time. You reply. You close. That's it.", "Votre agent filtre les réponses et ne remonte que celles qui valent votre temps. Vous répondez. Vous closez. C'est tout.") },
  ];
  return (
    <section id="how" className="bg-[#F8FAFC] px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> {t("How your agent works", "Comment votre agent travaille")}</span>
          <h2 className="mt-5 text-[36px] font-bold leading-[1.05] tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">{t("Set it up once.", "Configurez-le une fois.")}<br /><span className="v5-gradient-text">{t("Let it run forever.", "Laissez-le tourner à l'infini.")}</span></h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-[#475569]">{t("Your AI Sales Agent works around the clock. You review and close.", "Votre agent commercial IA travaille 24h/24. Vous validez et vous closez.")}</p>
        </div>
        <div className="mt-16 space-y-16 sm:space-y-24">
          {steps.map((s, i) => (
            <Reveal key={s.n}>
              <div className={`grid items-center gap-8 sm:gap-12 lg:grid-cols-2 ${i % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""}`}>
                {/* Text */}
                <div className={i % 2 === 1 ? "lg:pl-4" : "lg:pr-4"}>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[13px] font-bold text-white shadow-[0_6px_16px_-4px_rgba(0,81,255,0.5)]">{s.n}</span>
                    <span className="h-px flex-1 bg-gradient-to-r from-[#0051FF40] to-transparent" />
                  </div>
                  <h3 className="mt-4 text-[24px] font-bold leading-tight tracking-[-0.01em] text-[#0F172A] sm:text-[28px]">{s.h}</h3>
                  <p className="mt-3 text-[16px] leading-relaxed text-[#475569]">{s.d}</p>
                </div>
                {/* Illustration */}
                <StepArt step={i} t={t} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// Browser-chrome frame wrapping each step's animated mini-mockup.
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="v5-float overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_24px_60px_-24px_rgba(15,23,42,0.22)]">
      <div className="flex items-center gap-1.5 border-b border-[#F1F5F9] bg-[#F8FAFC] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 h-4 flex-1 rounded-md bg-[#EEF2F7]" />
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StepArt({ step, t }: { step: number; t: Tr }) {
  if (step === 0) {
    // Describe your prospect — prompt input with typewriter cursor
    return (
      <Frame>
        <div className="rounded-xl border border-[#E2E8F0] bg-[#FBFCFE] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{t("Your request", "Votre demande")}</div>
          <div className="mt-2 text-[15px] font-medium text-[#0F172A]">
            {t("Web agencies in France hiring a sales rep", "Agences web en France qui recrutent un commercial")}<span className="v5-blink ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-[#0051FF]" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {["LinkedIn", "Google Maps", "Web"].map((s) => (
              <span key={s} className="rounded-md bg-[#EFF4FF] px-2 py-1 text-[11px] font-medium text-[#0051FF]">{s}</span>
            ))}
          </div>
          <span className="rounded-lg bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-3 py-1.5 text-[12px] font-semibold text-white">{t("Find them →", "Trouvez-les →")}</span>
        </div>
      </Frame>
    );
  }
  if (step === 1) {
    // Finds them — prospect list with FIT scores rising in
    const rows = [
      { c: "Pixelis Studio", s: 94, g: "#10B981" },
      { c: "Nord Digital", s: 88, g: "#10B981" },
      { c: "Atelier Web", s: 72, g: "#F59E0B" },
      { c: "Studio Meraki", s: 61, g: "#F59E0B" },
    ];
    return (
      <Frame>
        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
          <span>{t("Prospect", "Prospect")}</span><span>Fit</span>
        </div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={r.c} className="v5-rise flex items-center justify-between rounded-lg border border-[#EEF2F7] bg-white px-3 py-2.5" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF4FF] text-[11px] font-bold text-[#0051FF]">{r.c[0]}</span>
                <span className="text-[13px] font-medium text-[#0F172A]">{r.c}</span>
              </div>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: r.g }} />
                <span className="num text-[13px] font-bold text-[#0F172A]">{r.s}</span>
              </span>
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  if (step === 2) {
    // Writes personalized messages — chat composer with typing dots
    return (
      <Frame>
        <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] pb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF4FF] text-[12px] font-bold text-[#0051FF]">P</span>
          <div>
            <div className="text-[13px] font-semibold text-[#0F172A]">Pixelis Studio</div>
            <div className="text-[11px] text-[#94A3B8]">{t("Founder · Paris", "Fondateur · Paris")}</div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="max-w-[85%] rounded-[12px_12px_12px_4px] bg-[#F1F5F9] px-3 py-2 text-[12.5px] leading-relaxed text-[#334155]">
            {t("Hi — saw you're hiring a sales rep. Growing the team is exactly when outbound gets messy…", "Bonjour — j'ai vu que vous recrutez un commercial. Agrandir l'équipe, c'est justement quand l'outbound devient compliqué…")}
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#0051FF] [animation-delay:0s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#0051FF] [animation-delay:0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#0051FF] [animation-delay:0.3s]" />
            <span className="ml-1.5 text-[11px] text-[#94A3B8]">{t("writing follow-up…", "rédige la relance…")}</span>
          </div>
        </div>
      </Frame>
    );
  }
  if (step === 3) {
    // Sends and follows up — sequence timeline
    const seq = [
      { l: t("First message", "Premier message"), d: t("Sent", "Envoyé"), done: true },
      { l: t("Wait 3 days", "Attendre 3 jours"), d: t("Auto", "Auto"), done: true },
      { l: t("Follow-up", "Relance"), d: t("Sent", "Envoyé"), done: true },
      { l: t("Wait 5 days", "Attendre 5 jours"), d: t("Scheduled", "Planifié"), done: false },
      { l: t("Last message", "Dernier message"), d: t("Queued", "En file"), done: false },
    ];
    return (
      <Frame>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{t("Sequence · on autopilot", "Séquence · en pilote auto")}</div>
        <div className="relative mt-3 space-y-3 pl-6">
          <span aria-hidden className="absolute bottom-2 left-[9px] top-2 w-px bg-[#E2E8F0]" />
          {seq.map((x, i) => (
            <div key={i} className="v5-rise relative flex items-center justify-between" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className={`absolute -left-6 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold ${x.done ? "bg-[#0051FF] text-white" : "border-2 border-[#CBD5E1] bg-white text-transparent"}`}>✓</span>
              <span className="text-[13px] font-medium text-[#0F172A]">{x.l}</span>
              <span className={`text-[11px] font-medium ${x.done ? "text-[#10B981]" : "text-[#94A3B8]"}`}>{x.d}</span>
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  // step 4 — hot conversations surfaced
  const hot = [
    { c: "Nord Digital", m: t("Yes, let's talk — how does Tuesday look?", "Oui, parlons-en — mardi vous convient ?") },
    { c: "Pixelis Studio", m: t("Interested. Can you send pricing?", "Intéressé. Vous pouvez m'envoyer les tarifs ?") },
  ];
  return (
    <Frame>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[15px]">🔥</span>
        <span className="text-[13px] font-semibold text-[#0F172A]">{t("Hot conversations", "Conversations chaudes")}</span>
        <span className="ml-auto rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-bold text-[#EF4444]">{t("2 new", "2 nouvelles")}</span>
      </div>
      <div className="space-y-2.5">
        {hot.map((h, i) => (
          <div key={h.c} className="v5-rise rounded-xl border border-[#E2E8F0] bg-[#FBFCFE] p-3" style={{ animationDelay: `${i * 0.2}s` }}>
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFF4FF] text-[10px] font-bold text-[#0051FF]">{h.c[0]}</span>
              <span className="text-[12.5px] font-semibold text-[#0F172A]">{h.c}</span>
              <span className="ml-auto h-2 w-2 rounded-full bg-[#10B981]" />
            </div>
            <div className="mt-1.5 text-[12.5px] leading-relaxed text-[#475569]">“{h.m}”</div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Sources() {
  const t = useTr();
  const sources = [
    { i: "🔵", n: "LinkedIn", d: t("Profiles & jobs", "Profils & offres"), soon: false },
    { i: "🟢", n: "Google Maps", d: t("Local businesses", "Commerces locaux"), soon: false },
    { i: "🟠", n: "Reddit", d: t("Community signals", "Signaux communautaires"), soon: true },
    { i: "📸", n: "Instagram", d: t("Social presence", "Présence sociale"), soon: true },
    { i: "🎵", n: "TikTok", d: t("Brand activity", "Activité de marque"), soon: true },
    { i: "📘", n: "Facebook", d: t("Company pages", "Pages entreprises"), soon: true },
    { i: "⬛", n: "X / Twitter", d: t("Real-time mentions", "Mentions en temps réel"), soon: true },
    { i: "🌐", n: t("Web & directories", "Web & annuaires"), d: t("Specialized sources", "Sources spécialisées"), soon: false },
  ];
  return (
    <section id="sources" className="scroll-mt-24 px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> {t("Where your agent searches", "Où votre agent cherche")}</span>
          <h2 className="mt-5 text-[32px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">{t("Your agent searches", "Votre agent cherche")}<br />{t("everywhere they are.", "partout où ils sont.")}</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {sources.map((s, i) => (
            <Reveal key={i} className={`relative rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 ${s.soon ? "opacity-50" : ""}`}>
              {s.soon && <span className="absolute right-2 top-2 rounded-full bg-[#0051FF]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#0051FF]">{t("Coming soon", "Bientôt")}</span>}
              <div className="text-[20px]">{s.i}</div>
              <div className="mt-1.5 text-[14px] font-medium text-[#0F172A]">{s.n}</div>
              <div className="text-[12px] text-[#94A3B8]">{s.d}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function BeforeAfter() {
  const t = useTr();
  const before = [
    t("4 hours/day searching for prospects manually", "4 heures/jour à chercher des prospects à la main"),
    t("Copy-pasting from LinkedIn, Google, Maps", "Copier-coller depuis LinkedIn, Google, Maps"),
    t("Generic messages that get ignored", "Des messages génériques qui sont ignorés"),
    t("Forgetting to follow up", "Oublier de relancer"),
    t("Missing signals that mean \"ready to buy\"", "Rater les signaux d'un « prêt à acheter »"),
    t("€3,000+/month for a human SDR", "3 000 €+/mois pour un SDR humain"),
    t("Your pipeline depends on one person", "Votre pipeline dépend d'une seule personne"),
  ];
  const after = [
    t("Agent finds 50+ qualified prospects overnight", "L'agent trouve 50+ prospects qualifiés pendant la nuit"),
    t("6 sources searched simultaneously", "6 sources scannées simultanément"),
    t("Every message personalized with real signals", "Chaque message personnalisé avec de vrais signaux"),
    t("Automatic follow-ups on perfect timing", "Des relances automatiques au bon moment"),
    t("Only hot replies surface to your inbox", "Seules les réponses chaudes remontent dans votre boîte"),
    t("€59/month. Works 24/7. Never quits.", "59 €/mois. Travaille 24h/24. Ne démissionne jamais."),
    t("Your pipeline runs while you sleep", "Votre pipeline tourne pendant que vous dormez"),
  ];
  return (
    <section id="before" className="scroll-mt-24 bg-[#F8FAFC] px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-[36px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">{t("Replace your SDR.", "Remplacez votre SDR.")}<br />{t("Or supercharge them.", "Ou boostez-le.")}</h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-[#475569]">{t("What your sales process looks like before and after LogLead.", "À quoi ressemble votre process commercial avant et après LogLead.")}</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-l-[3px] border-[#EF4444] bg-[#EF4444]/[0.04] p-6">
            {before.map((b, i) => <p key={i} className="flex items-start gap-2 py-1.5 text-[14px] text-[#475569]"><span className="text-[#EF4444]">✕</span> {b}</p>)}
          </div>
          <div className="rounded-2xl border-l-[3px] border-[#22C55E] bg-[#22C55E]/[0.04] p-6">
            {after.map((a, i) => <Reveal key={i} className="flex items-start gap-2 py-1.5 text-[14px] text-[#0F172A]"><span className="text-[#22C55E]">✓</span> {a}</Reveal>)}
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const t = useTr();
  const faqs: [string, string][] = [
    [t("Is this really a sales agent or just another prospecting tool?", "Est-ce vraiment un agent commercial ou juste un énième outil de prospection ?"), t("LogLead is a true sales agent. It finds prospects, writes personalized messages, sends them, follows up automatically and surfaces only the hot replies. Your only job is closing the conversations it brings you.", "LogLead est un vrai agent commercial. Il trouve les prospects, rédige des messages personnalisés, les envoie, relance automatiquement et ne remonte que les réponses chaudes. Votre seul travail : closer les conversations qu'il vous amène.")],
    [t("Will the messages sound robotic or AI-generated?", "Les messages vont-ils sonner robotiques ou générés par IA ?"), t("No. Your agent writes messages based on each prospect's specific signals — their Google rating, recent job postings, social activity, funding news. Every message references something real about that prospect. No one can tell it's AI.", "Non. Votre agent rédige à partir des signaux propres à chaque prospect — sa note Google, ses offres d'emploi récentes, son activité sociale, ses levées de fonds. Chaque message évoque quelque chose de réel sur ce prospect. Impossible de deviner que c'est une IA.")],
    [t("What sources does the agent search?", "Quelles sources l'agent explore-t-il ?"), t("LinkedIn (profiles and job postings), Google Maps (local businesses), Reddit, Instagram, TikTok, Facebook and X simultaneously. You can select which sources to activate for each campaign.", "LinkedIn (profils et offres d'emploi), Google Maps (commerces locaux), Reddit, Instagram, TikTok, Facebook et X simultanément. Vous choisissez quelles sources activer pour chaque campagne.")],
    [t("Does the agent actually send messages automatically?", "L'agent envoie-t-il vraiment les messages automatiquement ?"), t("On the Growth and Pro plans, yes. The agent sends via email and LinkedIn DM automatically. On Starter, it generates the messages and you send them manually. Full automation requires a connected LinkedIn account and email.", "Sur les plans Growth et Pro, oui. L'agent envoie automatiquement par email et DM LinkedIn. Sur Starter, il génère les messages et vous les envoyez manuellement. L'automatisation complète nécessite un compte LinkedIn et un email connectés.")],
    [t("What are credits?", "Que sont les crédits ?"), t("Credits are consumed by each AI action — finding a prospect (5 cr), sending a message (10 cr), enriching an email (20 cr). Your plan includes monthly credits. Buy more from €5/500 credits.", "Les crédits sont consommés par chaque action IA — trouver un prospect (5 cr), envoyer un message (10 cr), enrichir un email (20 cr). Votre plan inclut des crédits mensuels. Rechargez dès 5 €/500 crédits.")],
    [t("Can I cancel anytime?", "Puis-je annuler à tout moment ?"), t("Yes. Cancel in one click from Settings → Subscription. No commitment, no penalties. Your data is kept for 30 days after cancellation.", "Oui. Annulez en un clic depuis Paramètres → Abonnement. Sans engagement, sans pénalité. Vos données sont conservées 30 jours après l'annulation.")],
  ];
  return (
    <section id="faq" className="scroll-mt-24 px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-[32px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">{t("Questions about your agent.", "Questions sur votre agent.")}</h2>
        <div className="mt-8 divide-y divide-[#E2E8F0] rounded-2xl border border-[#E2E8F0]">
          {faqs.map(([q, a], i) => (
            <details key={i} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-[#0F172A]">
                {q}<span className="text-[#0051FF] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-[#475569]">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// Post-FAQ region: a large CTA with a prompt bubble over the footer-bg.svg
// gradient, then a cream footer card with link columns (Lovable-style).
export function Footer({ showCta = true }: { showCta?: boolean }) {
  const t = useTr();
  const cols = [
    { t: t("Company", "Entreprise"), links: [[t("About", "À propos"), "#"], ["Blog", "#"], [t("Careers", "Carrières"), "#"], ["Contact", "mailto:loglead@gmail.com"]] as [string, string][] },
    { t: t("Product", "Produit"), links: [["LogAgent", "/logagent"], [t("Leads Pipeline", "Pipeline Leads"), "/leads"], [t("Pricing", "Tarifs"), "/pricing"], [t("Changelog", "Nouveautés"), "#"]] as [string, string][] },
    { t: t("Resources", "Ressources"), links: [[t("Help Center", "Centre d'aide"), "#"], ["Documentation", "#"], [t("Templates", "Modèles"), "#"], [t("Guides", "Guides"), "#"]] as [string, string][] },
    { t: t("Legal", "Légal"), links: [[t("Privacy", "Confidentialité"), "/privacy"], [t("Terms", "CGU"), "/terms"], [t("Cookie settings", "Cookies"), "#"], [t("Legal notice", "Mentions légales"), "#"]] as [string, string][] },
    { t: t("Community", "Communauté"), links: [[t("Affiliate", "Affiliation"), "/affiliate"], [t("Become a partner", "Devenir partenaire"), "#"], [t("Hire an expert", "Recruter un expert"), "#"]] as [string, string][] },
  ];
  return (
    <footer className="relative overflow-hidden">
      {/* Gradient background image (white → blue/purple) */}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={{ backgroundImage: "url(/footer-bg.svg)", backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" }} />

      <div className="relative">
        {showCta && (
          <div className="mx-auto max-w-3xl px-5 pt-32 pb-32 text-center sm:px-6">
            <p className="text-[15px] font-medium text-[#64748B]">{t("AI Sales Agent", "Agent commercial IA")}</p>
            <h2 className="mt-3 text-[36px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F172A] sm:text-[52px]">{t("Ready to meet your next clients?", "Prêt à trouver vos prochains clients ?")}</h2>
            <Link href={SIGNUP} className="mx-auto mt-9 block w-full max-w-[620px] rounded-[20px] border border-[#E2E8F0] bg-white px-5 pb-3 pt-4 text-left shadow-[0_16px_44px_-14px_rgba(15,23,42,0.15)] transition hover:shadow-[0_22px_54px_-14px_rgba(15,23,42,0.22)]">
              <span className="block min-h-[44px] text-[15px] text-[#94A3B8]">{t("Ask LogLead to find your ideal clients…", "Demandez à LogLead de trouver vos clients idéaux…")}</span>
              <span className="mt-2 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] text-[18px] leading-none text-[#475569]">+</span>
                <span className="ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_0_16px_#0051FF40]">{t("Get started", "Commencer")} <span aria-hidden>➤</span></span>
              </span>
            </Link>
          </div>
        )}

        {/* White footer sheet — centered panel, only top corners rounded, flush to bottom */}
        <div className={`px-4 sm:px-6 ${showCta ? "" : "pt-24"}`}>
          <div className="mx-auto max-w-6xl rounded-t-[36px] bg-white px-8 pb-14 pt-14 sm:px-12">
            <div>
              <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-6">
                <div className="lg:col-span-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/loglead-logo.svg" alt="LogLead" className="h-7 w-auto" />
                  <p className="mt-3 text-[12px] leading-relaxed text-[#94A3B8]">{t("Your AI Sales Agent for B2B.", "Votre agent commercial IA pour le B2B.")}</p>
                </div>
                {cols.map((c) => (
                  <div key={c.t}>
                    <p className="text-[14px] font-bold text-[#0F172A]">{c.t}</p>
                    <ul className="mt-4 space-y-2.5">
                      {c.links.map(([l, h]) => <li key={l}><Link href={h} className="text-[13px] text-[#6B7280] transition hover:text-[#0F172A]">{l}</Link></li>)}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-[#E2E8F0] pt-6 text-[12px] text-[#94A3B8] sm:flex-row">
                <p>{t("© 2026 LogLead · Your AI Sales Agent for B2B", "© 2026 LogLead · Votre agent commercial IA pour le B2B")}</p>
                <p>{t("Not affiliated with LinkedIn Corporation. · SIRET 104 040 456 00014", "Non affilié à LinkedIn Corporation. · SIRET 104 040 456 00014")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function LandingV5() {
  return (
    <LangProvider>
      <div className="min-h-screen bg-[#FFFFFF] font-sans antialiased">
        <Nav />
        <Hero />
        <HowItWorks />
        <Sources />
        <BeforeAfter />
        <Faq />
        <Footer />
      </div>
    </LangProvider>
  );
}
