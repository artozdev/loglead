import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import {
  ALGO_NETWORKS,
  algoNetworkLabel,
  campaignChannelLabel,
  computeScoreTotal,
  languageLabel,
  leadChannelLabel,
  SCORE_CRITERIA,
  TONES,
  type AlgoNetwork,
  type AlgoNetworkInsight,
  type AnalysisCriterion,
  type AnalysisKind,
  type AnalysisVerdict,
  type BriefVariant,
  type CloneResult,
  type CampaignChannel,
  type CmoActionType,
  type LeadChannel,
  type LeadScoreBreakdown,
  type LeadScoreCriterion,
  type LeadScoreWeights,
  type LeadSignals,
  type Platform,
  type Profile,
  type ProspectSource,
  type RecommendedAction,
  type SearchCriteria,
  type SearchIntent,
  type Tone,
} from "./types";

// ---------------------------------------------------------------------------
// The differentiation engine.
//
// Every generation injects the founder's full profile (offer, ICP, the 3
// direct competitors, tone, platform, goal) into the system prompt — this is
// what makes the output personalized rather than generic.
//
// Model: claude-opus-4-8 with structured (JSON) output. When ANTHROPIC_API_KEY
// is missing we fall back to a deterministic, profile-aware mock so the whole
// product is testable in "demo mode" without a key.
// ---------------------------------------------------------------------------

const MODEL = "claude-opus-4-8";

export function isDemoMode(): boolean {
  return !process.env.ANTHROPIC_API_KEY;
}

function toneLine(tone: Profile["tone"]): string {
  const t = TONES.find((x) => x.value === tone);
  return t ? `${t.label} (${t.hint})` : tone;
}

function profileContext(profile: Profile): string {
  const comps = profile.competitors.filter(Boolean);
  const diffs = profile.competitorDiffs ?? [];
  const competitors =
    comps
      .map((c, i) => (diffs[i] ? `${c} (différence : ${diffs[i]})` : c))
      .join(", ") || "non renseignés";
  const lines = [
    `SaaS : ${profile.saasName}`,
    `Offre : ${profile.offer}`,
    `Proposition de valeur : ${profile.valueProp}`,
    `Audience cible (ICP) : ${profile.icp}`,
  ];
  if (profile.sector) lines.push(`Secteur : ${profile.sector}`);
  if (profile.companySizes?.length)
    lines.push(`Taille des entreprises ciblées : ${profile.companySizes.join(", ")}`);
  if (profile.problem) lines.push(`Problème principal résolu : ${profile.problem}`);
  lines.push(`Concurrents directs : ${competitors}`);
  lines.push(`Ton de voix : ${toneLine(profile.tone)}`);
  if (profile.frequency) lines.push(`Fréquence de publication : ${profile.frequency}`);
  lines.push(`Objectif principal : ${profile.goal}`);
  return lines.join("\n");
}

const SYSTEM_BASE = `Tu es le copywriter senior de LogLead, un studio de contenu pour founders de SaaS.
Tu écris en français, prêt-à-publier, sans fioritures ni clichés d'IA.
Règles :
- Adopte précisément le ton de voix demandé.
- Différencie le founder de ses concurrents directs : mets en avant l'angle unique de SON offre, n'imite jamais le positionnement des concurrents.
- N'invente jamais de chiffres, témoignages ou résultats précis ; reste crédible et concret.
- Le hook doit donner envie de lire la suite dès la première ligne.
- Le CTA doit servir l'objectif principal du founder.
- N'utilise pas de hashtags sauf si pertinent pour la plateforme.`;

// Pull the first JSON object out of a model response, tolerant of any prose.
function extractJSON<T>(text: string): T {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Réponse du modèle illisible (JSON introuvable).");
  }
  return JSON.parse(text.slice(start, end + 1)) as T;
}

// Sonnet 4.6 is the default for creative Studio generation (best quality/speed);
// other flows keep Opus via the `model` override.
const GEN_MODEL = "claude-sonnet-4-6";

async function callJSON<T>(args: {
  system: string;
  user: string;
  schema: Record<string, unknown>;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<T> {
  const client = new Anthropic();
  let message;
  try {
    message = await client.messages.create({
      model: args.model ?? MODEL,
      max_tokens: args.maxTokens ?? 8000,
      ...(args.temperature !== undefined ? { temperature: args.temperature } : {}),
      system: args.system,
      messages: [{ role: "user", content: args.user }],
      // Structured output — guarantees parseable JSON on supporting models.
      // Cast keeps us compatible across SDK minor versions.
      output_config: {
        format: { type: "json_schema", schema: args.schema },
      },
    } as unknown as Anthropic.MessageCreateParamsNonStreaming);
  } catch (err) {
    throw toFriendlyError(err);
  }
  const text = message.content.find((b) => b.type === "text");
  if (!text || text.type !== "text") {
    throw new Error("Réponse vide du modèle.");
  }
  return extractJSON<T>(text.text);
}

// Free-form market Q&A for the Market page ("Ask your market"). Analyst-brief
// style; never invents precise numbers (funding amounts, impressions, %) since
// those would require real LinkedIn/Apify data.
export async function askMarket(
  profile: Profile,
  question: string,
): Promise<string> {
  if (isDemoMode()) {
    return "Mode démo : ajoute une clé Claude (ANTHROPIC_API_KEY) avec des crédits pour obtenir une vraie analyse de ton marché.";
  }
  const system = `Tu es l'analyste de marché de LogLead. Réponds en français, façon brief d'analyste : concis, factuel, structuré en phrases fluides (pas de listes à puces inutiles). Appuie-toi sur le contexte du workspace ci-dessous. N'invente JAMAIS de chiffres précis (montants de levées, impressions, pourcentages, nombres de posts) : si la donnée n'est pas fournie, dis-le clairement et explique comment l'obtenir (ex. scraping LinkedIn). Reste utile et actionnable.`;
  const user = `Contexte du workspace :\n${profileContext(profile)}\n\nQuestion : ${question}`;
  const client = new Anthropic();
  let message;
  try {
    message = await client.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: user }],
    });
  } catch (err) {
    throw toFriendlyError(err);
  }
  const text = message.content.find((b) => b.type === "text");
  return text && text.type === "text" ? text.text.trim() : "Réponse vide du modèle.";
}

// ----- Market analysis from scraped LinkedIn posts -------------------------

export type MarketAnalysis = {
  marketScore: number;
  headline: string;
  trends: { topic: string; summary: string; momentum: "hot" | "rising" | "steady" }[];
  audienceTopics: string[];
  audienceQuestions: string[];
  audiencePainPoints: string[];
  signals: { title: string; who: string; why: string; kind: string }[];
  recommendations: string[];
};

const MARKET_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    marketScore: { type: "integer" },
    headline: { type: "string" },
    trends: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          topic: { type: "string" },
          summary: { type: "string" },
          momentum: { type: "string", enum: ["hot", "rising", "steady"] },
        },
        required: ["topic", "summary", "momentum"],
      },
    },
    audienceTopics: { type: "array", items: { type: "string" } },
    audienceQuestions: { type: "array", items: { type: "string" } },
    audiencePainPoints: { type: "array", items: { type: "string" } },
    signals: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          who: { type: "string" },
          why: { type: "string" },
          kind: { type: "string" },
        },
        required: ["title", "who", "why", "kind"],
      },
    },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: [
    "marketScore",
    "headline",
    "trends",
    "audienceTopics",
    "audienceQuestions",
    "audiencePainPoints",
    "signals",
    "recommendations",
  ],
} as const;

// Analyze real scraped LinkedIn posts into a structured market report. Grounded
// strictly in the provided posts — the model must not invent data.
export async function analyzeMarket(
  profile: Profile,
  posts: { content: string; author?: string; likes?: number; comments?: number }[],
): Promise<MarketAnalysis> {
  if (isDemoMode()) {
    throw new Error(
      "Mode démo : ajoute une clé Claude (ANTHROPIC_API_KEY) pour analyser ton marché.",
    );
  }
  const corpus = posts
    .slice(0, 40)
    .map((p, i) => {
      const eng = [
        p.likes != null ? `${p.likes} likes` : null,
        p.comments != null ? `${p.comments} commentaires` : null,
      ]
        .filter(Boolean)
        .join(", ");
      return `Post ${i + 1}${p.author ? ` — ${p.author}` : ""}${eng ? ` (${eng})` : ""}\n${p.content.slice(0, 700)}`;
    })
    .join("\n\n---\n\n");

  const system = `Tu es l'analyste de marché de LogLead. On te fournit de VRAIS posts LinkedIn récents, scrapés sur le marché du founder. Analyse-les et renvoie un rapport structuré en français. Règles STRICTES :
- Base-toi UNIQUEMENT sur les posts fournis. N'invente aucun chiffre, nom ou fait absent des posts.
- Les tendances doivent refléter ce dont parlent réellement ces posts.
- Les signaux d'achat = personnes/entreprises des posts qui montrent un besoin (recrutement, levée, lancement, frustration exprimée).
- marketScore (0-100) = à quel point le marché est dynamique et porteur d'opportunités d'après les posts.
- Sois concret et actionnable. Réponds uniquement en JSON.`;

  const user = `Contexte du founder :\n${profileContext(profile)}\n\n${posts.length} posts LinkedIn récents analysés :\n\n"""\n${corpus.slice(0, 14000)}\n"""\n\nProduis : marketScore, headline (brief analyste 2-3 phrases), trends (3-5), audienceTopics (5 mots-clés), audienceQuestions (3), audiencePainPoints (3), signals (3-5), recommendations (3 actions concrètes pour la semaine).`;

  return callJSON<MarketAnalysis>({
    system,
    user,
    schema: MARKET_SCHEMA as unknown as Record<string, unknown>,
    model: MODEL,
    maxTokens: 3000,
  });
}

// ----- LogAgent: analyze a natural-language search query -------------------

export type SearchAnalysis = {
  intent: SearchIntent;
  title: string;
  criteria: SearchCriteria;
  sources: ProspectSource[];
};

const SEARCH_ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: { type: "string", enum: ["prospect_search", "pipeline_analysis", "message_generation", "general"] },
    title: { type: "string" },
    criteria: {
      type: "object",
      additionalProperties: false,
      properties: {
        type: { type: "string", enum: ["company", "person", "local_business"] },
        sector: { type: "string" },
        signal: { type: "string" },
        jobTitle: { type: "string" },
        location: { type: "string" },
        sizeMin: { type: "integer" },
        sizeMax: { type: "integer" },
        keywords: { type: "array", items: { type: "string" } },
      },
      required: [],
    },
    sources: {
      type: "array",
      items: { type: "string", enum: ["linkedin_jobs", "linkedin_company", "google_maps", "google_search", "instagram", "tiktok", "facebook", "twitter"] },
    },
  },
  required: ["intent", "title", "criteria", "sources"],
} as const;

// Detect intent + parse criteria + pick sources for a LogAgent query, in one
// call. `sources` is limited to the V1 scrapers.
export async function analyzeSearchQuery(query: string): Promise<SearchAnalysis> {
  if (isDemoMode()) {
    return { intent: "prospect_search", title: query.slice(0, 60), criteria: { keywords: [query] }, sources: ["linkedin_jobs", "google_search"] };
  }
  const system = `Tu es le routeur du copilote LogAgent (prospection B2B). Analyse la requête de l'utilisateur et renvoie du JSON.
- intent : "prospect_search" (chercher des entreprises/personnes), "pipeline_analysis" (analyser ses prospects existants), "message_generation" (rédiger un message), "general" (question).
- title : un titre court et clair de la recherche (max 8 mots), dans la langue de la requête.
- criteria : critères extraits (type d'entité, secteur, signal comme "job_posting"/"no_website"/"low_rating", intitulé de poste, localisation, taille min/max, mots-clés).
- sources : parmi ["linkedin_jobs","linkedin_company","google_maps","google_search","instagram","tiktok","facebook","twitter"], choisis les plus pertinentes. Recrutement → linkedin_jobs. Commerces/PME locales/restaurants → google_maps. Recherche sectorielle large → google_search. Pages entreprises → linkedin_company. Créateurs/marques/influence sur un réseau social → instagram, tiktok, facebook ou twitter selon le réseau cité.
N'invente rien : si un critère est absent, omets-le.`;
  const user = `Requête : "${query}"`;
  return callJSON<SearchAnalysis>({
    system,
    user,
    schema: SEARCH_ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
    model: MODEL,
    maxTokens: 600,
  });
}

// ----- Onboarding: turn offer + target into a first Scout search query ------

export async function generateFirstSearchQuery(input: {
  offer: string;
  target?: string;
  profileType?: string;
}): Promise<string> {
  const fallback = (input.target?.trim() || `Businesses that need ${input.offer}`).slice(0, 150);
  if (isDemoMode()) return fallback;
  try {
    const res = await callJSON<{ query: string }>({
      system:
        "You turn a seller's offer and their ideal target into ONE concrete natural-language prospect search query for a B2B prospecting tool. Output in English, under 150 characters, specific and actionable (include a place or buying signal when implied). No surrounding quotes.",
      user: `Offer: ${input.offer}\nIdeal target: ${input.target || "(not specified)"}\nProfile: ${input.profileType || "(unknown)"}\n\nReturn the single best first search query.`,
      schema: {
        type: "object",
        additionalProperties: false,
        properties: { query: { type: "string" } },
        required: ["query"],
      },
      temperature: 0.4,
      maxTokens: 300,
    });
    const q = (res.query || "").trim().replace(/^["']|["']$/g, "");
    return q ? q.slice(0, 150) : fallback;
  } catch {
    return fallback;
  }
}

// ----- LogAgent: score prospect candidates against the ICP + criteria -------

export type ScoredProspect = { fitScore: number; fitReasoning: string };

const SCORE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    scores: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { fitScore: { type: "integer" }, reasoning: { type: "string" } },
        required: ["fitScore", "reasoning"],
      },
    },
  },
  required: ["scores"],
} as const;

