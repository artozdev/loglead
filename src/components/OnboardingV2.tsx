"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Prospecting onboarding — 5 quick steps to a first search in under 3 minutes.
// Light, modern, self-contained. Saves the profile + creates a first (pending)
// search, then hands off to the mandatory plan screen.

type Data = { profileType?: string; offer: string; target: string; sources: string[]; query: string };

const PROFILES: { id: string; emoji: string; title: string; sub: string }[] = [
  { id: "agency", emoji: "🏢", title: "Agency / Web studio", sub: "I find clients for my agency" },
  { id: "sales", emoji: "💼", title: "Sales / SDR", sub: "I need to fill my pipeline" },
  { id: "freelance", emoji: "👤", title: "Freelancer / Consultant", sub: "I find clients for my services" },
  { id: "founder", emoji: "🚀", title: "Founder / Startup", sub: "I grow my company" },
  { id: "local", emoji: "📍", title: "Local business", sub: "I find local clients" },
  { id: "other", emoji: "✦", title: "Other", sub: "Something else" },
];

const OFFER_PLACEHOLDER: Record<string, string> = {
  agency: "Web design and development for local businesses",
  sales: "B2B SaaS for HR teams",
  freelance: "SEO consulting for e-commerce brands",
  founder: "An AI tool that automates customer support",
  local: "A restaurant / local service in my city",
  other: "What you sell, in one sentence",
};

const TARGET_SUGGESTIONS: Record<string, string[]> = {
  agency: ["Local businesses without website", "Restaurants with low Google rating"],
  sales: ["Companies hiring a sales rep", "B2B SaaS 20-200 employees"],
  freelance: ["E-commerce brands with weak SEO", "Startups with no content strategy"],
  founder: ["Clients of my competitors", "Startups in my sector"],
  local: ["People near my business", "Businesses in my neighborhood"],
  other: ["Companies that match my offer", "Businesses with a clear pain point"],
};

const SOURCES: { id: string; label: string; emoji: string; soon?: boolean }[] = [
  { id: "linkedin", label: "LinkedIn", emoji: "🔵" },
  { id: "google_maps", label: "Google Maps", emoji: "🟢" },
  { id: "reddit", label: "Reddit", emoji: "🟠" },
  { id: "instagram", label: "Instagram", emoji: "📸", soon: true },
  { id: "tiktok", label: "TikTok", emoji: "🎵", soon: true },
];

// Compact modern buttons.
const BTN = "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_8px_20px_-8px_rgba(0,81,255,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-8px_rgba(0,81,255,0.7)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

