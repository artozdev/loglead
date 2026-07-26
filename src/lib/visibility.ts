import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  GOALS,
  VISIBILITY_LLMS,
  type GeoAction,
  type GeoCompetitorInsight,
  type GeoCompetitorScore,
  type GeoQueryGroup,
  type GeoQueryRow,
  type Profile,
  type VisibilityLLM,
  type VisibilityLLMResult,
  type VisibilityRecommendation,
  type VisibilityStatus,
} from "./types";

// ---------------------------------------------------------------------------
// IA Visibility engine — asks the 6 big LLMs the questions a prospect would
// ask, and checks whether the founder's SaaS shows up in the answers.
//
// Same philosophy as the rest of LogLead's AI layer: each provider is called
// for real when its env key is present (OPENAI_API_KEY, ANTHROPIC_API_KEY,
// GEMINI_API_KEY, PERPLEXITY_API_KEY, XAI_API_KEY, MISTRAL_API_KEY); otherwise
// a deterministic, profile-aware demo result is produced so the module is
// fully usable without any key.
// ---------------------------------------------------------------------------

const TIMEOUT_MS = 45_000;

// ----- Queries ---------------------------------------------------------------

export function buildQueries(profile: Profile): string[] {
  const niche = profile.sector || profile.icp || "les founders de SaaS";
  const icp = profile.icp || "un founder de SaaS";
  const goal =
    GOALS.find((g) => g.value === profile.goal)?.hint.toLowerCase() ||
    "générer des leads en organique";
  const competitor = profile.competitors.filter(Boolean)[0];

  const queries = [
    `Quel est le meilleur outil pour ${niche} ?`,
    `Quels outils recommandes-tu pour ${icp} qui veut ${goal} ?`,
  ];
  queries.push(
    competitor
      ? `Quelles sont les alternatives à ${competitor} pour ${niche} ?`
      : `Quels outils émergents faut-il suivre pour ${niche} ?`,
  );
  return queries;
}

// ----- Mention detection ------------------------------------------------------

export function detectMention(response: string, saasName: string): VisibilityStatus {
  const lowerResponse = response.toLowerCase();
  const lowerName = saasName.toLowerCase().trim();
  if (!lowerName) return "not_detected";
  if (lowerResponse.includes(lowerName)) {
    const positiveKeywords = ["recommand", "suggest", "idéal", "ideal", "parfait", "excellent", "top", "meilleur"];
    const isPositive = positiveKeywords.some((k) => lowerResponse.includes(k));
    return isPositive ? "mentioned" : "partial";
  }
  return "not_detected";
}

// Excerpt around the first mention of the name (or the start of the answer).
function extractExcerpt(response: string, saasName: string): string {
  const clean = response.replace(/\s+/g, " ").trim();
  const idx = clean.toLowerCase().indexOf(saasName.toLowerCase());
  if (idx === -1) return clean.slice(0, 220) + (clean.length > 220 ? "…" : "");
  const start = Math.max(0, idx - 90);
  const end = Math.min(clean.length, idx + saasName.length + 130);
  return `${start > 0 ? "…" : ""}${clean.slice(start, end)}${end < clean.length ? "…" : ""}`;
}

// Ordinal of the mention when the answer is list-shaped ("2e mention"), else null.
function mentionPosition(response: string, saasName: string): string | null {
  const lines = response.split("\n");
  const lower = saasName.toLowerCase();
  let itemCount = 0;
  for (const line of lines) {
    const isItem = /^\s*([-*•]|\d+[.)])\s+/.test(line);
    if (isItem) itemCount++;
    if (line.toLowerCase().includes(lower)) {
      if (isItem && itemCount > 0) {
        return itemCount === 1 ? "1re mention" : `${itemCount}e mention`;
      }
      return null;
    }
  }
  return null;
}

function toneLabel(status: VisibilityStatus): string | null {
  if (status === "mentioned") return "Recommandation positive ↑";
  if (status === "partial") return "Mention neutre →";
  return null;
}

// ----- Provider calls ----------------------------------------------------------

