"use client";

import { Gift, Send, Sparkles, Star, Telescope } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CountUp, Reveal, Roll } from "./LandingPage";
import { LangProvider, useLang, useTr } from "./lpLang";

// ---------------------------------------------------------------------------
// Landing v5 — "Your AI Sales Agent for B2B". Light, self-contained (its own
// nav + footer). Bilingual FR/EN via lpLang (auto-detected from the visitor's
// region, then remembered). Uses CSS/IO animations (Reveal), no Framer.
// ---------------------------------------------------------------------------

type Tr = ReturnType<typeof useTr>;

const SIGNUP = "/signup";
const BTN = "lp-roll-btn inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_0_20px_#0051FF40] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_#0051FF70]";
const EY ="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[12px] font-medium text-[#475569]";

// A hover dropdown nav menu. Trigger inherits the nav text color; the panel is
// always a white card with dark links.

// Product mega-menu — 3 feature cards, each with a modern mini-mockup.
function ProductMenu({ cls }: { cls: string }) {
  const t = useTr();
  const products = [
    {
      name: "Scout",
      href: "/#how",
      tag: t("Describe. LogLead finds.", "Décrivez. LogLead trouve."),
      icon: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
      art: <ProductArt src="/image1.svg" alt="Scout" />,
    },
    {
      name: "Lead Intelligence",
      href: "/#how",
      tag: t("Qualified, scored, enriched automatically.", "Qualifiés, scorés, enrichis automatiquement."),
      icon: <><path d="M3 3v18h18" /><path d="M7 13l3-3 3 2 5-6" /></>,
      art: <ProductArt src="/image2.svg" alt="Lead Intelligence" />,
    },
    {
      name: "Web Spy",
      href: "/#how",
      tag: t("Find competitors' customers", "Trouvez les clients de vos concurrents"),
      icon: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
      art: <ProductArt src="/image3.svg" alt="Web Spy" />,
    },
  ];
  return (
    <div className="group relative">
      <button className={`inline-flex items-center gap-1 ${cls}`}>
        {t("Product", "Produit")}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="transition group-hover:rotate-180"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100">
        <div className="w-[960px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E2E8F0] bg-white p-3 shadow-[0_16px_44px_-14px_rgba(15,23,42,0.25)]">
          <div className="grid grid-cols-3 gap-3">
            {products.map((p) => (
              <Link key={p.name} href={p.href} className="group/card rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition hover:border-[#0051FF60] hover:bg-white hover:shadow-[0_12px_32px_-14px_rgba(15,23,42,0.2)]">
                <div className="mb-4">{p.art}</div>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#0051FF]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{p.icon}</svg>
                  </span>
                  <span className="text-[15px] font-semibold text-[#0F172A]">{p.name}</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#64748B]">{p.tag}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Product illustration — a user-provided SVG shown in the Product mega-menu.
function ProductArt({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="flex h-[190px] items-center justify-center overflow-hidden rounded-xl border border-[#EAECF0] bg-white p-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-contain" />
    </div>
  );
}

// Solution menu — "by profile" audiences, one icon per target (Andoxa-style).
function SolutionMenu({ cls }: { cls: string }) {
  const t = useTr();
  const audiences: { name: string; href: string; icon: React.ReactNode }[] = [
    { name: t("Web agencies", "Agences web"), href: "/for/agencies", icon: <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></> },
    { name: t("Sales teams", "Commerciaux"), href: "/for/sales", icon: <><path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></> },
    { name: t("Freelancers & consultants", "Freelances & consultants"), href: "/for/freelancers", icon: <><rect x="3" y="8" width="18" height="12" rx="2" /><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2" /></> },
    { name: t("Founders", "Fondateurs"), href: "/for/founders", icon: <><rect x="4" y="3" width="16" height="18" rx="1.5" /><path d="M9 8h1M14 8h1M9 12h1M14 12h1M9 16h1M14 16h1" /></> },
  ];
  return (
    <div className="group relative">
      <button className={`inline-flex items-center gap-1 ${cls}`}>
        {t("Solution", "Solution")}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="transition group-hover:rotate-180"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div className="invisible absolute left-0 top-full z-50 pt-3 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100">
        <div className="w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_16px_44px_-14px_rgba(15,23,42,0.25)]">
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">{t("By profile", "Par profil")}</p>
          {audiences.map((a) => (
            <Link key={a.href} href={a.href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#F8FAFC]">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF4FF] text-[#0051FF]">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{a.icon}</svg>
              </span>
              <span className="text-[14px] font-medium leading-snug text-[#0F172A]">{a.name}</span>
            </Link>
          ))}
        </div>
      </div>
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

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${light ? "border-b border-[#E2E8F0] bg-[#FFFFFFEE] backdrop-blur-xl" : "border-b border-transparent"}`}>
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="LogLead">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={light ? "/loglead-logo.svg" : "/loglead-logo-dark.svg"} alt="LogLead" className="h-7 w-auto" />
          </Link>
          <div className={`hidden items-center gap-7 text-[14px] lg:flex ${light ? "text-[#475569]" : "text-white/85"}`}>
            <ProductMenu cls={linkCls} />
            <SolutionMenu cls={linkCls} />
            <Link href="/pricing" className={linkCls}>{t("Pricing", "Tarifs")}</Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLang(lang === "fr" ? "en" : "fr")}
            aria-label={t("Switch to French", "Passer en anglais")}
            className={`rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold transition ${light ? "border-[#E2E8F0] text-[#475569] hover:border-[#0051FF60] hover:text-[#0F172A]" : "border-white/30 text-white/85 hover:border-white hover:text-white"}`}
          >
            {lang === "fr" ? "FR" : "EN"}
          </button>
          <Link
            href="/login"
            className={`lp-roll-btn hidden rounded-[10px] border px-4 py-2 text-[14px] font-medium backdrop-blur-md transition sm:block ${light ? "border-slate-200 bg-slate-900/[0.04] text-[#0F172A] hover:bg-slate-900/[0.08]" : "border-white/20 bg-white/10 text-white hover:bg-white/20"}`}
          >
            <Roll>{t("Log in", "Se connecter")}</Roll>
          </Link>
          <Link href={SIGNUP} className={`${BTN} lp-roll-btn !px-5 !py-2 !text-[14px]`}><Roll>{t("Free trial", "Essai gratuit")}</Roll></Link>
        </div>
      </nav>
    </header>
  );
}

// Hero title word that auto-cycles through the platforms LogLead searches,
// rising up from the bottom each change. CSS-only animation (no framer-motion).
function PlatformCycler() {
  const t = useTr();
  const platforms = ["LinkedIn", "Google Maps", "Instagram", "Facebook", "TikTok", "Reddit", t("the Web", "le Web")];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % platforms.length), 2000);
    return () => clearInterval(id);
  }, [platforms.length]);
  return (
    <span
      key={i}
      className="v5-gradient-text-light inline-block whitespace-nowrap align-baseline"
      style={{ animation: "v5-word-in 0.42s cubic-bezier(0.25,0.46,0.45,0.94) both" }}
    >
      {platforms[i]}
    </span>
  );
}

// Social-proof banner above the hero title — a translucent glass pill with a
// group of profile photos + a trust line.
const PROOF_AVATARS = [
  "https://randomuser.me/api/portraits/men/32.jpg",
  "https://randomuser.me/api/portraits/women/44.jpg",
  "https://randomuser.me/api/portraits/men/85.jpg",
  "https://randomuser.me/api/portraits/women/68.jpg",
];
function SocialProofBanner({ t }: { t: Tr }) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.06] px-3 py-2 backdrop-blur-md sm:px-4">
      <div className="flex -space-x-2.5">
        {PROOF_AVATARS.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={src} alt="" loading="lazy" className="h-8 w-8 rounded-full border-2 border-white/80 object-cover shadow-sm" />
        ))}
      </div>
      <p className="whitespace-nowrap pr-1 text-[13px] font-medium text-white/90 sm:text-[15px]">
        {t("Trusted by over ", "Adopté par plus de ")}
        <strong className="font-bold text-white">{t("50 agencies & founders", "50 agences & fondateurs")}</strong>
      </p>
    </div>
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
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.max(38, ta.scrollHeight)}px`; }
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
    <section className="relative -mt-[72px] overflow-hidden px-5 pb-12 pt-[184px] sm:px-6">
      {/* Hero background image (dark navy → blue → white gradient) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-top bg-no-repeat"
        style={{ backgroundImage: "url(/hero-bg.svg)" }}
      />
      {/* Bottom fade into the light sections below */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-white" />

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <div className="mb-6 flex justify-center">
            <SocialProofBanner t={t} />
          </div>
        </Reveal>
        <Reveal>
          <h1 className="mx-auto max-w-3xl text-[27px] font-bold leading-[1.16] tracking-[-0.03em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.25)] sm:text-[42px] lg:text-[48px]">
            {t("Find your ideal clients on", "Trouvez vos clients idéaux sur")}<br />
            <PlatformCycler /> {t("in under 2 min.", "en moins de 2 min.")}
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-[500px] text-[17px] leading-[1.7] text-white/85">
            {t("Describe who you're looking for. Your AI SDR finds them, messages them and sends you only the hot replies.", "Décrivez qui vous cherchez. Votre SDR IA les trouve, les contacte et ne vous remonte que les réponses chaudes.")}
          </p>
        </Reveal>

        {/* Chat bubble */}
        <Reveal delay={200}>
          <div className="v5-chat mx-auto mt-8 w-full max-w-[540px] rounded-[18px] border border-[#E2E8F0] bg-white px-4 pb-2.5 pt-3.5 text-left shadow-[0_16px_44px_-14px_rgba(15,23,42,0.2)]">
            <textarea
              ref={taRef}
              value={query}
              onChange={(e) => onType(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); find(); } }}
              placeholder={typed || t("Describe your ideal prospect…", "Décrivez votre prospect idéal…")}
              className="min-h-[38px] w-full resize-none bg-transparent text-[14px] leading-relaxed text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            {/* Bottom bar */}
            <div className="mt-2 flex items-center gap-2">
              <button title={t("Add context", "Ajouter du contexte")} aria-label={t("Add context", "Ajouter du contexte")} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2E8F0] text-[18px] leading-none text-[#475569] transition hover:border-[#0051FF60] hover:text-[#0F172A]">+</button>
              <button
                onClick={find}
                disabled={!query.trim()}
                className="lp-roll-btn ml-auto inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_0_16px_#0051FF40] transition hover:-translate-y-0.5 hover:shadow-[0_0_28px_#0051FF70] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                <Roll>{t("Find them", "Trouvez-les")}</Roll> <span aria-hidden>➤</span>
              </button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

// Browser window with a URL bar — wraps each step's illustration.
function Win({ url, children }: { url?: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_40px_90px_-40px_rgba(15,23,42,0.3)]">
      <div className="flex items-center gap-1.5 border-b border-[#F1F5F9] bg-[#F8FAFC] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
        <span className="ml-3 flex h-6 flex-1 items-center gap-2 rounded-md bg-white px-2.5 text-[11px] text-[#94A3B8] shadow-[inset_0_0_0_1px_#E9EEF5]">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>{url}
        </span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  );
}

// ---- Step illustrations (modern, immediately readable) --------------------

// A tiny looping ticker: 0 → max, then pause and reset. Drives the animations.
function useLoop(max: number, stepMs: number, holdMs = 1600) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      if (!alive) return;
      setN(0);
      for (let i = 1; i <= max; i++) timers.push(setTimeout(() => alive && setN(i), i * stepMs));
      timers.push(setTimeout(run, max * stepMs + holdMs));
    };
    run();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [max, stepMs, holdMs]);
  return n;
}

// STEP 1 — Find: the real LogAgent UI in action. A query types itself, the
// agent searches, and prospects stream into the results panel. Loops.
function FindArt({ t }: { t: Tr }) {
  const query = t("Web agencies in France hiring a sales rep", "Agences web en France qui recrutent un commercial");
  const suggestions = [
    t("Web agencies hiring a sales rep in France", "Agences web qui recrutent un commercial en France"),
    t("Restaurants in Lyon rated under 4★ with no website", "Restaurants à Lyon notés sous 4★ sans site web"),
    t("B2B SaaS between 20 and 200 employees in Paris", "SaaS B2B de 20 à 200 employés à Paris"),
  ];
  const results = [
    { n: "Pixelis Studio", m: "Sales rep · Paris", s: 94 },
    { n: "Nord Digital", m: "Business Dev · Lille", s: 88 },
    { n: "Atelier Web", m: "Account exec · Lyon", s: 82 },
    { n: "Studio Meraki", m: "SDR · Nantes", s: 74 },
  ];
  const [phase, setPhase] = useState<"idle" | "typing" | "searching" | "results">("idle");
  const [typed, setTyped] = useState("");
  const [rows, setRows] = useState(0);

  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      if (!alive) return;
      setPhase("idle"); setTyped(""); setRows(0);
      timers.push(setTimeout(() => {
        if (!alive) return;
        setPhase("typing");
        let i = 0;
        const type = () => {
          if (!alive) return;
          i += 1; setTyped(query.slice(0, i));
          if (i < query.length) { timers.push(setTimeout(type, 34)); return; }
          timers.push(setTimeout(() => {
            if (!alive) return;
            setPhase("searching");
            timers.push(setTimeout(() => {
              if (!alive) return;
              setPhase("results");
              results.forEach((_, idx) => timers.push(setTimeout(() => alive && setRows(idx + 1), idx * 380)));
              timers.push(setTimeout(run, results.length * 380 + 2600));
            }, 950));
          }, 450));
        };
        type();
      }, 900));
    };
    run();
    return () => { alive = false; timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const started = phase !== "idle";
  return (
    <Win url="app.loglead.io/logagent">
      <div className="grid h-[320px] grid-cols-[1fr_1.25fr] overflow-hidden">
        {/* Left — chat */}
        <div className="flex flex-col border-r border-[#F1F5F9] pr-4">
          {!started ? (
            <div className="flex flex-1 flex-col items-center justify-center px-2 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[16px] font-bold text-white">L</span>
              <p className="mt-3 text-[15px] font-bold text-[#0F172A]">{t("What do you want to find?", "Que veux-tu trouver ?")}</p>
              <p className="mt-1 text-[11px] text-[#94A3B8]">{t("Describe your prospect. LogLead finds it.", "Décris ton prospect. LogLead le trouve.")}</p>
              <div className="mt-4 w-full space-y-2">
                {suggestions.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-[#EEF2F7] bg-[#F8FAFC] px-2.5 py-2 text-left text-[11px] text-[#64748B]">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                    <span className="truncate">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 space-y-2.5 overflow-hidden py-1">
              <div className="flex justify-end">
                <div className="max-w-[88%] rounded-[12px_12px_4px_12px] bg-[#EFF4FF] px-3 py-2 text-[12px] font-medium text-[#0F172A]">{query}</div>
              </div>
              {phase === "searching" && (
                <div className="flex items-center gap-1.5 pl-1 text-[11px] text-[#64748B]">
                  <span className="flex gap-1">{[0, 1, 2].map((k) => <span key={k} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#0051FF]" style={{ animationDelay: `${k * 0.15}s` }} />)}</span>
                  {t("Analyzing…", "Analyse…")}
                </div>
              )}
              {phase === "results" && (
                <div className="flex items-start gap-1.5 pl-1">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[9px] font-bold text-white">L</span>
                  <p className="text-[12px] leading-snug text-[#334155]"><span className="font-semibold text-[#10B981]">● 22</span> {t("prospects found — LinkedIn · Web.", "prospects trouvés — LinkedIn · Web.")}</p>
                </div>
              )}
            </div>
          )}
          {/* input */}
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#E7EBF1] bg-white px-2.5 py-2">
            <span className="text-[15px] leading-none text-[#94A3B8]">+</span>
            <span className="flex-1 truncate text-[11px] text-[#0F172A]">
              {phase === "typing" ? <>{typed}<span className="v5-blink inline-block h-3 w-[1.5px] translate-y-0.5 bg-[#0051FF]" /></> : <span className="text-[#94A3B8]">{t("Describe your ideal prospect…", "Décris ton prospect idéal…")}</span>}
            </span>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-white"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg></span>
          </div>
        </div>

        {/* Right — results */}
        <div className="flex flex-col pl-4">
          {phase !== "results" ? (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-[#94A3B8]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <p className="mt-2 max-w-[180px] text-[12px]">{phase === "searching" ? t("Searching everywhere they are…", "Recherche partout où ils sont…") : t("Your search results will appear here.", "Les résultats de ta recherche apparaîtront ici.")}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between pb-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF4FF] px-2.5 py-1 font-semibold text-[#0051FF]"><span className="h-1.5 w-1.5 rounded-full bg-[#0051FF]" /> 22 {t("prospects", "prospects")} · 68% {t("qualified", "qualifiés")}</span>
                <span className="text-[#94A3B8]">LinkedIn · Web</span>
              </div>
              <div className="space-y-1.5 overflow-hidden">
                {results.slice(0, rows).map((r, i) => (
                  <div key={i} className="v5-pop flex items-center gap-2.5 rounded-lg border border-[#EEF2F7] bg-[#FBFCFE] px-2.5 py-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF4FF] text-[11px] font-bold text-[#0051FF]">{r.n[0]}</span>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[12.5px] font-semibold text-[#0F172A]">{r.n}</span><span className="block truncate text-[10.5px] text-[#94A3B8]">{r.m}</span></span>
                    <span className="flex items-center gap-1 text-[12px] font-bold text-[#0F172A]"><span className="h-2 w-2 rounded-full" style={{ background: r.s > 80 ? "#10B981" : "#F59E0B" }} />{r.s}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </Win>
  );
}

// STEP 2 — Contact: the message types itself, then "Sent" + the auto pill appear.
function ContactArt({ t }: { t: Tr }) {
  const msg = t("Hi — saw you're hiring a sales rep. That's exactly when outbound gets messy. We help agencies like yours fill the pipeline automatically.", "Bonjour — j'ai vu que vous recrutez un commercial. C'est justement quand l'outbound devient compliqué. On aide les agences comme la vôtre à remplir leur pipeline automatiquement.");
  const [typed, setTyped] = useState("");
  const [sent, setSent] = useState(false);
  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      if (!alive) return;
      setTyped(""); setSent(false);
      let i = 0;
      const type = () => {
        if (!alive) return;
        i += 2; setTyped(msg.slice(0, i));
        if (i < msg.length) { timers.push(setTimeout(type, 22)); return; }
        timers.push(setTimeout(() => alive && setSent(true), 400));
        timers.push(setTimeout(play, 4200));
      };
      timers.push(setTimeout(type, 500));
    };
    play();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, [msg]);
  return (
    <Win url="app.loglead.io/outreach">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center gap-2.5 border-b border-[#F1F5F9] pb-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF4FF] text-[13px] font-bold text-[#0051FF]">P</span>
          <div><div className="text-[14px] font-semibold text-[#0F172A]">Pixelis Studio</div><div className="text-[12px] text-[#94A3B8]">{t("Founder · Paris", "Fondateur · Paris")}</div></div>
          <span className={`ml-auto rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${sent ? "bg-[#ECFDF3] text-[#10B981] opacity-100" : "opacity-0"}`}>✓ {t("Sent", "Envoyé")}</span>
        </div>
        <div className="mt-4 min-h-[92px] max-w-[92%] rounded-[14px_14px_14px_4px] bg-[#F1F5F9] px-4 py-3 text-[13.5px] leading-relaxed text-[#334155]">
          {typed}{!sent && <span className="v5-blink ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-[#0051FF]" />}
        </div>
        <div className={`mt-4 flex items-center gap-1.5 rounded-lg bg-[#EFF4FF] px-3 py-2.5 text-[12.5px] font-medium text-[#0051FF] transition-all duration-500 ${sent ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
          {t("Message + 2 follow-ups sent automatically, in your name.", "Message + 2 relances envoyés automatiquement, en ton nom.")}
        </div>
      </div>
    </Win>
  );
}

// STEP 3 — Track: score bars fill, and a row flips to "Replied 🔥" live.
function TrackArt({ t }: { t: Tr }) {
  const base = [
    { n: "Nord Digital", s: 88 }, { n: "Pixelis Studio", s: 94 },
    { n: "Atelier Web", s: 72 }, { n: "Studio Meraki", s: 61 },
  ];
  const [grow, setGrow] = useState(false);
  const [replied, setReplied] = useState(0); // how many rows flipped to "Replied"
  useEffect(() => {
    let alive = true;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const play = () => {
      if (!alive) return;
      setGrow(false); setReplied(0);
      timers.push(setTimeout(() => alive && setGrow(true), 120));
      timers.push(setTimeout(() => alive && setReplied(1), 1100));
      timers.push(setTimeout(() => alive && setReplied(2), 2000));
      timers.push(setTimeout(play, 4600));
    };
    play();
    return () => { alive = false; timers.forEach(clearTimeout); };
  }, []);
  const status = (i: number) => {
    if (i < replied) return { l: t("Replied", "Répondu"), c: "#10B981", bg: "#ECFDF3", hot: true };
    if (i === 0 || i === 1) return { l: t("Followed up", "Relancé"), c: "#D97706", bg: "#FEF3C7" };
    if (i === 2) return { l: t("Contacted", "Contacté"), c: "#0051FF", bg: "#EFF4FF" };
    return { l: t("New", "Nouveau"), c: "#64748B", bg: "#F1F5F9" };
  };
  return (
    <Win url="app.loglead.io/pipeline">
      <div className="grid grid-cols-[1fr_128px_84px] gap-2 border-b border-[#F1F5F9] px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">
        <span>{t("Prospect", "Prospect")}</span><span>{t("Status", "Statut")}</span><span>Score</span>
      </div>
      <div className="mt-1 space-y-1">
        {base.map((r, i) => {
          const st = status(i);
          return (
            <div key={i} className="grid grid-cols-[1fr_128px_84px] items-center gap-2 rounded-lg px-2 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EFF4FF] text-[11px] font-bold text-[#0051FF]">{r.n[0]}</span>
                <span className="text-[13px] font-medium text-[#0F172A]">{r.n}</span>
              </div>
              <span><span key={st.l} className="v5-pop inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: st.c, background: st.bg }}>{st.l}{st.hot ? " 🔥" : ""}</span></span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF2F7]"><span className="block h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: grow ? `${r.s}%` : "0%", background: r.s > 80 ? "#10B981" : "#F59E0B" }} /></span>
                <span className="num w-6 text-right text-[12px] font-bold text-[#0F172A]">{r.s}</span>
              </span>
            </div>
          );
        })}
      </div>
    </Win>
  );
}

// STEP 4 — Close: hot replies pop in one after another; the reply button pulses.
function CloseArt({ t }: { t: Tr }) {
  const hot = [
    { c: "Nord Digital", m: t("Yes, let's talk — Tuesday works?", "Oui, parlons-en — mardi ça marche ?") },
    { c: "Pixelis Studio", m: t("Interested. Can you send pricing?", "Intéressé. Vous pouvez m'envoyer les tarifs ?") },
  ];
  const n = useLoop(hot.length, 900, 2200);
  return (
    <Win url="app.loglead.io/inbox">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[16px]">🔥</span><span className="text-[14px] font-semibold text-[#0F172A]">{t("Hot replies", "Réponses chaudes")}</span>
        <span className="relative ml-auto rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-bold text-[#EF4444]">{n} {t("new", "nouvelles")}</span>
      </div>
      <div className="space-y-2.5">
        {hot.slice(0, n).map((h, i) => (
          <div key={i} className="v5-pop rounded-xl border border-[#E2E8F0] bg-[#FBFCFE] p-3">
            <div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#EFF4FF] text-[10px] font-bold text-[#0051FF]">{h.c[0]}</span><span className="text-[13px] font-semibold text-[#0F172A]">{h.c}</span><span className="ml-auto h-2 w-2 rounded-full bg-[#10B981]"><span className="block h-full w-full animate-ping rounded-full bg-[#10B981]" /></span></div>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 rounded-[10px_10px_10px_2px] bg-[#F1F5F9] px-3 py-2 text-[12.5px] text-[#334155]">{h.m}</div>
              <span className="relative shrink-0 rounded-lg bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-3 py-2 text-[12px] font-semibold text-white">{t("Reply", "Répondre")}{i === n - 1 && <span className="absolute inset-0 animate-pulse rounded-lg ring-2 ring-[#0051FF]/40" />}</span>
            </div>
          </div>
        ))}
        {n === 0 && <div className="flex h-[120px] items-center justify-center text-[13px] text-[#94A3B8]">{t("Waiting for replies…", "En attente de réponses…")}</div>}
      </div>
    </Win>
  );
}

// Scroll-driven stepper — the active step advances as you scroll; the left rail
// highlights it and the central illustration swaps with a fade.
function HowItWorks() {
  const t = useTr();
  const steps = [
    { rail: t("Find", "Trouver"), title: t("Find your prospects.", "Trouve tes prospects."), sub: t("Up to 1,500 qualified prospects a month — in 3 clicks.", "Jusqu'à 1 500 prospects qualifiés/mois — en 3 clics."), art: <FindArt t={t} /> },
    { rail: t("Contact", "Contacter"), title: t("Contact them hands-free.", "Contacte-les sans rien faire."), sub: t("Personalized messages + follow-ups, sent in your name.", "Messages personnalisés + relances, envoyés en ton nom."), art: <ContactArt t={t} /> },
    { rail: t("Track", "Suivre"), title: t("Track everything in one place.", "Suis tout au même endroit."), sub: t("Every prospect, every reply, every status.", "Chaque prospect, chaque réponse, chaque statut."), art: <TrackArt t={t} /> },
    { rail: t("Close", "Closer"), title: t("Close the hot conversations.", "Close les conversations chaudes."), sub: t("You only see the replies worth your time.", "Tu ne vois que les réponses qui valent ton temps."), art: <CloseArt t={t} /> },
  ];
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = wrapRef.current;
      if (!el) return;
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-el.getBoundingClientRect().top, 0), Math.max(total, 1));
      const p = total > 0 ? scrolled / total : 0;
      setActive(Math.min(steps.length - 1, Math.floor(p * steps.length * 0.9999)));
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  const goTo = (i: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const total = el.offsetHeight - window.innerHeight;
    window.scrollTo({ top: el.offsetTop + (i / steps.length) * total + 10, behavior: "smooth" });
  };

  return (
    <section id="how" ref={wrapRef} className="relative bg-white" style={{ height: `${steps.length * 85 + 15}vh` }}>
      <div className="sticky top-0 flex h-screen items-center px-5 sm:px-6">
        <div className="mx-auto w-full max-w-6xl">
          <span className={EY}><span className="text-[#0085FF]">✦</span> {t("How it works", "Comment ça marche")}</span>
          <div key={`h-${active}`} className="v5-fade">
            <div className="mt-4 flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[13px] font-bold text-white shadow-[0_6px_16px_-6px_rgba(0,81,255,0.7)]">{active + 1}</span>
              <span className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#0051FF]">{steps[active].rail}</span>
            </div>
            <h2 className="mt-3 max-w-3xl text-[28px] font-bold leading-[1.12] tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">
              {steps[active].title}
            </h2>
            <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-[#64748B] sm:text-[16px]">{steps[active].sub}</p>
          </div>
          <div className="mt-8 grid items-center gap-8 lg:mt-10 lg:grid-cols-[190px_1fr] lg:gap-12">
            {/* Left rail */}
            <div className="hidden flex-col gap-0.5 lg:flex">
              {steps.map((s, i) => (
                <button key={i} onClick={() => goTo(i)} className="group flex items-center gap-3 py-2 text-left">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition ${i === active ? "bg-[#0051FF] text-white shadow-[0_6px_14px_-4px_rgba(0,81,255,0.6)]" : "bg-[#E2E8F0] text-[#94A3B8]"}`}>{i + 1}</span>
                  <span className={`text-[17px] font-semibold transition ${i === active ? "text-[#0F172A]" : "text-[#CBD5E1] group-hover:text-[#94A3B8]"}`}>{s.rail}</span>
                </button>
              ))}
            </div>
            {/* Illustration */}
            <div key={`a-${active}`} className="v5-fade">{steps[active].art}</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Before/after comparison — manual search vs LogLead (SiteScout-style).
function Comparison() {
  const t = useTr();
  const bad = [
    t("Scroll through hundreds of results one by one", "Faire défiler des centaines de résultats un par un"),
    t("No way to filter who actually needs your service", "Aucun moyen de filtrer qui a vraiment besoin de vous"),
    t("No scoring — every prospect looks the same", "Aucun scoring — tous les prospects se ressemblent"),
    t("Hours of work to find 10 decent leads", "Des heures de travail pour 10 leads corrects"),
  ];
  const good = [
    t("Describe who you want — Scout finds them instantly", "Décrivez qui vous voulez — Scout les trouve instantanément"),
    t("Every prospect filtered and scored 0-100 by AI", "Chaque prospect filtré et scoré de 0 à 100 par l'IA"),
    t("Email and phone enriched automatically", "Email et téléphone enrichis automatiquement"),
    t("10 seconds to a list of 100+ qualified prospects", "10 secondes pour une liste de 100+ prospects qualifiés"),
  ];
  return (
    <section className="bg-white px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-[1000px]">
        <div className="v5-fade flex justify-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> {t("Why LogLead?", "Pourquoi LogLead ?")}</span>
        </div>
        <h2 className="v5-fade mx-auto mt-5 max-w-3xl text-center text-[32px] font-bold leading-[1.15] tracking-[-0.02em] text-[#0F172A] sm:text-[46px]">
          {t("You could spend hours searching manually", "Vous pouvez passer des heures à chercher à la main")}{" "}
          <span className="v5-gradient-text">{t("or 10 seconds on LogLead", "ou 10 secondes sur LogLead")}</span>
        </h2>

        <div className="mt-12 grid items-stretch gap-5 md:grid-cols-2">
          {/* Google Maps — white card */}
          <div className="v5-fade flex flex-col rounded-3xl border border-[#E9EDF2] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.18)] sm:p-8" style={{ animationDelay: "0.1s" }}>
            <p className="flex h-8 items-center text-[18px] font-semibold text-[#0F172A]">Google Maps</p>
            <div className="mt-5 flex items-center justify-center overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/i1.svg" alt="" className="max-h-[240px] w-full object-contain" />
            </div>
            <div className="my-6 border-t border-dashed border-[#E2E8F0]" />
            <ul className="space-y-4">
              {bad.map((b, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-[#374151] sm:text-[15px]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FEE2E2] text-[11px] font-bold text-[#EF4444]">✕</span>{b}
                </li>
              ))}
            </ul>
          </div>
          {/* LogLead — white card */}
          <div className="v5-fade flex flex-col rounded-3xl border border-[#E9EDF2] bg-white p-6 shadow-[0_20px_60px_-30px_rgba(15,23,42,0.18)] sm:p-8" style={{ animationDelay: "0.18s" }}>
            <p className="flex h-8 items-center gap-2 text-[18px] font-semibold text-[#0F172A]">
              <span className="text-[#94A3B8]">{t("With", "Avec")}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/loglead-logo.svg" alt="LogLead" className="h-6 w-auto" />
            </p>
            <div className="mt-5 flex items-center justify-center overflow-hidden rounded-2xl border border-[#EEF1F5] bg-white p-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/i2.svg" alt="" className="max-h-[300px] w-full object-contain" />
            </div>
            <div className="my-6 border-t border-dashed border-[#E2E8F0]" />
            <ul className="space-y-4">
              {good.map((g, i) => (
                <li key={i} className="flex items-start gap-3 text-[14px] leading-relaxed text-[#374151] sm:text-[15px]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DCFCE7] text-[11px] font-bold text-[#16A34A]">✓</span>{g}
                </li>
              ))}
            </ul>
            <Link href={SIGNUP} className={`${BTN} mt-8 w-full !py-3`}><Roll>{t("Get started", "Commencer")}</Roll></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Reviews() {
  const t = useTr();
  const reviews = [
    { name: "Lucas M.", img: "https://randomuser.me/api/portraits/men/32.jpg", role: t("Sales Director", "Directeur commercial"), text: t("In two weeks we found more qualified prospects than in a whole quarter by hand. The scoring saves us a huge amount of time.", "En deux semaines on a trouvé plus de prospects qualifiés qu'en un trimestre à la main. Le scoring nous fait gagner un temps fou.") },
    { name: "Camille D.", img: "https://randomuser.me/api/portraits/women/68.jpg", role: t("Web agency founder", "Fondatrice d'agence web"), text: t("Scout finds exactly the kind of clients we target. We signed 3 agencies in one month.", "Scout trouve exactement le type de clients qu'on cible. On a signé 3 agences en un mois.") },
    { name: "Thomas R.", img: "https://randomuser.me/api/portraits/men/75.jpg", role: t("Growth freelancer", "Freelance growth"), text: t("I describe my ideal client and LogLead hands me an enriched list with email and phone. Impressive.", "Je décris mon client idéal, LogLead me sort une liste enrichie avec email et téléphone. Bluffant.") },
    { name: "Sarah L.", img: "https://randomuser.me/api/portraits/women/90.jpg", role: t("Head of Sales", "Head of Sales"), text: t("No more copy-pasting into a spreadsheet. Everything is scored, organized by segment, ready to contact.", "Fini le copier-coller dans un tableur. Tout est scoré, organisé par segment, prêt à contacter.") },
    { name: "Marc V.", img: "https://randomuser.me/api/portraits/men/54.jpg", role: t("B2B consultant", "Consultant B2B"), text: t("The buying signals let me reach out at the right moment. My reply rate doubled.", "Les signaux d'achat détectés m'ont permis de contacter au bon moment. Mon taux de réponse a doublé.") },
    { name: "Julie P.", img: "https://randomuser.me/api/portraits/women/33.jpg", role: t("Startup CEO", "CEO de startup"), text: t("It's like having a full-time SDR. The pipeline fills up on its own.", "C'est comme avoir un SDR à plein temps. Le pipeline se remplit tout seul.") },
  ];
  const initials = (n: string) => n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();
  return (
    <section className="bg-white px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-[1000px]">
        <div className="flex flex-col items-center text-center">
          <span className={EY}><span className="text-[#F59E0B]">★</span> {t("Reviews", "Avis clients")}</span>
          <h2 className="mt-5 text-[32px] font-bold leading-[1.1] tracking-[-0.02em] text-[#0F172A] sm:text-[44px]">
            {t("+50 professionals", "+50 professionnels")}<br />{t("already use LogLead", "ont déjà adopté LogLead")}
          </h2>
        </div>
        <div
          className="relative mt-12 h-[520px] overflow-hidden"
          style={{
            maskImage: "linear-gradient(to bottom, transparent, #000 11%, #000 89%, transparent)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 11%, #000 89%, transparent)",
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((col) => {
              const items = [...reviews.slice(col * 2), ...reviews.slice(0, col * 2)];
              const dur = [46, 56, 50][col];
              return (
                <div key={col} className={col === 1 ? "hidden sm:block" : col === 2 ? "hidden lg:block" : ""}>
                  <div className="flex flex-col gap-4" style={{ animation: `lp-marquee-up ${dur}s linear infinite` }}>
                    {[...items, ...items].map((r, i) => (
                      <div key={`${col}-${i}`} className="flex flex-col rounded-2xl border border-[#EAECF0] bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.15)]">
                        <div className="flex gap-0.5 text-[15px] text-[#F59E0B]" aria-label="5/5">★★★★★</div>
                        <p className="mt-3 text-[14px] leading-relaxed text-[#475569]">“{r.text}”</p>
                        <div className="mt-5 flex items-center gap-3">
                          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#0051FF] text-[12px] font-bold text-white">
                            {initials(r.name)}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={r.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                          </span>
                          <div>
                            <p className="text-[13px] font-semibold text-[#0F172A]">{r.name}</p>
                            <p className="text-[12px] text-[#94A3B8]">{r.role}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function Faq() {
  const t = useTr();
  const faqs: [string, string][] = [
    [t("What is LogLead exactly?", "Qu'est-ce que LogLead exactement ?"), t("LogLead is your AI SDR — a prospecting agent that works autonomously so you don't have to. Describe your ideal client in plain language. LogLead searches across the web, qualifies every prospect, enriches their contact data and sends personalized outreach on your behalf. You only see the conversations worth your time. You focus on closing. LogLead handles everything before that.", "LogLead est votre SDR IA — un agent de prospection qui travaille en autonomie à votre place. Décrivez votre client idéal en langage naturel. LogLead cherche sur tout le web, qualifie chaque prospect, enrichit ses coordonnées et envoie des messages personnalisés en votre nom. Vous ne voyez que les conversations qui valent votre temps. Vous vous concentrez sur le closing. LogLead gère tout le reste en amont.")],
    [t("Where does LogLead search to find prospects?", "Où LogLead cherche-t-il pour trouver des prospects ?"), t("LogLead searches everywhere your future clients are — Google, Google Maps, LinkedIn, Reddit, Instagram, TikTok, Facebook, X and dozens of other web sources. Whether you're looking for local businesses, B2B companies, e-commerce brands or professionals — if they have a digital footprint, LogLead finds them. No manual search. No copy-pasting. One description, every relevant source scanned simultaneously.", "LogLead cherche partout où sont vos futurs clients — Google, Google Maps, LinkedIn, Reddit, Instagram, TikTok, Facebook, X et des dizaines d'autres sources web. Que vous cherchiez des commerces locaux, des entreprises B2B, des marques e-commerce ou des professionnels — s'ils ont une empreinte digitale, LogLead les trouve. Aucune recherche manuelle. Aucun copier-coller. Une description, toutes les sources pertinentes scannées simultanément.")],
    [t("What's the difference between LogLead, Apollo and Clay?", "Quelle est la différence entre LogLead, Apollo et Clay ?"), t("Apollo is a contact database — you search from a fixed list of pre-existing profiles. Clay is a powerful but highly technical enrichment tool that requires significant setup and expertise. LogLead is fundamentally different: you describe your ideal client in plain language and the AI searches 10+ live sources in real time — including Google Maps, Reddit, Instagram and TikTok that Apollo and Clay don't cover. But what truly sets LogLead apart is that it also finds the clients of your competitors (via WebSpy) and searches locally — restaurants, agencies, SMBs in any city — something no other tool does out of the box. No learning curve. No technical setup. Results in under 2 minutes.", "Apollo est une base de contacts — vous cherchez dans une liste figée de profils préexistants. Clay est un outil d'enrichissement puissant mais très technique, qui demande beaucoup de configuration et d'expertise. LogLead est fondamentalement différent : vous décrivez votre client idéal en langage naturel et l'IA cherche en temps réel dans 10+ sources live — dont Google Maps, Reddit, Instagram et TikTok qu'Apollo et Clay ne couvrent pas. Mais ce qui distingue vraiment LogLead, c'est qu'il trouve aussi les clients de vos concurrents (via WebSpy) et cherche en local — restaurants, agences, PME dans n'importe quelle ville — ce qu'aucun autre outil ne fait nativement. Aucune courbe d'apprentissage. Aucune configuration technique. Des résultats en moins de 2 minutes.")],
    [t("How quickly will I see results?", "En combien de temps vais-je voir des résultats ?"), t("Your first qualified prospects appear in under 2 minutes. LogLead runs all sources simultaneously — no waiting between searches. Most users find their first relevant prospects within minutes of signing up. The AI then enriches each profile with email, phone and company data automatically.", "Vos premiers prospects qualifiés apparaissent en moins de 2 minutes. LogLead lance toutes les sources simultanément — aucune attente entre les recherches. La plupart des utilisateurs trouvent leurs premiers prospects pertinents quelques minutes après leur inscription. L'IA enrichit ensuite chaque profil avec l'email, le téléphone et les données de l'entreprise, automatiquement.")],
    [t("Do I need technical skills to use LogLead?", "Ai-je besoin de compétences techniques pour utiliser LogLead ?"), t("None. LogLead is designed for founders, sales teams and agencies — not developers. You describe who you're looking for in plain language, just like you'd explain it to a colleague. No filters to configure. No spreadsheets to manage. No API to set up. If you can type a sentence, you can use LogLead.", "Aucune. LogLead est conçu pour les fondateurs, les équipes commerciales et les agences — pas pour les développeurs. Vous décrivez qui vous cherchez en langage naturel, comme vous l'expliqueriez à un collègue. Aucun filtre à configurer. Aucun tableur à gérer. Aucune API à mettre en place. Si vous savez taper une phrase, vous savez utiliser LogLead.")],
    [t("Can I cancel anytime?", "Puis-je annuler à tout moment ?"), t("Yes — no commitment, no fine print. Cancel in one click from Settings → Subscription. Your subscription ends at the close of the current billing period and your data stays accessible for 30 days after that.", "Oui — sans engagement, sans petites lignes. Annulez en un clic depuis Réglages → Abonnement. Votre abonnement prend fin à la clôture de la période de facturation en cours et vos données restent accessibles 30 jours après.")],
  ];
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="scroll-mt-24 bg-white px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <h2 className="text-[34px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[44px]">{t("Need more answers?", "Besoin de plus de réponses ?")}</h2>
          <p className="mx-auto mt-3 max-w-md text-[16px] text-[#64748B]">{t("Here are answers to our most asked questions", "Voici les réponses à nos questions les plus posées")}</p>
        </div>
        <div className="mt-10 space-y-1">
          {faqs.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className={
                  isOpen
                    ? "rounded-2xl border border-[#E2E8F0] bg-white px-6 py-5 shadow-[0_12px_40px_-18px_rgba(15,23,42,0.18)]"
                    : "border-b border-[#EEF1F5] px-2"
                }
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  aria-expanded={isOpen}
                  className={`flex w-full items-center justify-between gap-4 text-left text-[18px] font-semibold text-[#0F172A] transition ${isOpen ? "" : "py-5 hover:text-[#0051FF]"}`}
                >
                  <span>{q}</span>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center text-[22px] font-light leading-none transition ${isOpen ? "text-[#0F172A]" : "text-[#94A3B8]"}`}>{isOpen ? "−" : "+"}</span>
                </button>
                <div className={`grid transition-all duration-300 ease-out ${isOpen ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <p className="overflow-hidden text-[15px] leading-relaxed text-[#64748B]">{a}</p>
                </div>
              </div>
            );
          })}
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
    { t: t("Solutions", "Solutions"), links: [[t("Web agencies", "Agences web"), "/for/agencies"], [t("Sales teams", "Commerciaux"), "/for/sales"], [t("Freelancers", "Freelances"), "/for/freelancers"], [t("Founders", "Fondateurs"), "/for/founders"]] as [string, string][] },
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
            <p className="text-[15px] font-medium text-[#64748B]">{t("AI SDR", "SDR IA")}</p>
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
                  <p className="mt-3 text-[12px] leading-relaxed text-[#94A3B8]">{t("Your AI SDR for B2B.", "Votre SDR IA pour le B2B.")}</p>
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
                <p>{t("© 2026 LogLead · Your AI SDR for B2B", "© 2026 LogLead · Votre SDR IA pour le B2B")}</p>
                <p>{t("Not affiliated with LinkedIn Corporation. · SIRET 104 040 456 00014", "Non affilié à LinkedIn Corporation. · SIRET 104 040 456 00014")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Interactive demo — pick a query, watch the agent "search" and stream scored
// ---------------------------------------------------------------------------
// Features tabs + animated product interface (Adwize-style). Dark showcase band:
// 4 tabs (Find / Enrich / Qualify / Contact-soon), auto-rotates every 4s + click.
// Left = chat context, right = the matching LogLead UI, animated. CSS-only.
// ---------------------------------------------------------------------------
type FTab = "find" | "enrich" | "qualify" | "contact";
const FICONS: Record<FTab, React.ComponentType<{ size?: number; className?: string }>> = {
  find: Telescope, enrich: Sparkles, qualify: Star, contact: Send,
};
const FROWS = [
  { s: 93, c: "Le Bistrot du Port", sig: "Sans site web", city: "Lyon 2e", seg: "Restaurants Lyon" },
  { s: 88, c: "Chez Antoine", sig: "Sans site web", city: "Lyon 1er", seg: "Restaurants Lyon" },
  { s: 85, c: "La Table de Marie", sig: "Note < 4★", city: "Lyon 6e", seg: "Restaurants Lyon" },
  { s: 82, c: "Le Comptoir Lyon", sig: "Sans site web", city: "Lyon 3e", seg: "Restaurants Lyon" },
  { s: 79, c: "Brasserie du Parc", sig: "Note < 4★", city: "Lyon 5e", seg: "Restaurants Lyon" },
];
const fdot = (s: number) => (s > 85 ? "#22C55E" : s >= 70 ? "#F59E0B" : "#EF4444");

function FeaturesSection() {
  const t = useTr();
  const tabs: { id: FTab; label: string; soon?: boolean }[] = [
    { id: "find", label: t("Find", "Trouver") },
    { id: "enrich", label: t("Enrich", "Enrichir") },
    { id: "qualify", label: t("Qualify", "Qualifier") },
    { id: "contact", label: "Contact", soon: true },
  ];
  const [active, setActive] = useState<FTab>("find");
  useEffect(() => {
    const auto: FTab[] = ["find", "enrich", "qualify"];
    const id = setInterval(() => setActive((p) => auto[(Math.max(0, auto.indexOf(p)) + 1) % auto.length]), 7000);
    return () => clearInterval(id);
  }, []);
  return (
    <section className="bg-white px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-[1100px]">
        <div className="flex flex-col items-center text-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> {t("Product", "Produit")}</span>
          <h2 className="mt-5 text-[30px] font-bold leading-[1.14] tracking-[-0.02em] text-[#0F172A] sm:text-[46px]">
            {t("An agent that prospects", "Un agent qui prospecte")} <span className="text-[#0051FF]">{t("for you", "pour vous")}</span>
          </h2>
          <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-[#64748B]">{t("From finding prospects to qualifying them, LogLead automates your prospecting end to end.", "De la recherche de prospects à la qualification, LogLead automatise votre prospection de bout en bout.")}</p>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex justify-center">
          <div className="inline-flex flex-wrap justify-center gap-1 rounded-2xl border border-[#E9EDF2] bg-[#F8FAFC] p-1.5 sm:rounded-full">
            {tabs.map((tb) => {
              const Icon = FICONS[tb.id];
              const on = active === tb.id;
              return (
                <button key={tb.id} onClick={() => setActive(tb.id)} className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-medium transition ${on ? "bg-white font-semibold text-[#0F172A] shadow-[0_2px_10px_-4px_rgba(15,23,42,0.22)]" : "text-[#64748B] hover:text-[#0F172A]"}`}>
                  <Icon size={15} className={on ? "text-[#0051FF]" : "text-[#94A3B8]"} /> {tb.label}
                  {tb.soon && <span className="rounded-full bg-[#F59E0B]/12 px-1.5 py-0.5 text-[10px] font-bold text-[#D97706]">Soon</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Demo */}
        <div className="mt-9 grid overflow-hidden rounded-[20px] border border-[#E9EDF2] bg-white shadow-[0_30px_80px_-40px_rgba(15,23,42,0.25)] lg:min-h-[460px] lg:grid-cols-[340px_1px_1fr]">
          <div key={`${active}-c`} className="v5-fade bg-[#FBFCFE] p-6 sm:p-7"><FChat t={t} tab={active} /></div>
          <div className="hidden bg-[#E9EDF2] lg:block" />
          <div key={`${active}-i`} className="v5-fade min-w-0 p-5 sm:p-7"><FInterface t={t} tab={active} /></div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link href={SIGNUP} className="lp-roll-btn inline-flex items-center gap-2.5 rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_14px_34px_-14px_rgba(0,81,255,0.7)] transition hover:brightness-110">
            <Roll>{t("Free trial", "Essai gratuit")}</Roll>
            <Gift size={18} className="shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function FChat({ t, tab }: { t: Tr; tab: FTab }) {
  const C: Record<FTab, { head: string; user: string; agent: string; result: string; resultColor: string }> = {
    find: { head: "Scout · Prospect Search", user: t("Find restaurants in Lyon with a Google rating under 4★ and no website", "Trouve des restaurants à Lyon avec une note Google sous 4★ et sans site web"), agent: t("Searching Google Maps, LinkedIn, Reddit…", "Recherche sur Google Maps, LinkedIn, Reddit…"), result: t("34 prospects found · 71% qualified", "34 prospects trouvés · 71% qualifiés"), resultColor: "#16A34A" },
    enrich: { head: "Lead Intelligence · Enrichment", user: t("Enrich the top 10 prospects with email and phone", "Enrichis les 10 meilleurs prospects avec email et téléphone"), agent: t("Enriching via FullEnrich…", "Enrichissement via FullEnrich…"), result: t("9/10 emails · 7/10 phones found", "9/10 emails · 7/10 téléphones trouvés"), resultColor: "#16A34A" },
    qualify: { head: "Lead Intelligence · Scoring", user: t("Show me the most promising prospects this week", "Montre-moi les prospects les plus prometteurs cette semaine"), agent: t("Analyzing 34 prospects, scoring by opportunity level…", "Analyse de 34 prospects, scoring par niveau d'opportunité…"), result: t("8 hot prospects · Score > 85", "8 prospects chauds · Score > 85"), resultColor: "#D97706" },
    contact: { head: t("Contact · Coming soon", "Contact · Bientôt"), user: t("Show me who to contact today and what to say", "Montre-moi qui contacter aujourd'hui et quoi dire"), agent: t("🔒 This feature is coming soon. Contact will centralize your conversations and tell you who to reach out to and when.", "🔒 Cette fonctionnalité arrive bientôt. Contact centralisera vos conversations et vous dira qui contacter et quand."), result: "", resultColor: "#D97706" },
  };
  const c = C[tab];
  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center gap-2 text-[12px] text-[#94A3B8]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/loglead-logo.svg" alt="LogLead" className="h-4 w-auto" /> · {c.head}
      </div>
      <div className={`ml-auto max-w-[240px] rounded-[12px_12px_4px_12px] bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-3.5 py-2.5 text-[13px] leading-relaxed text-white ${tab === "contact" ? "opacity-60" : ""}`}>{c.user}</div>
      <div className="mt-3.5 flex items-start gap-2">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[10px] font-bold text-white">L</span>
        <p className="text-[13px] leading-relaxed text-[#64748B]">{c.agent}</p>
      </div>
      {c.result && (
        <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg border border-[#E9EDF2] bg-[#F8FAFC] px-2.5 py-1.5 text-[12px] font-medium" style={{ color: c.resultColor }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.resultColor }} /> {c.result}
        </div>
      )}
    </div>
  );
}

// Fit-score bars — identical to the dashboard LeadsBoard (10 bars, /10 number).
function FitBars({ s }: { s: number }) {
  const v = Math.round(s / 10);
  const color = v > 8 ? "#22C55E" : v >= 5 ? "#F59E0B" : "#EF4444";
  return (
    <span className="flex items-center gap-1.5">
      <span className="flex items-end gap-[2px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <span key={i} className="w-[3px] rounded-full" style={{ height: 6 + i, background: i < v ? color : "#E2E8F0" }} />
        ))}
      </span>
      <span className="text-[12px] font-semibold text-[#0F172A]">{v}</span>
    </span>
  );
}
function FindPill({ label }: { label: string }) {
  return <span className="inline-flex whitespace-nowrap rounded-full border border-[#EAECF0] px-2 py-0.5 text-[11px] font-medium text-[#94A3B8]">{label}</span>;
}
function SegChip({ label }: { label: string }) {
  return (
    <span className="inline-flex max-w-[150px] items-center gap-1.5 whitespace-nowrap rounded-full bg-[#F8FAFC] px-2 py-0.5 text-[11px] font-medium text-[#334155]">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0051FF]" /><span className="truncate">{label}</span>
    </span>
  );
}

// "Trouver" — the request is shown, then LogLead generates the Leads table row
// by row (exact dashboard interface: Fit bars, Find email/phone, Segment…).
function FindTable({ t }: { t: Tr }) {
  // The request is shown (left panel), then rows stream in via CSS-staggered
  // fade — robust even when timers are throttled. Header flips generating→done.
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDone(false);
    const id = setTimeout(() => setDone(true), FROWS.length * 300 + 500);
    return () => clearTimeout(id);
  }, []);
  return (
    <div className="flex min-h-[380px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[13px] font-medium text-[#334155]">
          {done ? (
            t("34 prospects found · 71% qualified", "34 prospects trouvés · 71% qualifiés")
          ) : (
            <><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#0051FF]/25 border-t-[#0051FF]" />{t("Generating…", "Génération en cours…")}</>
          )}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0051FF]/8 px-2.5 py-1 text-[11px] font-semibold text-[#0051FF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0051FF]" style={{ animation: "fs-pill 1.4s ease-in-out infinite" }} /> {t("Live", "En direct")}
        </span>
      </div>
      <div className="overflow-x-auto overflow-y-hidden rounded-2xl border border-[#EAECF0] shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)]">
        <table className="w-full min-w-[620px] text-left text-[12px]">
          <thead>
            <tr className="border-b border-[#EAECF0] bg-[#F8FAFC] text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
              <th className="px-3 py-3 font-semibold">Fit</th>
              <th className="px-3 py-3 font-semibold">Lead</th>
              <th className="px-3 py-3 font-semibold">{t("Company", "Entreprise")}</th>
              <th className="px-3 py-3 font-semibold">Email</th>
              <th className="px-3 py-3 font-semibold">{t("Phone", "Tél.")}</th>
              <th className="px-3 py-3 font-semibold">Segment</th>
              <th className="px-3 py-3 font-semibold">Signal</th>
            </tr>
          </thead>
          <tbody>
            {FROWS.map((r, i) => (
              <tr key={r.c} className="v5-fade border-b border-[#F1F5F9] last:border-b-0" style={{ animationDelay: `${i * 0.3}s` }}>
                <td className="px-3 py-3"><FitBars s={r.s} /></td>
                <td className="px-3 py-3 text-[#94A3B8]">—</td>
                <td className="whitespace-nowrap px-3 py-3 font-medium text-[#334155]">{r.c}</td>
                <td className="px-3 py-3"><FindPill label={t("Find email", "Trouver email")} /></td>
                <td className="px-3 py-3"><FindPill label={t("Find phone", "Trouver tél.")} /></td>
                <td className="px-3 py-3"><SegChip label={r.seg} /></td>
                <td className="whitespace-nowrap px-3 py-3 text-[#64748B]">{r.sig}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FInterface({ t, tab }: { t: Tr; tab: FTab }) {
  if (tab === "enrich") return <EnrichCard t={t} />;
  if (tab === "contact") return <ContactLocked t={t} />;
  if (tab === "find") return <FindTable t={t} />;
  // qualify — same dashboard table, scored by opportunity level
  return (
    <div className="flex min-h-[380px] flex-col">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-[13px] font-medium text-[#334155]">{t("Scored by opportunity level", "Scorés par niveau d'opportunité")}</div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0051FF]/8 px-2.5 py-1 text-[11px] font-semibold text-[#0051FF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#0051FF]" style={{ animation: "fs-pill 1.4s ease-in-out infinite" }} /> {t("Live", "En direct")}
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#EAECF0] shadow-[0_20px_50px_-32px_rgba(15,23,42,0.35)]">
        <div className="grid grid-cols-[72px_1fr_1.1fr_96px] border-b border-[#EAECF0] bg-[#F8FAFC] px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">
          <span>Fit</span><span>{t("Company", "Entreprise")}</span><span>{t("Signal", "Signal")}</span><span className="text-right">Score</span>
        </div>
        {FROWS.map((r, i) => (
          <div key={r.c} className="v5-fade grid grid-cols-[72px_1fr_1.1fr_96px] items-center border-b border-[#F1F5F9] px-4 py-3.5 text-[12.5px] last:border-b-0" style={{ animationDelay: `${i * 0.14}s` }}>
            <FitBars s={r.s} />
            <span className="min-w-0"><span className="block truncate font-medium text-[#334155]">{r.c}</span><span className="block truncate text-[11px] text-[#94A3B8]">{r.city}</span></span>
            <span className="truncate text-[#64748B]">{r.sig}</span>
            <span className="flex items-center justify-end gap-1">
              {r.s > 85 && <span className="text-[11px]" style={{ animation: "fs-pill 1.2s ease-in-out infinite" }}>🔥</span>}
              <span className="font-bold" style={{ color: fdot(r.s) }}><CountUp to={r.s} /></span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EnrichCard({ t }: { t: Tr }) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setRevealed(true), 550);
    return () => clearTimeout(id);
  }, []);
  const Field = ({ label, masked, real, warn = false }: { label: string; masked: string; real: string; warn?: boolean }) => (
    <div className="flex items-center gap-2 text-[12px]">
      <span className="w-[64px] shrink-0 text-[#94A3B8]">{label}</span>
      <span className={`min-w-0 flex-1 truncate font-mono ${warn ? "text-[#D97706]" : "text-[#334155]"}`}>{revealed ? real : masked}</span>
      <span className={`transition-opacity duration-300 ${revealed ? "opacity-100" : "opacity-0"}`}>{warn ? "⚠️" : "✅"}</span>
    </div>
  );
  return (
    <div className="mx-auto max-w-[420px] rounded-2xl border border-[#EAECF0] bg-[#FBFCFE] p-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0051FF]/10 text-[13px] font-bold text-[#0051FF]">LB</span>
        <div><p className="text-[14px] font-semibold text-[#0F172A]">Le Bistrot du Port</p><p className="text-[12px] text-[#64748B]">Restaurant · Lyon 2e</p></div>
      </div>
      <div className="mt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">Fit score</p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className="text-[15px] font-bold text-[#16A34A]"><CountUp to={93} />/100</span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EAECF0]"><div className="h-full rounded-full bg-gradient-to-r from-[#0051FF] to-[#00D4FF]" style={{ animation: "fs-progress 0.9s ease forwards" }} /></div>
          <span>🔥</span>
        </div>
      </div>
      <div className="mt-4 space-y-2 border-t border-[#EAECF0] pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">Contact</p>
        <Field label="Email" masked="••••••@••••••.fr" real="contact@bistrot-port.fr" />
        <Field label={t("Phone", "Tél.")} masked="+33 4 •• •• •• ••" real="+33 4 78 62 14 09" />
        <Field label="Website" masked="•••••••••••" real={t("No website found", "Aucun site détecté")} warn />
      </div>
    </div>
  );
}

function ContactLocked({ t }: { t: Tr }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !email.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/waitlist-contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setDone(true);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="relative min-h-[280px] overflow-hidden rounded-xl border border-[#EAECF0]">
      <div aria-hidden className="pointer-events-none select-none p-4 opacity-50 blur-[5px]">
        <div className="mb-3 flex items-center justify-between text-[12px] text-[#64748B]"><span>{t("To do", "À faire")}</span><span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 font-semibold text-[#0F172A]">836</span></div>
        {[["Thomas Robert", "Relancer", "#F59E0B"], ["Camille Vernet", "Répondre", "#0051FF"], ["Marc Lambert", "Vérifier", "#94A3B8"], ["Julie Martin", "Relancer", "#F59E0B"]].map(([n, a, col]) => (
          <div key={n} className="flex items-center gap-2.5 border-b border-[#F1F5F9] py-2.5">
            <span className="h-7 w-7 rounded-full bg-[#E9EDF2]" />
            <span className="flex-1 text-[13px] text-[#334155]">{n}</span>
            <span className="text-[12px]" style={{ color: col as string }}>{a}</span>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 px-6 text-center backdrop-blur-[2px]">
        <div className="text-[26px]">🔒</div>
        <p className="mt-1 text-[15px] font-semibold text-[#0F172A]">{t("Coming in V1.2", "Bientôt en V1.2")}</p>
        {done ? (
          <p className="mt-2 text-[13px] font-medium text-[#16A34A]">{t("You're on the list — we'll notify you 🎉", "Tu es sur la liste — on te préviendra 🎉")}</p>
        ) : (
          <>
            <p className="mt-1 max-w-xs text-[12px] text-[#64748B]">{t("Be the first to know when it launches.", "Sois le premier informé du lancement.")}</p>
            <form onSubmit={submit} className="mt-3 flex w-full max-w-xs items-center gap-2">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("Enter your email", "Ton email")} className="min-w-0 flex-1 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-[13px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]" />
              <button type="submit" disabled={busy} className="shrink-0 rounded-lg bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-3 py-2 text-[13px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60">{t("Notify me", "Préviens-moi")}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// prospects. Fully client-side (mock data), no API. Auto-plays when in view.
// ---------------------------------------------------------------------------
function InteractiveDemo() {
  const t = useTr();
  const demos = [
    {
      chip: t("🍽️ Restaurants", "🍽️ Restaurants"),
      q: t("Restaurants in Lyon under 4★ with no website", "Restaurants à Lyon sous 4★ sans site web"),
      sources: ["Google Maps", "Web"],
      rows: [
        { n: "Le Bistrot du Port", m: ["3.6★", t("No website", "Sans site")], s: 93 },
        { n: "Chez Antoine", m: ["3.8★", t("No website", "Sans site")], s: 88 },
        { n: "La Table de Marie", m: ["3.4★", t("No website", "Sans site")], s: 85 },
        { n: "Le Petit Jardin", m: ["3.9★", t("Old site", "Site daté")], s: 71 },
      ],
      found: 34, rate: 71,
    },
    {
      chip: t("💼 Web agencies", "💼 Agences web"),
      q: t("Web agencies in France hiring a sales rep", "Agences web en France qui recrutent un commercial"),
      sources: ["LinkedIn", "Web"],
      rows: [
        { n: "Pixelis Studio", m: ["Sales rep", "Paris"], s: 94 },
        { n: "Nord Digital", m: ["Business Dev", "Lille"], s: 89 },
        { n: "Atelier Web", m: ["Account exec", "Lyon"], s: 82 },
        { n: "Studio Meraki", m: ["SDR", "Nantes"], s: 76 },
      ],
      found: 22, rate: 68,
    },
    {
      chip: t("🚀 B2B SaaS", "🚀 SaaS B2B"),
      q: t("B2B SaaS between 20 and 200 employees in Paris", "SaaS B2B de 20 à 200 employés à Paris"),
      sources: ["LinkedIn", "Web"],
      rows: [
        { n: "Notion FR", m: ["120 emp.", "Paris"], s: 91 },
        { n: "Figma EU", m: ["80 emp.", "Paris"], s: 87 },
        { n: "Linear", m: ["45 emp.", "Paris"], s: 83 },
        { n: "Hrflow", m: ["30 emp.", "Paris"], s: 74 },
      ],
      found: 18, rate: 82,
    },
    {
      chip: t("📱 E-commerce", "📱 E-commerce"),
      q: t("E-commerce brands with low engagement on Instagram", "Marques e-commerce avec peu d'engagement sur Instagram"),
      sources: ["Instagram", "Web"],
      rows: [
        { n: "Maison Bloom", m: ["Low IG", "No SEO"], s: 90 },
        { n: "Atelier Nova", m: ["Low IG", "No blog"], s: 84 },
        { n: "Studio Léa", m: ["Low IG", "No SEO"], s: 79 },
        { n: "Brand Kioko", m: ["Low IG", "Old site"], s: 68 },
      ],
      found: 27, rate: 76,
    },
  ];

  const [active, setActive] = useState(0);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState<"typing" | "scanning" | "results">("typing");
  const [rows, setRows] = useState(0);
  const [started, setStarted] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Start when scrolled into view.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStarted(true); io.disconnect(); } }, { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Play the sequence for the active demo.
  useEffect(() => {
    if (!started) return;
    const d = demos[active];
    const timers: ReturnType<typeof setTimeout>[] = [];
    setTyped(""); setPhase("typing"); setRows(0);
    let i = 0;
    const type = () => {
      i++;
      setTyped(d.q.slice(0, i));
      if (i < d.q.length) { timers.push(setTimeout(type, 26)); return; }
      timers.push(setTimeout(() => {
        setPhase("scanning");
        timers.push(setTimeout(() => {
          setPhase("results");
          d.rows.forEach((_, idx) => timers.push(setTimeout(() => setRows(idx + 1), idx * 260)));
        }, 750));
      }, 350));
    };
    timers.push(setTimeout(type, 300));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, started]);

  const d = demos[active];
  const scoreColor = (n: number) => (n > 80 ? "#10B981" : n >= 60 ? "#F59E0B" : "#EF4444");

  return (
    <section className="bg-white px-5 py-24 sm:px-6">
      <div ref={rootRef} className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> {t("Live demo", "Démo en direct")}</span>
          <h2 className="mt-5 text-[32px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[44px]">{t("Watch your agent work.", "Regardez votre agent travailler.")}</h2>
          <p className="mx-auto mt-3 max-w-md text-[16px] text-[#475569]">{t("Pick a request — see how LogLead finds and scores prospects in seconds.", "Choisissez une demande — voyez LogLead trouver et scorer des prospects en quelques secondes.")}</p>
        </div>

        {/* Query chips */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {demos.map((x, i) => (
            <button key={i} onClick={() => setActive(i)} className={`rounded-full border px-4 py-2 text-[13px] font-medium transition ${i === active ? "border-[#0051FF] bg-[#0051FF] text-white shadow-[0_8px_20px_-8px_rgba(0,81,255,0.6)]" : "border-[#E2E8F0] bg-white text-[#475569] hover:border-[#0051FF60] hover:text-[#0F172A]"}`}>{x.chip}</button>
          ))}
        </div>

        {/* Browser-chrome demo panel */}
        <div className="mx-auto mt-6 max-w-2xl overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_30px_80px_-30px_rgba(15,23,42,0.28)]">
          <div className="flex items-center gap-1.5 border-b border-[#F1F5F9] bg-[#F8FAFC] px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" /><span className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" /><span className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            <div className="ml-3 flex flex-1 items-center gap-2 rounded-lg bg-white px-3 py-1.5 text-[12px] text-[#0F172A] shadow-[inset_0_0_0_1px_#E9EEF5]">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <span className="truncate">{typed || d.q}</span>
              {phase === "typing" && <span className="v5-blink h-3 w-[2px] bg-[#0051FF]" />}
            </div>
          </div>
          <div className="min-h-[292px] p-5">
            {phase === "typing" ? (
              <div className="flex h-[252px] items-center justify-center text-[13px] text-[#94A3B8]">{t("Describe your ideal prospect…", "Décrivez votre prospect idéal…")}</div>
            ) : phase === "scanning" ? (
              <div className="flex h-[252px] flex-col items-center justify-center gap-3 text-center">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((k) => <span key={k} className="h-2.5 w-2.5 animate-bounce rounded-full bg-[#0051FF]" style={{ animationDelay: `${k * 0.15}s` }} />)}
                </div>
                <p className="text-[13px] font-medium text-[#475569]">{t("Scanning", "Analyse")} {d.sources.join(" · ")}…</p>
              </div>
            ) : (
              <div>
                <div className="mb-3 flex items-center justify-between text-[12px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF4FF] px-2.5 py-1 font-semibold text-[#0051FF]"><span className="h-1.5 w-1.5 rounded-full bg-[#0051FF]" /> {d.found} {t("found", "trouvés")} · {d.rate}% {t("qualified", "qualifiés")}</span>
                  <span className="text-[#94A3B8]">{d.sources.join(" · ")}</span>
                </div>
                <div className="space-y-2">
                  {d.rows.map((r, i) => (
                    <div key={i} className={`flex items-center gap-3 rounded-xl border border-[#EEF2F7] bg-[#FBFCFE] px-3 py-2.5 transition-all duration-300 ${i < rows ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EFF4FF] text-[12px] font-bold text-[#0051FF]">{r.n[0]}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-medium text-[#0F172A]">{r.n}</span>
                        <span className="mt-0.5 flex gap-1">{r.m.map((m, j) => <span key={j} className="rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[10px] font-medium text-[#64748B]">{m}</span>)}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold text-[#0F172A]"><span className="h-2 w-2 rounded-full" style={{ background: scoreColor(r.s) }} />{r.s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href={SIGNUP} className={BTN}><Roll>{t("Run your own search →", "Lancer votre propre recherche →")}</Roll></Link>
        </div>
      </div>
    </section>
  );
}

// Animated stats strip (counts up on scroll).
function StatsStrip() {
  const t = useTr();
  const stats = [
    { v: <><CountUp to={150} prefix="+" />K</>, l: t("prospects found", "prospects trouvés") },
    { v: <><CountUp to={10} />+</>, l: t("hours saved / week", "heures gagnées / semaine") },
    { v: <><CountUp to={2} /> min</>, l: t("to find your future clients", "pour trouver vos futurs clients") },
  ];
  return (
    <section className="bg-white px-5 pb-8 pt-0 sm:px-6">
      <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div key={i} className="rounded-xl border border-[#EAECF0] bg-white px-5 py-4 text-center shadow-[0_8px_24px_-18px_rgba(15,23,42,0.15)]">
            <div className="num text-[28px] font-bold leading-none tracking-[-0.02em] text-[#0F172A] sm:text-[32px]">{s.v}</div>
            <div className="mt-1.5 text-[13px] text-[#64748B]">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Floating CTA pill — hidden on the hero, slides in once you scroll, stays fixed
// at the bottom, and hides again near the footer. A blue light orbits the pill.
function FloatingCta() {
  const t = useTr();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const docH = document.documentElement.scrollHeight;
      const winH = window.innerHeight;
      const nearBottom = y + winH >= docH - 260; // hide when the footer is in view
      setShow(y > 40 && !nearBottom); // appears as soon as the user starts scrolling
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);
  return (
    <div className={`pointer-events-none fixed inset-x-0 bottom-5 z-[55] flex justify-center px-4 transition-all duration-300 ${show ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"}`}>
      <div className="relative">
        {/* Soft glow */}
        <div aria-hidden className="absolute -inset-2 rounded-full bg-[#0051FF]/20 blur-lg" />
        {/* Light beam travelling around the border */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{
            padding: "2px",
            background: "conic-gradient(from var(--beam), transparent 0deg, transparent 295deg, #00D4FF 328deg, #0051FF 348deg, #00D4FF 358deg, transparent 360deg)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            animation: "v5-beam 3s linear infinite",
          } as React.CSSProperties}
        />
        <Link
          href={SIGNUP}
          className={`lp-roll-btn relative flex items-center gap-2 rounded-full bg-white py-1.5 pl-3.5 pr-1.5 shadow-[0_18px_44px_-12px_rgba(15,23,42,0.4)] ${show ? "pointer-events-auto" : ""}`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0051FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <rect x="3" y="8" width="18" height="4" rx="1" />
            <path d="M12 8v13" />
            <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
            <path d="M7.5 8a2.5 2.5 0 0 1 0-5C9 3 12 5 12 8c0-3 3-5 4.5-5a2.5 2.5 0 0 1 0 5" />
          </svg>
          <span className="whitespace-nowrap text-[13px] font-semibold text-[#0F172A]"><Roll>{t("Get Started for free", "Commencer gratuitement")}</Roll></span>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-white shadow-[0_6px_16px_-6px_rgba(0,81,255,0.7)]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17L17 7M7 7h10v10" /></svg>
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function LandingV5() {
  return (
    <LangProvider>
      <div className="min-h-screen bg-[#FFFFFF] font-sans antialiased">
        <Nav />
        <Hero />
        <StatsStrip />
        <FeaturesSection />
        <Comparison />
        <Reviews />
        <Faq />
        <Footer />
        <FloatingCta />
      </div>
    </LangProvider>
  );
}
