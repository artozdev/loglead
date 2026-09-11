"use client";

import { ArrowRight, Lock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { useLocale } from "./LocaleProvider";
import type { PreviewProspect } from "@/lib/types";

type Phase = "welcome" | "search" | "searching" | "results";
type Results = { query: string; totalFound: number; visible: PreviewProspect[]; lockedCount: number };

const SOURCES = ["Google", "Google Maps", "LinkedIn", "Reddit", "Instagram", "TikTok", "Facebook", "X / Twitter", "Web directories"];

export default function FreeSearchOnboarding({ initial }: { initial?: Results | null }) {
  const router = useRouter();
  const { locale } = useLocale();
  const t = (en: string, fr: string) => (locale === "fr" ? fr : en);

  const [phase, setPhase] = useState<Phase>(initial ? "results" : "welcome");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Results | null>(initial ?? null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const suggestions = [
    t("Restaurants without a website", "Restaurants sans site web"),
    t("Agencies hiring a sales rep", "Agences qui recrutent un commercial"),
    t("Local businesses with bad reviews", "Commerces locaux avec de mauvais avis"),
    t("E-commerce with no social presence", "E-commerce sans présence sociale"),
  ];

  async function runSearch(q: string) {
    const clean = q.trim();
    if (clean.length < 3) return;
    setPhase("searching");
    const started = Date.now();
    let data: Results | null = null;
    try {
      const res = await fetch("/api/onboarding/free-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: clean }),
      });
      if (res.ok) data = await res.json();
    } catch {
      /* handled below */
    }
    const wait = Math.max(0, 4200 - (Date.now() - started));
    setTimeout(() => {
      if (data) {
        setResults(data);
        setPhase("results");
      } else {
        setPhase("search");
      }
    }, wait);
  }

  return (
    <div className="min-h-screen w-full bg-[#050A14] px-4 py-10 text-[#F0F4FF]">
      {phase === "welcome" && <Welcome t={t} onStart={() => setPhase("search")} />}
      {phase === "search" && (
        <SearchStep
          t={t}
          query={query}
          setQuery={setQuery}
          taRef={taRef}
          suggestions={suggestions}
          onSubmit={() => runSearch(query)}
          onPick={(s) => { setQuery(s); runSearch(s); }}
        />
      )}
      {phase === "searching" && <Searching t={t} />}
      {phase === "results" && results && (
        <ResultsStep t={t} r={results} onUnlock={() => router.push("/onboarding/plan")} />
      )}
    </div>
  );
}

// ----- Step 1: welcome -----------------------------------------------------
function Welcome({ t, onStart }: { t: (en: string, fr: string) => string; onStart: () => void }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[560px] flex-col items-center justify-center text-center">
      <div className="fs-rise">
        <Logo size={48} className="[&_.logo-light]:!hidden [&_.logo-dark]:!block" />
      </div>
      <div className="fs-rise mt-8 text-[34px]" style={{ animationDelay: "0.05s" }}>🎁</div>
      <h1 className="fs-rise mt-3 text-[26px] font-semibold tracking-tight sm:text-[28px]" style={{ animationDelay: "0.1s" }}>
        {t("Your first search is on us.", "Votre première recherche est offerte.")}
      </h1>
      <p className="fs-rise mt-4 text-[16px] leading-relaxed text-[#8B9EC4]" style={{ animationDelay: "0.16s" }}>
        {t("Describe your ideal client. We'll show you exactly who's waiting for you.", "Décrivez votre client idéal. On vous montre exactement qui vous attend.")}
      </p>
      <p className="fs-rise mt-2 text-[14px] text-[#8B9EC4]" style={{ animationDelay: "0.2s" }}>
        {t("No credit card. No plan. Just results.", "Sans carte bancaire. Sans engagement. Juste des résultats.")}
      </p>
      <button
        onClick={onStart}
        className="fs-rise mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0051FF] to-[#0085FF] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(0,81,255,0.8)] transition hover:brightness-110"
        style={{ animationDelay: "0.26s" }}
      >
        {t("Launch my free search", "Lancer ma recherche gratuite")} <ArrowRight size={17} />
      </button>
      <p className="fs-rise mt-5 text-[12px] text-[#4A5980]" style={{ animationDelay: "0.32s" }}>
        {t("Your search results will be ready in under 2 minutes.", "Vos résultats seront prêts en moins de 2 minutes.")}
      </p>
    </div>
  );
}