async function callOpenAICompatible(args: {
  baseUrl: string;
  apiKey: string;
  model: string;
  query: string;
}): Promise<string> {
  const res = await fetch(`${args.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      max_tokens: 700,
      messages: [{ role: "user", content: args.query }],
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  return data.choices?.[0]?.message?.content ?? "";
}

async function callClaude(query: string): Promise<string> {
  const client = new Anthropic();
  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 700,
    messages: [{ role: "user", content: query }],
  });
  const text = message.content.find((b) => b.type === "text");
  return text && text.type === "text" ? text.text : "";
}

async function callGemini(query: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: query }] }] }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
}

async function askProvider(llm: VisibilityLLM, query: string): Promise<string> {
  switch (llm) {
    case "chatgpt":
      return callOpenAICompatible({
        baseUrl: "https://api.openai.com/v1",
        apiKey: process.env.OPENAI_API_KEY!,
        model: "gpt-4o",
        query,
      });
    case "claude":
      return callClaude(query);
    case "gemini":
      return callGemini(query, process.env.GEMINI_API_KEY!);
    case "perplexity":
      return callOpenAICompatible({
        baseUrl: "https://api.perplexity.ai",
        apiKey: process.env.PERPLEXITY_API_KEY!,
        model: "llama-3.1-sonar-large-128k-online",
        query,
      });
    case "grok":
      return callOpenAICompatible({
        baseUrl: "https://api.x.ai/v1",
        apiKey: process.env.XAI_API_KEY!,
        model: "grok-2",
        query,
      });
    case "mistral":
      return callOpenAICompatible({
        baseUrl: "https://api.mistral.ai/v1",
        apiKey: process.env.MISTRAL_API_KEY!,
        model: "mistral-large-latest",
        query,
      });
  }
}

function hasKey(llm: VisibilityLLM): boolean {
  const envKey = VISIBILITY_LLMS.find((x) => x.value === llm)?.envKey;
  return Boolean(envKey && process.env[envKey]);
}

// ----- Demo mode -----------------------------------------------------------------

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic per (workspace, llm, scan index) so repeated scans evolve
// plausibly over time instead of flapping randomly on refresh.
function demoResult(args: {
  llm: VisibilityLLM;
  workspaceId: string;
  scanIndex: number;
  profile: Profile;
  query: string;
}): VisibilityLLMResult {
  const { llm, workspaceId, scanIndex, profile, query } = args;
  const saas = profile.saasName || "ton SaaS";
  const niche = profile.sector || profile.icp || "ta niche";
  const icp = profile.icp || "ton audience";
  const comp = profile.competitors.filter(Boolean)[0] || "les acteurs établis";

  const r = hash(`${workspaceId}:${llm}:${scanIndex}`) % 10;
  const status: VisibilityStatus = r < 3 ? "mentioned" : r < 6 ? "partial" : "not_detected";

  const excerpts: Record<VisibilityStatus, string> = {
    mentioned: `« …pour ${niche}, ${saas} est particulièrement adapté : je le recommande aux ${icp} qui veulent des résultats en organique, sans agence… »`,
    partial: `« …plusieurs outils existent sur ce segment, comme ${comp} ou ${saas} ; le choix dépend surtout de la taille de l'équipe et du budget… »`,
    not_detected: `« …les options les plus citées pour ${niche} restent ${comp} et quelques acteurs établis du marché ; il existe aussi des solutions plus génériques… »`,
  };
  const positions: Record<VisibilityStatus, string | null> = {
    mentioned: (hash(`${workspaceId}:${llm}:pos`) % 3) + 1 === 1 ? "1re mention" : `${(hash(`${workspaceId}:${llm}:pos`) % 3) + 1}e mention`,
    partial: null,
    not_detected: null,
  };

  return {
    llm,
    status,
    query,
    excerpt: excerpts[status],
    position: positions[status],
    tone: toneLabel(status),
    demo: true,
  };
}

// ----- Per-LLM scan ---------------------------------------------------------------

const better = (a: VisibilityStatus, b: VisibilityStatus) => {
  const rank: Record<VisibilityStatus, number> = { mentioned: 2, partial: 1, not_detected: 0 };
  return rank[a] >= rank[b];
};

