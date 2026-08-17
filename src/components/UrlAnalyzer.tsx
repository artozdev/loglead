"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Hero "aha moment": paste a LinkedIn profile to analyze it. Analysis needs an
// account, so we play a short scanning loader then send the visitor to signup,
// carrying the URL (?analyze=) so the app can start the analysis right after.
const STEPS = ["Analyzing your profile…", "Scanning your market…", "Detecting opportunities…"];

export default function UrlAnalyzer() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setStep(0);
    timers.current.push(setTimeout(() => setStep(1), 700));
    timers.current.push(setTimeout(() => setStep(2), 1400));
    timers.current.push(
      setTimeout(() => {
        const v = url.trim();
        router.push(`/signup${v ? `?analyze=${encodeURIComponent(v)}` : ""}`);
      }, 2100),
    );
  }

  return (
    <div className="mx-auto w-full max-w-xl">
      {/* White floating pill — input + dark action button, like the hero mockup */}
      <div className="rounded-full bg-white p-1.5 pl-4 shadow-[0_24px_60px_-20px_rgba(0,20,80,0.55)]">
        {loading ? (
          <div className="flex items-center gap-3 py-2 pr-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#EEF2F7]">
              <div className="ua-progress h-full rounded-full" style={{ background: "linear-gradient(135deg,#0051FF,#00D4FF)" }} />
            </div>
            <span className="shrink-0 text-[13px] font-medium text-[#64748B]">{STEPS[step]}</span>
          </div>
        ) : (
          <form onSubmit={analyze} className="flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#94A3B8]" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="min-w-0 flex-1 bg-transparent py-2 text-[14px] text-[#0F172A] outline-none placeholder:text-[#94A3B8]"
            />
            <button type="submit" className="shrink-0 rounded-full bg-[#0A0A0A] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#1A1A1A]">
              <span className="lp-roll"><span>Analyze</span><span aria-hidden>Analyze</span></span>
            </button>
          </form>
        )}
      </div>
      <p className="mt-3 text-center text-[13px] font-medium text-[#475569]">
        See your growth score, your competitors and your first opportunities.
      </p>
    </div>
  );
}
