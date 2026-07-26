import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { generateFromBrief, isDemoMode } from "./ai";
import {
  contentItems,
  conversations as convRepo,
  inboxMessages,
  leads as leadsRepo,
  visibilityScans,
} from "./db";
import { leadChannelLabel, type AgentAction, type AgentPayload, type Profile } from "./types";

// ---------------------------------------------------------------------------
// LogAgent — the conversational CMO. Intent is routed server-side to a real
// tool that queries the workspace's actual data; Claude then frames the answer
// in the CMO voice. Without an API key the framing falls back to deterministic
// copy, so the agent still returns REAL data (never hallucinated).
// ---------------------------------------------------------------------------

const MODEL = "claude-sonnet-4-6";

export type AgentResult = {
  content: string;
  payload: AgentPayload;
  action: AgentAction;
  reasoning: string; // shown above the answer — what the agent actually did
};

// Explicit criteria pulled out of the request so the answer can echo them.
const ROLE_WORDS = [
  "ceo","cto","cmo","coo","cfo","founder","fondateur","fondatrice","directeur","directrice",
  "head","manager","consultant","consultante","freelance","développeur","developpeur","designer",
  "marketeur","growth","sales","commercial","rh",
];

export type Criteria = { roles: string[]; city: string | null; sector: string | null };

export function extractCriteria(message: string): Criteria {
  const lower = message.toLowerCase();
  const roles = ROLE_WORDS.filter((r) => new RegExp(`\\b${r}\\b`, "i").test(lower));
  // "à Toulouse", "sur la ville de Toulouse", "basé à Lyon"
  const cityMatch =
    message.match(/\b(?:ville de|basé[e]?s? (?:à|sur|en)|situé[e]?s? à|à)\s+([A-ZÉÈÀ][\p{L}-]{2,})/u) ?? null;
  const city = cityMatch ? cityMatch[1] : null;
  const sectorMatch = lower.match(/\b(?:secteur|dans le|niche)\s+([\p{L}-]{3,})/u);
  return { roles, city, sector: sectorMatch ? sectorMatch[1] : null };
}

function criteriaLabel(c: Criteria): string {
  const parts = [...c.roles.map((r) => r.toUpperCase()), c.city, c.sector].filter(Boolean);
  return parts.length ? parts.join(", ") : "aucun critère précis";
}

// ----- Intent detection -----------------------------------------------------

export function detectAction(message: string): AgentAction {
  const m = message.toLowerCase();
  if (/(répond|repond|reply|message non lu|dernier[s]? échange|inbox|dm\b)/.test(m)) {
    return /(non lu|échange|inbox|conversation|dm\b)/.test(m) && !/rédige|ecris|écris/.test(m)
      ? "reply"
      : "reply";
  }
  if (/(trouve|cherche|recherche|liste|donne).*(lead|prospect|ceo|cto|founder|client)/.test(m) ||
      /(lead|prospect)s?\s+(qualifi|à contacter)/.test(m)) {
    return "search_leads";
  }
  if (/(crée|cree|génère|genere|rédige|redige|écris|ecris).*(post|contenu|thread|tweet|article)/.test(m)) {
    return "generate_content";
  }
  if (/(analyse|concurrent|concurrence|geo|visibilité|visibilite)/.test(m)) return "analyze";
  if (/(performance|rapport|stats|statistique|comment se porte|résultats|resultats)/.test(m)) {
    return "report";
  }
  return "chat";
}

// ----- Tools (real workspace data) ------------------------------------------

const STOP = new Set([
  "trouve","moi","des","de","du","la","le","les","un","une","sur","pour","dans","avec","qui",
  "que","mes","ma","mon","est","sont","et","à","a","en","ville","basé","base","qualifiés",
  "qualifies","lead","leads","prospect","prospects","cherche","liste","donne","tous","toutes",
]);

function keywords(message: string): string[] {
  return message
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w));
}

function fmtDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Search the workspace's leads on job title / company / name / notes.
export function toolSearchLeads(workspaceId: string, message: string, criteria: Criteria) {
  const all = leadsRepo.listByWorkspace(workspaceId);
  const kw = keywords(message);
  const hayOf = (l: (typeof all)[number]) =>
    `${l.firstName} ${l.lastName} ${l.company ?? ""} ${l.jobTitle ?? ""} ${l.notes ?? ""}`.toLowerCase();

  // Explicit criteria are hard filters; free keywords only rank.
  let pool = all;
  if (criteria.roles.length) {
    pool = pool.filter((l) => criteria.roles.some((r) => hayOf(l).includes(r)));
  }
  if (criteria.city) {
    const city = criteria.city.toLowerCase();
    pool = pool.filter((l) => hayOf(l).includes(city));
  }

  const scored = pool
    .map((l) => ({ lead: l, score: kw.reduce((s, k) => (hayOf(l).includes(k) ? s + 1 : s), 0) }))
    .sort((a, b) => b.score - a.score);

  return {
    scanned: all.length,
    matchedCount: pool.length,
    // Strict when criteria were given: no silent fallback to unrelated leads.
    items: scored.slice(0, 6).map(({ lead: l }) => ({
      id: l.id,
      name: `${l.firstName} ${l.lastName}`.trim(),
      subtitle: [l.jobTitle, l.company].filter(Boolean).join(" · ") || leadChannelLabel(l.channel),
      unread: 0,
      date: fmtDate(l.createdAt),
    })),
  };
}