// Batch-score candidates (one Claude call). Returns one entry per candidate,
// in order. Falls back to a heuristic in demo mode.
export async function scoreProspects(
  profile: Profile,
  criteria: { sector?: string; jobTitle?: string; location?: string; signal?: string },
  candidates: { companyName: string; companySector?: string; companyLocation?: string; signalDescription?: string; rating?: number }[],
): Promise<ScoredProspect[]> {
  const list = candidates.slice(0, 20);
  if (isDemoMode()) {
    return list.map((c) => ({
      fitScore: Math.max(40, Math.min(95, 70 + (c.rating != null ? Math.round((c.rating - 3.5) * 8) : 0))),
      fitReasoning: c.signalDescription ?? "Correspond aux critères de recherche.",
    }));
  }
  const system = `Tu notes des prospects B2B pour un founder. Pour chaque candidat, donne un fitScore 0-100 (à quel point il correspond à l'ICP et aux critères de recherche) et une raison en 1 phrase (français). Sois discriminant : réserve >85 aux correspondances vraiment fortes. Réponds uniquement en JSON, un score par candidat, dans l'ordre.`;
  const user = `ICP du founder : ${profile.icp}
Secteur du founder : ${profile.sector ?? "non précisé"}
Critères de recherche : ${JSON.stringify(criteria)}

Candidats :
${list.map((c, i) => `${i + 1}. ${c.companyName}${c.companySector ? ` — ${c.companySector}` : ""}${c.companyLocation ? ` (${c.companyLocation})` : ""}${c.signalDescription ? ` — signal : ${c.signalDescription}` : ""}${c.rating != null ? ` — note ${c.rating}` : ""}`).join("\n")}`;

  try {
    const data = await callJSON<{ scores: ScoredProspect[] }>({
      system,
      user,
      schema: SCORE_SCHEMA as unknown as Record<string, unknown>,
      model: GEN_MODEL,
      maxTokens: 2000,
    });
    return list.map((c, i) => data.scores[i] ?? { fitScore: 60, fitReasoning: c.signalDescription ?? "" });
  } catch {
    return list.map((c) => ({ fitScore: 60, fitReasoning: c.signalDescription ?? "" }));
  }
}

// ----- LogAgent: draft a personalized outreach message ---------------------

export type ProspectMessage = { message: string; score: number; reasons: string[] };

const MESSAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    message: { type: "string" },
    score: { type: "integer" },
    reasons: { type: "array", items: { type: "string" } },
  },
  required: ["message", "score", "reasons"],
} as const;

const CHANNEL_HINT: Record<string, string> = {
  linkedin: "DM LinkedIn : court (4-6 lignes), tutoiement, pas de formule de politesse ampoulée, une seule question de clôture.",
  email: "Email : objet implicite, 5-8 lignes, ton pro mais direct, signature avec le prénom.",
  whatsapp: "WhatsApp : très court (2-4 lignes), ton chaleureux et informel, une question simple.",
};

// Write a personalized first-touch message for a prospect, grounded in the real
// signal. Never invents facts. Returns the message + a quality score + reasons.
export async function draftProspectMessage(
  profile: Profile,
  prospect: { companyName: string; contactName?: string; signalDescription?: string; fitReasoning?: string; companySector?: string },
  channel: "linkedin" | "email" | "whatsapp",
): Promise<ProspectMessage> {
  const firstName = prospect.contactName?.split(/\s+/)[0] ?? "";
  if (isDemoMode()) {
    return {
      message: `Salut${firstName ? " " + firstName : ""},\n\nJ'ai vu ${prospect.signalDescription ?? "votre activité"} — ça m'a fait penser à ce qu'on fait chez ${profile.saasName}.\n\nTu aurais 15 min cette semaine pour en parler ?\n\n${profile.saasName}`,
      score: 80,
      reasons: ["Référence un signal réel", "Court et direct", "Question de clôture naturelle"],
    };
  }
  const system = `Tu écris un premier message de prise de contact B2B pour ${profile.saasName}. ${CHANNEL_HINT[channel]}
Règles ABSOLUES : appuie-toi UNIQUEMENT sur le signal réel fourni, n'invente aucun fait. Pas de pitch commercial lourd, crée de la curiosité. Écris en français, dans un ton naturel et humain (jamais "IA LinkedIn"). Termine par UNE question ouverte. Renvoie aussi un score 0-100 (qualité du message) et 3 raisons courtes de son efficacité.`;
  const user = `Offre : ${profile.offer}
Proposition de valeur : ${profile.valueProp}
ICP : ${profile.icp}

Prospect : ${prospect.contactName ?? prospect.companyName}${prospect.companySector ? ` (${prospect.companySector})` : ""}
Entreprise : ${prospect.companyName}
Signal réel détecté : ${prospect.signalDescription ?? "aucun signal spécifique"}
Contexte : ${prospect.fitReasoning ?? ""}

Rédige le message (canal : ${channel}).`;

  return callJSON<ProspectMessage>({
    system,
    user,
    schema: MESSAGE_SCHEMA as unknown as Record<string, unknown>,
    model: GEN_MODEL,
    temperature: 0.85,
    maxTokens: 1200,
  });
}

function toFriendlyError(err: unknown): Error {
  if (err instanceof Anthropic.AuthenticationError) {
    return new Error(
      "Clé Claude API invalide. Vérifie ANTHROPIC_API_KEY dans .env.local.",
    );
  }
  if (err instanceof Anthropic.RateLimitError) {
    return new Error("Limite de requêtes Claude atteinte. Réessaie dans un instant.");
  }
  if (err instanceof Anthropic.APIError) {
    return new Error(`Erreur Claude API : ${err.message}`);
  }
  return err instanceof Error ? err : new Error("Erreur de génération inconnue.");
}

// ----- Step 1: analyze a SaaS site -----------------------------------------

export type SiteAnalysis = {
  name: string;
  description: string;
  valueProp: string;
  icp: string;
  tone: Tone;
};

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    nom: { type: "string" },
    description: { type: "string" },
    valeur_proposee: { type: "string" },
    icp_pressenti: { type: "string" },
    ton_detecte: {
      type: "string",
      enum: ["direct", "expert", "challenger", "fun"],
    },
  },
  required: ["nom", "description", "valeur_proposee", "icp_pressenti", "ton_detecte"],
} as const;

export async function analyzeSite(
  pageText: string,
  url: string,
): Promise<SiteAnalysis> {
  if (isDemoMode()) return mockAnalyze(url);

  const system = `Tu analyses la page d'un SaaS (site, app ou page de vente) et tu en extrais des informations structurées, factuelles, en français. N'invente rien : si une info est absente, déduis-la prudemment du contenu. Réponds uniquement en JSON.`;
  const user = `URL : ${url}

Contenu de la page :
"""
${pageText.slice(0, 6000)}
"""

Extrais :
- nom : le nom du SaaS
- description : l'offre en 1-2 phrases
- valeur_proposee : la proposition de valeur principale
- icp_pressenti : l'audience cible pressentie (profil d'acheteur)
- ton_detecte : le ton de communication du site, parmi "direct", "expert", "challenger", "fun".
Réponds en JSON : { "nom": string, "description": string, "valeur_proposee": string, "icp_pressenti": string, "ton_detecte": string }.`;

  const raw = await callJSON<{
    nom: string;
    description: string;
    valeur_proposee: string;
    icp_pressenti: string;
    ton_detecte: string;
  }>({ system, user, schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown> });

  const validTones: Tone[] = ["direct", "expert", "challenger", "fun"];
  const tone = validTones.includes(raw.ton_detecte as Tone)
    ? (raw.ton_detecte as Tone)
    : "expert";

  return {
    name: raw.nom,
    description: raw.description,
    valueProp: raw.valeur_proposee,
    icp: raw.icp_pressenti,
    tone,
  };
}

function mockAnalyze(url: string): SiteAnalysis {
  let host = "ton-saas";
  try {
    host = new URL(url).hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    /* keep default */
  }
  const name = host.charAt(0).toUpperCase() + host.slice(1);
  return {
    name: `${name} (démo)`,
    description: `${name} aide les équipes à aller plus vite sur leur cœur de métier, sans friction.`,
    valueProp: "Gagner du temps et des résultats concrets, sans complexité.",
    icp: "Founders et équipes de SaaS B2B early-stage",
    tone: "expert",
  };
}

// ----- Brief generation ----------------------------------------------------

const clampScore = (n: number) =>
  typeof n === "number" ? Math.max(0, Math.min(100, Math.round(n))) : 70;

const TONE_RULES: Record<Tone, string> = {
  direct:
    "Phrases courtes. Beaucoup. Va droit au but dès le mot 1, tutoiement, commence souvent par un fait ou une affirmation tranchée.",
  expert:
    "Données/chiffres accessibles (jamais académiques). Profondeur de connaissance sans condescendance. Des insights qu'on ne trouve pas ailleurs.",
  storytelling:
    "Commence toujours par une scène concrète, pas une morale. Détails sensoriels qui rendent la scène réelle. La leçon arrive à la fin, jamais au début.",
  challenger:
    "Contredis une croyance commune de la niche. Provoque une réaction — mais avec des arguments solides, pas du clash gratuit.",
  fun: "Léger, accessible, une pointe d'humour — jamais gadget ni forcé.",
};

const ANTI_AI = `RÈGLES ABSOLUES — UNE VIOLATION = RÉÉCRIRE :
- Jamais : "Il est important de", "Dans le monde actuel", "N'oubliez pas", "N'hésitez pas", "En conclusion", "Il est indéniable", "Cela dit", "Pour résumer", "Aujourd'hui je veux vous parler de". Ne commence jamais par "Je suis ravi/fier/heureux de…", ni une phrase par "Cependant"/"Néanmoins".
- Jamais de mots vagues corporate : "solutions", "synergie", "valeur ajoutée", "écosystème", "paradigme".
- Jamais les mots "ghostwriter", "copywriter", "prompt", "IA", "intelligence artificielle" dans le contenu.
- Max 2 emojis par contenu, jamais en début de phrase. Aucun hashtag générique.
- Aucune liste numérotée dans un post texte (sauf si le format l'exige explicitement).
- Varie la longueur des phrases (alterne 3-5 mots et 10-15 mots). Le hook crée un pattern interrupt dès les 5 premiers mots.
- Mentionne le SaaS une fois maximum, naturellement. CTA conversationnel, jamais "N'hésitez pas à me contacter".
- Chiffres crédibles et spécifiques (jamais "des milliers"). Termine sur ce qui donne envie de réagir ou de partager.
- Test permanent : "Est-ce qu'un humain expert dans cette niche aurait pu écrire exactement ça ?" Si non, réécris.`;

// "Style IA LinkedIn" formulas to avoid by reflex — only allowed if they're
// genuinely part of the user's real language.
const AI_CLICHE_BANLIST = `Formules "style IA LinkedIn" à NE PAS utiliser par réflexe (uniquement si c'est réellement SON langage) : "Voici ce que j'ai appris", "La vérité c'est que", "Personne ne vous dit que", "Le problème n'est pas X, c'est Y", "J'ai longtemps pensé que", "Et puis j'ai compris une chose", "3 leçons que j'aurais aimé connaître plus tôt", "Si vous êtes entrepreneur, lisez ceci", "Arrêtez de faire X", "Vous n'avez pas besoin de X, vous avez besoin de Y", "La plupart des gens…", "Spoiler :", "On en parle ?", "La leçon ?", "Retenez bien ceci". Ce ne sont pas des mots interdits, mais ne les emploie jamais juste parce que "ça marche" sur LinkedIn.`;

// The 9 voice-mimicry rules — write like the user, not like generic AI LinkedIn.
function voiceMimicryRules(firstName: string): string {
  return `PRIORITÉ ABSOLUE — RESSEMBLER À ${firstName}, PAS À "UN CRÉATEUR LINKEDIN" :
1. APPRENDS SA VOIX depuis ses anciens posts (fournis plus bas) : vocabulaire, expressions, tournures, longueur et rythme des phrases, niveau de langage, spontanéité, humour, style d'argumentation, façon d'ouvrir ET de conclure un post, usage des emojis, des retours à la ligne, de la ponctuation, formulations récurrentes, et ce qu'il/elle n'utilise JAMAIS. Imite la VOIX, jamais le contenu — ne recopie aucun ancien post. Test de réussite : si on remplaçait la signature par le nom de ${firstName}, personne ne verrait la différence.
2. N'écris JAMAIS "comme un créateur LinkedIn". Fuis les recettes omniprésentes (hook choc → phrases ultra-courtes → "et voici pourquoi" → 3 ou 5 points → leçon → conclusion inspirante → question à l'audience) SAUF si c'est réellement le style naturel de ${firstName}.
3. Chaque post doit pouvoir se différencier de la masse des posts générés par IA (voir la ban-list ci-dessous).
4. PAS DE FAUSSE AUTHENTICITÉ : n'ajoute jamais anecdote, émotion, vulnérabilité, détail perso, opinion provocatrice ou histoire INVENTÉS pour créer de l'engagement. N'invente JAMAIS une expérience vécue. Si l'info n'est pas fournie, ne l'invente pas. Une petite idée honnête vaut mieux qu'une grande histoire fabriquée.
5. DÉTAILS CONCRETS : privilégie le spécifique au contexte réel de ${firstName} plutôt que le générique ("cette expérience m'a appris la persévérance" = à bannir). On doit ressentir "cette personne était vraiment là", pas "une IA a construit une histoire pour illustrer une morale".
6. LAISSE DE LA PERSONNALITÉ si ça colle à ses posts : phrases longues ou très courtes, parenthèses, interruptions, digressions, formulations imparfaites, opinions tranchées, ironie, changements de rythme. Ne "nettoie" pas le texte pour le rendre parfait. Imparfait mais reconnaissable > parfait mais générique.
7. CHAQUE POST DIFFÉRENT : ne réutilise pas le même hook, la même longueur, la même structure, le même nombre de paragraphes, le même type de conclusion ni les mêmes expressions. Deux posts doivent avoir des FORMES très différentes tout en restant immédiatement reconnaissables comme venant de ${firstName}. La cohérence vient de la voix, pas d'un template.
8. NE SUR-OPTIMISE PAS POUR L'ALGO : n'ajoute pas question finale, appel aux commentaires, emojis, listes, phrases choc, lignes vides ou hashtags UNIQUEMENT parce que "ça booste la portée". Seulement si ${firstName} le fait naturellement.
9. UNE VRAIE PENSÉE : chaque post doit porter une opinion, une observation ou une expérience qui appartient VRAIMENT à ${firstName}. Si ce n'est qu'une banalité que n'importe qui pourrait écrire, trouve un angle plus personnel.`;
}