// ----- Step 2: search interface --------------------------------------------
function SearchStep({
  t, query, setQuery, taRef, suggestions, onSubmit, onPick,
}: {
  t: (en: string, fr: string) => string;
  query: string;
  setQuery: (v: string) => void;
  taRef: React.RefObject<HTMLTextAreaElement | null>;
  suggestions: string[];
  onSubmit: () => void;
  onPick: (s: string) => void;
}) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[680px] flex-col items-center justify-center">
      <div className="fs-rise"><Logo size={40} className="[&_.logo-light]:!hidden [&_.logo-dark]:!block" /></div>
      <h1 className="fs-rise mt-7 text-center text-[24px] font-semibold sm:text-[28px]" style={{ animationDelay: "0.05s" }}>
        {t("What kind of prospects are you looking for?", "Quel type de prospects cherchez-vous ?")}
      </h1>
      <div className="fs-rise mt-6 w-full rounded-2xl border border-[#1E2D4A] bg-[#0D1526] p-2.5" style={{ animationDelay: "0.1s" }}>
        <textarea
          ref={taRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
          rows={3}
          placeholder={t('e.g. "Restaurants in Toulouse with a Google rating under 4 stars and no website"', 'ex. "Restaurants à Toulouse avec une note Google sous 4 étoiles et sans site web"')}
          className="w-full resize-none bg-transparent px-3 pt-2 text-[15px] leading-relaxed text-[#F0F4FF] outline-none placeholder:text-[#4A5980]"
        />
        <div className="flex justify-end px-1 pb-1">
          <button
            onClick={onSubmit}
            disabled={query.trim().length < 3}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-[#0051FF] to-[#0085FF] text-white transition hover:brightness-110 disabled:opacity-40"
            aria-label={t("Search", "Rechercher")}
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div className="fs-rise mt-4 flex flex-wrap justify-center gap-2" style={{ animationDelay: "0.16s" }}>
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="rounded-full border border-[#1E2D4A] bg-[#0D1526] px-3.5 py-1.5 text-[13px] text-[#8B9EC4] transition hover:border-[#0051FF60] hover:text-[#F0F4FF]"
          >
            {s}
          </button>
        ))}
      </div>
      <p className="fs-rise mt-6 flex items-center gap-1.5 text-[12px] text-[#4A5980]" style={{ animationDelay: "0.2s" }}>
        <Search size={13} /> {t("LogLead searches LinkedIn, Google Maps, Reddit and 7+ more sources.", "LogLead explore LinkedIn, Google Maps, Reddit et 7+ autres sources.")}
      </p>
    </div>
  );
}