// Recent LogReach conversations, newest first, with unread counts.
export function toolReadMessages(workspaceId: string) {
  const leadById = new Map(leadsRepo.listByWorkspace(workspaceId).map((l) => [l.id, l]));
  const items = convRepo
    .listByWorkspace(workspaceId)
    .flatMap((c) => {
      const lead = leadById.get(c.leadId);
      if (!lead) return [];
      const msgs = inboxMessages.listByConversation(c.id);
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.direction === "inbound" && !m.readAt).length;
      return [
        {
          id: c.id,
          name: `${lead.firstName} ${lead.lastName}`.trim(),
          subtitle: last ? last.content.replace(/\s+/g, " ").slice(0, 80) : "Aucun message",
          unread,
          date: fmtDate(c.lastMessageAt ?? c.createdAt),
          firstName: lead.firstName,
        },
      ];
    })
    .slice(0, 6);
  return { items, unreadNames: items.filter((i) => i.unread > 0).map((i) => i.firstName) };
}

// Strip the instruction wrapper so the topic is the actual subject:
// "Crée un post LinkedIn sur la distribution SaaS" → "la distribution SaaS".
function extractTopic(message: string): string {
  const m = message.replace(/\s+/g, " ").trim();
  const after = m.match(/\b(?:sur|à propos de|au sujet de|about)\b\s+(.+)$/i);
  if (after?.[1]) return after[1].replace(/[?.!]+$/, "").trim();
  return m
    .replace(/^\s*(crée|cree|génère|genere|rédige|redige|écris|ecris|fais)\s+(moi\s+)?(un|une|des)?\s*/i, "")
    .replace(/\b(post|contenu|thread|tweet|article)\s+(linkedin|reddit|x|twitter)?\s*/i, "")
    .trim() || m;
}

export async function toolGenerateContent(profile: Profile, message: string, firstName: string) {
  const m = message.toLowerCase();
  const network = /reddit/.test(m) ? "reddit" : /\b(x|twitter|thread|tweet)\b/.test(m) ? "x" : "linkedin";
  const existing = contentItems.listByWorkspace(profile.workspaceId).map((c) => c.body);
  const variants = await generateFromBrief(
    profile,
    { network, format: network === "x" ? "Thread" : "Post texte court", topic: extractTopic(message) },
    { firstName, existingPosts: existing },
  );
  return {
    platform: network === "x" ? "X" : network === "reddit" ? "Reddit" : "LinkedIn",
    body: variants[0]?.content ?? "",
    topic: extractTopic(message),
  };
}

export function toolAnalyze(workspaceId: string, profile: Profile) {
  const scans = visibilityScans.listByWorkspace(workspaceId).filter((s) => s.queryRows);
  const latest = scans[0];
  const competitors = profile.competitors.filter(Boolean);
  const rows: { label: string; value: string }[] = [
    { label: "Score GEO", value: latest ? `${latest.globalScore}/100` : "aucun scan" },
    { label: "Concurrents suivis", value: competitors.length ? competitors.join(", ") : "aucun" },
  ];
  if (latest?.competitorScores?.length) {
    const best = [...latest.competitorScores].sort((a, b) => b.avg - a.avg)[0];
    rows.push({ label: "Concurrent le plus visible", value: `${best.name} (${best.avg}/100)` });
    rows.push({
      label: "Écart",
      value: `${latest.globalScore - best.avg >= 0 ? "+" : ""}${latest.globalScore - best.avg} pts`,
    });
  }
  return { rows, hasScan: Boolean(latest) };
}

export function toolReport(workspaceId: string) {
  const content = contentItems.listByWorkspace(workspaceId);
  const month = new Date().toISOString().slice(0, 7);
  const thisMonth = content.filter((c) => c.createdAt.slice(0, 7) === month);
  const published = thisMonth.filter((c) => c.status === "published").length;
  const scheduled = content.filter((c) => c.scheduledDate).length;
  const allLeads = leadsRepo.listByWorkspace(workspaceId);
  const newLeads = allLeads.filter((l) => l.createdAt.slice(0, 7) === month).length;
  const geo = visibilityScans.listByWorkspace(workspaceId).find((s) => s.queryRows);
  return {
    rows: [
      { label: "Contenus créés ce mois", value: String(thisMonth.length) },
      { label: "Publiés", value: String(published) },
      { label: "Planifiés", value: String(scheduled) },
      { label: "Nouveaux leads ce mois", value: String(newLeads) },
      { label: "Score GEO", value: geo ? `${geo.globalScore}/100` : "—" },
    ],
    published,
    created: thisMonth.length,
    newLeads,
  };
}