// Platform-specific hook & format codes (2026), injected per generation.
const PLATFORM_HOOKS: Record<AlgoNetwork, string> = {
  linkedin: `LinkedIn 2026 : les 3 premières lignes (avant "voir plus") font tout. Hooks qui marchent : chiffre surprenant / affirmation contrariante / question sur une douleur précise / "J'ai [fait X] — voici ce que j'ai appris" / pattern interrupt ("Stop."). Lignes courtes seules > paragraphes denses ; saut de ligne après chaque phrase importante. Longueur : 150-300 mots (engagement) ou 800-1200 (visibilité). Hashtags : 0-3 max, jamais en vrac.`,
  x: `X 2026 : tweet seul = max 240 caractères, percutant, autonome. Thread = 1 tweet hook → 3-7 tweets (1 idée par tweet, chacun lisible seul, 200-240 caractères) → conclusion + CTA. Jamais de "🧵 Thread :" — le hook suffit.`,
  instagram: `Instagram 2026 : 1re ligne = hook textuel (visible sans cliquer "plus"). Corps court 50-150 mots. CTA vers lien bio ou commentaires. 3-8 hashtags pertinents à la niche (jamais génériques).`,
  reddit: `Reddit 2026 : le titre = le hook le plus important (doit marcher seul). Corps conversationnel, long-form accepté, valeur RÉELLE. Zéro auto-promo directe — la valeur d'abord, le SaaS en contexte seulement si pertinent. Réponds à une vraie douleur du subreddit.`,
};

function formatStructure(network: AlgoNetwork, format: string): string {
  const f = format.toLowerCase();
  if (/reel|script|story|vidéo|video/.test(f))
    return "Structure script vidéo : [HOOK 0-3s, max 10 mots, lisible sans le son] → [PROBLÈME : agiter la douleur] → [PIVOT : la promesse] → [VALEUR : démonstration concrète] → [CTA : une seule action naturelle].";
  if (/thread/.test(f))
    return "Structure thread : tweet 1 = hook autonome ; tweets 2-8 = 1 idée par tweet (lisibles seuls) ; dernier tweet = résumé + CTA.";
  if (network === "reddit")
    return "Structure Reddit : TITRE = affirmation/question la plus précise possible ; INTRO = contexte perso 2-3 phrases (crédibilité) ; CORPS = valeur détaillée + exemples concrets ; NUANCE = les limites ; FIN = question ouverte à la communauté.";
  return "Structure post long-form : LIGNE 1 = hook seul ; ligne vide ; développement 2 lignes ; corps en paragraphes courts (2-3 lignes) ; chaque insight important seul sur sa ligne ; fin = question ouverte OU statement fort ; hashtags 0-3.";
}

// ----- Voice profile (Source A + C) : style rules from existing posts --------
export function buildVoiceProfile(posts: string[]): string {
  const clean = posts.map((p) => p.trim()).filter((p) => p.length > 20).slice(0, 10);
  if (clean.length < 2)
    return "- Pas encore assez de contenu publié pour extraire une signature — applique le ton choisi, reste spécifique et naturel.";
  const sentences = clean.flatMap((p) => p.split(/[.!?\n]+/).map((s) => s.trim()).filter(Boolean));
  const avgWords = Math.round(sentences.reduce((a, s) => a + s.split(/\s+/).length, 0) / Math.max(1, sentences.length));
  const emoji = clean.reduce((a, p) => a + (p.match(/\p{Extended_Pictographic}/gu)?.length ?? 0), 0);
  const hashtags = clean.reduce((a, p) => a + (p.match(/#\w+/g)?.length ?? 0), 0);
  const tu = clean.filter((p) => /\b(tu|ton|tes|toi)\b/i.test(p)).length;
  const vous = clean.filter((p) => /\b(vous|votre|vos)\b/i.test(p)).length;
  const qOpen = clean.filter((p) => /^[^.\n]{0,80}\?/.test(p)).length;
  const numOpen = clean.filter((p) => /^\s*\d/.test(p)).length;

  const rules: string[] = [];
  rules.push(avgWords <= 8 ? "Écrit en phrases très courtes (souvent une idée = une ligne)." : avgWords <= 14 ? "Alterne phrases courtes et moyennes, rythme dynamique." : "Phrases plutôt développées mais toujours claires.");
  rules.push(tu >= vous ? "Tutoie toujours (\"tu\", jamais \"vous\")." : "Vouvoie son audience.");
  rules.push(emoji === 0 ? "N'utilise jamais d'emoji." : emoji <= clean.length ? "Utilise les emojis avec parcimonie (0-1 par contenu)." : "Utilise volontiers quelques emojis bien placés.");
  rules.push(hashtags === 0 ? "Ne met jamais de hashtags." : "Termine par quelques hashtags ciblés.");
  rules.push(qOpen >= 3 ? "Ouvre souvent par une question." : numOpen >= 3 ? "Ouvre souvent par un chiffre." : "Ouvre par une affirmation courte et frappante.");
  rules.push("Met les phrases importantes seules sur leur ligne.");
  return rules.map((r) => `- ${r}`).join("\n");
}

function genSystem(
  profile: Profile,
  firstName: string,
  voiceProfile: string,
  samples: string[] = [],
): string {
  // Raw samples of the user's real posts — the model reproduces the voice from
  // these (never copies them). Only injected when we have enough signal.
  const clean = samples.map((p) => p.trim()).filter((p) => p.length > 40).slice(0, 6);
  const samplesBlock =
    clean.length >= 2
      ? `\n\nANCIENS POSTS DE ${firstName} — analyse-les pour reproduire sa voix (vocabulaire, rythme, ouvertures, ponctuation…). NE LES RECOPIE JAMAIS, imite seulement la voix :\n${clean.map((p, i) => `--- Post ${i + 1} ---\n${p.slice(0, 600)}`).join("\n\n")}`
      : `\n\n(Pas encore assez d'anciens posts pour extraire une empreinte vocale fiable — applique le ton choisi, reste spécifique, honnête et humain, et évite absolument le "style IA LinkedIn".)`;

  return `Tu es le ghostwriter numéro 1 de ${firstName}, fondateur·rice de ${profile.saasName}. Tu connais parfaitement sa voix, son style, sa niche et son audience. Tu écris POUR lui/elle — jamais comme une IA générique.

Avant d'écrire, décompose la demande EN INTERNE (ne l'affiche pas) : (1) l'intention réelle, (2) l'audience et ses douleurs, (3) l'angle différenciant propre à ${firstName}, (4) la structure optimale — puis écris.

Profil du founder :
${profileContext(profile)}

${voiceMimicryRules(firstName)}

Signature de style extraite de ses posts (à appliquer à CHAQUE contenu) :
${voiceProfile}

${AI_CLICHE_BANLIST}

${ANTI_AI}${samplesBlock}`;
}

const VARIANT_ITEM_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    content: { type: "string" },
    hookScore: { type: "number" },
    hookReason: { type: "string" },
    hookType: { type: "string" },
    angle: { type: "string" },
    whyNiche: { type: "string" },
    scores: {
      type: "object",
      additionalProperties: false,
      properties: {
        hook: { type: "number" },
        structure: { type: "number" },
        voice: { type: "number" },
        platform: { type: "number" },
      },
      required: ["hook", "structure", "voice", "platform"],
    },
    strengths: { type: "array", items: { type: "string" } },
    improvements: { type: "array", items: { type: "string" } },
  },
  required: ["content", "hookScore", "hookReason", "hookType", "angle", "whyNiche", "scores", "strengths", "improvements"],
} as const;

const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { variants: { type: "array", items: VARIANT_ITEM_SCHEMA } },
  required: ["variants"],
} as const;

export type BriefInput = {
  network: AlgoNetwork;
  format: string; // human label, e.g. "Thread"
  topic: string;
  technique?: string;
  tone?: Tone;
  // Studio v3 wizard fields (all optional — back-compat with the classic editor).
  language?: string; // language code, e.g. "en" (defaults to French)
  objective?: string; // label, e.g. "Générer des leads"
  audience?: string; // targeted audience, e.g. "Founders SaaS B2B early-stage"
  context?: string; // extra info to include
  toneLabel?: string; // free-form tone chip beyond the Tone enum, e.g. "Provocateur"
};
export type BriefContext = { firstName: string; existingPosts?: string[] };

// Wizard context block injected into the generation prompt (empty lines omitted).
function wizardLines(input: BriefInput): string {
  const lines: string[] = [];
  if (input.objective) lines.push(`Objectif du post : ${input.objective}`);
  if (input.audience) lines.push(`Audience ciblée : ${input.audience}`);
  if (input.toneLabel) lines.push(`Ton souhaité : ${input.toneLabel}`);
  if (input.context) lines.push(`Contexte / infos à inclure : ${input.context}`);
  return lines.length ? `${lines.join("\n")}\n` : "";
}

// Force-language directive. French (default / empty) → no directive.
function langDirective(language?: string): string {
  if (!language || language === "fr") return "";
  return `Écris INTÉGRALEMENT en ${languageLabel(language)} — tout le contenu, hooks et CTA compris.\n`;
}

const VARIANT_FIELDS = `- "content" : contenu complet, prêt à copier-coller, formaté pour la plateforme (respecte sa longueur naturelle).
- "hookScore" : entier 0-100 (force de l'accroche). "hookReason" : 1 phrase (pourquoi, comment améliorer).
- "hookType" : type du hook (Chiffre surprenant / Affirmation contrariante / Question douleur / Scène / Pattern interrupt / Promesse).
- "angle" : nom court de l'angle. "whyNiche" : 1 phrase (pourquoi c'est adapté à sa niche).
- "scores" : { "hook", "structure", "voice", "platform" } chacun 0-100 (voice = à quel point ça sonne comme ce founder ; platform = respect des codes de la plateforme).
- "strengths" : 2 points forts courts. "improvements" : 2 suggestions précises et actionnables.`;

function normalizeVariant(v: BriefVariant): BriefVariant {
  const s = v.scores ?? { hook: v.hookScore, structure: 70, voice: 70, platform: 70 };
  return {
    ...v,
    hookScore: clampScore(v.hookScore ?? s.hook),
    scores: {
      hook: clampScore(s.hook),
      structure: clampScore(s.structure),
      voice: clampScore(s.voice),
      platform: clampScore(s.platform),
    },
    strengths: (v.strengths ?? []).slice(0, 3),
    improvements: (v.improvements ?? []).slice(0, 3),
  };
}

export async function generateFromBrief(
  profile: Profile,
  input: BriefInput,
  ctx: BriefContext,
): Promise<BriefVariant[]> {
  const tone = input.tone ?? profile.tone;
  if (isDemoMode()) return mockBriefVariants(profile, input, tone);

  const voice = buildVoiceProfile(ctx.existingPosts ?? []);
  const user = `Plateforme cible : ${algoNetworkLabel(input.network)}
Format : ${input.format}
Ton de voix : ${toneLine(tone)} — ${TONE_RULES[tone] ?? ""}
Codes de la plateforme : ${PLATFORM_HOOKS[input.network]}
${formatStructure(input.network, input.format)}
${wizardLines(input)}${langDirective(input.language)}${input.technique ? `Technique de mise en avant à appliquer : ${input.technique}\n` : ""}Brief du founder : ${input.topic || "(libre — choisis l'angle le plus fort et le plus spécifique pour cette niche)"}

Génère EXACTEMENT 3 variantes DISTINCTES — pas 3 reformulations, mais 3 approches différentes (angle, hook et structure différents). Chaque variante doit sonner EXACTEMENT comme ${ctx.firstName}.
Pour chaque variante :
${VARIANT_FIELDS}
Réponds uniquement en JSON : { "variants": [ { … } ] }.`;

  const data = await callJSON<{ variants: BriefVariant[] }>({
    system: genSystem(profile, ctx.firstName, voice, ctx.existingPosts ?? []),
    user,
    schema: BRIEF_SCHEMA as unknown as Record<string, unknown>,
    model: GEN_MODEL,
    temperature: 0.9,
    maxTokens: 4000,
  });
  return (data.variants ?? []).slice(0, 3).map(normalizeVariant);
}

