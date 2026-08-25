"use client";

import { ArrowUp, Plus, Search, Sparkles } from "lucide-react";
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

export default function LogAgent() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SearchRow | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const started = messages.length > 0;

  async function submit(q: string) {
    const query = q.trim();
    if (!query || busy) return;
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
    <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
      {/* Left — chat */}
      <div className="flex w-full shrink-0 flex-col border-b border-line lg:w-[35%] lg:border-b-0 lg:border-r">
        {!started ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-[22px] font-bold text-white">L</span>
            <h1 className="mt-5 font-display text-[22px] font-semibold text-ink">What do you want to find?</h1>
            <p className="mt-1 text-[13px] text-muted">Décris ton prospect. LogLead le trouve.</p>
            <div className="mt-6 w-full max-w-md space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => { setInput(s); inputRef.current?.focus(); }}
                  className="flex w-full items-center gap-2 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-left text-[13px] text-muted transition hover:border-primary/40 hover:text-ink"
                >
                  <Search size={14} className="shrink-0 text-faint" /> {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[85%] rounded-[12px_12px_4px_12px] bg-primary/10 px-3.5 py-2.5 text-[14px] text-ink">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-[11px] font-bold text-white">L</span>
                  <div className="max-w-[85%] text-[14px] leading-relaxed text-ink">{m.text}</div>
                </div>
              ),
            )}
            {busy && <div className="flex items-center gap-2 text-[13px] text-muted"><Sparkles size={14} className="animate-pulse text-primary" /> Analyse…</div>}
          </div>
        )}

        {/* Input */}
        <div className="border-t border-line p-3">
          <div className="flex items-end gap-2 rounded-2xl border border-line bg-surface px-3 py-2">
            <button className="mb-1 text-muted hover:text-ink" title="Options avancées" aria-label="Options"><Plus size={18} /></button>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(input); } }}
              placeholder="Describe your ideal prospect…"
              className="max-h-32 flex-1 resize-none bg-transparent py-1 text-[14px] text-ink outline-none placeholder:text-faint"
            />
            <button
              onClick={() => submit(input)}
              disabled={busy || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition disabled:opacity-40"
              aria-label="Envoyer"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </div>

      {/* Right — dynamic results */}
      <div className="flex-1 overflow-y-auto bg-canvas">
        {!result ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center text-muted">
            <Search size={26} className="text-faint" />
            <p className="mt-3 max-w-xs text-[14px]">Les résultats de ta recherche apparaîtront ici.</p>
          </div>
        ) : result.analysis.intent === "prospect_search" ? (
          <ResultsPanel row={result} />
        ) : (
          <div className="mx-auto max-w-2xl px-6 py-8">
            <h2 className="font-display text-[18px] font-semibold text-ink">{result.analysis.title}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-muted">{replyForIntent(result.analysis)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultsPanel({ row }: { row: SearchRow }) {
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
      {row.prospects.length > 0 && (
        <p className="mt-3 text-[12px] text-muted">Retrouve ces prospects dans <a href="/leads" className="text-primary hover:underline">Leads</a> — scoring terminé.</p>
      )}
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