// ----- Response composition --------------------------------------------------

function systemPrompt(profile: Profile, firstName: string): string {
  return `Tu es l'AI Growth Agent de LogLead — un Growth Operator B2B intelligent, PAS un assistant. Tu opères la chaîne d'acquisition de ${firstName} pour ${profile.saasName} : de la cible jusqu'au rendez-vous qualifié.

Profil : offre "${profile.offer}" · ICP "${profile.icp}" · marché "${profile.sector || profile.icp}".
Concurrents : ${profile.competitors.filter(Boolean).join(", ") || "non renseignés"}.

TON OBJECTIF : des rendez-vous qualifiés — jamais le volume de messages. Tu es conservateur sur le volume, agressif sur la pertinence.

RÈGLES NON NÉGOCIABLES :
- Vérité sourcée : tu n'affirmes JAMAIS un fait sur un prospect ou une entreprise sans donnée réelle fournie. Tu n'inventes ni nom, ni chiffre, ni actualité, ni cas client. En cas de doute, tu dis ce qui manque.
- Humain dans la boucle : tu prépares et tu recommandes, mais tu n'envoies jamais un message seul. Toute action impactante attend une validation explicite.
- Tu proposes, tu ne demandes pas. Jamais "Comment puis-je vous aider ?".
- Personnalisation = démontrer que tu comprends une situation spécifique et actuelle du prospect, pas mentionner son prénom. Un message qui pourrait être envoyé à quelqu'un d'autre n'est pas personnalisé.
- Réponses courtes (2-4 phrases), ton d'un Growth expert, directes et actionnables.
- Tu appelles les prospects par leur prénom.
- Tu termines TOUJOURS par une action proposée que le founder peut valider.
- Réponds dans la langue du message du founder.`;
}

async function frame(profile: Profile, firstName: string, user: string, facts: string, fallback: string): Promise<string> {
  if (isDemoMode()) return fallback;
  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 400,
      system: systemPrompt(profile, firstName),
      messages: [
        {
          role: "user",
          content: `Demande du founder : "${user}"\n\nDonnées réelles du workspace :\n${facts}\n\nRédige la réponse (2-4 phrases, ton CMO, termine par une question ou une action proposée).`,
        },
      ],
    });
    const text = msg.content.find((b) => b.type === "text");
    return text && text.type === "text" ? text.text.trim() : fallback;
  } catch {
    return fallback;
  }
}