// Refine a single variant: apply its improvements, or try a fresh angle.
export async function refineVariant(
  profile: Profile,
  input: BriefInput,
  ctx: BriefContext,
  refine: { content: string; mode: "improve" | "angle"; improvements?: string[] },
): Promise<BriefVariant> {
  const tone = input.tone ?? profile.tone;
  if (isDemoMode()) {
    const base = mockBriefVariants(profile, input, tone);
    return refine.mode === "angle" ? base[1] : { ...base[0], hookScore: 91, scores: { hook: 91, structure: 88, voice: 86, platform: 89 } };
  }
  const voice = buildVoiceProfile(ctx.existingPosts ?? []);
  const task =
    refine.mode === "improve"
      ? `Réécris ce contenu en appliquant ces améliorations : ${(refine.improvements ?? []).join(" ; ")}. Garde l'angle, améliore l'exécution.`
      : `Réécris ce contenu avec un ANGLE et un HOOK complètement différents (même sujet).`;
  const user = `Plateforme : ${algoNetworkLabel(input.network)} (${input.format}). Codes : ${PLATFORM_HOOKS[input.network]}
${wizardLines(input)}${langDirective(input.language)}Contenu actuel :
"""
${refine.content}
"""
${task}
Réponds en JSON avec une seule variante : { "variants": [ { … } ] } (mêmes champs que d'habitude).
${VARIANT_FIELDS}`;
  const data = await callJSON<{ variants: BriefVariant[] }>({
    system: genSystem(profile, ctx.firstName, voice, ctx.existingPosts ?? []),
    user,
    schema: BRIEF_SCHEMA as unknown as Record<string, unknown>,
    model: GEN_MODEL,
    temperature: 0.88,
    maxTokens: 4000,
  });
  return normalizeVariant((data.variants ?? [])[0]);
}

// ----- Angle suggestions (Studio v3 wizard, step 5) -------------------------

const ANGLES_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { angles: { type: "array", items: { type: "string" } } },
  required: ["angles"],
} as const;

// 3 short, specific angle ideas for a post — sector/tone aware, non-generic.
export async function suggestAngles(
  profile: Profile,
  network: AlgoNetwork,
  objective?: string,
): Promise<string[]> {
  if (isDemoMode()) return mockSuggestAngles(profile, objective);
  const system = `Tu es un stratège de contenu pour founders de SaaS. Tu proposes des angles de post percutants, spécifiques et non génériques, en français. ${ANTI_AI}`;
  const user = `Profil du founder :
${profileContext(profile)}

Plateforme : ${algoNetworkLabel(network)}${objective ? `\nObjectif : ${objective}` : ""}

Propose EXACTEMENT 3 angles de post distincts, chacun en une phrase concrète et accrocheuse (comme un hook), adaptés à cette niche et à ce qui performe en ${new Date().getFullYear()}. Évite tout angle générique. Réponds en JSON : { "angles": ["…", "…", "…"] }.`;
  const data = await callJSON<{ angles: string[] }>({
    system,
    user,
    schema: ANGLES_SCHEMA as unknown as Record<string, unknown>,
    model: GEN_MODEL,
    temperature: 0.9,
    maxTokens: 500,
  });
  return (data.angles ?? []).slice(0, 3);
}

function mockSuggestAngles(profile: Profile, objective?: string): string[] {
  const niche = profile.sector || profile.icp || "SaaS B2B";
  const year = new Date().getFullYear();
  const pool = [
    `J'ai analysé 50 ${niche} qui ont échoué — le point commun n'est pas celui qu'on croit`,
    `Notre taux de conversion a doublé en supprimant une feature`,
    `Ce que personne ne dit sur la distribution ${niche} en ${year}`,
    `On a réduit notre churn de 40 % en changeant une seule étape d'onboarding`,
    `La leçon la plus chère de ${profile.saasName} : ${objective ? objective.toLowerCase() : "acquérir sans budget"}`,
    `Pourquoi 90 % des ${niche} se trompent d'audience (et comment on l'a compris)`,
  ];
  // Deterministic pick of 3 based on the SaaS name, so it's stable per workspace.
  let h = 0;
  for (const c of profile.saasName) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const start = h % pool.length;
  return [pool[start], pool[(start + 2) % pool.length], pool[(start + 4) % pool.length]];
}

// ----- Campaign declination (multichannel) ---------------------------------

export type CampaignVariant = { channel: CampaignChannel; content: string; subject?: string };

const CAMPAIGN_CHANNEL_RULE: Record<CampaignChannel, string> = {
  linkedin: `LINKEDIN : post texte aéré (sauts de ligne), 150-300 mots. Hook sur les 2-3 premières lignes (avant "voir plus"). 0-3 hashtags pertinents. CTA naturel et conversationnel. Ton professionnel mais humain.`,
  x: `X : thread de 4-7 tweets. Tweet 1 = hook autonome. Tweets suivants = 1 idée par tweet (200-240 caractères, lisible seul). Dernier tweet = résumé + CTA. Sépare chaque tweet par une ligne vide. Jamais de "🧵 Thread".`,
  reddit: `REDDIT (r/SaaS) : post long-form communautaire. 1re ligne = titre accrocheur non clickbait. Corps = valeur réelle d'abord, SaaS mentionné naturellement si pertinent. Fin = question ouverte à la communauté. Ton d'un pair, jamais corporate.`,
  email: `EMAIL : "subject" = objet accrocheur max 50 caractères. "content" = corps type newsletter : intro personnelle → valeur → un seul CTA clair. Ton d'une lettre à un ami de l'industrie.`,
};

const CAMPAIGN_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    variants: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          channel: { type: "string", enum: ["linkedin", "x", "reddit", "email"] },
          content: { type: "string" },
          subject: { type: "string" },
        },
        required: ["channel", "content", "subject"],
      },
    },
  },
  required: ["variants"],
} as const;

// Decline a core message into one native variant per channel — a SINGLE call.
export async function declineCampaign(
  profile: Profile,
  coreMessage: string,
  channels: CampaignChannel[],
  ctx: BriefContext,
): Promise<CampaignVariant[]> {
  if (isDemoMode()) return mockDecline(profile, coreMessage, channels);
  const voice = buildVoiceProfile(ctx.existingPosts ?? []);
  const rules = channels.map((c) => CAMPAIGN_CHANNEL_RULE[c]).join("\n\n");
  const user = `MESSAGE CENTRAL :
"""
${coreMessage}
"""

Décline ce message central sur ces canaux : ${channels.map(campaignChannelLabel).join(", ")}.
Le FOND reste identique ; la FORME devient parfaitement native à chaque plateforme. Chaque variante doit sonner comme ${ctx.firstName}.

RÈGLES PAR CANAL :
${rules}

Réponds uniquement en JSON : { "variants": [ { "channel", "content", "subject" } ] }.
Une variante par canal demandé, prête à publier sans retouche. "subject" = objet de l'email (chaîne vide pour les autres canaux).`;
  const data = await callJSON<{ variants: CampaignVariant[] }>({
    system: genSystem(profile, ctx.firstName, voice, ctx.existingPosts ?? []),
    user,
    schema: CAMPAIGN_SCHEMA as unknown as Record<string, unknown>,
    model: GEN_MODEL,
    temperature: 0.88,
    maxTokens: 4000,
  });
  const seen = new Set<CampaignChannel>();
  return (data.variants ?? []).filter(
    (v) => channels.includes(v.channel) && !seen.has(v.channel) && seen.add(v.channel),
  );
}

function mockDecline(
  profile: Profile,
  coreMessage: string,
  channels: CampaignChannel[],
): CampaignVariant[] {
  const first = (coreMessage.split("\n")[0] || coreMessage).slice(0, 80);
  return channels.map((ch) => {
    if (ch === "linkedin")
      return { channel: ch, content: `${coreMessage}\n\nEt toi, tu t'y prends comment ?` };
    if (ch === "x")
      return {
        channel: ch,
        content: `${first}\n\n${coreMessage.slice(0, 220)}\n\nCe que j'en retiens, en clair :\n\nLa distribution passe avant le produit. À chaque fois.`,
      };
    if (ch === "reddit")
      return {
        channel: ch,
        content: `${first}\n\n${coreMessage}\n\nCurieux d'avoir vos retours — vous gérez ça comment de votre côté ?`,
      };
    return {
      channel: ch,
      subject: first.slice(0, 50),
      content: `Salut,\n\n${coreMessage}\n\nSi ça résonne, réponds-moi directement — je lis tout.\n\n— ${profile.saasName}`,
    };
  });
}

// ----- CMO IA ("Loger") batch ----------------------------------------------

export type CmoBatchItem = {
  type: CmoActionType;
  title: string;
  message: string;
  body: string;
  platform: Platform;
  suggestedTime: string;
};

const CMO_SYSTEM = `Tu es "Loger", le CMO IA de LogLead — un directeur marketing senior qui épaule le founder comme un CMO épaule un CEO.
Tu n'es PAS un assistant servile ni un chatbot. Tu analyses, tu décides, tu RECOMMANDES — tu ne poses pas de questions ouvertes.
Style : tutoiement, direct, expert, orienté action. Tu parles de toi à la première personne ("J'ai préparé…", "Je te recommande…", "J'ai déjà ajusté…").
INTERDIT : "Bien sûr !", "Je suis là pour vous aider", "N'hésitez pas à me demander", "Comment puis-je vous aider".
Tu écris en français. Tu n'inventes jamais de chiffres précis non fournis.`;

const CMO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: ["strategy", "content", "trend", "competitive", "report"],
          },
          title: { type: "string" },
          message: { type: "string" },
          body: { type: "string" },
          platform: { type: "string", enum: ["linkedin", "instagram", "tiktok"] },
          suggestedTime: { type: "string" },
        },
        required: ["type", "title", "message", "body", "platform", "suggestedTime"],
      },
    },
  },
  required: ["items"],
} as const;

export async function generateCmoBatch(
  profile: Profile,
  analyticsBrief: string,
  instruction?: string,
): Promise<CmoBatchItem[]> {
  if (isDemoMode()) return mockCmoBatch(profile, analyticsBrief);

  const user = `Profil du founder :
${profileContext(profile)}

Performances récentes (7 derniers jours) :
${analyticsBrief}
${instruction ? `\nInstruction du founder : ${instruction}\n` : ""}
Produis EXACTEMENT 5 recommandations, une de chaque type, dans cet ordre :
1. "strategy" : recommandation stratégique du mois (3 axes de contenu + un objectif chiffré réaliste).
2. "content" : un contenu prêt à publier (body = le post complet, prêt à poster, dans le ton du founder), avec "platform" et "suggestedTime" (créneau optimal, ex : "mardi 8h30").
3. "trend" : une tendance/fenêtre d'opportunité dans sa niche (48h).
4. "competitive" : une analyse d'un concurrent renseigné + un contre-positionnement.
5. "report" : un point de performance court (ce qui a marché/baissé et pourquoi).
Pour chaque item : "title" court, "message" = ta note à la première personne (ton de CMO senior), "body" = le détail/contenu.
Pour les items non-"content", "platform" et "suggestedTime" peuvent reprendre la plateforme prioritaire et un créneau générique.
Réponds en JSON : { "items": [ { "type", "title", "message", "body", "platform", "suggestedTime" } ] }.`;

  const data = await callJSON<{ items: CmoBatchItem[] }>({
    system: CMO_SYSTEM,
    user,
    schema: CMO_SCHEMA as unknown as Record<string, unknown>,
  });
  return (data.items ?? []).slice(0, 5);
}

function mockCmoBatch(profile: Profile, analyticsBrief: string): CmoBatchItem[] {
  const { saasName, icp } = profile;
  const platform = profile.platforms[0] ?? "linkedin";
  const comp = profile.competitors.filter(Boolean)[0] || "ton concurrent principal";
  return [
    {
      type: "strategy",
      title: "Plan du mois",
      message: `J'ai analysé tes 30 derniers jours. Ce mois-ci, on capitalise sur ce qui convertit. Objectif : +15% d'engagement et 3 leads qualifiés.`,
      body: `3 axes prioritaires :\n1. Preuve produit (cas d'usage concrets de ${saasName}).\n2. Prise de position sur ta niche.\n3. Coulisses de founder.\nJ'ai pré-rempli le calendrier en conséquence.`,
      platform,
      suggestedTime: "—",
    },
    {
      type: "content",
      title: "Post LinkedIn — preuve produit",
      message: `J'ai préparé ton contenu du jour. Ton meilleur créneau historique est le mardi à 8h30 — j'ai planifié en conséquence.`,
      body: `La plupart des ${icp} pilotent à l'aveugle.\n\nPas par manque d'outils — par manque de lecture claire de leurs données.\n\nC'est exactement ce qu'on a réglé avec ${saasName}.\n\nCurieux de voir comment ? Commente "DEMO".`,
      platform,
      suggestedTime: "mardi 8h30",
    },
    {
      type: "trend",
      title: "Tendance détectée dans ta niche",
      message: `Tendance qui monte chez les ${icp} : le "build in public" des metrics produit. Fenêtre d'opportunité : 48h. Contenu prêt, dis-moi si tu veux que je publie.`,
      body: `Le sujet "transparence sur les chiffres produit" performe fort cette semaine. Un post qui montre TES coulisses data te positionnerait bien.`,
      platform,
      suggestedTime: "sous 48h",
    },
    {
      type: "competitive",
      title: `Veille — ${comp}`,
      message: `${comp} a publié 4 fois cette semaine sur l'onboarding. Je te suggère de prendre le contre-pied : eux parlent features, toi tu parles résultats.`,
      body: `Angle de contre-positionnement : pendant qu'ils détaillent leurs fonctionnalités, montre l'impact business concret chez tes clients.`,
      platform,
      suggestedTime: "—",
    },
    {
      type: "report",
      title: "Point de performance",
      message: `Bilan rapide : ${analyticsBrief}. J'ai déjà ajusté le plan de la semaine prochaine en fonction.`,
      body: `Ce qui a marché : les posts orientés preuve. À corriger : les contenus trop génériques publiés en fin de semaine.`,
      platform,
      suggestedTime: "—",
    },
  ];
}

// ----- Leads: profile prefill + first-contact message ----------------------

export type LeadProfileFields = {
  firstName: string;
  lastName: string;
  jobTitle: string;
  company: string;
};

