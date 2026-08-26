"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "./LandingPage";

// ---------------------------------------------------------------------------
// Landing v5 — "Your AI Sales Agent for B2B". Dark, self-contained (its own
// nav + footer), English. Uses CSS/IO animations (Reveal/CountUp), no Framer.
// ---------------------------------------------------------------------------

const SIGNUP = "/signup";
const BTN = "inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_0_20px_#0051FF40] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_#0051FF70]";
const BTN_SEC = "inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#E2E8F0] px-7 py-3.5 text-[15px] text-[#475569] transition hover:border-[#0051FF60] hover:text-[#0F172A]";
const EY = "inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1 text-[12px] font-medium text-[#475569]";

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 60);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-[#E2E8F0] bg-[#FFFFFFEE] backdrop-blur-xl" : "border-b border-transparent"}`}>
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" aria-label="LogLead">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loglead-logo.svg" alt="LogLead" className="h-7 w-auto" />
        </Link>
        <div className="hidden items-center gap-7 text-[14px] text-[#475569] lg:flex">
          <a href="#how" className="transition hover:text-[#0F172A]">How it works</a>
          <a href="#pricing" className="transition hover:text-[#0F172A]">Pricing</a>
          <Link href="/affiliate" className="transition hover:text-[#0F172A]">Affiliate</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-[14px] text-[#475569] transition hover:text-[#0F172A] sm:block">Log in</Link>
          <Link href={SIGNUP} className={`${BTN} !px-5 !py-2.5 !text-[14px]`}>Hire your agent →</Link>
        </div>
      </nav>
    </header>
  );
}

const DEMO_QUERIES = [
  "Restaurants in Lyon with Google rating under 4 stars and no website",
  "Web agencies in France hiring a sales rep",
  "B2B SaaS between 20 and 200 employees in Paris",
  "E-commerce brands with low engagement on Instagram",
];
const CHIPS = [
  "🏪 Local businesses without website",
  "💼 B2B SaaS hiring a sales rep",
  "⭐ Restaurants with low Google rating",
  "🏗️ Construction companies in France",
  "📱 E-commerce brands on TikTok",
];