export async function runAgent(args: {
  workspaceId: string;
  profile: Profile;
  firstName: string;
  message: string;
}): Promise<AgentResult> {
  const { workspaceId, profile, firstName, message } = args;
  const action = detectAction(message);
  const crit = extractCriteria(message);

  if (action === "search_leads") {
    const { items, matchedCount, scanned } = toolSearchLeads(workspaceId, message, crit);
    const reasoning = `Recherche dans tes leads · critères : ${criteriaLabel(crit)} · ${scanned} leads parcourus → ${matchedCount} correspondance${matchedCount > 1 ? "s" : ""}.`;
    if (items.length === 0) {
      const what = criteriaLabel(crit);
      return {
        action,
        reasoning,
        payload: null,
        content:
          scanned === 0
            ? "Ta base de leads est encore vide. Publie du contenu ou importe un CSV, et je prends le relais dès les premiers prospects. Je te génère un post pour amorcer ?"
            : `Aucun lead ne correspond à ${what} sur les ${scanned} de ta base. Je peux élargir la recherche, ou te sortir les ${Math.min(scanned, 5)} leads les plus récents — tu préfères quoi ?`,
      };
    }
    const many = items.length > 1;
    const names = items.slice(0, 3).map((i) => i.name.split(" ")[0]).join(", ");
    const fallback = `Sur « ${criteriaLabel(crit)} », ${many ? `${items.length} leads correspondent` : "1 lead correspond"} dans ta base : ${names}${many ? "" : ` (${items[0].subtitle})`}. Je ${many ? "leur" : "lui"} rédige un premier message ?`;
    const facts = `Critères demandés : ${criteriaLabel(crit)}\n${items.length} leads correspondants :\n${items.map((i) => `- ${i.name} — ${i.subtitle}`).join("\n")}`;
    return {
      action,
      reasoning,
      payload: { kind: "leads", items },
      content: await frame(profile, firstName, message, facts, fallback),
    };
  }

  if (action === "reply") {
    const { items, unreadNames } = toolReadMessages(workspaceId);
    const unreadCount = items.filter((i) => i.unread > 0).length;
    const reasoning = `Lecture de tes conversations LogReach · ${items.length} conversation${items.length > 1 ? "s" : ""} · ${unreadCount} non lu${unreadCount > 1 ? "s" : ""}.`;
    if (items.length === 0) {
      return {
        action,
        reasoning,
        payload: null,
        content: "Aucune conversation en cours dans LogReach. Dès qu'un lead a un email, je peux lancer le premier contact — tu veux que je m'en occupe ?",
      };
    }
    const who = unreadNames[0];
    const fallback = who
      ? `Voici tes derniers échanges. Tu as notamment un message non lu de **${who}**. Veux-tu que je lise le message de ${who} pour te proposer une réponse ?`
      : `Voici tes ${items.length} derniers échanges — aucun message non lu. Le plus utile maintenant : relancer ceux qui n'ont pas répondu. Je prépare les relances ?`;
    const facts = `Conversations récentes :\n${items.map((i) => `- ${i.name} (${i.unread} non lu) : ${i.subtitle}`).join("\n")}`;
    return {
      action,
      reasoning,
      payload: { kind: "messages", items },
      content: await frame(profile, firstName, message, facts, fallback),
    };
  }

  if (action === "generate_content") {
    const { platform, body, topic } = await toolGenerateContent(profile, message, firstName);
    return {
      action,
      reasoning: `Génération de contenu · réseau : ${platform} · sujet : « ${topic} » · ton : ${profile.tone}.`,
      payload: { kind: "content", platform, body },
      content: `Voilà un post ${platform} sur « ${topic} », calé sur ta voix et ton ICP. Tu veux que je le planifie au prochain créneau optimal ?`,
    };
  }

  if (action === "analyze") {
    const { rows, hasScan } = toolAnalyze(workspaceId, profile);
    const comps = profile.competitors.filter(Boolean);
    const reasoning = `Analyse concurrentielle · ${hasScan ? "dernier scan GEO" : "aucun scan GEO"} · ${comps.length} concurrent${comps.length > 1 ? "s" : ""} suivi${comps.length > 1 ? "s" : ""}.`;
    const fallback = hasScan
      ? `Voici où tu te situes face à ${comps.length > 1 ? "tes concurrents" : comps[0] ?? "ton concurrent"}. Le levier le plus rapide reste Reddit — c'est la source que Perplexity et Claude citent le plus. Je te prépare 3 posts Reddit cette semaine ?`
      : `Tu n'as pas encore de scan GEO, donc je ne peux pas comparer tes scores. Lance-en un depuis le module GEO et je sors l'analyse complète derrière. Je t'y emmène ?`;
    const facts = rows.map((r) => `- ${r.label} : ${r.value}`).join("\n");
    return {
      action,
      reasoning,
      payload: { kind: "report", rows },
      content: await frame(profile, firstName, message, facts, fallback),
    };
  }

  if (action === "report") {
    const r = toolReport(workspaceId);
    const reasoning = `Rapport de performance · période : ce mois · ${r.created} contenus, ${r.newLeads} leads analysés.`;
    const fallback = `Ce mois : ${r.created} contenu${r.created > 1 ? "s" : ""} créé${r.created > 1 ? "s" : ""}, ${r.published} publié${r.published > 1 ? "s" : ""}, ${r.newLeads} nouveau${r.newLeads > 1 ? "x" : ""} lead${r.newLeads > 1 ? "s" : ""}. Le ratio publication/création est ton point faible — je planifie tes brouillons sur les créneaux optimaux ?`;
    const facts = r.rows.map((x) => `- ${x.label} : ${x.value}`).join("\n");
    return {
      action,
      reasoning,
      payload: { kind: "report", rows: r.rows },
      content: await frame(profile, firstName, message, facts, fallback),
    };
  }

  // Generic chat — still grounded in the workspace.
  const r = toolReport(workspaceId);
  const fallback = `Je suis ton CMO : je trouve des leads, j'écris tes contenus, je réponds à tes DMs et je surveille ta visibilité IA. Là tout de suite : ${r.created} contenu${r.created > 1 ? "s" : ""} ce mois et ${r.newLeads} nouveau${r.newLeads > 1 ? "x" : ""} lead${r.newLeads > 1 ? "s" : ""}. Par quoi on commence — leads ou contenu ?`;
  const facts = `Contexte : ${r.created} contenus ce mois, ${r.published} publiés, ${r.newLeads} nouveaux leads.`;
  return {
    action: "chat",
    reasoning: `Demande générale · lecture du contexte workspace (contenus, leads, GEO).`,
    payload: null,
    content: await frame(profile, firstName, message, facts, fallback),
  };
}