const LEAD_PROFILE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    firstName: { type: "string" },
    lastName: { type: "string" },
    jobTitle: { type: "string" },
    company: { type: "string" },
  },
  required: ["firstName", "lastName", "jobTitle", "company"],
} as const;

export async function analyzeLeadProfile(url: string): Promise<LeadProfileFields> {
  if (isDemoMode()) return mockLeadProfile(url);
  const system =
    "Tu extrais les informations publiques d'un profil professionnel (LinkedIn, Instagram) en JSON. N'invente jamais d'email ni de téléphone.";
  const user = `URL du profil : ${url}
Extrais : prénom, nom, titre/poste, entreprise. Réponds en JSON : { "firstName", "lastName", "jobTitle", "company" }.`;
  return callJSON<LeadProfileFields>({
    system,
    user,
    schema: LEAD_PROFILE_SCHEMA as unknown as Record<string, unknown>,
  });
}

function mockLeadProfile(url: string): LeadProfileFields {
  let slug = "prospect";
  try {
    const u = new URL(url.startsWith("http") ? url : `https://${url}`);
    slug = (u.pathname.split("/").filter(Boolean).pop() || "prospect").replace(/[-_]/g, " ");
  } catch {
    /* keep default */
  }
  const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
  const parts = slug.split(" ");
  return {
    firstName: cap(parts[0] || "Alex"),
    lastName: cap(parts[1] || "Martin"),
    jobTitle: "Founder",
    company: "Startup (démo)",
  };
}

export type LeadMessage = { subject: string; body: string };

const LEAD_MSG_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { subject: { type: "string" }, body: { type: "string" } },
  required: ["subject", "body"],
} as const;

export async function draftLeadMessage(args: {
  profile: Profile;
  firstName: string;
  company?: string;
  channel: string;
  sourceTitle?: string;
}): Promise<LeadMessage> {
  if (isDemoMode()) return mockLeadMessage(args);
  const user = `Profil du founder :
${profileContext(args.profile)}

Lead : ${args.firstName}${args.company ? ` (${args.company})` : ""}, arrivé via ${args.channel}.
Contenu source : ${args.sourceTitle ?? "non précisé"}.
Rédige un email de premier contact court, personnalisé et non vendeur, qui référence ce contexte. Réponds en JSON : { "subject", "body" }.`;
  return callJSON<LeadMessage>({
    system: SYSTEM_BASE,
    user,
    schema: LEAD_MSG_SCHEMA as unknown as Record<string, unknown>,
  });
}

function mockLeadMessage(args: {
  profile: Profile;
  firstName: string;
  sourceTitle?: string;
}): LeadMessage {
  const { profile, firstName, sourceTitle } = args;
  return {
    subject: `Suite à ton intérêt pour ${profile.saasName}`,
    body: `Bonjour ${firstName},\n\nJ'ai vu que tu as interagi avec notre contenu${sourceTitle ? ` (« ${sourceTitle} »)` : ""}. Je construis ${profile.saasName} — ${profile.valueProp}.\n\nSi le sujet te parle, je serais ravi d'échanger 15 minutes. Tu as une dispo cette semaine ?\n\nÀ très vite,`,
  };
}

// ----- Lead qualification score --------------------------------------------

export type LeadQualification = {
  total: number;
  breakdown: LeadScoreBreakdown;
  signals: LeadSignals;
  recommendedActions: RecommendedAction[];
};

export type QualifyLeadArgs = {
  profile: Profile;
  lead: {
    firstName: string;
    lastName: string;
    jobTitle?: string;
    company?: string;
    sector?: string;
    interests?: string[];
    channel: LeadChannel;
    status: string;
  };
  sourceTitle?: string;
  eventsSummary: string; // human-readable list of the lead's interactions
  interactionCount: number; // number of timeline events (shifts the demo score)
  weights: LeadScoreWeights;
};

const CRIT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { score: { type: "number" }, reason: { type: "string" } },
  required: ["score", "reason"],
} as const;

const SIGNAL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { text: { type: "string" }, hint: { type: "string" } },
  required: ["text", "hint"],
} as const;

const LEAD_SCORE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    total: { type: "number" },
    breakdown: {
      type: "object",
      additionalProperties: false,
      properties: {
        profile: CRIT_SCHEMA,
        engagement: CRIT_SCHEMA,
        icp_match: CRIT_SCHEMA,
        reactivity: CRIT_SCHEMA,
        timing: CRIT_SCHEMA,
        ai_signals: CRIT_SCHEMA,
      },
      required: ["profile", "engagement", "icp_match", "reactivity", "timing", "ai_signals"],
    },
    signals: {
      type: "object",
      additionalProperties: false,
      properties: {
        hot: { type: "array", items: SIGNAL_SCHEMA },
        warm: { type: "array", items: SIGNAL_SCHEMA },
        cold: { type: "array", items: SIGNAL_SCHEMA },
      },
      required: ["hot", "warm", "cold"],
    },
    recommendedActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          ctaLabel: { type: "string" },
          ctaKind: { type: "string", enum: ["message", "studio"] },
          brief: { type: "string" },
        },
        required: ["title", "description", "ctaLabel", "ctaKind", "brief"],
      },
    },
  },
  required: ["total", "breakdown", "signals", "recommendedActions"],
} as const;

export async function qualifyLead(args: QualifyLeadArgs): Promise<LeadQualification> {
  if (isDemoMode()) return mockQualifyLead(args);
  const { profile, lead, weights } = args;
  const system =
    "Tu es un expert en qualification de leads B2B SaaS. Tu évalues un lead sur 100 points, en français, et réponds uniquement en JSON. N'invente jamais d'email, de téléphone ni de chiffres précis non fournis.";
  const user = `Profil du founder :
${profileContext(profile)}

LEAD À QUALIFIER :
- Nom : ${lead.firstName} ${lead.lastName}
- Poste : ${lead.jobTitle || "inconnu"}
- Entreprise : ${lead.company || "inconnue"}
- Secteur : ${lead.sector || "inconnu"}
- Canal d'acquisition : ${leadChannelLabel(lead.channel)}
- Statut CRM actuel : ${lead.status}
- Centres d'intérêt détectés : ${lead.interests?.join(", ") || "aucun"}
- Contenu source : ${args.sourceTitle || "non précisé"}
- Interactions :
${args.eventsSummary || "aucune interaction enregistrée"}

PONDÉRATION (points maximum par critère — chaque score partiel doit être compris entre 0 et ce maximum) :
${SCORE_CRITERIA.map((c) => `- ${c.label} (${c.value}) : ${weights[c.value]}`).join("\n")}

Retourne un JSON strict :
{
  "total": nombre 0-100,
  "breakdown": { "profile":{"score","reason"}, "engagement":{...}, "icp_match":{...}, "reactivity":{...}, "timing":{...}, "ai_signals":{...} },
  "signals": { "hot":[{"text","hint"}], "warm":[...], "cold":[...] },
  "recommendedActions": [ { "title","description","ctaLabel","ctaKind","brief" } ]
}
Règles :
- "reason" : une phrase concrète et personnalisée par critère.
- signals.hot = signaux d'intérêt forts, warm = potentiels, cold = frictions/objections. 1 à 3 par catégorie.
- 2 à 3 recommendedActions, dont au moins une avec ctaKind "message" (contacter le lead) et au moins une avec ctaKind "studio" (créer un contenu ; "brief" = brief prêt pour le Studio).`;
  const q = await callJSON<LeadQualification>({
    system,
    user,
    schema: LEAD_SCORE_SCHEMA as unknown as Record<string, unknown>,
    temperature: 0.4,
  });
  // Recompute total from the breakdown + weights so the gauge is always coherent
  // with the bars, whatever the model returned.
  return { ...q, total: computeScoreTotal(q.breakdown, weights) };
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Deterministic, profile/lead-aware qualification for demo mode (no API key).
// The interaction count is mixed into the hash so adding a note / changing the
// status visibly shifts the score, matching the "recompute on interaction" spec.
function mockQualifyLead(args: QualifyLeadArgs): LeadQualification {
  const { profile, lead, weights } = args;
  const first = lead.firstName;
  const base = hashStr(`${first}${lead.lastName}${lead.company ?? ""}`) + args.interactionCount * 13;
  const frac = (seed: number) => 0.5 + (((base >> (seed % 24)) ^ (base >> ((seed + 7) % 24))) % 50) / 100; // 0.5..0.99
  const mk = (crit: LeadScoreCriterion, seed: number, reason: string) => ({
    score: Math.round(weights[crit] * frac(seed)),
    reason,
  });
  const breakdown: LeadScoreBreakdown = {
    profile: mk("profile", 1, `${lead.jobTitle || "Fondateur"}${lead.company ? ` chez ${lead.company}` : ""} — profil décideur idéal`),
    engagement: mk("engagement", 4, "A interagi avec ton contenu (réaction + réponse au message)"),
    icp_match: mk("icp_match", 7, `Secteur ${lead.sector || profile.sector || "SaaS B2B"} — correspond à ton ICP`),
    reactivity: mk("reactivity", 10, "A répondu rapidement au premier contact"),
    timing: mk("timing", 13, "En phase de croissance active de son SaaS — besoin fort"),
    ai_signals: mk("ai_signals", 16, `${profile.saasName} peut adresser un besoin de visibilité détecté`),
  };
  const total = computeScoreTotal(breakdown, weights);
  const signals: LeadSignals = {
    hot: [
      { text: `A réagi à plusieurs de tes posts ${leadChannelLabel(lead.channel)}`, hint: "Fort intérêt pour ton contenu — le moment est idéal pour le contacter." },
      { text: `Le SaaS de ${first} n'est pas référencé sur ChatGPT ni Perplexity`, hint: "Besoin GEO non adressé — angle d'accroche puissant pour ton pitch." },
    ],
    warm: [
      { text: "Peu de présence active sur X et Reddit", hint: `Potentiel de croissance sur ces canaux — ${profile.saasName} peut l'aider.` },
    ],
    cold: [
      { text: "N'a pas ouvert le dernier email envoyé", hint: "Relancer via DM plutôt qu'email." },
    ],
  };
  const recommendedActions: RecommendedAction[] = [
    {
      title: "Envoie-lui un message sur l'angle GEO",
      description: `Le SaaS de ${first} n'apparaît pas sur ChatGPT — c'est ton meilleur argument. Mentionne-le dans ton prochain message.`,
      ctaLabel: "Générer ce message",
      ctaKind: "message",
    },
    {
      title: "Publie un post sur la distribution SaaS",
      description: `${first} engage régulièrement sur ce sujet. Un post ciblé peut ramener son attention vers toi naturellement.`,
      ctaLabel: "Créer ce contenu",
      ctaKind: "studio",
      brief: `Post LinkedIn pour ${profile.saasName} sur la distribution SaaS, pensé pour capter l'attention d'un fondateur comme ${first}${lead.company ? ` (${lead.company})` : ""}.`,
    },
  ];
  return { total, breakdown, signals, recommendedActions };
}

// ----- Viral structure clone -----------------------------------------------

const CLONE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    hookType: { type: "string" },
    narrativeStructure: { type: "string" },
    retention: { type: "string" },
    viralityTrigger: { type: "string" },
    viralityScore: { type: "number" },
    content: { type: "string" },
    hookScore: { type: "number" },
    whyItWorks: { type: "string" },
    improvementTip: { type: "string" },
  },
  required: ["hookType", "narrativeStructure", "retention", "viralityTrigger", "viralityScore", "content", "hookScore", "whyItWorks", "improvementTip"],
} as const;

export type CloneInput = {
  url: string;
  text: string; // extracted / pasted source content
  platform: string; // detected source platform label
  targetNetwork: AlgoNetwork;
};

export async function cloneStructure(
  profile: Profile,
  input: CloneInput,
  ctx: BriefContext,
): Promise<CloneResult> {
  if (isDemoMode() || !input.text.trim()) return mockClone(profile, input);

  const voice = buildVoiceProfile(ctx.existingPosts ?? []);
  const user = `Voici un contenu qui a bien marché (source : ${input.platform}).
Contenu extrait :
"""
${input.text.slice(0, 6000)}
"""

Analyse ce contenu EN PROFONDEUR, puis crée un équivalent pour ${algoNetworkLabel(input.targetNetwork)}. Codes cible : ${PLATFORM_HOOKS[input.targetNetwork]}
- "hookType" : type de hook du contenu source (question / chiffre / affirmation contrariante / histoire / promesse / pattern interrupt).
- "narrativeStructure" : la structure narrative (Problème→Solution, Avant/Après, Liste+twist, Storytelling 3 actes, Question→Réponse, Données→Insight, Contrarian…).
- "retention" : la technique de rétention principale (loop ouvert, promesse de révélation, progression dramatique, surprise, humour).
- "viralityTrigger" : le déclencheur émotionnel principal (curiosité, peur, admiration, colère, inspiration, humour) et pourquoi les gens partagent.
- "viralityScore" : entier 0-100.
- "content" : un NOUVEAU contenu qui COPIE la structure, le type de hook, le rythme et le placement du CTA — mais 100 % adapté à la niche de ${ctx.firstName} et à sa voix. Ne reprends AUCUN mot du contenu source ; ne mentionne jamais l'auteur/source.
- "hookScore" : entier 0-100 pour ton accroche.
- "whyItWorks" : 1 phrase — pourquoi cette structure va marcher pour ${ctx.firstName} dans sa niche.
- "improvementTip" : 1 suggestion optionnelle pour personnaliser encore plus.
Réponds uniquement en JSON.`;

  const data = await callJSON<CloneResult>({
    system: genSystem(profile, ctx.firstName, voice, ctx.existingPosts ?? []),
    user,
    schema: CLONE_SCHEMA as unknown as Record<string, unknown>,
    model: GEN_MODEL,
    temperature: 0.88,
    maxTokens: 4000,
  });
  return {
    ...data,
    platform: input.platform,
    viralityScore: clampScore(data.viralityScore),
    hookScore: clampScore(data.hookScore),
  };
}