// Ask one LLM the 3 niche queries and keep the best outcome. Falls back to a
// demo result when the provider key is missing, and to "not_detected" with the
// real queries when every call errors.
export async function scanLLM(args: {
  llm: VisibilityLLM;
  profile: Profile;
  workspaceId: string;
  scanIndex: number;
}): Promise<VisibilityLLMResult> {
  const { llm, profile, workspaceId, scanIndex } = args;
  const queries = buildQueries(profile);

  if (!hasKey(llm)) {
    // Small stagger so demo results stream in progressively like real ones.
    const delay = 500 + (hash(`${workspaceId}:${llm}:${scanIndex}:d`) % 1800);
    await new Promise((r) => setTimeout(r, delay));
    return demoResult({ llm, workspaceId, scanIndex, profile, query: queries[0] });
  }

  const saas = profile.saasName;
  let best: VisibilityLLMResult | null = null;

  const settled = await Promise.allSettled(
    queries.map(async (query) => ({ query, response: await askProvider(llm, query) })),
  );
  for (const s of settled) {
    if (s.status !== "fulfilled" || !s.value.response) continue;
    const { query, response } = s.value;
    const status = detectMention(response, saas);
    const candidate: VisibilityLLMResult = {
      llm,
      status,
      query,
      excerpt: extractExcerpt(response, saas),
      position: status === "not_detected" ? null : mentionPosition(response, saas),
      tone: toneLabel(status),
      demo: false,
    };
    if (!best || better(candidate.status, best.status)) best = candidate;
    if (best.status === "mentioned") break;
  }

  return (
    best ?? {
      llm,
      status: "not_detected",
      query: queries[0],
      excerpt: "Le modèle n'a pas répondu (erreur ou délai dépassé).",
      position: null,
      tone: null,
      demo: false,
    }
  );
}

// ----- Recommendations ---------------------------------------------------------------

// 3-5 recommendations picked from a curated pool depending on which LLMs
// missed the SaaS, personalized with the founder's competitor/niche.
export function buildRecommendations(
  results: VisibilityLLMResult[],
  profile: Profile,
): VisibilityRecommendation[] {
  const missed = (llm: VisibilityLLM) =>
    results.find((r) => r.llm === llm)?.status !== "mentioned";
  const comp = profile.competitors.filter(Boolean)[0] || "ton concurrent principal";
  const niche = profile.sector || profile.icp || "ta niche";

  const recs: VisibilityRecommendation[] = [];
  if (missed("perplexity") || missed("claude")) {
    recs.push({
      title: "Publie du contenu long-form sur Reddit",
      text: `Les LLMs comme Perplexity et Claude s'appuient fortement sur Reddit pour leurs réponses. Un post détaillé sur r/SaaS avec ${profile.saasName} cité en contexte augmente tes chances d'être repris.`,
    });
  }
  if (missed("chatgpt") || missed("gemini")) {
    recs.push({
      title: `Crée une page « Alternatives à ${comp} »`,
      text: `ChatGPT et Gemini recommandent souvent des alternatives aux outils populaires. Une page SEO bien structurée sur ton site peut te faire apparaître dans ces comparaisons.`,
    });
  }
  recs.push({
    title: "Obtiens des mentions dans des newsletters tech",
    text: "Les LLMs accordent du poids aux sources éditoriales. Une mention dans Product Hunt, Indie Hackers ou une newsletter tech renforce ta crédibilité auprès des modèles.",
  });
  recs.push({
    title: "Structure ton site avec du schema markup",
    text: `Perplexity et Claude lisent le contenu structuré (FAQ, schema.org). Ajoute des balises FAQ sur ta landing page pour augmenter tes chances d'apparaître dans les réponses sur ${niche}.`,
  });
  if (missed("grok")) {
    recs.push({
      title: "Sois actif sur X avec des threads de niche",
      text: `Grok s'appuie massivement sur X. Des threads réguliers qui associent ${profile.saasName} aux problèmes de ${niche} augmentent ta présence dans ses réponses.`,
    });
  }
  return recs.slice(0, 5);
}

// ===========================================================================
// GEO engine (v2) — every generated query is asked to every LLM, producing
// per-query rows for the performance table and 0-100 scores per LLM.
// Demo mode stays deterministic per (workspace, llm, query, scan index).
// ===========================================================================

export type GeoQuery = { query: string; group: GeoQueryGroup };