export default function OnboardingV2({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Data>({ offer: "", target: "", sources: ["linkedin", "google_maps"], query: "" });
  const [genLoading, setGenLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const generatedFor = useRef<string>("");

  const set = (patch: Partial<Data>) => setData((d) => ({ ...d, ...patch }));

  useEffect(() => {
    if (step !== 5) return;
    const key = `${data.offer}|${data.target}|${data.profileType}`;
    if (generatedFor.current === key && data.query) return;
    generatedFor.current = key;
    setGenLoading(true);
    fetch("/api/onboarding/first-query", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offer: data.offer, target: data.target, profileType: data.profileType }),
    })
      .then((r) => r.json())
      .then((d) => set({ query: d.query || data.target || data.offer }))
      .catch(() => set({ query: data.target || data.offer }))
      .finally(() => setGenLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function launch() {
    setErr(null);
    setLaunching(true);
    try {
      const res = await fetch("/api/onboarding/finish", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileType: data.profileType, offer: data.offer, target: data.target, sources: data.sources, query: data.query }),
      });
      const d = await res.json();
      if (!res.ok) { setErr(d.error ?? "Une erreur est survenue."); setLaunching(false); return; }
      router.push("/onboarding/plan");
    } catch {
      setErr("Connexion impossible. Réessaie."); setLaunching(false);
    }
  }

  const progress = step === 0 ? 6 : (step / 5) * 100;

  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#F8FAFC] px-5 py-10 font-sans">
      {/* Soft decorative glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-60 blur-[120px]" style={{ background: "radial-gradient(ellipse at center, #DCE8FF, transparent 70%)" }} />
      </div>

      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-10 h-[3px] w-full bg-[#E9EEF5]">
        <div className="h-full bg-gradient-to-r from-[#0051FF] to-[#0085FF] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Logo */}
      <div className="relative mt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/loglead-logo.svg" alt="LogLead" className="h-7 w-auto" />
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-[520px] rounded-[20px] border border-[#E7EBF1] bg-white p-7 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.22)] sm:p-9">
          {step > 0 && (
            <div className="mb-5 flex items-center justify-between">
              <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 text-[13px] font-medium text-[#64748B] transition hover:text-[#0F172A]">← Back</button>
              <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-semibold text-[#64748B]">{step}/5</span>
            </div>
          )}

          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[22px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(0,81,255,0.6)]">L</div>
              <h1 className="mt-5 text-[23px] font-bold tracking-[-0.01em] text-[#0F172A]">Welcome to LogLead, {firstName}. 👋</h1>
              <p className="mx-auto mt-3 max-w-md text-[14.5px] leading-relaxed text-[#64748B]">Your AI Sales Agent is almost ready. We just need 4 quick answers to find your first prospects. Takes less than 2 minutes.</p>
              <div className="mt-7"><button onClick={() => setStep(1)} className={BTN}>Let&apos;s go →</button></div>
            </div>
          )}

          {/* STEP 1 — Profile */}
          {step === 1 && (
            <div>
              <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[#0F172A]">What best describes you?</h2>
              <div className="mt-5 space-y-2">
                {PROFILES.map((p) => {
                  const active = data.profileType === p.id;
                  return (
                    <button key={p.id} onClick={() => { set({ profileType: p.id }); setStep(2); }}
                      className={`group flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${active ? "border-[#0051FF] bg-[#EFF4FF]" : "border-[#E7EBF1] bg-white hover:border-[#0051FF60] hover:bg-[#F8FAFC]"}`}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF4FF] text-[17px]">{p.emoji}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14px] font-semibold text-[#0F172A]">{p.title}</span>
                        {p.sub && <span className="block text-[12px] text-[#64748B]">{p.sub}</span>}
                      </span>
                      <span className="text-[#CBD5E1] transition group-hover:text-[#0051FF]">→</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Offer */}
          {step === 2 && (
            <div>
              <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[#0F172A]">What do you sell?</h2>
              <textarea
                autoFocus rows={2} maxLength={150} value={data.offer}
                onChange={(e) => set({ offer: e.target.value })}
                placeholder={OFFER_PLACEHOLDER[data.profileType ?? "other"]}
                className="mt-5 w-full resize-none rounded-xl border border-[#E7EBF1] bg-[#F8FAFC] px-4 py-3 text-[15px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0051FF] focus:bg-white"
              />
              <div className="mt-1 text-right text-[11px] text-[#94A3B8]">{data.offer.length}/150</div>
              <div className="mt-5 flex justify-end"><button onClick={() => setStep(3)} disabled={!data.offer.trim()} className={BTN}>Continue →</button></div>
            </div>
          )}

          {/* STEP 3 — Target */}
          {step === 3 && (
            <div>
              <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[#0F172A]">Who is your ideal client?</h2>
              <textarea
                autoFocus rows={2} value={data.target}
                onChange={(e) => set({ target: e.target.value })}
                placeholder="Describe your ideal client…"
                className="mt-5 w-full resize-none rounded-xl border border-[#E7EBF1] bg-[#F8FAFC] px-4 py-3 text-[15px] text-[#0F172A] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0051FF] focus:bg-white"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {(TARGET_SUGGESTIONS[data.profileType ?? "other"] ?? []).map((s) => (
                  <button key={s} onClick={() => set({ target: s })} className="rounded-full border border-[#E7EBF1] bg-white px-3 py-1.5 text-[12px] font-medium text-[#64748B] transition hover:border-[#0051FF60] hover:text-[#0F172A]">{s}</button>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between gap-3">
                <button onClick={() => { set({ target: "" }); setStep(4); }} className="text-[13px] font-medium text-[#94A3B8] transition hover:text-[#64748B]">I&apos;ll define this later</button>
                <button onClick={() => setStep(4)} className={BTN}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Sources */}
          {step === 4 && (
            <div>
              <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[#0F172A]">Where should your agent search?</h2>
              <div className="mt-5 space-y-2">
                {SOURCES.map((s) => {
                  const on = data.sources.includes(s.id);
                  return (
                    <button key={s.id} disabled={s.soon}
                      onClick={() => set({ sources: on ? data.sources.filter((x) => x !== s.id) : [...data.sources, s.id] })}
                      className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${on ? "border-[#0051FF] bg-[#EFF4FF]" : "border-[#E7EBF1] bg-white hover:border-[#0051FF40]"}`}>
                      <span className="flex items-center gap-2.5 text-[14px] font-medium text-[#0F172A]">
                        <span className="text-[15px]">{s.emoji}</span>{s.label}
                        {s.soon && <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[10px] font-semibold text-[#94A3B8]">Coming soon</span>}
                      </span>
                      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${on ? "bg-[#0051FF]" : "bg-[#E2E8F0]"}`}><span className={`h-4 w-4 rounded-full bg-white shadow-sm transition ${on ? "translate-x-4" : ""}`} /></span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[12px] text-[#94A3B8]">You can change this anytime in settings.</p>
              <div className="mt-5 flex justify-end"><button onClick={() => setStep(5)} disabled={data.sources.length === 0} className={BTN}>Continue →</button></div>
            </div>
          )}

          {/* STEP 5 — First search */}
          {step === 5 && (
            <div>
              <h2 className="text-[19px] font-bold tracking-[-0.01em] text-[#0F172A]">Your agent is ready. 🤖</h2>
              <p className="mt-2 text-[14px] text-[#64748B]">Based on your answers, here&apos;s your first search:</p>
              <div className="mt-5 rounded-xl border border-[#E7EBF1] bg-[#F8FAFC] p-4">
                {genLoading ? (
                  <div className="flex items-center gap-2 text-[14px] text-[#64748B]"><span className="h-2 w-2 animate-ping rounded-full bg-[#0051FF]" /> Generating your first search…</div>
                ) : (
                  <textarea rows={2} value={data.query} onChange={(e) => set({ query: e.target.value })} maxLength={150}
                    className="w-full resize-none bg-transparent text-[15px] font-medium leading-relaxed text-[#0F172A] outline-none" />
                )}
              </div>
              {err && <p className="mt-3 text-[13px] text-[#EF4444]">{err}</p>}
              <div className="mt-6 flex justify-center"><button onClick={launch} disabled={launching || genLoading || !data.query.trim()} className={`${BTN} !px-6`}>{launching ? "Launching…" : "Launch my first search →"}</button></div>
              <p className="mt-3 text-center text-[12px] text-[#94A3B8]">You can edit the search above before launching.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