// ----- Algo Insider ---------------------------------------------------------

const ALGO_SYSTEM = `Tu es l'expert algorithmes de LogLead. Tu connais finement le fonctionnement actuel de LinkedIn, X, Instagram et Reddit, et comment un founder de SaaS peut s'y mettre en avant en organique.
Tu donnes des recommandations PRÉCISES, ACTIONNABLES et SPÉCIFIQUES à la niche du founder — jamais des généralités creuses.
Tu écris en français, au tutoiement, de façon concise (pas de pavés). Tu ne promets pas de chiffres précis non vérifiables.
Pour chaque réseau, adapte les conseils à SA niche, son ICP et son offre.`;

const ALGO_NETWORK_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    network: { type: "string", enum: ["linkedin", "x", "instagram", "reddit"] },
    bestTimes: { type: "string" },
    formats: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { name: { type: "string" }, why: { type: "string" } },
        required: ["name", "why"],
      },
    },
    hooks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { type: { type: "string" }, example: { type: "string" } },
        required: ["type", "example"],
      },
    },
    techniques: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          example: { type: "string" },
        },
        required: ["title", "description", "example"],
      },
    },
    avoid: { type: "array", items: { type: "string" } },
    trend: { type: "string" },
  },
  required: ["network", "bestTimes", "formats", "hooks", "techniques", "avoid", "trend"],
} as const;

const ALGO_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    networks: { type: "array", items: ALGO_NETWORK_SCHEMA },
  },
  required: ["networks"],
} as const;

export async function generateAlgoInsights(
  profile: Profile,
): Promise<AlgoNetworkInsight[]> {
  if (isDemoMode()) return mockAlgoInsights(profile);

  const user = `Profil du founder :
${profileContext(profile)}

Génère le guide algorithmique pour les 4 réseaux suivants, DANS CET ORDRE : linkedin, x, instagram, reddit.
Pour CHAQUE réseau, remplis :
- "bestTimes" : les meilleurs créneaux de publication pour CETTE niche (jours + heures précises), 1-2 phrases.
- "formats" : 3 formats qui performent en ce moment sur ce réseau pour cette niche (chaque format = "name" + "why" = pourquoi il marche pour lui).
- "hooks" : 3 types de hooks efficaces (chaque hook = "type" ex. "Chiffre surprenant" + "example" = un exemple d'accroche réécrit pour SON SaaS).
- "techniques" : 3 techniques de mise en avant de SON SaaS sans avoir l'air de faire de la pub (chaque technique = "title" + "description" courte + "example" concret adapté à sa niche).
- "avoid" : 3 erreurs qui tuent la portée sur ce réseau.
- "trend" : 1 tendance / fenêtre d'opportunité actuelle dans sa niche sur ce réseau.
Réponds uniquement en JSON valide : { "networks": [ { "network", "bestTimes", "formats":[{"name","why"}], "hooks":[{"type","example"}], "techniques":[{"title","description","example"}], "avoid":[string], "trend" } ] }.`;

  const data = await callJSON<{ networks: AlgoNetworkInsight[] }>({
    system: ALGO_SYSTEM,
    user,
    schema: ALGO_SCHEMA as unknown as Record<string, unknown>,
  });

  // Keep only the 4 known networks, in canonical order, deduped.
  const byNet = new Map<AlgoNetwork, AlgoNetworkInsight>();
  for (const n of data.networks ?? []) {
    if (ALGO_NETWORKS.some((x) => x.value === n.network) && !byNet.has(n.network)) {
      byNet.set(n.network, n);
    }
  }
  const ordered = ALGO_NETWORKS.map((x) => byNet.get(x.value)).filter(
    (x): x is AlgoNetworkInsight => Boolean(x),
  );
  // If the model dropped a network, backfill from the mock so the UI stays whole.
  if (ordered.length < ALGO_NETWORKS.length) {
    const fallback = mockAlgoInsights(profile);
    for (const f of fallback) if (!byNet.has(f.network)) byNet.set(f.network, f);
    return ALGO_NETWORKS.map((x) => byNet.get(x.value)!).filter(Boolean);
  }
  return ordered;
}

function mockAlgoInsights(profile: Profile): AlgoNetworkInsight[] {
  const icp = profile.icp || "ton audience cible";
  const saas = profile.saasName || "ton SaaS";
  const niche = profile.sector || "ta niche";
  const networks: Record<AlgoNetwork, AlgoNetworkInsight> = {
    linkedin: {
      network: "linkedin",
      bestTimes: `Pour ${icp}, LinkedIn performe le mardi et le jeudi entre 8h et 9h30, et le mardi en début d'après-midi. Évite le week-end.`,
      formats: [
        { name: "Post texte (200-300 mots)", why: "La portée organique reste la plus forte ; idéal pour une prise de position." },
        { name: "Carrousel (document PDF)", why: "Temps de visionnage élevé = signal fort à l'algorithme ; parfait pour un how-to." },
        { name: "Post + image native", why: "Capte le scroll sans pénalité de lien ; mets le lien en 1er commentaire." },
      ],
      hooks: [
        { type: "Chiffre surprenant", example: `90 % des ${icp} font cette erreur avec leurs données — et ne le savent pas.` },
        { type: "Question qui dérange", example: `Et si ton vrai problème n'était pas l'outil, mais la façon dont tu mesures ?` },
        { type: "Contrarian", example: `Arrête d'ajouter des features. Voilà ce que ${saas} a appris en en supprimant.` },
      ],
      techniques: [
        { title: "Build in public", description: "Partage les coulisses de ton build : les founders qui buildent en public génèrent bien plus d'engagement.", example: `Ce que j'ai appris en construisant ${saas} ce mois-ci (et les 2 erreurs que je ne referai pas).` },
        { title: "Avant / Après", description: "Montre concrètement ce que ton SaaS change pour l'utilisateur.", example: `Avant ${saas} : 3h de reporting par semaine. Après : 10 minutes. Voici comment.` },
        { title: "Le problème d'abord", description: "Montre le problème AVANT la solution pour créer l'identification.", example: `Décris la galère de ${icp} pendant 4 lignes, puis révèle l'angle de ${saas}.` },
      ],
      avoid: [
        "Mettre 10+ hashtags : ça réduit la portée plutôt que de l'augmenter.",
        "Poster sans CTA clair (commenter, partager son avis).",
        "Ignorer les commentaires dans la première heure — réponds vite pour booster l'algorithme.",
      ],
      trend: `Le « build in public » des metrics produit monte fort chez ${icp} en ce moment — fenêtre d'opportunité pour partager tes chiffres.`,
    },
    x: {
      network: "x",
      bestTimes: `Sur X, ${icp} est plus actif en semaine vers 9h, 12h-13h et 18h-19h. Les threads du matin ont la meilleure durée de vie.`,
      formats: [
        { name: "Thread (5-8 tweets)", why: "Récompensé en portée si les gens lisent jusqu'au bout ; idéal pour un retour d'XP." },
        { name: "Post court + opinion tranchée", why: "Génère des réponses, le signal d'engagement le plus valorisé." },
        { name: "Capture d'écran produit", why: "Montre le SaaS en action, très partageable dans une niche tech." },
      ],
      hooks: [
        { type: "Promesse de thread", example: `J'ai analysé 50 ${icp}. Voici les 5 patterns qui séparent ceux qui scalent des autres 🧵` },
        { type: "Hot take", example: `La plupart des outils pour ${icp} résolvent le mauvais problème.` },
        { type: "Mini-histoire", example: `Il y a 6 mois ${saas} n'avait aucun user. Ce qui a tout changé en une semaine :` },
      ],
      techniques: [
        { title: "Le fil retour d'expérience", description: "Raconte un apprentissage concret de ton build, étape par étape.", example: `Comment on a trouvé nos 100 premiers users pour ${saas} (sans budget pub).` },
        { title: "Répondre aux gros comptes", description: "Apporte de la valeur dans les réponses des comptes de ta niche pour gagner en visibilité.", example: `Réponds avec un insight utile, pas un pitch, sous les posts des leaders de ${niche}.` },
        { title: "Le chiffre coulisses", description: "Partage une stat réelle de ton produit pour créer de la curiosité.", example: `Notre churn est passé de 8 % à 3 %. La seule chose qu'on a changée :` },
      ],
      avoid: [
        "Mettre un lien externe dans le tweet principal (réduit la portée) — mets-le en réponse.",
        "Poster et disparaître : reste pour répondre aux premières réactions.",
        "Threads trop longs sans payoff clair à la fin.",
      ],
      trend: `Les threads « teardown » d'outils de ${niche} sont très partagés en ce moment — déconstruis un workflow et propose le tien.`,
    },
    instagram: {
      network: "instagram",
      bestTimes: `Pour ${icp}, Instagram marche le mieux en semaine à 11h-13h et 19h-21h. Les Reels publiés en soirée tournent plus longtemps.`,
      formats: [
        { name: "Reel 30-60 s", why: "Le format le plus poussé par l'algorithme pour atteindre des non-abonnés." },
        { name: "Carrousel éducatif", why: "Fort taux de sauvegarde et de partage = signal de qualité." },
        { name: "Story avec sticker question", why: "Booste l'interaction et nourrit le lien avec ta communauté." },
      ],
      hooks: [
        { type: "Hook visuel (3 premières s)", example: `Montre le problème de ${icp} à l'écran avant de dire un mot.` },
        { type: "Promesse claire", example: `3 façons d'utiliser ${saas} que personne ne connaît.` },
        { type: "Avant/après visuel", example: `Le « avant » chaotique → le « après » avec ${saas}, en 15 secondes.` },
      ],
      techniques: [
        { title: "Mini-tutoriel 60 s", description: "Montre comment utiliser une feature de ton SaaS en moins d'une minute.", example: `Fais ce reporting en 60 s avec ${saas} — étape par étape à l'écran.` },
        { title: "Le before/after", description: "Visualise le problème puis la transformation apportée par le produit.", example: `Split screen : la galère manuelle vs ${saas}.` },
        { title: "Coulisses de founder", description: "Humanise la marque en montrant ton quotidien de builder.", example: `Une journée à construire ${saas} pour ${icp}.` },
      ],
      avoid: [
        "Reels verticaux mal cadrés ou avec un watermark TikTok (déprioritisés).",
        "Texte trop dense dans les Reels : va à l'essentiel.",
        "Oublier le CTA dans la légende ET dans la vidéo (25e-30e seconde).",
      ],
      trend: `Les Reels « 1 feature, 1 problème résolu » performent fort dans ${niche} — décline une série courte.`,
    },
    reddit: {
      network: "reddit",
      bestTimes: `Sur Reddit, vise les matinées en semaine (heure US) sur les subreddits de ${niche}. La régularité prime sur l'horaire.`,
      formats: [
        { name: "Post texte détaillé", why: "La valeur et l'authenticité priment ; un vrai retour d'XP est récompensé." },
        { name: "Commentaire utile", why: "Construis ta crédibilité en répondant avant de jamais te promouvoir." },
        { name: "AMA / partage d'apprentissages", why: "Crée de la confiance et de la visibilité quand tu as une histoire à raconter." },
      ],
      hooks: [
        { type: "Question authentique", example: `Comment ${icp} gèrent-ils [problème] ? Voici ce qui a marché pour nous.` },
        { type: "Retour d'XP honnête", example: `Ce qu'on a raté en lançant ${saas} (et ce que je referais).` },
        { type: "Donnée utile", example: `J'ai compilé les outils que ${icp} utilisent vraiment — partage.` },
      ],
      techniques: [
        { title: "Crédibilité d'abord", description: "Réponds à des questions de ta niche SANS mentionner ton SaaS — construis la confiance avant tout.", example: `Aide vraiment sur r/[niche] pendant des semaines avant de jamais citer ${saas}.` },
        { title: "Le retour d'XP transparent", description: "Partage un échec/apprentissage chiffré : Reddit déteste le marketing, adore l'honnêteté.", example: `« On a perdu 40 % de nos users au mois 2 — voici pourquoi », puis mentionne ${saas} seulement si on te le demande.` },
        { title: "La ressource gratuite", description: "Offre un template/outil sans rien demander en retour.", example: `Partage un template utile à ${icp}, lien vers ${saas} en option discrète.` },
      ],
      avoid: [
        "Faire de l'autopromo directe : c'est le meilleur moyen de te faire bannir.",
        "Ignorer les règles spécifiques du subreddit.",
        "Copier-coller le même message sur plusieurs subs.",
      ],
      trend: `Les posts « j'ai testé X outils de ${niche}, voici mon verdict » génèrent beaucoup d'échanges — participe avec honnêteté.`,
    },
  };
  return ALGO_NETWORKS.map((x) => networks[x.value]);
}

// ----- Content Analyzer -----------------------------------------------------

export type AnalysisResult = {
  globalScore: number;
  criteria: AnalysisCriterion[];
  summary: { good: string[]; improve: string[]; change: string[] };
  rewriteBrief: string;
};

const ANALYZE_SYSTEM = `Tu es le coach contenu de LogLead : tu analyses le post ou la vidéo d'un founder de SaaS et tu donnes un feedback CONCRET, honnête et actionnable, comme un expert qui regarde par-dessus son épaule.
Tu écris en français, au tutoiement, sans complaisance mais constructif. Chaque feedback cite un problème PRÉCIS du contenu fourni et la correction exacte à appliquer.
Tu notes sur 100. verdict = "good" (≥75), "warn" (45-74), "bad" (<45). N'invente pas de métriques que tu n'as pas.`;