function Hero() {
  const [query, setQuery] = useState("");
  const [typed, setTyped] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const typing = useRef(true);

  // Typewriter placeholder cycling through examples. Stops once the user types.
  useEffect(() => {
    let qi = 0, ci = 0, erasing = false;
    const tick = () => {
      if (!typing.current) return;
      const full = DEMO_QUERIES[qi];
      if (!erasing) {
        ci++;
        setTyped(full.slice(0, ci));
        if (ci >= full.length) { erasing = true; return void (t = setTimeout(tick, 1800)); }
      } else {
        ci -= 3;
        setTyped(full.slice(0, Math.max(0, ci)));
        if (ci <= 0) { erasing = false; ci = 0; qi = (qi + 1) % DEMO_QUERIES.length; }
      }
      t = setTimeout(tick, erasing ? 20 : 42);
    };
    let t = setTimeout(tick, 1000);
    return () => clearTimeout(t);
  }, []);

  // Auto-resize the textarea.
  useEffect(() => {
    const ta = taRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.max(52, ta.scrollHeight)}px`; }
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
    <section className="relative overflow-hidden bg-white px-5 pb-28 pt-28 sm:px-6">
      {/* Animated glow blobs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="v5-blob v5-blob-a" style={{ left: "8%", top: "26%", width: 420, height: 340, background: "#0051FF", opacity: 0.1 }} />
        <div className="v5-blob v5-blob-b" style={{ right: "6%", top: "6%", width: 360, height: 300, background: "#6E56FF", opacity: 0.08 }} />
        <div className="v5-blob v5-blob-c" style={{ left: "42%", bottom: "4%", width: 380, height: 300, background: "#00D4FF", opacity: 0.07 }} />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <Reveal>
          <h1 className="mx-auto max-w-2xl text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F172A] sm:text-[64px] lg:text-[68px]">
            Find your ideal clients<br /><span className="v5-gradient-text">before your competitors do.</span>
          </h1>
        </Reveal>
        <Reveal delay={120}>
          <p className="mx-auto mt-6 max-w-[500px] text-[17px] leading-[1.7] text-[#475569]">
            Describe who you&apos;re looking for. Your AI Sales Agent finds them, messages them and sends you only the hot replies.
          </p>
        </Reveal>

        {/* Chat bubble */}
        <Reveal delay={200}>
          <div className="v5-chat mx-auto mt-10 w-full max-w-[680px] rounded-2xl border border-[#E2E8F0] bg-white p-4 text-left shadow-[0_12px_40px_-12px_rgba(15,23,42,0.15)]">
            <textarea
              ref={taRef}
              value={query}
              onChange={(e) => onType(e.target.value)}
              placeholder={typed || "Describe your ideal prospect…"}
              className="min-h-[52px] w-full resize-none bg-transparent text-[15px] leading-relaxed text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            {/* Suggestion chips */}
            <div className="v5-chips mt-2 flex gap-2 overflow-x-auto pb-1">
              {CHIPS.map((c) => (
                <button key={c} onClick={() => onType(c.replace(/^\S+\s/, ""))} className="shrink-0 whitespace-nowrap rounded-full border border-[#E2E8F0] bg-[#F1F5F9] px-3 py-1.5 text-[13px] text-[#475569] transition hover:border-[#0051FF60] hover:text-[#0F172A]">
                  {c}
                </button>
              ))}
            </div>
            {/* Bottom bar */}
            <div className="mt-3 flex items-center gap-2 border-t border-[#E2E8F0] pt-3">
              <button title="Add context" className="flex h-8 w-8 items-center justify-center rounded-lg text-[#475569] transition hover:bg-[#F1F5F9] hover:text-[#0F172A]">+</button>
              <button
                onClick={find}
                disabled={!query.trim()}
                className="ml-auto rounded-lg bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-5 py-2 text-[14px] font-semibold text-white shadow-[0_0_16px_#0051FF40] transition hover:-translate-y-0.5 hover:shadow-[0_0_28px_#0051FF70] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                Find them →
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
              <span className="text-[13px] text-[#475569]">500+ B2B sales teams trust LogLead</span>
            </div>
            <p className="text-[13px] text-[#94A3B8]"><span className="text-[#F59E0B]">★★★★★</span> &ldquo;Like having a full-time SDR for €59/month&rdquo;</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const STEPS = [
  { n: "01", h: "You describe your ideal prospect", d: "\"Web agencies in France hiring a sales rep.\" One sentence. Your agent does the rest." },
  { n: "02", h: "Your agent finds them", d: "LinkedIn · Google Maps · Reddit · Instagram · Web. Qualified, scored 0-100, enriched with email + phone." },
  { n: "03", h: "Your agent writes personalized messages", d: "Based on each prospect's signals, industry, recent activity and your offer. Every message sounds human. Never generic." },
  { n: "04", h: "Your agent sends and follows up", d: "First message → wait 3 days → follow-up → wait 5 days → last message. All automatically. All in your name." },
  { n: "05", h: "You only see the hot conversations", d: "Your agent filters replies and surfaces only the ones worth your time. You reply. You close. That's it." },
];

function HowItWorks() {
  return (
    <section id="how" className="bg-[#F8FAFC] px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> How your agent works</span>
          <h2 className="mt-5 text-[36px] font-bold leading-[1.05] tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">Set it up once.<br /><span className="v5-gradient-text">Let it run forever.</span></h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-[#475569]">Your AI Sales Agent works around the clock. You review and close.</p>
        </div>
        <div className="mt-16 space-y-16 sm:space-y-24">
          {STEPS.map((s, i) => (
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
                <StepArt step={i} />
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

function StepArt({ step }: { step: number }) {
  if (step === 0) {
    // Describe your prospect — prompt input with typewriter cursor
    return (
      <Frame>
        <div className="rounded-xl border border-[#E2E8F0] bg-[#FBFCFE] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Your request</div>
          <div className="mt-2 text-[15px] font-medium text-[#0F172A]">
            Web agencies in France hiring a sales rep<span className="v5-blink ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 bg-[#0051FF]" />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-1.5">
            {["LinkedIn", "Google Maps", "Web"].map((s) => (
              <span key={s} className="rounded-md bg-[#EFF4FF] px-2 py-1 text-[11px] font-medium text-[#0051FF]">{s}</span>
            ))}
          </div>
          <span className="rounded-lg bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-3 py-1.5 text-[12px] font-semibold text-white">Find them →</span>
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
          <span>Prospect</span><span>Fit</span>
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
            <div className="text-[11px] text-[#94A3B8]">Founder · Paris</div>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="max-w-[85%] rounded-[12px_12px_12px_4px] bg-[#F1F5F9] px-3 py-2 text-[12.5px] leading-relaxed text-[#334155]">
            Hi — saw you&apos;re hiring a sales rep. Growing the team is exactly when outbound gets messy…
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#0051FF] [animation-delay:0s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#0051FF] [animation-delay:0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-[#0051FF] [animation-delay:0.3s]" />
            <span className="ml-1.5 text-[11px] text-[#94A3B8]">writing follow-up…</span>
          </div>
        </div>
      </Frame>
    );
  }
  if (step === 3) {
    // Sends and follows up — sequence timeline
    const seq = [
      { t: "First message", d: "Sent", done: true },
      { t: "Wait 3 days", d: "Auto", done: true },
      { t: "Follow-up", d: "Sent", done: true },
      { t: "Wait 5 days", d: "Scheduled", done: false },
      { t: "Last message", d: "Queued", done: false },
    ];
    return (
      <Frame>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-[#94A3B8]">Sequence · on autopilot</div>
        <div className="relative mt-3 space-y-3 pl-6">
          <span aria-hidden className="absolute bottom-2 left-[9px] top-2 w-px bg-[#E2E8F0]" />
          {seq.map((x, i) => (
            <div key={x.t} className="v5-rise relative flex items-center justify-between" style={{ animationDelay: `${i * 0.12}s` }}>
              <span className={`absolute -left-6 top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] font-bold ${x.done ? "bg-[#0051FF] text-white" : "border-2 border-[#CBD5E1] bg-white text-transparent"}`}>✓</span>
              <span className="text-[13px] font-medium text-[#0F172A]">{x.t}</span>
              <span className={`text-[11px] font-medium ${x.done ? "text-[#10B981]" : "text-[#94A3B8]"}`}>{x.d}</span>
            </div>
          ))}
        </div>
      </Frame>
    );
  }
  // step 4 — hot conversations surfaced
  const hot = [
    { c: "Nord Digital", m: "Yes, let's talk — how does Tuesday look?" },
    { c: "Pixelis Studio", m: "Interested. Can you send pricing?" },
  ];
  return (
    <Frame>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[15px]">🔥</span>
        <span className="text-[13px] font-semibold text-[#0F172A]">Hot conversations</span>
        <span className="ml-auto rounded-full bg-[#FEF2F2] px-2 py-0.5 text-[11px] font-bold text-[#EF4444]">2 new</span>
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

const SOURCES = [
  { i: "🔵", n: "LinkedIn", d: "Profiles & jobs", soon: false },
  { i: "🟢", n: "Google Maps", d: "Local businesses", soon: false },
  { i: "🟠", n: "Reddit", d: "Community signals", soon: true },
  { i: "📸", n: "Instagram", d: "Social presence", soon: true },
  { i: "🎵", n: "TikTok", d: "Brand activity", soon: true },
  { i: "📘", n: "Facebook", d: "Company pages", soon: true },
  { i: "⬛", n: "X / Twitter", d: "Real-time mentions", soon: true },
  { i: "🌐", n: "Web & directories", d: "Specialized sources", soon: false },
];

function Sources() {
  return (
    <section className="px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> Where your agent searches</span>
          <h2 className="mt-5 text-[32px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">Your agent searches<br />everywhere they are.</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {SOURCES.map((s) => (
            <Reveal key={s.n} className={`relative rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 ${s.soon ? "opacity-50" : ""}`}>
              {s.soon && <span className="absolute right-2 top-2 rounded-full bg-[#0051FF]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#0051FF]">Coming soon</span>}
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
  const before = ["4 hours/day searching for prospects manually", "Copy-pasting from LinkedIn, Google, Maps", "Generic messages that get ignored", "Forgetting to follow up", "Missing signals that mean \"ready to buy\"", "€3,000+/month for a human SDR", "Your pipeline depends on one person"];
  const after = ["Agent finds 50+ qualified prospects overnight", "6 sources searched simultaneously", "Every message personalized with real signals", "Automatic follow-ups on perfect timing", "Only hot replies surface to your inbox", "€59/month. Works 24/7. Never quits.", "Your pipeline runs while you sleep"];
  return (
    <section className="bg-[#F8FAFC] px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-[36px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">Replace your SDR.<br />Or supercharge them.</h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-[#475569]">What your sales process looks like before and after LogLead.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-l-[3px] border-[#EF4444] bg-[#EF4444]/[0.04] p-6">
            {before.map((b) => <p key={b} className="flex items-start gap-2 py-1.5 text-[14px] text-[#475569]"><span className="text-[#EF4444]">✕</span> {b}</p>)}
          </div>
          <div className="rounded-2xl border-l-[3px] border-[#22C55E] bg-[#22C55E]/[0.04] p-6">
            {after.map((a) => <Reveal key={a} className="flex items-start gap-2 py-1.5 text-[14px] text-[#0F172A]"><span className="text-[#22C55E]">✓</span> {a}</Reveal>)}
          </div>
        </div>
      </div>
    </section>
  );
}

const TESTIS = [
  { q: "I set up LogLead on a Monday. By Wednesday my agent had found 34 qualified restaurants in Lyon without websites and sent them all a personalized first message. I got 7 replies. Closed 3 that week.", n: "Thomas R.", r: "Fondateur agence web · Paris" },
  { q: "We replaced our junior SDR with LogLead. Not because we wanted to cut costs — because LogLead finds better prospects, writes better messages and never forgets to follow up.", n: "Camille V.", r: "Head of Sales · Nexio", mid: true },
  { q: "The 'while you were sleeping' dashboard is what sold me. I wake up, I see 3 hot replies from my agent, I reply and I close. That's literally my morning routine now.", n: "Marc L.", r: "Founder · Hrflow" },
];

function Testimonials() {
  const marquee = "500+ sales teams · 68% qualify rate · 3 replies/day avg · €59/month · Works 24/7";
  return (
    <section className="px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> What sales teams say</span>
          <h2 className="mt-5 text-[36px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">They let the agent work.<br />They just closed.</h2>
        </div>
        <div className="mt-12 grid items-center gap-4 md:grid-cols-3">
          {TESTIS.map((t) => (
            <Reveal key={t.n} className={`rounded-2xl border bg-[#F8FAFC] p-6 ${t.mid ? "border-[#0051FF40] md:scale-105" : "border-[#E2E8F0]"}`}>
              <p className="text-[#F59E0B]">★★★★★</p>
              <p className="mt-3 text-[14px] leading-relaxed text-[#0F172A]">&ldquo;{t.q}&rdquo;</p>
              <p className="mt-4 text-[13px] font-semibold text-[#0F172A]">{t.n}</p>
              <p className="text-[12px] text-[#94A3B8]">{t.r}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 overflow-hidden">
          <div className="v5-marquee flex w-max gap-8 text-[13px] text-[#94A3B8]">
            {[0, 1].map((k) => <span key={k} className="whitespace-nowrap">{marquee} · {marquee}</span>)}
          </div>
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  { name: "Free", price: "€0", tag: "Discover what your agent can do.", feats: ["200 one-time credits", "Prospect search (LinkedIn + Google Maps)", "AI qualification scoring", "View leads (read-only)", "5 AI agent messages"], cta: "Start free →", note: "200 credits. Enough to see the value." },
  { name: "Starter", price: "€29", per: "/month", tag: "Your agent finds. You message.", feats: ["2,000 credits/month", "LinkedIn + Google Maps search", "500 prospects/month", "Email enrichment", "Manual outreach with AI messages"], cta: "Start 7-day trial" },
  { name: "Growth", price: "€59", per: "/month", tag: "Your agent finds and messages.", popular: true, feats: ["5,000 credits/month", "All 6 sources · 2,000 prospects/month", "Email + Phone enrichment", "AI-generated personalized outreach", "Basic follow-up sequences"], cta: "Start 7-day trial" },
  { name: "Pro", price: "€99", per: "/month", tag: "Full autonomous sales agent.", feats: ["10,000 credits/month", "Unlimited prospects · All sources", "Automatic sending (email + LinkedIn)", "Multi-step sequences", "Hot reply detection", "Dedicated support"], cta: "Start 7-day trial" },
];

function Pricing() {
  return (
    <section id="pricing" className="bg-[#F8FAFC] px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#0085FF]">✦</span> Pricing</span>
          <h2 className="mt-5 text-[36px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">One agent.<br />Three levels of autonomy.</h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] text-[#475569]">Start free. Upgrade when your pipeline grows.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {PLANS.map((p) => (
            <Reveal key={p.name} className={`relative flex flex-col rounded-2xl border p-6 ${p.popular ? "border-2 border-[#0051FF] shadow-[0_0_60px_#0051FF20]" : "border-[#E2E8F0] bg-[#F8FAFC]"}`} style={p.popular ? { background: "linear-gradient(180deg,#EAF1FF,#F8FAFC)" } : undefined}>
              {p.popular && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-3 py-1 text-[11px] font-semibold text-white">Most popular</span>}
              <p className="text-[15px] font-bold text-[#0F172A]">{p.name}</p>
              <p className="mt-1 text-[12px] text-[#475569]">{p.tag}</p>
              <p className="mt-4 text-[30px] font-bold text-[#0F172A]">{p.price}<span className="text-[13px] font-normal text-[#94A3B8]">{p.per ?? ""}</span></p>
              <ul className="mt-4 flex-1 space-y-2 text-[13px] text-[#475569]">
                {p.feats.map((f) => <li key={f} className="flex items-start gap-2"><span className="text-[#0051FF]">✓</span>{f}</li>)}
              </ul>
              <Link href={SIGNUP} className={`${BTN} mt-6 w-full !py-2.5 !text-[14px]`}>{p.cta}</Link>
              {p.note && <p className="mt-2 text-center text-[11px] text-[#94A3B8]">{p.note}</p>}
            </Reveal>
          ))}
        </div>
        <div className="mt-8 text-center text-[13px] text-[#475569]">
          ✓ 7-day free trial on all plans · ✓ No credit card to start · ✓ Cancel anytime<br />
          <span className="text-[#94A3B8]">1 credit = 1 action · Buy extra from €5/500 credits</span>
        </div>
      </div>
    </section>
  );
}