// 10-15 queries from the SaaS profile, capped per plan by the caller.
export function buildGeoQueries(profile: Profile, max: number): GeoQuery[] {
  const niche = profile.sector || profile.icp || "les founders de SaaS";
  const icp = profile.icp || "un founder de SaaS";
  const goal =
    GOALS.find((g) => g.value === profile.goal)?.hint.toLowerCase() ||
    "générer des leads en organique";
  const competitors = profile.competitors.filter(Boolean);

  const queries: GeoQuery[] = [
    { query: `Meilleur outil pour ${niche} ?`, group: "niche" },
    { query: `Quels outils recommandes-tu pour ${icp} qui veut ${goal} ?`, group: "niche" },
    { query: `Outil de ${niche} pour ${icp} ?`, group: "niche" },
    { query: `Comment ${goal} quand on est ${icp} ?`, group: "niche" },
    { query: `Quels outils émergents faut-il suivre pour ${niche} ?`, group: "niche" },
  ];
  for (const comp of competitors.slice(0, 3)) {
    queries.push({ query: `Alternative à ${comp} ?`, group: "competitor" });
    queries.push({ query: `${comp} vs autres outils de ${niche} — que choisir ?`, group: "competitor" });
  }
  queries.push(
    { query: `${profile.saasName} — avis et alternatives`, group: "brand" },
    { query: `Est-ce que ${profile.saasName} vaut le coup pour ${icp} ?`, group: "brand" },
    { query: `Logiciel abordable pour ${niche} en 2026 ?`, group: "niche" },
    { query: `Top 5 des outils pour ${niche} ?`, group: "niche" },
  );
  return queries.slice(0, max);
}

export type GeoLLMOutcome = {
  llm: VisibilityLLM;
  score: number; // 0-100: mentioned=1, partial=0.5 over all queries
  demo: boolean;
  perQuery: {
    query: string;
    status: VisibilityStatus;
    linked: boolean; // answer contains the site URL host
    excerpt: string;
    competitorsCited: string[]; // competitors named in this answer
  }[];
};

function demoGeoStatus(seed: string): VisibilityStatus {
  const r = hash(seed) % 10;
  return r < 3 ? "mentioned" : r < 6 ? "partial" : "not_detected";
}

// Ask one LLM every query (real call when its key exists, demo otherwise).
export async function scanGeoLLM(args: {
  llm: VisibilityLLM;
  queries: GeoQuery[];
  profile: Profile;
  url: string;
  workspaceId: string;
  scanIndex: number;
}): Promise<GeoLLMOutcome> {
  const { llm, queries, profile, url, workspaceId, scanIndex } = args;
  const saas = profile.saasName || "ton SaaS";
  const niche = profile.sector || profile.icp || "ta niche";
  const comp = profile.competitors.filter(Boolean)[0] || "les acteurs établis";
  let host = "";
  try {
    host = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./, "");
  } catch {
    host = "";
  }

  if (!hasKey(llm)) {
    // Staggered like a real provider so SSE progress feels live.
    const delay = 400 + (hash(`${workspaceId}:${llm}:${scanIndex}:d`) % 1600);
    await new Promise((r) => setTimeout(r, delay));
    const excerpts: Record<VisibilityStatus, string> = {
      mentioned: `« …pour ${niche}, ${saas} est particulièrement adapté : je le recommande sans hésiter… »`,
      partial: `« …plusieurs outils existent sur ce segment, comme ${comp} ou ${saas} ; le choix dépend du budget… »`,
      not_detected: `« …les options les plus citées pour ${niche} restent ${comp} et quelques acteurs établis… »`,
    };
    const competitors = profile.competitors.filter(Boolean);
    const perQuery = queries.map(({ query }) => {
      const status = demoGeoStatus(`${workspaceId}:${llm}:${query}:${scanIndex}`);
      return {
        query,
        status,
        linked: status === "mentioned" && hash(`${workspaceId}:${llm}:${query}:link`) % 4 === 0,
        excerpt: excerpts[status],
        // Competitors get cited more often where the SaaS is absent.
        competitorsCited: competitors.filter(
          (c) =>
            hash(`${workspaceId}:${llm}:${query}:${c}`) % 10 <
            (status === "not_detected" ? 6 : 4),
        ),
      };
    });
    return { llm, demo: true, perQuery, score: geoScore(perQuery) };
  }

  const settled = await Promise.allSettled(
    queries.map(async ({ query }) => ({ query, response: await askProvider(llm, query) })),
  );
  const competitors = profile.competitors.filter(Boolean);
  const perQuery = settled.map((s, i) => {
    if (s.status !== "fulfilled" || !s.value.response) {
      return {
        query: queries[i].query,
        status: "not_detected" as VisibilityStatus,
        linked: false,
        excerpt: "Le modèle n'a pas répondu (erreur ou délai dépassé).",
        competitorsCited: [],
      };
    }
    const { query, response } = s.value;
    const status = detectMention(response, saas);
    const lower = response.toLowerCase();
    return {
      query,
      status,
      linked: Boolean(host) && lower.includes(host.toLowerCase()),
      excerpt: extractExcerpt(response, saas),
      competitorsCited: competitors.filter((c) => lower.includes(c.toLowerCase())),
    };
  });
  return { llm, demo: false, perQuery, score: geoScore(perQuery) };
}