// ----- Step 3: searching animation -----------------------------------------
function Searching({ t }: { t: (en: string, fr: string) => string }) {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-[480px] flex-col items-center justify-center">
      <p className="text-center text-[20px] font-semibold" style={{ animation: "fs-pulse 1.4s ease-in-out infinite" }}>
        {t("LogLead is searching for your prospects…", "LogLead recherche vos prospects…")}
      </p>
      <div className="mt-8 w-full space-y-2.5">
        {SOURCES.map((s, i) => (
          <div
            key={s}
            className="flex items-center gap-3 rounded-xl border border-[#1E2D4A] bg-[#0D1526] px-4 py-2.5 opacity-0"
            style={{ animation: "fs-rise 0.4s ease forwards", animationDelay: `${i * 0.38}s` }}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#22C55E]/20 text-[11px] font-bold text-[#4ADE80]">✓</span>
            <span className="text-[14px] text-[#F0F4FF]">{s}</span>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-full bg-[#0051FF]/15 px-4 py-1.5 text-[13px] font-semibold text-[#4F8BFF]" style={{ animation: "fs-pill 1.2s ease-in-out infinite" }}>
        +10 {t("sources analyzed", "sources analysées")}
      </div>
      <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-[#0D1526]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#0051FF] to-[#0085FF]" style={{ animation: "fs-progress 4.2s linear forwards" }} />
      </div>
    </div>
  );
}

// ----- Step 4 + 5: results (gated) + conversion ----------------------------
function scoreColor(s: number) {
  return s > 85 ? "#22C55E" : s >= 70 ? "#F59E0B" : "#8B9EC4";
}

function ResultsStep({ t, r, onUnlock }: { t: (en: string, fr: string) => string; r: Results; onUnlock: () => void }) {
  return (
    <div className="mx-auto max-w-[720px] py-6">
      {/* Header */}
      <div className="fs-rise text-center">
        <h1 className="text-[24px] font-bold sm:text-[28px]">
          🔥 <span className="bg-gradient-to-r from-[#4F8BFF] to-[#00D4FF] bg-clip-text text-[36px] text-transparent sm:text-[40px]">{r.totalFound}</span>{" "}
          {t("prospects found for you.", "prospects trouvés pour vous.")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-[14px] text-[#8B9EC4]">“{r.query}”</p>
      </div>

      {/* Unlocked cards */}
      <div className="mt-8 space-y-4">
        {r.visible.map((p, i) => (
          <div key={i} className="fs-rise rounded-[14px] border border-[#1E2D4A] bg-[#0D1526] p-5" style={{ animationDelay: `${0.1 + i * 0.12}s` }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[16px] font-semibold text-[#F0F4FF]">{p.company}</p>
                <p className="mt-0.5 text-[13px] text-[#8B9EC4]">📍 {p.city}</p>
              </div>
              <span className="flex shrink-0 items-center gap-1.5 text-[14px] font-bold" style={{ color: scoreColor(p.score) }}>
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: scoreColor(p.score) }} /> {p.score}
              </span>
            </div>
            {p.signals.length > 0 && (
              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A5980]">{t("Signals detected", "Signaux détectés")}</p>
                <ul className="mt-1.5 space-y-1">
                  {p.signals.map((s, j) => (
                    <li key={j} className="flex items-center gap-2 text-[13px] text-[#C9D6EF]">⚠️ {s}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4A5980]">{t("Why this prospect", "Pourquoi ce prospect")}</p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#8B9EC4]">“{p.why}”</p>
            </div>
            <p className="mt-3 text-[12px] text-[#4A5980]">{t("Source", "Source")} : {p.source}</p>

            <div className="my-4 h-px bg-[#1E2D4A]" />
            {/* Locked contact fields — visible format, masked value */}
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {[
                [t("Email", "Email"), "••••••@••••••.fr"],
                [t("Phone", "Téléphone"), "+33 6 •• •• •• ••"],
                [t("Decision maker", "Décideur"), "J••• D•••••"],
                ["LinkedIn", "linkedin.com/••••••"],
              ].map(([label, masked]) => (
                <div key={label} className="flex items-center gap-2 text-[13px] text-[#4A5980]">
                  <Lock size={13} className="shrink-0" />
                  <span className="w-[92px] shrink-0 text-[#8B9EC4]">{label}</span>
                  <span className="truncate font-mono">{masked}</span>
                </div>
              ))}
            </div>
            <button
              onClick={onUnlock}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#0051FF66] bg-[#162035] px-4 py-2.5 text-[13px] font-medium text-[#8B9EC4] transition hover:text-[#F0F4FF]"
            >
              <Lock size={13} /> {t("Unlock this prospect", "Débloquer ce prospect")} <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Locked / blurred cards to show volume */}
      {r.lockedCount > 0 && (
        <div className="relative mt-4">
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="select-none rounded-[14px] border border-[#1E2D4A] bg-[#0D1526] p-5 opacity-60 blur-[4px]">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-4 w-40 rounded bg-[#1E2D4A]" />
                    <div className="mt-2 h-3 w-24 rounded bg-[#162035]" />
                  </div>
                  <div className="h-4 w-10 rounded bg-[#1E2D4A]" />
                </div>
                <div className="mt-4 flex items-center gap-2 text-[13px] text-[#4A5980]">
                  <Lock size={13} /> {t("Unlock to see signals and contact info", "Débloquez pour voir les signaux et les contacts")}
                </div>
              </div>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#050A14]" />
        </div>
      )}

      {/* Conversion block */}
      <div className="fs-rise mt-8 rounded-[20px] border border-[#0051FF66] bg-[#0D1526] p-6 shadow-[0_0_60px_rgba(0,81,255,0.15)] sm:p-8" style={{ animationDelay: "0.5s" }}>
        <h2 className="text-[20px] font-semibold sm:text-[22px]">
          {t("You've found your first prospects.", "Vous avez trouvé vos premiers prospects.")}<br />
          {t("Now turn them into real opportunities.", "Transformez-les en vraies opportunités.")}
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-[#8B9EC4]">
          {t("Unlock their contact details, buying signals and keep finding new prospects every week.", "Débloquez leurs contacts, leurs signaux d'achat et continuez à trouver de nouveaux prospects chaque semaine.")}
        </p>
        <ul className="mt-5 space-y-2.5 rounded-xl border border-[#1E2D4A] bg-[#0A1120] p-4">
          {[
            t(`Email and phone for all ${r.totalFound} prospects`, `Email et téléphone pour les ${r.totalFound} prospects`),
            t("Decision maker names and LinkedIn profiles", "Noms des décideurs et profils LinkedIn"),
            t("Full buying signals (funding, hiring, bad reviews…)", "Signaux d'achat complets (levées, recrutement, avis…)"),
            t("Unlimited searches · New prospects every day", "Recherches illimitées · De nouveaux prospects chaque jour"),
            t("Export to Google Sheets in one click", "Export vers Google Sheets en un clic"),
          ].map((f) => (
            <li key={f} className="flex items-start gap-2.5 text-[14px] text-[#F0F4FF]">
              <span className="mt-0.5 text-[#4ADE80]">✓</span> {f}
            </li>
          ))}
        </ul>
        <button
          onClick={onUnlock}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0051FF] to-[#0085FF] px-6 py-3.5 text-[16px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(0,81,255,0.8)] transition hover:brightness-110"
        >
          <ArrowRight size={17} /> {t(`Unlock my ${r.totalFound} prospects`, `Débloquer mes ${r.totalFound} prospects`)}
        </button>
        <div className="mt-4 text-center">
          <button onClick={onUnlock} className="text-[13px] text-[#4A5980] transition hover:text-[#8B9EC4]">
            {t("or see plans →", "ou voir les offres →")}
          </button>
        </div>
      </div>
    </div>
  );
}
