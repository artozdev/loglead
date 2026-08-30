"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Prospecting onboarding — 5 quick steps to a first search in under 3 minutes.
// Dark, self-contained. Saves to the profile + creates a first (pending) search,
// then hands off to the mandatory plan screen.

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

const SOURCES: { id: string; label: string; soon?: boolean }[] = [
  { id: "linkedin", label: "LinkedIn" },
  { id: "google_maps", label: "Google Maps" },
  { id: "reddit", label: "Reddit" },
  { id: "instagram", label: "Instagram", soon: true },
  { id: "tiktok", label: "TikTok", soon: true },
];

const BG = "#050A14", CARD = "#0D1526", BORDER = "#1E2D4A", ACTIVE = "#162035";
const BTN = "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#0051FF] to-[#0085FF] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_0_24px_#0051FF50] transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_#0051FF80] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

export default function OnboardingV2({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = welcome
  const [data, setData] = useState<Data>({ offer: "", target: "", sources: ["linkedin", "google_maps"], query: "" });
  const [genLoading, setGenLoading] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const generatedFor = useRef<string>("");

  const set = (patch: Partial<Data>) => setData((d) => ({ ...d, ...patch }));

  // When arriving on step 5, generate the first search query (once per input set).
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
      // Plan selection is mandatory before results.
      router.push("/onboarding/plan");
    } catch {
      setErr("Connexion impossible. Réessaie."); setLaunching(false);
    }
  }

  const progress = step === 0 ? 0 : (step / 5) * 100;

  return (
    <div className="flex min-h-screen flex-col items-center px-5 py-10 font-sans" style={{ background: BG }}>
      {/* Progress bar */}
      <div className="fixed inset-x-0 top-0 z-10 h-[3px] w-full" style={{ background: "#0B1220" }}>
        <div className="h-full bg-gradient-to-r from-[#0051FF] to-[#0085FF] transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Logo */}
      <div className="mt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/loglead-logo-dark.svg" alt="LogLead" className="h-7 w-auto" />
      </div>

      <div className="flex w-full flex-1 items-center justify-center">
        <div className="w-full max-w-[560px] rounded-2xl border p-7 sm:p-9" style={{ background: CARD, borderColor: BORDER }}>
          {step > 0 && (
            <div className="mb-5 flex items-center justify-between">
              <button onClick={() => setStep((s) => s - 1)} className="text-[13px] text-[#8B9EC4] transition hover:text-white">← Back</button>
              <span className="text-[12px] font-medium text-[#6A7690]">{step}/5</span>
            </div>
          )}

          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0051FF] to-[#0085FF] text-[22px] font-bold text-white">L</div>
              <h1 className="mt-5 text-[24px] font-bold text-white">Welcome to LogLead, {firstName}. 👋</h1>
              <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-[#8B9EC4]">Your AI Sales Agent is almost ready. We just need 4 quick answers to find your first prospects. Takes less than 2 minutes.</p>
              <div className="mt-7"><button onClick={() => setStep(1)} className={BTN}>Let&apos;s go →</button></div>
            </div>
          )}

          {/* STEP 1 — Profile */}
          {step === 1 && (
            <div>
              <h2 className="text-[20px] font-bold text-white">What best describes you?</h2>
              <div className="mt-5 space-y-2.5">
                {PROFILES.map((p) => {
                  const active = data.profileType === p.id;
                  return (
                    <button key={p.id} onClick={() => { set({ profileType: p.id }); setStep(2); }}
                      className="flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition"
                      style={{ borderColor: active ? "#0051FF" : BORDER, background: active ? ACTIVE : "transparent" }}>
                      <span className="text-[20px]">{p.emoji}</span>
                      <span className="min-w-0">
                        <span className="block text-[14px] font-semibold text-white">{p.title}</span>
                        {p.sub && <span className="block text-[12px] text-[#8B9EC4]">{p.sub}</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2 — Offer */}
          {step === 2 && (
            <div>
              <h2 className="text-[20px] font-bold text-white">What do you sell?</h2>
              <textarea
                autoFocus rows={2} maxLength={150} value={data.offer}
                onChange={(e) => set({ offer: e.target.value })}
                placeholder={OFFER_PLACEHOLDER[data.profileType ?? "other"]}
                className="mt-5 w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-[15px] text-white outline-none placeholder:text-[#6A7690] focus:border-[#0051FF]"
                style={{ borderColor: BORDER }}
              />
              <div className="mt-1 text-right text-[11px] text-[#6A7690]">{data.offer.length}/150</div>
              <div className="mt-5"><button onClick={() => setStep(3)} disabled={!data.offer.trim()} className={BTN}>Continue →</button></div>
            </div>
          )}

          {/* STEP 3 — Target */}
          {step === 3 && (
            <div>
              <h2 className="text-[20px] font-bold text-white">Who is your ideal client?</h2>
              <textarea
                autoFocus rows={2} value={data.target}
                onChange={(e) => set({ target: e.target.value })}
                placeholder="Describe your ideal client…"
                className="mt-5 w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-[15px] text-white outline-none placeholder:text-[#6A7690] focus:border-[#0051FF]"
                style={{ borderColor: BORDER }}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {(TARGET_SUGGESTIONS[data.profileType ?? "other"] ?? []).map((s) => (
                  <button key={s} onClick={() => set({ target: s })} className="rounded-full border px-3 py-1.5 text-[12px] text-[#8B9EC4] transition hover:border-[#0051FF] hover:text-white" style={{ borderColor: BORDER }}>{s}</button>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={() => { set({ target: "" }); setStep(4); }} className="text-[13px] text-[#6A7690] transition hover:text-[#8B9EC4]">I&apos;ll define this later</button>
                <button onClick={() => setStep(4)} className={`${BTN} ml-auto !w-auto !px-6`}>Continue →</button>
              </div>
            </div>
          )}

          {/* STEP 4 — Sources */}
          {step === 4 && (
            <div>
              <h2 className="text-[20px] font-bold text-white">Where should your agent search?</h2>
              <div className="mt-5 space-y-2.5">
                {SOURCES.map((s) => {
                  const on = data.sources.includes(s.id);
                  return (
                    <button key={s.id} disabled={s.soon}
                      onClick={() => set({ sources: on ? data.sources.filter((x) => x !== s.id) : [...data.sources, s.id] })}
                      className="flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderColor: on ? "#0051FF" : BORDER, background: on ? ACTIVE : "transparent" }}>
                      <span className="flex items-center gap-2 text-[14px] font-medium text-white">{s.label}{s.soon && <span className="rounded-full bg-[#1E2D4A] px-2 py-0.5 text-[10px] font-semibold text-[#8B9EC4]">Coming soon</span>}</span>
                      <span className={`flex h-5 w-9 items-center rounded-full p-0.5 transition ${on ? "bg-[#0051FF]" : "bg-[#1E2D4A]"}`}><span className={`h-4 w-4 rounded-full bg-white transition ${on ? "translate-x-4" : ""}`} /></span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-[12px] text-[#6A7690]">You can change this anytime in settings.</p>
              <div className="mt-5"><button onClick={() => setStep(5)} disabled={data.sources.length === 0} className={BTN}>Continue →</button></div>
            </div>
          )}

          {/* STEP 5 — First search */}
          {step === 5 && (
            <div>
              <h2 className="text-[20px] font-bold text-white">Your agent is ready. 🤖</h2>
              <p className="mt-2 text-[14px] text-[#8B9EC4]">Based on your answers, here&apos;s your first search:</p>
              <div className="mt-5 rounded-xl border p-4" style={{ background: ACTIVE, borderColor: BORDER }}>
                {genLoading ? (
                  <div className="flex items-center gap-2 text-[14px] text-[#8B9EC4]"><span className="h-2 w-2 animate-ping rounded-full bg-[#0051FF]" /> Generating your first search…</div>
                ) : (
                  <textarea rows={2} value={data.query} onChange={(e) => set({ query: e.target.value })} maxLength={150}
                    className="w-full resize-none bg-transparent text-[15px] font-medium leading-relaxed text-white outline-none" />
                )}
              </div>
              {err && <p className="mt-3 text-[13px] text-[#F87171]">{err}</p>}
              <div className="mt-6"><button onClick={launch} disabled={launching || genLoading || !data.query.trim()} className={BTN}>{launching ? "Launching…" : "Launch my first search →"}</button></div>
              <p className="mt-3 text-center text-[12px] text-[#6A7690]">You can edit the search above before launching.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