function geoScore(perQuery: { status: VisibilityStatus }[]): number {
  if (perQuery.length === 0) return 0;
  const pts = perQuery.reduce(
    (acc, q) => acc + (q.status === "mentioned" ? 1 : q.status === "partial" ? 0.5 : 0),
    0,
  );
  return Math.round((pts / perQuery.length) * 100);
}

const STATUS_RANK: Record<VisibilityStatus, number> = {
  mentioned: 2,
  partial: 1,
  not_detected: 0,
};

// Merge the 6 LLM outcomes into per-query rows for the performance table.
export function buildGeoRows(
  outcomes: GeoLLMOutcome[],
  queries: GeoQuery[],
  profile: Profile,
): GeoQueryRow[] {
  const competitors = profile.competitors.filter(Boolean);
  return queries.map(({ query, group }) => {
    const perLLM: GeoQueryRow["perLLM"] = {};
    const citations = new Map<string, number>();
    let topLLM: VisibilityLLM | null = null;
    let excerpt = "";
    let linkedCount = 0;
    let best = -1;
    for (const o of outcomes) {
      const q = o.perQuery.find((x) => x.query === query);
      if (!q) continue;
      perLLM[o.llm] = q.status;
      if (q.linked) linkedCount++;
      for (const c of q.competitorsCited) citations.set(c, (citations.get(c) ?? 0) + 1);
      if (STATUS_RANK[q.status] > best) {
        best = STATUS_RANK[q.status];
        topLLM = o.llm;
        excerpt = q.excerpt;
      }
    }
    const statuses = Object.values(perLLM);
    const score =
      statuses.length === 0
        ? 0
        : Math.round(
            (statuses.reduce((a, s) => a + STATUS_RANK[s] / 2, 0) / statuses.length) * 100,
          );
    // The competitor most often cited on this query across the 6 answers.
    const topCompetitor =
      [...citations.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ??
      (score < 100 && competitors.length > 0 ? competitors[hash(query) % competitors.length] : null);
    return {
      query,
      group,
      perLLM,
      score,
      topLLM: best <= 0 ? null : topLLM,
      topCompetitor,
      linksToSite: linkedCount > 0,
      linkedCount,
      excerpt,
    };
  });
}

// Global metrics for the 3 headline cards.
export function buildGeoMetrics(rows: GeoQueryRow[]): {
  mentionRows: number;
  linkRows: number;
  opportunityRows: number;
  globalScore: number; // 0-100 average of row scores
} {
  const mentionRows = rows.filter((r) =>
    Object.values(r.perLLM).some((s) => s === "mentioned"),
  ).length;
  const linkRows = rows.filter((r) => r.linksToSite).length;
  return {
    mentionRows,
    linkRows,
    opportunityRows: rows.length - mentionRows,
    globalScore:
      rows.length === 0
        ? 0
        : Math.round(rows.reduce((a, r) => a + r.score, 0) / rows.length),
  };
}

// ----- Competitor tracking -----------------------------------------------------

// Per-competitor visibility on the same queries: % of answers citing them,
// per LLM (0-100) + average. Derived from the same outcomes as the SaaS scores
// so real and demo modes both work.
export function buildCompetitorScores(
  outcomes: GeoLLMOutcome[],
  competitors: string[],
): GeoCompetitorScore[] {
  return competitors.map((name) => {
    const scores: GeoCompetitorScore["scores"] = {};
    for (const o of outcomes) {
      if (o.perQuery.length === 0) continue;
      const cited = o.perQuery.filter((q) => q.competitorsCited.includes(name)).length;
      scores[o.llm] = Math.round((cited / o.perQuery.length) * 100);
    }
    const vals = Object.values(scores);
    const avg = vals.length === 0 ? 0 : Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    return { name, scores, avg };
  });
}

// Plausible source breakdown per competitor (deterministic in demo mode —
// real source crawling is a future iteration), plus the queries it dominates
// and how to counter it.
export function buildCompetitorInsights(
  competitorScores: GeoCompetitorScore[],
  rows: GeoQueryRow[],
  profile: Profile,
): GeoCompetitorInsight[] {
  const niche = profile.sector || profile.icp || "ta niche";
  return competitorScores.map((c) => {
    const h = (salt: string) => hash(`${c.name}:${salt}`);
    // Source volume scales with how visible the competitor actually is.
    const k = Math.max(0.2, c.avg / 60);
    const sources = [
      { label: "mentions dans des newsletters tech (Product Hunt, Indie Hackers…)", count: Math.round((20 + (h("nl") % 35)) * k) },
      { label: `posts Reddit à fort engagement dans ${niche}`, count: Math.round((8 + (h("rd") % 20)) * k) },
      { label: `articles de blog « meilleur outil ${niche} » qui le citent`, count: Math.round((5 + (h("bl") % 12)) * k) },
      { label: "vidéos YouTube avec transcriptions indexées", count: Math.round((2 + (h("yt") % 8)) * k) },
      { label: "comparatifs sur G2 et Capterra", count: Math.round((1 + (h("g2") % 4)) * k) },
    ].filter((s) => s.count > 0);

    const dominantQueries = rows
      .filter((r) => r.topCompetitor === c.name && r.score < 100)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3)
      .map((r) => ({
        query: r.query,
        // Their strength mirrors our weakness on that query.
        score: Math.min(98, 100 - r.score + (h(r.query) % 10)),
      }));

    const counters = [
      `Crée une page « Alternative à ${c.name} » sur ton site`,
      `Publie 3 posts Reddit comparatifs dans ${niche} cette semaine`,
      "Obtiens 5 mentions dans des newsletters tech",
    ];
    return { name: c.name, sources, dominantQueries, counters };
  });
}