const ANALYZE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    globalScore: { type: "number" },
    criteria: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          score: { type: "number" },
          verdict: { type: "string", enum: ["good", "warn", "bad"] },
          feedback: { type: "string" },
        },
        required: ["name", "score", "verdict", "feedback"],
      },
    },
    summary: {
      type: "object",
      additionalProperties: false,
      properties: {
        good: { type: "array", items: { type: "string" } },
        improve: { type: "array", items: { type: "string" } },
        change: { type: "array", items: { type: "string" } },
      },
      required: ["good", "improve", "change"],
    },
    rewriteBrief: { type: "string" },
  },
  required: ["globalScore", "criteria", "summary", "rewriteBrief"],
} as const;

export async function analyzeContent(
  profile: Profile,
  input: { url: string; text: string; kind: AnalysisKind; platform: string },
): Promise<AnalysisResult> {
  if (isDemoMode()) return mockAnalysis(profile, input);

  // Network-specific grids (V1 : LinkedIn, X, Reddit). Falls back to the
  // generic video/text grid for anything else (e.g. Instagram, later).
  const p = input.platform.toLowerCase();
  let grid: string;
  if (input.kind === "video") {
    grid = `Grille VIDÉO : Hook (3 premières secondes), Structure (Problème → Solution → Preuve → CTA), Rétention (estimation du taux de rétention selon rythme/structure), CTA, Adéquation plateforme (durée/codes du réseau), Alignement niche (parle-t-il à l'ICP ?).`;
  } else if (p.includes("linkedin")) {
    grid = `Grille LINKEDIN — évalue exactement ces 5 critères : Hook (les 3 premières lignes arrêtent-elles le scroll avant "voir plus" ?), Lisibilité (paragraphes courts, sauts de ligne, aération), Algorithme (pas de lien externe dans le post, hashtags corrects 0-3, CTA qui génère des commentaires), Voix (ressemble au founder ou à un post générique ?), CTA (action claire demandée ?).`;
  } else if (p === "x" || p.includes("twitter")) {
    grid = `Grille X — évalue exactement ces 5 critères : Hook tweet (le premier tweet donne-t-il envie de lire la suite ?), Standalone (chaque tweet est-il lisible seul ?), Rythme (longueur correcte, pas de tweet trop court ou trop long), Valeur (chaque tweet apporte-t-il un insight ou une information ?), CTA final (le dernier tweet convertit-il : follow, réponse, lien ?).`;
  } else if (p.includes("reddit")) {
    grid = `Grille REDDIT — évalue exactement ces 5 critères : Titre (fonctionne-t-il seul sans lire le corps ?), Valeur (apporte-t-il quelque chose à la communauté ?), Règles sub (respecte les règles du subreddit ciblé, ton conversationnel), Authenticité (vraie contribution ou auto-promo déguisée ?), Engagement (la question finale donne-t-elle envie de répondre ?).`;
  } else {
    grid = `Grille POST TEXTE : Hook (1ère ligne), Structure & lisibilité (aération, longueur), CTA (présence, clarté, timing), Hashtags / format (usage adapté à la plateforme), Adéquation plateforme, Alignement niche (parle-t-il à l'ICP ?).`;
  }

  const user = `Profil du founder :
${profileContext(profile)}

Plateforme : ${input.platform}
Type de contenu : ${input.kind === "video" ? "vidéo" : "post texte"}
URL : ${input.url || "(non fournie)"}

Contenu à analyser :
"""
${input.text.slice(0, 6000)}
"""

${grid}
Pour CHAQUE critère de la grille : "name", "score" (0-100), "verdict" ("good"/"warn"/"bad") et "feedback" (1-2 phrases citant un élément PRÉCIS du contenu + la correction exacte).
Puis : "globalScore" (0-100, cohérent avec les critères), "summary" = { "good": [...], "improve": [...], "change": [...] } (points courts), et "rewriteBrief" = un brief concis prêt à coller dans un générateur de contenu, intégrant TOUTES les corrections, pour réécrire ce contenu.
Réponds uniquement en JSON valide respectant le schéma.`;

  const data = await callJSON<AnalysisResult>({
    system: ANALYZE_SYSTEM,
    user,
    schema: ANALYZE_SCHEMA as unknown as Record<string, unknown>,
  });
  data.globalScore = Math.max(0, Math.min(100, Math.round(data.globalScore)));
  data.criteria = (data.criteria ?? []).map((c) => ({
    ...c,
    score: Math.max(0, Math.min(100, Math.round(c.score))),
  }));
  return data;
}

function mockAnalysis(
  profile: Profile,
  input: { url: string; text: string; kind: AnalysisKind; platform: string },
): AnalysisResult {
  const text = input.text.trim();
  const lower = text.toLowerCase();
  const firstLine = text.split("\n")[0] ?? "";
  const verdictOf = (s: number): AnalysisVerdict => (s >= 75 ? "good" : s >= 45 ? "warn" : "bad");

  const weakHook = /^(bonjour|salut|hello|hey|coucou|bienvenue)/i.test(firstLine.trim());
  const hookScore = weakHook ? 35 : firstLine.length > 90 ? 58 : 78;
  const hasCta = /(commente|commentez|lien en bio|abonne|inscris|inscription|découvre|essaie|essaye|demo|démo|dm|message|télécharge|réserve|clique)/i.test(lower);
  const ctaScore = hasCta ? 76 : 32;
  const longForVideo = input.kind === "video" && text.length > 1200;
  const platformScore = longForVideo ? 48 : 72;
  const icp = profile.icp || "ton ICP";
  const nicheScore = lower.includes(icp.toLowerCase().split(" ")[0] ?? "###") ? 80 : 60;
  const structureScore = text.length > 200 ? 66 : 52;

  const criteria: AnalysisCriterion[] = [
    {
      name: "Hook",
      score: hookScore,
      verdict: verdictOf(hookScore),
      feedback: weakHook
        ? `Ton accroche démarre par « ${firstLine.slice(0, 30)}… » — c'est l'un des débuts qui génèrent le plus de scroll away. Remplace par une question directe ou un chiffre surprenant.`
        : `Ton accroche fonctionne, mais teste une variante encore plus spécifique à ${icp} pour augmenter l'arrêt sur contenu.`,
    },
    {
      name: input.kind === "video" ? "Structure" : "Structure & lisibilité",
      score: structureScore,
      verdict: verdictOf(structureScore),
      feedback:
        input.kind === "video"
          ? "Pose clairement le problème AVANT la solution : sans ça, l'audience décroche car elle ne sait pas encore pourquoi écouter."
          : "Aère davantage : phrases courtes, une idée par ligne, et un saut de ligne après le hook pour donner envie de lire « plus ».",
    },
    input.kind === "video"
      ? {
          name: "Rétention",
          score: longForVideo ? 40 : 62,
          verdict: verdictOf(longForVideo ? 40 : 62),
          feedback: longForVideo
            ? "Le contenu perd probablement l'audience avant 15 s : il y a une digression qui peut être coupée pour aller plus vite au cœur du sujet."
            : "Rythme correct. Coupe toute phrase qui ne sert pas directement le message pour tenir l'attention.",
        }
      : {
          name: "Hashtags / format",
          score: 64,
          verdict: "warn",
          feedback: "Limite-toi à 3 hashtags pertinents max sur ce réseau — au-delà, ça réduit la portée plutôt que de l'augmenter.",
        },
    {
      name: "CTA",
      score: ctaScore,
      verdict: verdictOf(ctaScore),
      feedback: hasCta
        ? "CTA présent — rends-le encore plus spécifique (une seule action attendue) et place-le juste après la preuve."
        : `Aucun CTA clair détecté. Ajoute une action unique alignée sur ton objectif (ex. commenter « DEMO » pour découvrir ${profile.saasName}).`,
    },
    {
      name: "Adéquation plateforme",
      score: platformScore,
      verdict: verdictOf(platformScore),
      feedback: longForVideo
        ? `Trop long pour ${input.platform} : vise un format court et découpe en plusieurs contenus distincts.`
        : `Format globalement adapté aux codes de ${input.platform}.`,
    },
    {
      name: "Alignement niche",
      score: nicheScore,
      verdict: verdictOf(nicheScore),
      feedback:
        nicheScore >= 75
          ? `Bien ciblé : le contenu parle directement à ${icp}.`
          : `Reformule pour t'adresser explicitement à ${icp} et au problème précis que tu résous.`,
    },
  ];

  const globalScore = Math.round(criteria.reduce((a, c) => a + c.score, 0) / criteria.length);
  const change = criteria.filter((c) => c.verdict === "bad").map((c) => `${c.name} : ${c.feedback}`);
  const improve = criteria.filter((c) => c.verdict === "warn").map((c) => `${c.name} : ${c.feedback}`);
  const good = criteria.filter((c) => c.verdict === "good").map((c) => `${c.name} solide.`);

  return {
    globalScore,
    criteria,
    summary: {
      good: good.length ? good : ["Le sujet est pertinent pour ta niche."],
      improve: improve.length ? improve : ["Affûte le rythme et la spécificité."],
      change: change.length ? change : ["Renforce le hook et le CTA pour passer un cap."],
    },
    rewriteBrief: `Réécris ce ${input.kind === "video" ? "script vidéo" : "post"} pour ${input.platform} en corrigeant : ${weakHook ? "un hook accrocheur (chiffre ou question, pas de salutation), " : ""}${!hasCta ? "un CTA unique et clair, " : ""}une structure problème→solution→preuve→CTA, et un ciblage explicite de ${icp}. Sujet d'origine : « ${firstLine.slice(0, 80)} ».`,
  };
}

// ----- Demo-mode mocks (no API key) ----------------------------------------

function mockBriefVariants(profile: Profile, input: BriefInput, _tone: Tone): BriefVariant[] {
  const { saasName, icp } = profile;
  const niche = profile.sector || "ta niche";
  const topic = input.topic?.trim() || `ce que ${icp} ratent vraiment`;
  const goalCta: Record<Profile["goal"], string> = {
    notoriety: "Tu fais comment, toi, sur ce point ?",
    leads: "Dis-moi en commentaire où tu bloques — je réponds à tout le monde.",
    both: "Curieux de ton avis. Et si tu veux le détail, écris-moi « OK ».",
    recruiting: `On construit ${saasName}. Si ça te parle, viens en discuter.`,
    convert: "Envie de tester ? Le lien est en bio.",
  };
  const cta = goalCta[profile.goal];

  return [
    {
      angle: "Contrarian",
      hookType: "Affirmation contrariante",
      hookScore: 86,
      hookReason: "Prend le contre-pied dès le premier mot — pattern interrupt fort, idéal pour générer des réactions.",
      whyNiche: `Attaque une croyance répandue chez ${icp} : te positionne comme une voix qui pense autrement dans ${niche}.`,
      content: `On t'a menti sur ${topic}.\n\nPublier plus ne règle rien. J'ai vu des dizaines de ${icp} s'épuiser à poster chaque jour. Zéro prospect au bout.\n\nLe problème n'est pas la quantité. C'est de dire la même chose que tout le monde.\n\nCe qui marche, c'est un angle. Un vrai. Celui que personne dans ${niche} n'ose prendre.\n\n${cta}`,
      scores: { hook: 86, structure: 82, voice: 80, platform: 88 },
      strengths: ["Le hook stoppe le scroll dès la 1re ligne.", "Un seul message central, tenu jusqu'au bout."],
      improvements: ["Ajoute un chiffre réel de ton expérience pour ancrer l'affirmation.", "Raccourcis l'avant-dernière phrase pour un rythme plus sec."],
    },
    {
      angle: "Storytelling personnel",
      hookType: "Scène concrète",
      hookScore: 81,
      hookReason: "Ouvre sur une scène concrète et datée — on veut lire la suite ; un détail sensoriel de plus renforcerait la tension.",
      whyNiche: `Rend « ${topic} » tangible via une anecdote de founder, ce qui crée de l'identification chez ${icp}.`,
      content: `Mardi, 23h. Troisième café.\n\nJe relisais le même post pour la dixième fois. Zéro like sur le précédent. Je me demandais si tout ça servait à quelque chose.\n\nPuis un message. Un ${icp} : « ton dernier post décrit exactement mon problème. »\n\nUn seul. Mais le bon.\n\nCe soir-là j'ai compris : on n'écrit pas pour tout le monde. On écrit pour une personne précise.\n\n${cta}`,
      scores: { hook: 81, structure: 85, voice: 84, platform: 82 },
      strengths: ["La scène datée crée de l'immersion immédiate.", "La leçon arrive à la fin, pas au début."],
      improvements: ["Ajoute un détail sensoriel (le bruit, l'écran) pour rendre la scène plus réelle.", "Nomme l'émotion précise ressentie à cet instant."],
    },
    {
      angle: "Donnée surprenante",
      hookType: "Chiffre surprenant",
      hookScore: 78,
      hookReason: "Un chiffre précis stoppe le scroll — garde-le crédible pour ton audience.",
      whyNiche: `Appuie « ${topic} » sur un chiffre parlant pour ${icp}, ce qui renforce ta crédibilité sans jargon.`,
      content: `9 ${icp} sur 10 abandonnent avant leur 20e contenu.\n\nPas par manque d'idées. Par manque de retour.\n\nQuand tu publies dans le vide pendant des semaines, ton cerveau conclut que ça ne marche pas. Il a tort.\n\nCe qui change tout : mesurer ce qui accroche vraiment, puis en refaire.\n\n${cta}`,
      scores: { hook: 78, structure: 80, voice: 79, platform: 84 },
      strengths: ["Le chiffre d'ouverture crée une tension immédiate.", "Retourne une croyance en une phrase."],
      improvements: ["Cite la source du chiffre (ou reformule en observation vécue) pour la crédibilité.", "Termine sur une question pour déclencher les commentaires."],
    },
  ];
}