const FAQS: [string, string][] = [
  ["Is this really a sales agent or just another prospecting tool?", "LogLead is a true sales agent. It finds prospects, writes personalized messages, sends them, follows up automatically and surfaces only the hot replies. Your only job is closing the conversations it brings you."],
  ["Will the messages sound robotic or AI-generated?", "No. Your agent writes messages based on each prospect's specific signals — their Google rating, recent job postings, social activity, funding news. Every message references something real about that prospect. No one can tell it's AI."],
  ["What sources does the agent search?", "LinkedIn (profiles and job postings), Google Maps (local businesses), Reddit, Instagram, TikTok, Facebook and X simultaneously. You can select which sources to activate for each campaign."],
  ["Does the agent actually send messages automatically?", "On the Growth and Pro plans, yes. The agent sends via email and LinkedIn DM automatically. On Starter, it generates the messages and you send them manually. Full automation requires a connected LinkedIn account and email."],
  ["What are credits?", "Credits are consumed by each AI action — finding a prospect (5 cr), sending a message (10 cr), enriching an email (20 cr). Your plan includes monthly credits. Buy more from €5/500 credits."],
  ["Can I cancel anytime?", "Yes. Cancel in one click from Settings → Subscription. No commitment, no penalties. Your data is kept for 30 days after cancellation."],
];