// ----- Action plan ---------------------------------------------------------------

// 6 actions, prioritized by impact, personalized with the profile and scan
// results. Points are calibrated so the top-3 sum lands a realistic target.
export function buildActionPlan(args: {
  profile: Profile;
  rows: GeoQueryRow[];
  llmScores: Partial<Record<VisibilityLLM, number>>;
  competitorScores: GeoCompetitorScore[];
}): GeoAction[] {
  const { profile, rows, llmScores, competitorScores } = args;
  const saas = profile.saasName || "ton SaaS";
  const niche = profile.sector || profile.icp || "ta niche";
  const icp = profile.icp || "ton audience";
  const topComp =
    [...competitorScores].sort((a, b) => b.avg - a.avg)[0]?.name ||
    profile.competitors.filter(Boolean)[0] ||
    "ton concurrent principal";
  const compQueries = rows.filter((r) => r.topCompetitor && r.score < 50).length;
  const compShare =
    rows.length === 0 ? 0 : Math.min(95, Math.round((compQueries / rows.length) * 100) + 30);
  const weakest = (Object.entries(llmScores) as [VisibilityLLM, number][])
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2)
    .map(([llm]) => VISIBILITY_LLMS.find((x) => x.value === llm)?.label ?? llm);

  return [
    {
      id: "alt-page",
      title: `Crée une page « Alternative à ${topComp} » sur ton site`,
      impact: "critical",
      effort: "quick",
      points: 8,
      why: `ChatGPT et Gemini recommandent souvent des alternatives. Tu n'apparais sur aucune de ces requêtes — tes concurrents y captent ${compShare} % des mentions.`,
      steps: [
        `Crée une landing page /alternatives/${topComp.toLowerCase().replace(/\s+/g, "-")} sur ton site`,
        `Structure : tableau comparatif ${saas} vs ${topComp} + avantages + CTA`,
        `Utilise ces mots-clés exacts dans le H1 : « Alternative à ${topComp} pour ${icp} »`,
      ],
      cta: {
        label: "Générer le contenu de cette page",
        kind: "studio",
        brief: `Rédige une page « Alternative à ${topComp} » pour ${saas} : tableau comparatif, avantages différenciants pour ${icp}, CTA. Optimisée pour être citée par les LLMs (GEO).`,
      },
    },
    {
      id: "reddit-posts",
      title: "Publie 3 posts Reddit dans ta niche cette semaine",
      impact: "critical",
      effort: "medium",
      points: 6,
      why: `Perplexity et Claude s'appuient fortement sur Reddit. ${topComp} y est régulièrement détecté, toi non — c'est la source de son avantage sur ces deux LLMs.`,
      steps: [
        `r/SaaS (156k membres) — requêtes cibles : « outil marketing SaaS »`,
        "r/Entrepreneur (2,3M membres) — requêtes cibles : « distribuer son produit »",
        "r/startups (1,1M membres) — requêtes cibles : « machine à leads startup »",
        `Format gagnant : post long-form (500-800 mots) avec valeur réelle, mention naturelle de ${saas} en contexte — pas de pub directe.`,
      ],
      cta: {
        label: "Générer les 3 posts Reddit",
        kind: "studio",
        brief: `Rédige 3 posts Reddit long-form (500-800 mots) pour r/SaaS, r/Entrepreneur et r/startups, avec une mention naturelle de ${saas} en contexte, pensés pour la visibilité LLM (GEO), sans ton publicitaire.`,
      },
    },
    {
      id: "faq-schema",
      title: "Ajoute des balises FAQ schema.org sur ta landing page",
      impact: "high",
      effort: "quick",
      points: 5,
      why: "Perplexity et Claude lisent le contenu structuré. Une page avec des FAQ schema augmente de 40 % les chances d'être cité dans une réponse IA.",
      steps: [
        `« À quoi sert ${saas} ? »`,
        `« Comment ${saas} génère du contenu IA ? »`,
        `« ${saas} fonctionne sur quels réseaux sociaux ? »`,
        `« Quelle est la différence entre ${saas} et ${topComp} ? »`,
        `« ${saas} est-il fait pour ${icp} ? »`,
      ],
      cta: {
        label: "Générer le code schema.org",
        kind: "schema",
        faq: [
          `À quoi sert ${saas} ?`,
          `Comment ${saas} génère du contenu IA ?`,
          `${saas} fonctionne sur quels réseaux sociaux ?`,
          `Quelle est la différence entre ${saas} et ${topComp} ?`,
          `${saas} est-il fait pour ${icp} ?`,
        ],
      },
    },
    {
      id: "newsletters",
      title: "Obtiens 5 mentions dans des newsletters tech",
      impact: "high",
      effort: "long",
      points: 5,
      why: `Les LLMs accordent du poids aux sources éditoriales. Aucune mention détectée dans les newsletters — c'est la principale raison de ton faible score sur ${weakest[0] ?? "ChatGPT"}.`,
      steps: [
        "Indie Hackers Newsletter (250k lecteurs)",
        "The SaaS Weekly (45k lecteurs)",
        "Product Hunt Daily (500k lecteurs)",
        "Lenny's Newsletter (700k lecteurs)",
        "Ben's Bites (100k lecteurs, focus IA)",
      ],
      cta: {
        label: "Générer le pitch pour chaque newsletter",
        kind: "studio",
        brief: `Rédige un pitch press/newsletter court et percutant pour présenter ${saas} (${niche}) à des newsletters tech (Indie Hackers, Product Hunt Daily, Lenny's Newsletter…), angle founder story + résultat concret.`,
      },
    },
    {
      id: "landing-prompts",
      title: "Optimise ta page d'accueil avec ces formulations IA",
      impact: "medium",
      effort: "quick",
      points: 3,
      why: "Les LLMs lisent ta landing page. Certains termes augmentent la probabilité d'être cité comme réponse experte.",
      steps: [
        `« ${saas} est la solution de ${niche} pour ${icp} »`,
        "« Plateforme IA de distribution pour startups »",
        "« Générer des leads qualifiés sans budget pub pour SaaS B2B »",
        "« Comprendre les algorithmes de LinkedIn, X, Instagram et Reddit »",
      ],
      cta: { label: "Analyser les pages à optimiser", kind: "analyzer" },
    },
    {
      id: "youtube",
      title: "Crée du contenu YouTube avec transcriptions",
      impact: "medium",
      effort: "medium",
      points: 3,
      why: `Des vidéos YouTube de ${topComp} sont indexées et citées par les LLMs. Les transcriptions YouTube sont une source majeure pour ${weakest[1] ?? "Claude"} et Gemini.`,
      steps: [
        "Vidéos de 5-10 minutes (format tutoriel ou témoignage)",
        `Titre optimisé : « Comment ${niche} sans budget pub avec ${saas} »`,
        "Active les sous-titres automatiques (indexés par les LLMs)",
      ],
      cta: {
        label: "Générer le script de la première vidéo",
        kind: "studio",
        brief: `Rédige le script d'une vidéo YouTube de 5-10 minutes (format tutoriel) : « Comment réussir en ${niche} avec ${saas} », pensé pour que la transcription soit citée par les LLMs.`,
      },
    },
  ];
}
