"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Reveal } from "./LandingPage";

// ---------------------------------------------------------------------------
// Landing v5 — "Your AI Sales Agent for B2B". Dark, self-contained (its own
// nav + footer), English. Uses CSS/IO animations (Reveal/CountUp), no Framer.
// ---------------------------------------------------------------------------

const SIGNUP = "/signup";
const BTN = "inline-flex items-center justify-center gap-2 rounded-[10px] bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_0_20px_#0051FF40] transition hover:-translate-y-0.5 hover:shadow-[0_0_36px_#0051FF70]";
const BTN_SEC = "inline-flex items-center justify-center gap-2 rounded-[10px] border border-[#1E2D4A] px-7 py-3.5 text-[15px] text-[#8B9EC4] transition hover:border-[#0051FF60] hover:text-[#F0F4FF]";
const EY = "inline-flex items-center gap-2 rounded-full border border-[#1E2D4A] bg-[#0D1526] px-3 py-1 text-[12px] font-medium text-[#8B9EC4]";

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 60);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "border-b border-[#1E2D4A] bg-[#050A14CC] backdrop-blur-xl" : "border-b border-transparent"}`}>
      <nav className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-[17px] font-bold text-[#F0F4FF]">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[14px] font-bold text-white">L</span>
          LogLead
        </Link>
        <div className="hidden items-center gap-7 text-[14px] text-[#8B9EC4] lg:flex">
          <a href="#how" className="transition hover:text-[#F0F4FF]">How it works</a>
          <a href="#features" className="transition hover:text-[#F0F4FF]">Features</a>
          <a href="#pricing" className="transition hover:text-[#F0F4FF]">Pricing</a>
          <Link href="/affiliate" className="transition hover:text-[#F0F4FF]">Affiliate</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-[14px] text-[#8B9EC4] transition hover:text-[#F0F4FF] sm:block">Log in</Link>
          <Link href={SIGNUP} className={`${BTN} !px-5 !py-2.5 !text-[14px]`}>Hire your agent →</Link>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pb-24 pt-16 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[560px]" style={{ background: "radial-gradient(ellipse 900px 500px at 50% -5%, #0051FF12, transparent)" }} />
      <div className="relative mx-auto max-w-4xl text-center">
        <Reveal>
          <span className="v5-badge inline-flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium text-[#8B9EC4]">
            <span className="text-[#00D4FF]">✦</span> AI Sales Agent · LinkedIn · Google Maps · Email · WhatsApp
          </span>
        </Reveal>
        <Reveal delay={80}>
          <h1 className="mx-auto mt-7 max-w-3xl text-[40px] font-bold leading-[1.03] tracking-[-0.03em] text-[#F0F4FF] sm:text-[64px] lg:text-[72px]">
            Your AI Sales Agent<br />for <span className="v5-gradient-text">B2B.</span>
          </h1>
        </Reveal>
        <Reveal delay={160}>
          <Link href={SIGNUP} className={`v5-pulse ${BTN} mx-auto mt-8`}>→ Hire your agent — Free for 7 days</Link>
        </Reveal>
        <Reveal delay={240}>
          <p className="mx-auto mt-6 max-w-[540px] text-[17px] leading-[1.7] text-[#8B9EC4]">
            LogLead finds your ideal prospects across LinkedIn, Google Maps and the web — then messages them, follows up automatically and sends you only the conversations worth your time.
          </p>
        </Reveal>
        <Reveal delay={320}>
          <div className="mt-7 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["#0051FF", "#00A3FF", "#4F8BFF", "#00D4FF", "#1A6BFF"].map((c, i) => <span key={i} className="h-7 w-7 rounded-full border-2 border-[#050A14]" style={{ background: c }} />)}
              </div>
              <span className="text-[13px] text-[#8B9EC4]">Trusted by 500+ B2B sales teams</span>
            </div>
            <p className="text-[13px] text-[#8B9EC4]"><span className="text-[#F59E0B]">★★★★★</span> &ldquo;Like having a full-time SDR for €59/month&rdquo;</p>
          </div>
        </Reveal>

        {/* Hero dashboard */}
        <Reveal delay={200} className="relative mt-16">
          <HeroDashboard />
        </Reveal>
      </div>
    </section>
  );
}

function HeroDashboard() {
  const convos = [
    { name: "Thomas Robert", role: "CEO · OrbitSoft", score: 94, hot: true, msg: "Oui c'est intéressant, tu as du temps cette semaine ?", cta: "Reply now →" },
    { name: "Camille Vernet", role: "CMO · Nexio", score: 88, hot: false, msg: "Pourrais-tu m'envoyer plus d'infos ?", cta: "Reply now →" },
    { name: "Marc Lambert", role: "Founder · Hrflow", score: 82, hot: false, msg: "On peut se faire un call vendredi ?", cta: "Book meeting →" },
  ];
  return (
    <div className="relative mx-auto max-w-3xl">
      {/* floating cards */}
      <div className="v5-float absolute -left-4 top-16 z-10 hidden rounded-xl border border-[#1E2D4A] bg-[#162035] px-3.5 py-2.5 text-left text-[12px] text-[#8B9EC4] shadow-[0_10px_30px_#00000060] lg:block">
        <span className="text-[#F0F4FF]">47 prospects found</span><br />LinkedIn + Google Maps
      </div>
      <div className="v5-float absolute -right-4 top-40 z-10 hidden rounded-xl border border-[#1E2D4A] bg-[#162035] px-3.5 py-2.5 text-left text-[12px] text-[#F0F4FF] shadow-[0_10px_30px_#00000060] lg:block" style={{ animationDelay: "1.5s" }}>
        3 replies this morning 🔥
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#1E2D4A] bg-[#0D1526] text-left shadow-[0_40px_80px_#0051FF20]">
        <div className="flex items-center justify-between border-b border-[#1E2D4A] px-5 py-3">
          <span className="flex items-center gap-2 text-[14px] font-semibold text-[#F0F4FF]">🤖 LogLead Agent</span>
          <span className="text-[12px] text-[#4A5980]">Last 8 hours</span>
        </div>
        <div className="px-5 py-5">
          <p className="text-[13px] text-[#8B9EC4]">While you were sleeping, your agent:</p>
          <ul className="mt-3 space-y-2 text-[14px] text-[#F0F4FF]">
            <li>✅ Found <b>47 new prospects</b> matching your ICP</li>
            <li>✅ Sent <b>23 personalized first messages</b></li>
            <li>✅ Sent <b>8 follow-ups</b> to prospects who didn&apos;t reply</li>
            <li>🔥 Got <b>3 positive replies</b> — ready for you</li>
          </ul>
        </div>
        <div className="border-t border-[#1E2D4A] px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A5980]">Hot conversations — Action needed</p>
          <div className="mt-3 space-y-3">
            {convos.map((c) => (
              <div key={c.name} className="flex items-start gap-3 rounded-xl border border-[#1E2D4A] bg-[#162035] p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0051FF]/20 text-[13px] font-bold text-[#4F8BFF]">{c.name.charAt(0)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-[#F0F4FF]">{c.name}</span>
                    <span className="text-[11px] text-[#4A5980]">{c.role}</span>
                    <span className="ml-auto flex items-center gap-1 text-[12px] font-semibold text-[#22C55E]">● {c.score}{c.hot ? " 🔥" : ""}</span>
                  </div>
                  <p className="mt-1 text-[13px] italic text-[#8B9EC4]">&ldquo;{c.msg}&rdquo;</p>
                  <button className="mt-1.5 text-[12px] font-medium text-[#4F8BFF]">{c.cta}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
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
    <section id="how" className="bg-[#0D1526] px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#00D4FF]">✦</span> How your agent works</span>
          <h2 className="mt-5 text-[36px] font-bold leading-[1.05] tracking-[-0.02em] text-[#F0F4FF] sm:text-[48px]">Set it up once.<br /><span className="v5-gradient-text">Let it run forever.</span></h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-[#8B9EC4]">Your AI Sales Agent works around the clock. You review and close.</p>
        </div>
        <div className="relative mt-14 pl-8">
          <div aria-hidden className="absolute bottom-2 left-[7px] top-2 w-px bg-[#0051FF30]" />
          {STEPS.map((s) => (
            <Reveal key={s.n} className="relative mb-10 last:mb-0">
              <span className="absolute -left-8 top-1 h-3.5 w-3.5 rounded-full border-2 border-[#050A14] bg-[#0051FF]" />
              <div className="text-[13px] font-bold text-[#0051FF]">{s.n}</div>
              <h3 className="mt-1 text-[19px] font-semibold text-[#F0F4FF]">{s.h}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-[#8B9EC4]">{s.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const CAPS = [
  { icon: "🔍", t: "Prospect Discovery", d: "Searches 6+ sources simultaneously. LinkedIn, Google Maps, Reddit, Instagram and more." },
  { icon: "🧠", t: "AI Qualification", d: "Every prospect scored 0-100 with AI. Knows why each one is relevant to your specific offer." },
  { icon: "💎", t: "Data Enrichment", d: "Email, phone and company data found automatically for every qualified prospect." },
  { icon: "✉️", t: "Personalized Outreach", d: "Writes messages based on each prospect's signals, recent activity and your offer. Never robotic." },
  { icon: "🔄", t: "Automatic Follow-ups", d: "Your agent follows up on your behalf. Sequences configured once, run automatically forever." },
  { icon: "🔥", t: "Hot Reply Detection", d: "Reads every reply and surfaces only the hot ones. You never miss a real opportunity." },
];

function Capabilities() {
  return (
    <section id="features" className="px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#00D4FF]">✦</span> Your agent&apos;s capabilities</span>
          <h2 className="mt-5 text-[36px] font-bold tracking-[-0.02em] text-[#F0F4FF] sm:text-[48px]">More than prospecting.<br />A full sales workflow.</h2>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {CAPS.map((c) => (
            <Reveal key={c.t} className="group rounded-2xl border border-[#1E2D4A] bg-[#162035] p-6 transition hover:border-[#0051FF60] hover:shadow-[0_0_40px_#0051FF12]">
              <div className="text-[28px]">{c.icon}</div>
              <h3 className="mt-3 text-[17px] font-semibold text-[#F0F4FF]">{c.t}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-[#8B9EC4]">{c.d}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
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
          <span className={EY}><span className="text-[#00D4FF]">✦</span> Where your agent searches</span>
          <h2 className="mt-5 text-[32px] font-bold tracking-[-0.02em] text-[#F0F4FF] sm:text-[40px]">Your agent searches<br />everywhere they are.</h2>
        </div>
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {SOURCES.map((s) => (
            <Reveal key={s.n} className={`relative rounded-xl border border-[#1E2D4A] bg-[#0D1526] p-4 ${s.soon ? "opacity-50" : ""}`}>
              {s.soon && <span className="absolute right-2 top-2 rounded-full bg-[#0051FF]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#4F8BFF]">Coming soon</span>}
              <div className="text-[20px]">{s.i}</div>
              <div className="mt-1.5 text-[14px] font-medium text-[#F0F4FF]">{s.n}</div>
              <div className="text-[12px] text-[#4A5980]">{s.d}</div>
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
    <section className="bg-[#0D1526] px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <h2 className="text-[36px] font-bold tracking-[-0.02em] text-[#F0F4FF] sm:text-[48px]">Replace your SDR.<br />Or supercharge them.</h2>
          <p className="mx-auto mt-4 max-w-lg text-[16px] text-[#8B9EC4]">What your sales process looks like before and after LogLead.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border-l-[3px] border-[#EF4444] bg-[#EF4444]/[0.04] p-6">
            {before.map((b) => <p key={b} className="flex items-start gap-2 py-1.5 text-[14px] text-[#8B9EC4]"><span className="text-[#EF4444]">✕</span> {b}</p>)}
          </div>
          <div className="rounded-2xl border-l-[3px] border-[#22C55E] bg-[#22C55E]/[0.04] p-6">
            {after.map((a) => <Reveal key={a} className="flex items-start gap-2 py-1.5 text-[14px] text-[#F0F4FF]"><span className="text-[#22C55E]">✓</span> {a}</Reveal>)}
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
          <span className={EY}><span className="text-[#00D4FF]">✦</span> What sales teams say</span>
          <h2 className="mt-5 text-[36px] font-bold tracking-[-0.02em] text-[#F0F4FF] sm:text-[48px]">They let the agent work.<br />They just closed.</h2>
        </div>
        <div className="mt-12 grid items-center gap-4 md:grid-cols-3">
          {TESTIS.map((t) => (
            <Reveal key={t.n} className={`rounded-2xl border bg-[#0D1526] p-6 ${t.mid ? "border-[#0051FF40] md:scale-105" : "border-[#1E2D4A]"}`}>
              <p className="text-[#F59E0B]">★★★★★</p>
              <p className="mt-3 text-[14px] leading-relaxed text-[#F0F4FF]">&ldquo;{t.q}&rdquo;</p>
              <p className="mt-4 text-[13px] font-semibold text-[#F0F4FF]">{t.n}</p>
              <p className="text-[12px] text-[#4A5980]">{t.r}</p>
            </Reveal>
          ))}
        </div>
        <div className="mt-12 overflow-hidden">
          <div className="v5-marquee flex w-max gap-8 text-[13px] text-[#4A5980]">
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
    <section id="pricing" className="bg-[#0D1526] px-5 py-24 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className={EY}><span className="text-[#00D4FF]">✦</span> Pricing</span>
          <h2 className="mt-5 text-[36px] font-bold tracking-[-0.02em] text-[#F0F4FF] sm:text-[48px]">One agent.<br />Three levels of autonomy.</h2>
          <p className="mx-auto mt-4 max-w-md text-[16px] text-[#8B9EC4]">Start free. Upgrade when your pipeline grows.</p>
        </div>
        <div className="mt-12 grid gap-4 lg:grid-cols-4">
          {PLANS.map((p) => (
            <Reveal key={p.name} className={`relative flex flex-col rounded-2xl border p-6 ${p.popular ? "border-2 border-[#0051FF] shadow-[0_0_60px_#0051FF20]" : "border-[#1E2D4A] bg-[#0D1526]"}`} style={p.popular ? { background: "linear-gradient(180deg,#0D2060,#0D1526)" } : undefined}>
              {p.popular && <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-3 py-1 text-[11px] font-semibold text-white">Most popular</span>}
              <p className="text-[15px] font-bold text-[#F0F4FF]">{p.name}</p>
              <p className="mt-1 text-[12px] text-[#8B9EC4]">{p.tag}</p>
              <p className="mt-4 text-[30px] font-bold text-[#F0F4FF]">{p.price}<span className="text-[13px] font-normal text-[#4A5980]">{p.per ?? ""}</span></p>
              <ul className="mt-4 flex-1 space-y-2 text-[13px] text-[#8B9EC4]">
                {p.feats.map((f) => <li key={f} className="flex items-start gap-2"><span className="text-[#4F8BFF]">✓</span>{f}</li>)}
              </ul>
              <Link href={SIGNUP} className={`${BTN} mt-6 w-full !py-2.5 !text-[14px]`}>{p.cta}</Link>
              {p.note && <p className="mt-2 text-center text-[11px] text-[#4A5980]">{p.note}</p>}
            </Reveal>
          ))}
        </div>
        <div className="mt-8 text-center text-[13px] text-[#8B9EC4]">
          ✓ 7-day free trial on all plans · ✓ No credit card to start · ✓ Cancel anytime<br />
          <span className="text-[#4A5980]">1 credit = 1 action · Buy extra from €5/500 credits</span>
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
        <h2 className="text-center text-[32px] font-bold tracking-[-0.02em] text-[#F0F4FF] sm:text-[40px]">Questions about your agent.</h2>
        <div className="mt-8 divide-y divide-[#1E2D4A] rounded-2xl border border-[#1E2D4A]">
          {FAQS.map(([q, a]) => (
            <details key={q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-semibold text-[#F0F4FF]">
                {q}<span className="text-[#4F8BFF] transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-[14px] leading-relaxed text-[#8B9EC4]">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="px-5 py-28 sm:px-6" style={{ background: "linear-gradient(180deg, #0051FF08, #050A14)" }}>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-[#F0F4FF] sm:text-[56px]">Your AI Sales Agent<br /><span className="v5-gradient-text">starts tonight.</span></h2>
        <p className="mx-auto mt-5 max-w-lg text-[17px] text-[#8B9EC4]">While you sleep, your agent prospects, messages and follows up. You wake up to hot conversations ready to close.</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href={SIGNUP} className={BTN}>→ Hire your agent — Free for 7 days</Link>
          <a href="#" className={BTN_SEC}>Book a demo</a>
        </div>
        <p className="mt-4 text-[12px] text-[#4A5980]">No credit card · Ready in 60 seconds · Cancel anytime</p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">{["#0051FF", "#00A3FF", "#4F8BFF", "#00D4FF", "#1A6BFF"].map((c, i) => <span key={i} className="h-7 w-7 rounded-full border-2 border-[#050A14]" style={{ background: c }} />)}</div>
          <span className="text-[13px] text-[#8B9EC4]">500+ B2B sales teams</span>
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
    <footer className="border-t border-[#1E2D4A] px-5 py-14 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-[16px] font-bold text-[#F0F4FF]"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[12px] text-white">L</span> LogLead</div>
          <p className="mt-3 text-[13px] text-[#4A5980]">Your AI Sales Agent for B2B.</p>
        </div>
        {cols.map((c) => (
          <div key={c.t}>
            <p className="text-[13px] font-bold text-[#F0F4FF]">{c.t}</p>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([l, h]) => <li key={l}><Link href={h} className="text-[13px] text-[#8B9EC4] transition hover:text-[#F0F4FF]">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="mx-auto mt-10 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-[#1E2D4A] pt-6 text-[12px] text-[#4A5980] sm:flex-row">
        <p>© 2026 LogLead · Your AI Sales Agent for B2B</p>
        <p>Not affiliated with LinkedIn Corporation. · SIRET 104 040 456 00014</p>
      </div>
    </footer>
  );
}

export default function LandingV5() {
  return (
    <div className="min-h-screen bg-[#050A14] font-sans antialiased">
      <Nav />
      <Hero />
      <HowItWorks />
      <Capabilities />
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