function Faq() {
  return (
    <section className="px-5 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-center text-[32px] font-bold tracking-[-0.02em] text-[#0F172A] sm:text-[40px]">Questions about your agent.</h2>
        <div className="mt-8 divide-y divide-[#E2E8F0] rounded-2xl border border-[#E2E8F0]">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
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

function FinalCta() {
  return (
    <section className="px-5 py-28 sm:px-6" style={{ background: "linear-gradient(180deg, #0051FF08, #FFFFFF)" }}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-[#0F172A] sm:text-[56px]">Your AI Sales Agent<br /><span className="v5-gradient-text">starts tonight.</span></h2>
        <p className="mx-auto mt-5 max-w-lg text-[17px] text-[#475569]">While you sleep, your agent prospects, messages and follows up. You wake up to hot conversations ready to close.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={SIGNUP} className={BTN}>→ Hire your agent — Free for 7 days</Link>
          <a href="#" className={BTN_SEC}>Book a demo</a>
        </div>
        <p className="mt-4 text-[12px] text-[#94A3B8]">No credit card · Ready in 60 seconds · Cancel anytime</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">{["#0051FF", "#00A3FF", "#0051FF", "#0085FF", "#1A6BFF"].map((c, i) => <span key={i} className="h-7 w-7 rounded-full border-2 border-[#FFFFFF]" style={{ background: c }} />)}</div>
          <span className="text-[13px] text-[#475569]">500+ B2B sales teams</span>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    { t: "Product", links: [["LogAgent", "/logagent"], ["Leads Pipeline", "/leads"], ["Pricing", "#pricing"], ["Changelog", "#"]] },
    { t: "Company", links: [["About", "#"], ["Blog", "#"], ["Affiliate", "/affiliate"], ["Contact", "mailto:loglead@gmail.com"]] },
    { t: "Resources", links: [["Help Center", "#"], ["Documentation", "#"], ["Privacy", "/privacy"], ["Terms", "/terms"]] },
  ];
  return (
    <footer className="border-t border-[#E2E8F0] px-5 py-14 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-[16px] font-bold text-[#0F172A]"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[12px] text-white">L</span> LogLead</div>
          <p className="mt-3 text-[13px] text-[#94A3B8]">Your AI Sales Agent for B2B.</p>
        </div>
        {cols.map((c) => (
          <div key={c.t}>
            <p className="text-[13px] font-bold text-[#0F172A]">{c.t}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([l, h]) => <li key={l}><Link href={h} className="text-[13px] text-[#475569] transition hover:text-[#0F172A]">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-[#E2E8F0] pt-6 text-[12px] text-[#94A3B8] sm:flex-row">
        <p>© 2026 LogLead · Your AI Sales Agent for B2B</p>
        <p>Not affiliated with LinkedIn Corporation. · SIRET 104 040 456 00014</p>
      </div>
    </footer>
  );
}

export default function LandingV5() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] font-sans antialiased">
      <Nav />
      <Hero />
      <HowItWorks />
      <Sources />
      <BeforeAfter />
      <Testimonials />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />
    </div>
  );
}