function mockClone(profile: Profile, input: CloneInput): CloneResult {
  const { icp } = profile;
  const niche = profile.sector || "ta niche";
  return {
    platform: input.platform,
    hookType: "Affirmation contrariante",
    narrativeStructure: "Problème → Prise de conscience → Solution",
    retention: "Loop ouvert : la 1re ligne pose une tension qui n'est résolue qu'à la fin, ce qui pousse à lire jusqu'au bout.",
    viralityTrigger:
      "Curiosité + un soupçon de controverse : le contenu remet en cause une évidence, ce qui pousse à commenter pour donner son avis.",
    viralityScore: 83,
    hookScore: 85,
    content: `La plupart des ${icp} font l'inverse de ce qu'il faudrait.\n\nIls veulent aller vite. Alors ils copient ce qui marche chez les autres.\n\nRésultat : un feed qui se ressemble tous. Et une audience qui scrolle.\n\nCe qui sort du lot dans ${niche}, ce n'est pas la vitesse. C'est d'avoir un point de vue que personne d'autre n'assume.\n\nCommence par là. Le reste suit.`,
    whyItWorks: `Cette structure « affirmation contrariante → prise de conscience → solution » fonctionne dans ${niche} parce qu'elle crée une tension qui parle directement à ${icp} et donne envie de réagir.`,
    improvementTip: `Remplace la 2e ligne par un exemple précis vécu par un·e ${icp} pour ancrer l'affirmation dans le réel.`,
  };
}

// ----- LogReach — first-contact ghostwriting ---------------------------------

const REACH_MSG_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { message: { type: "string" } },
  required: ["message"],
} as const;

export type ReachDraftArgs = {
  profile: Profile;
  founderFirstName: string;
  leadFirstName: string;
  leadCompany?: string;
  channel: string; // acquisition channel label, e.g. "LinkedIn"
  sourceTitle?: string;
  // Set on regenerate so the model (and the mock) produces a variation.
  variant?: number;
};

// Short, human first-contact message (3-5 lines, one open question, no pitch).
export async function draftReachMessage(args: ReachDraftArgs): Promise<string> {
  if (isDemoMode()) return mockReachMessage(args);

  const system = `Tu es le ghostwriter de ${args.founderFirstName}, fondateur de ${args.profile.saasName}.
Tu rédiges un message de premier contact pour ${args.leadFirstName}${args.leadCompany ? ` de ${args.leadCompany}` : ""}.

Contexte :
- ${args.leadFirstName} a interagi avec ce contenu : "${args.sourceTitle ?? "un contenu du founder"}"
- Canal : ${args.channel}
- Ton de voix du founder : ${toneLine(args.profile.tone)}
- Objectif : démarrer une conversation naturelle, pas vendre directement

RÈGLES ABSOLUES :
- Court : 3-5 lignes maximum
- Ton humain, conversationnel — pas corporate
- Mentionner le contenu source de façon naturelle
- Une seule question ouverte à la fin
- Zéro pitch produit dans ce premier message
- Zéro "j'espère que ce message vous trouve bien"
- Commencer par le prénom directement

FORMAT : message texte brut, prêt à envoyer, signé "${args.founderFirstName}".`;

  const { message } = await callJSON<{ message: string }>({
    system,
    user: `Rédige le message${args.variant ? ` (variation n°${args.variant + 1}, angle différent des précédentes)` : ""}.`,
    schema: REACH_MSG_SCHEMA as unknown as Record<string, unknown>,
    temperature: 1,
    maxTokens: 500,
  });
  return message;
}

// Deterministic demo draft, faithful to the examples in the product spec.
function mockReachMessage(args: ReachDraftArgs): string {
  const { founderFirstName, leadFirstName, sourceTitle, channel } = args;
  const source = sourceTitle
    ? `mon contenu « ${sourceTitle} »`
    : `mon contenu sur ${channel}`;
  const openers = [
    `J'ai vu que tu avais réagi à ${source} — content que ça ait résonné.`,
    `Merci d'avoir pris le temps de regarder ${source}, ça fait plaisir de voir que le sujet parle.`,
    `Ton passage sur ${source} ne m'a pas échappé — merci pour l'intérêt.`,
  ];
  const questions = [
    `Tu développes quoi en ce moment ? Curieux de savoir où tu en es avec le marketing de ton produit.`,
    `Tu es à quelle étape sur ton projet ? Juste en mode build ou tu commences à chercher tes premiers clients ?`,
    `Qu'est-ce qui t'a amené sur ce sujet ? Toujours preneur du point de vue d'un founder.`,
  ];
  const i = (args.variant ?? 0) % openers.length;
  return `Salut ${leadFirstName},\n\n${openers[i]}\n\n${questions[i]}\n\n${founderFirstName}`;
}

// ----- LogReach : contextual reply / follow-up -------------------------------

export type ReachReplyArgs = {
  profile: Profile;
  founderFirstName: string;
  leadFirstName: string;
  leadCompany?: string;
  channel: string; // messaging channel label, e.g. "LinkedIn", "Email"
  sourceTitle?: string;
  history: { direction: "outbound" | "inbound"; content: string }[];
  kind: "reply" | "followup"; // reply to lead's last message, or nudge if silent
  variant?: number;
};

// Per-channel tone register (MOD 6). Matched loosely on the channel label.
function channelRegistre(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("email")) return "plus formel, peut être un peu plus long, objet accrocheur";
  if (l.includes("x ") || l === "x" || l.includes("twitter")) return "décontracté, direct, informel acceptable";
  if (l.includes("reddit")) return "communautaire, valeur d'abord, jamais commercial en direct";
  if (l.includes("whatsapp")) return "très conversationnel, court, emojis acceptés";
  return "professionnel, concis, pas d'emoji excessif"; // LinkedIn DM (défaut)
}

// Generate the best reply to the lead's last message, or a soft follow-up.
export async function draftReachReply(args: ReachReplyArgs): Promise<string> {
  if (isDemoMode()) return mockReachReply(args);

  const lastInbound = [...args.history].reverse().find((m) => m.direction === "inbound");
  const historyText = args.history
    .slice(-6)
    .map((m) => `${m.direction === "outbound" ? args.founderFirstName : args.leadFirstName} : ${m.content}`)
    .join("\n");

  const registre = channelRegistre(args.channel);

  const system = `Tu es le ghostwriter de ${args.founderFirstName}, fondateur de ${args.profile.saasName}.
${
  args.kind === "reply"
    ? `Tu dois répondre à ce message de ${args.leadFirstName} :\n"${lastInbound?.content ?? "(dernier message du lead)"}"`
    : `${args.leadFirstName} n'a pas répondu depuis quelques jours. Rédige une relance douce.`
}

Contexte de la conversation :
- Canal : ${args.channel} (registre ${registre})
- Historique récent :
${historyText || "(début de conversation)"}
- Profil du lead : ${args.leadFirstName}${args.leadCompany ? ` / ${args.leadCompany}` : ""}
- Contenu source : ${args.sourceTitle ?? "non précisé"}
- Ton de voix du founder : ${toneLine(args.profile.tone)}
- Objectif : qualifier et faire avancer la conversation, sans être commercial

RÈGLES ABSOLUES :
- Court : 2-4 lignes max
- Ton humain et naturel
- Répondre précisément à ce qu'il a dit
- Avancer vers l'objectif sans être commercial
- Jamais "J'espère que tu vas bien"
- Finir par une question ou une proposition concrète
- Adapter le registre au canal

Génère UNE réponse optimale, prête à envoyer, signée "${args.founderFirstName}".`;

  const { message } = await callJSON<{ message: string }>({
    system,
    user: `Rédige la réponse${args.variant ? ` (variation n°${args.variant + 1})` : ""}.`,
    schema: REACH_MSG_SCHEMA as unknown as Record<string, unknown>,
    temperature: 0.9,
    maxTokens: 500,
  });
  return message;
}

function mockReachReply(args: ReachReplyArgs): string {
  const { founderFirstName, leadFirstName, kind, history } = args;
  const lastInbound = [...history].reverse().find((m) => m.direction === "inbound");
  const v = (args.variant ?? 0) % 3;
  if (kind === "followup") {
    const nudges = [
      `Salut ${leadFirstName}, je remonte mon message au cas où il serait passé à la trappe 🙂\n\nToujours partant pour en discuter 15 min cette semaine ?\n\n${founderFirstName}`,
      `Salut ${leadFirstName}, pas de pression — juste un petit up.\n\nQu'est-ce qui bloque de ton côté en ce moment ? Je peux peut-être aider.\n\n${founderFirstName}`,
      `Salut ${leadFirstName}, je ne veux pas te spammer 🙂 dis-moi juste si le timing n'est pas bon.\n\nSinon, on cale un créneau ?\n\n${founderFirstName}`,
    ];
    return nudges[v];
  }
  const ack = lastInbound
    ? `Merci pour ton retour${/merci|super|intéress|top|génial/i.test(lastInbound.content) ? " — content que ça te parle" : ""} !`
    : "Merci pour ta réponse !";
  const closers = [
    `Pour bien cadrer : tu en es où exactement sur le sujet ? On peut en parler 15 min si tu veux.`,
    `Ce qui t'aiderait le plus là, ce serait quoi précisément ? Je te propose un créneau rapide si ça te dit.`,
    `Tu veux que je t'envoie un exemple concret, ou on cale un appel court pour en discuter ?`,
  ];
  return `Salut ${leadFirstName},\n\n${ack}\n\n${closers[v]}\n\n${founderFirstName}`;
}

// ----- Studio composer : one-click tools on the current draft ----------------

export type StudioTool =
  | "expand"    // Développer
  | "optimise"  // Optimiser
  | "wrapup"    // Conclure + hashtags
  | "concise"   // Raccourcir
  | "grammar"   // Corriger
  | "hook";     // Hook plus fort

const TOOL_INSTRUCTION: Record<StudioTool, string> = {
  expand:
    "Étoffe ce contenu avec plus de détails, d'exemples concrets et de profondeur, SANS le diluer. Garde la même structure, la même voix et le même angle.",
  optimise:
    "Optimise ce contenu pour l'impact et la conversion : accroche plus forte, clarté, rythme, CTA plus efficace. Garde à peu près la même longueur.",
  wrapup:
    "Ajoute une conclusion engageante à ce contenu (une phrase qui marque + une question ouverte OU un CTA), puis une ligne de 2-4 hashtags pertinents et adaptés au réseau. Garde tout le reste identique.",
  concise:
    "Rends ce contenu plus concis et percutant : coupe le superflu, garde uniquement ce qui sert le message. Ne perds aucune idée clé.",
  grammar:
    "Corrige la grammaire, l'orthographe, la ponctuation et les maladresses de style de ce contenu. Ne change NI le fond, NI le ton, NI la structure.",
  hook:
    "Réécris UNIQUEMENT l'accroche (les 2-3 premières lignes) pour qu'elle capte l'attention plus vite et donne envie de lire la suite. Garde le reste du contenu strictement identique.",
};

const TOOL_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: { content: { type: "string" } },
  required: ["content"],
} as const;

export type StudioToolArgs = {
  profile: Profile;
  firstName: string;
  content: string;
  tool: StudioTool;
  network: AlgoNetwork;
  format: string;
  existingPosts?: string[];
};

export async function applyStudioTool(args: StudioToolArgs): Promise<string> {
  if (isDemoMode()) return mockStudioTool(args);

  const voice = buildVoiceProfile(args.existingPosts ?? []);
  const user = `Réseau : ${algoNetworkLabel(args.network)} (${args.format}). Codes : ${PLATFORM_HOOKS[args.network]}

Contenu actuel du founder :
"""
${args.content}
"""

Action demandée : ${TOOL_INSTRUCTION[args.tool]}

Renvoie le contenu retravaillé, prêt à publier, dans la voix EXACTE de ${args.firstName}. Réponds uniquement en JSON : { "content": "…" }.`;

  const { content } = await callJSON<{ content: string }>({
    system: genSystem(args.profile, args.firstName, voice, args.existingPosts ?? []),
    user,
    schema: TOOL_SCHEMA as unknown as Record<string, unknown>,
    model: GEN_MODEL,
    temperature: 0.7,
    maxTokens: 2000,
  });
  return content;
}

// Deterministic demo transforms so the composer is fully usable without a key.
function mockStudioTool(args: StudioToolArgs): string {
  const { content, tool, network, profile } = args;
  const lines = content.split("\n");
  switch (tool) {
    case "expand":
      return `${content}\n\nEn pratique, ça change tout : quand tu appliques ça à ${profile.saasName}, tu vois la différence dès les premiers jours. Un exemple concret : au lieu de rester en surface, tu détailles le "comment" — et c'est exactement ce que ton audience attend.`;
    case "optimise":
      return `${content.replace(/^(.{0,80})/, "$1").trim()}\n\n(Version optimisée : accroche resserrée, une idée par ligne, CTA plus direct en fin.)`;
    case "wrapup": {
      const tags =
        network === "reddit"
          ? ""
          : network === "x"
            ? "\n\n#build #SaaS"
            : "\n\n#SaaS #Founders #Marketing";
      return `${content}\n\nAu final, la distribution n'est pas une option — c'est le vrai travail. Tu t'y prends comment, toi ?${tags}`;
    }
    case "concise":
      return lines.filter((l) => l.trim()).slice(0, Math.max(2, Math.ceil(lines.length / 2))).join("\n");
    case "grammar":
      return content.replace(/\s+([,.;:!?])/g, "$1").replace(/\s{2,}/g, " ").trim();
    case "hook":
      return `Personne ne te le dira, mais voici ce qui change tout 👇\n\n${content}`;
  }
}
