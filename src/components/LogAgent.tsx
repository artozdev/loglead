"use client";

import { ArrowUp, Check, ChevronDown, Loader2, Lock, Mail, Phone, Plus, Search, Sparkles, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

// LogAgent — the product's core: a conversational search engine. Left column =
// chat, right column = dynamic results. This is the shell + real intent
// analysis; the streaming prospect table (Apify) is wired next.

type Msg = { role: "user" | "agent"; text: string };
type Criteria = {
  type?: string; sector?: string; signal?: string; jobTitle?: string;
  location?: string; sizeMin?: number; sizeMax?: number; keywords?: string[];
};
type Analysis = { intent: string; title: string; criteria: Criteria; sources: string[] };
type ProspectRow = {
  id: string; companyName: string; companyDomain?: string; companyLocation?: string;
  fitScore: number; signalDescription?: string; source: string; contactName?: string;
};
type SearchRow = { search: { id: string; title: string } | null; analysis: Analysis; prospects: ProspectRow[] };

const SUGGESTIONS = [
  "Web agencies hiring a sales rep in France",
  "Restaurants in Lyon with a Google rating under 4 stars and no website",
  "B2B SaaS companies between 20 and 200 employees in Paris",
  "Local SMBs with no Instagram presence",
];

const SOURCE_LABEL: Record<string, string> = {
  linkedin_jobs: "LinkedIn Jobs",
  linkedin_company: "LinkedIn",
  google_maps: "Google Maps",
  google_search: "Google",
  instagram: "Instagram",
  tiktok: "TikTok",
  facebook: "Facebook",
  twitter: "X",
};

export default function LogAgent({ initialQuery = "", freeTrial = false }: { initialQuery?: string; freeTrial?: boolean }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SearchRow | null>(null);
  const [freeDone, setFreeDone] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const started = messages.length > 0;

  async function submit(q: string) {
    const query = q.trim();
    if (!query || busy) return;

    // Free trial: one capped real search inside this same UI. Any further
    // generation attempt pops the upgrade wall instead of running (no extra spend).
    if (freeTrial) {
      if (freeDone) { setShowUpsell(true); return; }
      setInput("");
      setBusy(true);
      setMessages((m) => [...m, { role: "user", text: query }]);
      try {
        const res = await fetch("/api/onboarding/free-search", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query }),
        });
        const data = await res.json();
        if (!res.ok) {
          setMessages((m) => [...m, { role: "agent", text: data.error ?? "Une erreur est survenue." }]);
          return;
        }
        const found: ProspectRow[] = data.prospects ?? [];
        setMessages((m) => [...m, { role: "agent", text: found.length > 0 ? `● ${found.length} prospects trouvés — un avant-goût de ta recherche. Passe à un plan pour en trouver plus et débloquer leurs contacts.` : "Aucun résultat. Reformule ta recherche." }]);
        setResult({ search: data.search ?? null, analysis: data.analysis, prospects: found });
        setFreeDone(true);
      } catch {
        setMessages((m) => [...m, { role: "agent", text: "Connexion impossible. Réessaie." }]);
      } finally {
        setBusy(false);
      }
      return;
    }

    setInput("");
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text: query }]);
    try {
      const res = await fetch("/api/logagent/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (res.status === 402) {
        window.dispatchEvent(new CustomEvent("loglead:insufficient-credits", { detail: { needed: data.needed, balance: data.balance, action: data.action } }));
        setMessages((m) => [...m, { role: "agent", text: "Crédits insuffisants pour lancer cette recherche." }]);
        return;
      }
      if (!res.ok) {
        setMessages((m) => [...m, { role: "agent", text: data.error ?? "Une erreur est survenue." }]);
        return;
      }
      const a: Analysis = data.analysis;
      window.dispatchEvent(new CustomEvent("loglead:credits-changed"));
      if (a.intent === "prospect_search") {
        const found: ProspectRow[] = data.prospects ?? [];
        setMessages((m) => [...m, { role: "agent", text: found.length > 0 ? `● ${found.length} prospects trouvés — scannés sur ${a.sources.map((s) => SOURCE_LABEL[s] ?? s).join(" · ")}.` : `Aucun résultat pour cette recherche. Essaie d'être plus précis ou de changer de source.` }]);
        setResult({ search: data.search, analysis: a, prospects: found });
      } else {
        setMessages((m) => [...m, { role: "agent", text: replyForIntent(a) }]);
        setResult({ search: null, analysis: a, prospects: [] });
      }
    } catch {
      setMessages((m) => [...m, { role: "agent", text: "Connexion impossible. Réessaie." }]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-canvas">
      {/* Top toolbar — reset only (title removed) */}
      {started && (
        <div className="flex items-center justify-end px-5 py-3">
          <button
            onClick={() => { setMessages([]); setResult(null); setInput(""); inputRef.current?.focus(); }}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] font-medium text-muted transition hover:text-ink"
          >
            Nouvelle recherche
          </button>
        </div>
      )}

      {/* Body — chat + canvas */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden px-4 pb-4 lg:flex-row">
        {/* Left — chat */}
        <div className="flex w-full flex-col lg:w-[38%]">
          <div className="flex-1 overflow-y-auto">
            {!started ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#0085FF] text-[22px] font-bold text-white shadow-[0_10px_28px_-8px_rgba(0,81,255,0.6)]">L</span>
                <h1 className="mt-5 font-display text-[22px] font-semibold text-ink">What do you want to find?</h1>
                <p className="mt-1 text-[13px] text-muted">Décris ton prospect. LogLead le trouve.</p>
                <div className="mt-6 w-full max-w-md space-y-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => { setInput(s); inputRef.current?.focus(); }}
                      className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-[13px] text-muted transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-ink hover:shadow-[0_8px_20px_-12px_rgba(15,23,42,0.25)]"
                    >
                      <Search size={14} className="shrink-0 text-faint" /> {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2 pr-1">
                {messages.map((m, i) =>
                  m.role === "user" ? (
                    <div key={i} className="flex justify-end">
                      <div className="max-w-[88%] rounded-[16px_16px_4px_16px] bg-surface px-4 py-2.5 text-[14px] text-ink shadow-[0_4px_14px_-8px_rgba(15,23,42,0.25)]">{m.text}</div>
                    </div>
                  ) : (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-[#0085FF] text-[11px] font-bold text-white">L</span>
                      <div className="max-w-[88%] text-[14px] leading-relaxed text-ink">{m.text}</div>
                    </div>
                  ),
                )}
                {busy && (
                  <div className="flex items-center gap-2 text-[13px] font-medium text-muted">
                    <Loader2 size={15} className="animate-spin text-primary" /> En cours de réflexion…
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input — modern composer */}
          <div className="mt-3 rounded-2xl border border-line bg-surface p-2.5 shadow-[0_10px_30px_-16px_rgba(15,23,42,0.25)]">
            <textarea
              ref={inputRef}
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
              placeholder="Demandez à LogLead…"
              className="max-h-32 w-full resize-none bg-transparent px-1.5 pt-1 text-[14px] text-ink outline-none placeholder:text-faint"
            />
            <div className="mt-1 flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-muted transition hover:border-primary/40 hover:text-ink" title="Ajouter du contexte" aria-label="Ajouter du contexte"><Plus size={16} /></button>
              <span className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[13px] font-medium text-muted">Rechercher <ChevronDown size={14} /></span>
              <button
                onClick={() => submit(input)}
                disabled={busy || !input.trim()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#0085FF] text-white shadow-[0_6px_16px_-6px_rgba(0,81,255,0.7)] transition disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                aria-label="Envoyer"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={17} />}
              </button>
            </div>
          </div>
        </div>

        {/* Right — canvas */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-line bg-surface">
          {!result ? (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center text-muted">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-hover"><Search size={22} className="text-faint" /></span>
              <p className="mt-3 max-w-xs text-[14px]">{busy ? "Recherche en cours…" : "Les résultats de ta recherche apparaîtront ici."}</p>
            </div>
          ) : result.analysis.intent === "prospect_search" ? (
            freeTrial ? (
              <FreeTrialResults row={result} onUpsell={() => setShowUpsell(true)} />
            ) : (
              <ResultsPanel row={result} />
            )
          ) : (
            <div className="mx-auto max-w-2xl px-6 py-8">
              <h2 className="font-display text-[18px] font-semibold text-ink">{result.analysis.title}</h2>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">{replyForIntent(result.analysis)}</p>
            </div>
          )}
        </div>
      </div>

      {showUpsell && <FreeTrialUpsell onClose={() => setShowUpsell(false)} onUpgrade={() => router.push("/onboarding/plan")} />}
    </div>
  );
}

function ResultsPanel({ row, freeTrial = false }: { row: SearchRow; freeTrial?: boolean }) {
  const { analysis } = row;
  const c = analysis.criteria;
  const chips = [c.sector, c.jobTitle, c.location, c.signal, c.type].filter(Boolean) as string[];
  return (
    <div className="px-6 py-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[18px] font-semibold text-ink">{analysis.title}</h2>
        {analysis.sources.map((s) => (
          <span key={s} className="rounded-full bg-surface-hover px-2.5 py-0.5 text-[11px] font-medium text-muted">{SOURCE_LABEL[s] ?? s}</span>
        ))}
      </div>
      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((x) => (
            <span key={x} className="rounded-md bg-primary/[0.08] px-2 py-1 text-[12px] font-medium text-primary">{x}</span>
          ))}
        </div>
      )}

      {/* Results */}
      <div className="mt-2 text-[12px] text-muted">{row.prospects.length} prospects · {row.prospects.filter((p) => p.fitScore > 80).length} qualifiés (score &gt; 80)</div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-line">
        <div className="grid grid-cols-[64px_1.4fr_1fr_1.4fr_100px] border-b border-line bg-surface-hover/50 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
          <span>Fit</span><span>Entreprise</span><span>Domaine</span><span>Signal</span><span>Ville</span>
        </div>
        {row.prospects.length === 0 ? (
          <div className="px-4 py-12 text-center text-[13px] text-muted">Aucun résultat.</div>
        ) : (
          <div className="divide-y divide-line">
            {row.prospects.map((p) => {
              const color = p.fitScore > 80 ? "#10B981" : p.fitScore >= 60 ? "#F59E0B" : "#EF4444";
              return (
                <div key={p.id} className="grid grid-cols-[64px_1.4fr_1fr_1.4fr_100px] items-center px-4 py-3 text-[13px]">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                    <span className="num font-semibold text-ink">{p.fitScore}</span>
                  </span>
                  <span className="truncate font-medium text-ink">{p.companyName}</span>
                  <span className="truncate text-muted">{p.companyDomain ?? "—"}</span>
                  <span className="truncate text-muted">{p.signalDescription ?? "—"}</span>
                  <span className="truncate text-faint">{p.companyLocation ?? "—"}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {row.prospects.length > 0 && !freeTrial && (
        <p className="mt-3 text-[12px] text-muted">Retrouve ces prospects dans <a href="/leads" className="text-primary hover:underline">Leads</a> — scoring terminé.</p>
      )}
      {row.prospects.length > 0 && freeTrial && (
        <div className="mt-4 flex flex-col items-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.06] px-4 py-4 text-center">
          <p className="text-[13px] font-semibold text-ink">🔒 Essai gratuit — contacts &amp; recherches illimitées verrouillés</p>
          <p className="text-[12px] text-muted">Passe à un plan pour débloquer l&apos;email et le téléphone de chaque prospect et continuer à en trouver.</p>
          <a href="/onboarding/plan" className="mt-1 rounded-lg bg-gradient-to-br from-primary to-[#0085FF] px-4 py-2 text-[13px] font-semibold text-white transition hover:brightness-110">Voir les plans →</a>
        </div>
      )}
    </div>
  );
}

// Free-trial results: name + city + score are readable; every other detail
// (signal, email, phone, decision maker, LinkedIn) is shown but LOCKED.
function FreeTrialResults({ row, onUpsell }: { row: SearchRow; onUpsell: () => void }) {
  const { analysis } = row;
  const initials = (n: string) => n.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <div className="px-5 py-6 sm:px-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-display text-[18px] font-semibold text-ink">{analysis.title}</h2>
        {analysis.sources.map((s) => (
          <span key={s} className="rounded-full bg-surface-hover px-2.5 py-0.5 text-[11px] font-medium text-muted">{SOURCE_LABEL[s] ?? s}</span>
        ))}
      </div>
      <p className="mt-1.5 text-[12px] text-muted">{row.prospects.length} prospects · <span className="font-medium text-ink">essai gratuit</span> — nom, ville & score visibles, le reste est verrouillé.</p>

      <div className="mt-4 space-y-3">
        {row.prospects.map((p) => {
          const color = p.fitScore > 80 ? "#10B981" : p.fitScore >= 60 ? "#F59E0B" : "#EF4444";
          return (
            <div key={p.id} className="rounded-2xl border border-line bg-canvas p-4">
              {/* Visible: name + city + score */}
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[12px] font-bold text-primary">{initials(p.companyName)}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-semibold text-ink">{p.companyName}</p>
                  <p className="truncate text-[12px] text-muted">📍 {p.companyLocation ?? "—"}</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-[13px] font-bold" style={{ color }}>
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} /> {p.fitScore}
                </span>
              </div>
              {/* Locked: everything detailed */}
              <div className="mt-3 grid grid-cols-1 gap-2 border-t border-line pt-3 sm:grid-cols-2">
                <LockRow icon={<Zap size={12} />} label="Signal détecté" value={p.signalDescription ?? "Signal d'achat"} blur />
                <LockRow icon={<Mail size={12} />} label="Email" value="••••••@••••••.fr" />
                <LockRow icon={<Phone size={12} />} label="Téléphone" value="+33 6 •• •• •• ••" />
                <LockRow icon={<Lock size={12} />} label="Décideur" value="J••• D•••••" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-col items-center gap-2 rounded-2xl border border-primary/40 bg-primary/[0.06] px-4 py-5 text-center">
        <p className="text-[14px] font-semibold text-ink">🔒 Débloque les contacts et tous les détails</p>
        <p className="max-w-sm text-[12px] leading-relaxed text-muted">Email, téléphone, décideurs, signaux complets et recherches illimitées — passe à un plan pour continuer.</p>
        <button onClick={onUpsell} className="mt-1 rounded-xl bg-gradient-to-br from-primary to-[#0085FF] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_8px_22px_-8px_rgba(0,81,255,0.7)] transition hover:brightness-110">Débloquer →</button>
      </div>
    </div>
  );
}

function LockRow({ icon, label, value, blur = false }: { icon: React.ReactNode; label: string; value: string; blur?: boolean }) {
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-surface-hover text-faint">{icon}</span>
      <span className="w-[64px] shrink-0 text-muted">{label}</span>
      <span className={`min-w-0 flex-1 truncate ${blur ? "select-none blur-[3px]" : "font-mono"} text-faint`}>{value}</span>
      <Lock size={11} className="shrink-0 text-faint" />
    </div>
  );
}

// Upgrade wall — shown when a trial user forces another generation.
function FreeTrialUpsell({ onClose, onUpgrade }: { onClose: () => void; onUpgrade: () => void }) {
  const features: [string, string][] = [
    ["🚀", "150 crédits pour l'IA & la recherche"],
    ["🔓", "Contacts débloqués (email + téléphone)"],
    ["♾️", "Recherches illimitées"],
    ["✨", "Nouveaux prospects chaque semaine"],
  ];
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[24px] border border-line bg-surface p-6 shadow-[0_30px_80px_-20px_rgba(15,23,42,0.5)] sm:p-8">
        <button onClick={onClose} aria-label="Fermer" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-surface-hover hover:text-ink"><X size={16} /></button>
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1 text-[12px] font-bold">
            <span className="flex -space-x-2">{["#0051FF", "#00A3FF", "#4F8BFF"].map((c) => <span key={c} className="h-5 w-5 rounded-full border-2 border-surface" style={{ background: c }} />)}</span>
            <span className="bg-gradient-to-r from-[#0051FF] to-[#8B5CF6] bg-clip-text text-transparent">Adopté par 50+ agences & fondateurs</span>
          </span>
          <h2 className="mt-4 font-display text-[26px] font-bold tracking-tight text-ink">Débloque LogLead</h2>
          <p className="mt-1.5 text-[14px] text-muted">Passe à un plan pour accéder à tes prospects et à toutes les fonctionnalités.</p>
        </div>
        <div className="mt-6 space-y-2.5">
          {features.map(([emoji, label]) => (
            <div key={label} className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#22C55E]/12 text-[16px]">{emoji}</span>
              <span className="flex-1 text-[14px] font-medium text-ink">{label}</span>
              <Check size={16} className="text-[#22C55E]" strokeWidth={2.5} />
            </div>
          ))}
        </div>
        <button onClick={onUpgrade} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-[#0085FF] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_12px_30px_-10px_rgba(0,81,255,0.8)] transition hover:brightness-110">
          <Sparkles size={17} /> Passer à un plan
        </button>
      </div>
    </div>
  );
}

function replyForIntent(a: Analysis): string {
  switch (a.intent) {
    case "pipeline_analysis":
      return "Analyse de ton pipeline — bientôt disponible dans cette vue.";
    case "message_generation":
      return "Génération de message personnalisé — bientôt disponible dans cette vue.";
    default:
      return "Je peux chercher des prospects, analyser ton pipeline ou rédiger un message. Décris ce que tu cherches.";
  }
}
