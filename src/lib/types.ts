// Shared domain types for LogLead.
// These mirror the eventual Postgres/Supabase tables (users, profiles,
// content_items) so swapping the JSON store for a real DB later is contained
// to lib/db.ts.

export type Tone = "direct" | "expert" | "storytelling" | "challenger" | "fun";
export type Platform = "linkedin" | "instagram" | "tiktok";
export type Goal = "notoriety" | "leads" | "recruiting" | "convert" | "both";
export type Frequency = "weekly_1_2" | "weekly_3_5" | "daily" | "more";
export type CompanySize = "solo" | "1_10" | "10_50" | "50_200" | "200_plus";

export const TONES: { value: Tone; label: string; hint: string }[] = [
  { value: "direct", label: "Direct", hint: "Pas de blabla, des résultats concrets" },
  { value: "expert", label: "Expert", hint: "Data, insights et analyses de fond" },
  { value: "storytelling", label: "Storytelling", hint: "Récits, anecdotes, émotion" },
  { value: "challenger", label: "Challenger", hint: "Opinions tranchées, contenus contrarians" },
];

// Display list for content-format platform pickers. TikTok is dropped in V1;
// Instagram is coming soon (greyed). `Platform` keeps all values for stored
// content back-compat.
export const PLATFORMS: { value: Platform; label: string; comingSoon?: boolean }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram", comingSoon: true },
];

export const GOALS: {
  value: Goal;
  label: string;
  hint: string;
  emoji: string;
}[] = [
  { value: "notoriety", label: "Notoriété", emoji: "📣", hint: "Faire connaître mon SaaS et gagner en visibilité" },
  { value: "leads", label: "Générer des leads", emoji: "🎯", hint: "Transformer mes abonnés en prospects qualifiés" },
  { value: "both", label: "Les deux", emoji: "🚀", hint: "Notoriété et génération de leads en parallèle" },
  { value: "recruiting", label: "Recruter", emoji: "👥", hint: "Attirer des talents ou des co-fondateurs" },
  { value: "convert", label: "Convertir", emoji: "💰", hint: "Pousser à l'essai gratuit ou à l'achat" },
];

export const FREQUENCIES: { value: Frequency; label: string }[] = [
  { value: "weekly_1_2", label: "1-2 posts/semaine" },
  { value: "weekly_3_5", label: "3-5 posts/semaine" },
  { value: "daily", label: "Quotidien" },
  { value: "more", label: "Plus" },
];

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: "solo", label: "Solopreneurs" },
  { value: "1_10", label: "1-10" },
  { value: "10_50", label: "10-50" },
  { value: "50_200", label: "50-200" },
  { value: "200_plus", label: "200+" },
];

// ----- Organization type (onboarding step 2) -------------------------------
// Chosen at onboarding; drives the interface vocabulary (lead/prospect/role)
// and, later, the tone/format/scoring recommendations.

export type OrgType = "startup" | "smb" | "midmarket" | "sales" | "agency" | "solo";

export const ORG_TYPES: { value: OrgType; emoji: string; labelKey: string }[] = [
  { value: "startup", emoji: "🚀", labelKey: "org.startup" },
  { value: "smb", emoji: "🏢", labelKey: "org.smb" },
  { value: "midmarket", emoji: "🏭", labelKey: "org.midmarket" },
  { value: "sales", emoji: "💼", labelKey: "org.sales" },
  { value: "agency", emoji: "🎯", labelKey: "org.agency" },
  { value: "solo", emoji: "👤", labelKey: "org.solo" },
];

// Interface vocabulary per organization type (spec's global adaptation table).
// `role` = how we refer to the user ("Founder"/"Sales rep"/…). Mid-Market
// mirrors SMB (not in the spec table).
export const ORG_VOCAB: Record<OrgType, { lead: string; prospect: string; role: string }> = {
  startup: { lead: "Lead", prospect: "Prospect", role: "Founder" },
  smb: { lead: "Opportunity", prospect: "Contact", role: "CEO / Manager" },
  midmarket: { lead: "Opportunity", prospect: "Contact", role: "CEO / Manager" },
  sales: { lead: "Lead", prospect: "Prospect", role: "Sales rep" },
  agency: { lead: "Prospect", prospect: "Client prospect", role: "Account manager" },
  solo: { lead: "Lead", prospect: "Prospect", role: "You" },
};

export function orgVocab(orgType?: OrgType) {
  return ORG_VOCAB[orgType ?? "startup"];
}

export const SECTORS = [
  "SaaS / Logiciel",
  "E-commerce",
  "Agence / Services",
  "Fintech",
  "Santé / MedTech",
  "Éducation / EdTech",
  "Marketing / AdTech",
  "Industrie / Hardware",
  "Autre",
];

// Per-user transactional email opt-outs (default: everything on).
export type EmailPrefs = {
  dailyBrief?: boolean;
  weeklySummary?: boolean;
  newLead?: boolean;
};

export type User = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  emailVerifiedAt?: string | null;
  emailPrefs?: EmailPrefs;
};

// One-time password-reset token (only the SHA-256 hash is stored).
export type PasswordReset = {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string; // 1 hour after creation
  usedAt: string | null;
  createdAt: string;
};

// Waitlist signups for features that are still "coming soon" (Analytics…).
export type WaitlistEntry = {
  id: string;
  feature: string; // e.g. "analytics"
  email: string;
  userId: string;
  createdAt: string;
};

export type Plan = "free" | "starter" | "growth" | "pro";

export const PLANS: { value: Plan; label: string }[] = [
  { value: "starter", label: "Starter" },
  { value: "growth", label: "Growth" },
  { value: "pro", label: "Pro" },
];

// A "startup" — the tenant. A user can own/belong to several.
export type LinkedInConnection = {
  accessToken: string; // encrypted at rest
  memberSub: string; // LinkedIn member id (OpenID `sub`) — used as author URN
  name?: string;
  expiresAt: string; // ISO
  connectedAt: string; // ISO
};

export type Workspace = {
  id: string;
  name: string;
  ownerId: string;
  plan: Plan;
  createdAt: string;
  trialEndsAt?: string; // set when the workspace is on a 7-day trial
  linkedin?: LinkedInConnection; // official LinkedIn OAuth connection (V1)
  linkedinProfileUrl?: string; // public profile URL — used to auto-detect leads from post engagement
  lastLeadDetectAt?: string; // ISO — last engagement-detection run (24h cooldown)
  autoDetectLeads?: boolean; // opt-in: run engagement detection daily via cron
  // ----- Credits & billing -----
  planChosen?: boolean; // false → force the mandatory /onboarding/plan screen
  credits?: number; // current spendable balance (trial + monthly + purchased)
  monthlyCreditsLimit?: number; // plan quota used for the header gauge ratio
  trialStartsAt?: string; // ISO — set when a plan is picked
  creditsRenewAt?: string; // ISO — next monthly renewal (trial end, then +1 month)
};

// One line in the credit ledger (add or consume). Positive = added.
export type CreditTransactionType = "trial" | "monthly_renewal" | "purchase" | "consumption";
export type CreditTransaction = {
  id: string;
  workspaceId: string;
  type: CreditTransactionType;
  action?: string; // e.g. "generate_post", "enrich_lead_full" (consumption)
  credits: number; // signed: + added, − consumed
  amountEur?: number | null; // set for purchases
  stripePaymentIntent?: string | null;
  balanceAfter: number;
  createdAt: string;
};

// ----- CMO IA ("Loger") ----------------------------------------------------

export type CmoStatus = "active" | "paused";

export type CmoConfig = {
  workspaceId: string;
  activatedAt: string | null; // null → not configured yet (show setup)
  status: CmoStatus;
  briefHour: string; // "08:00"
  autonomyLevel: number; // 1..5
  priorities: string[];
  priorityChannels: Platform[];
  autopilot: boolean;
  lastInstruction?: string;
  updatedAt: string;
};

export type CmoActionType =
  | "content"
  | "report"
  | "trend"
  | "strategy"
  | "competitive";

export type CmoActionStatus = "pending" | "approved" | "published" | "rejected";

export type CmoAction = {
  id: string;
  workspaceId: string;
  type: CmoActionType;
  title: string;
  message: string; // Loger's senior-collaborator note
  body: string; // details; for "content" = the publishable draft
  platform?: Platform; // for "content"
  suggestedTime?: string; // for "content", e.g. "mardi 8h30"
  status: CmoActionStatus;
  createdAt: string;
  approvedAt?: string | null;
  publishedAt?: string | null;
  cancelUntil?: string | null; // autopilot 30-min undo window
  contentItemId?: string | null; // the content created on publish
};

export const CMO_ACTION_META: Record<
  CmoActionType,
  { emoji: string; label: string }
> = {
  content: { emoji: "📅", label: "Contenu prêt" },
  report: { emoji: "📊", label: "Rapport de performance" },
  trend: { emoji: "🔥", label: "Alerte tendance" },
  strategy: { emoji: "🎯", label: "Recommandation stratégique" },
  competitive: { emoji: "🕵️", label: "Veille concurrentielle" },
};

export const AUTONOMY_LEVELS: { level: number; label: string }[] = [
  { level: 1, label: "Je valide tout avant publication" },
  { level: 2, label: "Je valide presque tout" },
  { level: 3, label: "Je valide uniquement les contenus importants" },
  { level: 4, label: "Loger publie, je supervise" },
  { level: 5, label: "Pilote automatique complet" },
];

// ----- Leads (CRM) ---------------------------------------------------------

export type LeadChannel =
  | "reddit"
  | "linkedin"
  | "x"
  | "instagram"
  | "website"
  | "manual";

export type LeadStatus =
  | "new"
  | "contacted"
  | "in_discussion"
  | "converted"
  | "lost";

export const LEAD_CHANNELS: {
  value: LeadChannel;
  label: string;
  dot: string;
}[] = [
  { value: "reddit", label: "Reddit", dot: "#FF4500" },
  { value: "linkedin", label: "LinkedIn", dot: "#0A66C2" },
  { value: "x", label: "X", dot: "#0E1525" },
  { value: "instagram", label: "Instagram", dot: "#C13584" },
  { value: "website", label: "Site web", dot: "#12B76A" },
  { value: "manual", label: "Manuel", dot: "#667085" },
];

// Pill styles per status — pale token-based backgrounds, dark-mode safe.
// "converted" is surfaced as "Qualifié" in the UI (CRM vocabulary).
export const LEAD_STATUSES: {
  value: LeadStatus;
  label: string;
  cls: string;
}[] = [
  { value: "new", label: "New", cls: "border-line bg-surface-hover text-muted" },
  { value: "contacted", label: "Contacted", cls: "border-primary/15 bg-primary/[0.06] text-primary" },
  { value: "converted", label: "Qualified", cls: "border-success/20 bg-success/10 text-success" },
  { value: "in_discussion", label: "In discussion", cls: "border-warning/25 bg-warning/10 text-warning" },
  { value: "lost", label: "Lost", cls: "border-danger/15 bg-danger/[0.06] text-danger" },
];

export function leadChannelLabel(c: LeadChannel): string {
  return LEAD_CHANNELS.find((x) => x.value === c)?.label ?? c;
}
export function leadStatusLabel(s: LeadStatus): string {
  return LEAD_STATUSES.find((x) => x.value === s)?.label ?? s;
}

export type Lead = {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName: string;
  email: string | null; // plaintext in API responses; encrypted at rest
  phone: string | null;
  company?: string;
  jobTitle?: string;
  linkedinUrl?: string;
  siteUrl?: string;
  channel: LeadChannel;
  sourceContentId?: string | null;
  status: LeadStatus;
  notes?: string;
  // ----- Enrichment (filled by AI enrichment) -----
  sector?: string;
  companySize?: string;
  interests?: string[];
  enrichedAt?: string;
  // ----- Qualification score (filled by scoreLead / qualifyLead) -----
  score?: number; // 0-100
  scoreBreakdown?: LeadScoreBreakdown;
  signals?: LeadSignals;
  recommendedActions?: RecommendedAction[];
  lastScoreAt?: string;
  createdAt: string;
  updatedAt: string;
};

// ----- Lead qualification score --------------------------------------------

export type LeadScoreCriterion =
  | "profile"
  | "engagement"
  | "icp_match"
  | "reactivity"
  | "timing"
  | "ai_signals";

// Display order + labels for the breakdown bars and the config sliders.
export const SCORE_CRITERIA: { value: LeadScoreCriterion; label: string; hint: string }[] = [
  { value: "profile", label: "Profil", hint: "Poste, séniorité, audience du lead" },
  { value: "engagement", label: "Engagement", hint: "Réactions, commentaires, réponses" },
  { value: "icp_match", label: "Intérêt ICP", hint: "Correspondance avec ta cible idéale" },
  { value: "reactivity", label: "Réactivité", hint: "Vitesse de réponse aux messages" },
  { value: "timing", label: "Timing", hint: "Moment / phase de besoin du lead" },
  { value: "ai_signals", label: "Signaux IA", hint: "Opportunités détectées par l'IA" },
];

export type LeadScoreBreakdown = Record<
  LeadScoreCriterion,
  { score: number; reason: string }
>;

export type LeadSignal = { text: string; hint: string };
export type LeadSignals = {
  hot: LeadSignal[];
  warm: LeadSignal[];
  cold: LeadSignal[];
};

// A recommended next action. `ctaKind` (typed) replaces the spec's free `cta_link`
// so the client routes safely instead of trusting a model-produced URL.
export type RecommendedAction = {
  title: string;
  description: string;
  ctaLabel: string;
  ctaKind: "message" | "studio";
  brief?: string; // Studio brief, used when ctaKind === "studio"
};

// Per-criterion weight. Weights are relative and normalized to 100, so the
// total score is always /100 whatever the founder picks in the config panel.
export type LeadScoreWeights = Record<LeadScoreCriterion, number>;

export const DEFAULT_SCORE_WEIGHTS: LeadScoreWeights = {
  profile: 20,
  engagement: 20,
  icp_match: 20,
  reactivity: 20,
  timing: 20,
  ai_signals: 20,
};

export type LeadScoreConfig = {
  workspaceId: string;
  weights: LeadScoreWeights;
  updatedAt: string;
};

// 0-40 froid · 41-70 tiède · 71-100 chaud. Colors resolve to theme tokens so the
// gauge and bars stay dark-mode safe (never a hardcoded hex in a component).
export type ScoreTier = "cold" | "warm" | "hot";

export function scoreTier(n: number): ScoreTier {
  if (n <= 40) return "cold";
  if (n <= 70) return "warm";
  return "hot";
}

export function scoreColorVar(n: number): string {
  const tier = scoreTier(n);
  if (tier === "cold") return "var(--color-danger)";
  if (tier === "warm") return "var(--color-warning)";
  return "var(--color-success)";
}

export function scoreLabel(n: number): string {
  const tier = scoreTier(n);
  if (tier === "cold") return "Lead froid";
  if (tier === "warm") return "Lead tiède";
  return "Lead chaud 🔥";
}

// Normalize the per-criterion partial scores to /100 using the weights as the
// per-criterion maxima. The total is always /100 whatever weights the founder
// picks, so the gauge stays coherent with the breakdown bars (score_i / weight_i).
export function computeScoreTotal(
  breakdown: LeadScoreBreakdown,
  weights: LeadScoreWeights,
): number {
  const maxTotal = SCORE_CRITERIA.reduce((s, c) => s + (weights[c.value] || 0), 0) || 1;
  const raw = SCORE_CRITERIA.reduce(
    (s, c) => s + Math.min(breakdown[c.value]?.score ?? 0, weights[c.value] ?? 0),
    0,
  );
  return Math.max(0, Math.min(100, Math.round((raw / maxTotal) * 100)));
}

// ----- Segments --------------------------------------------------------------
// A segment is defined by criteria; a lead belongs to it when it matches those
// criteria — so auto-segmentation is automatic and no join table is needed.

export type SegmentType = "auto" | "manual" | "competitor_audience";

export type SegmentCriteria = {
  sectors?: string[]; // detected sector of the lead's company
  channels?: LeadChannel[];
  statuses?: LeadStatus[];
  minScore?: number; // qualification score threshold (0/50/75/90)
};

export type Segment = {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  type: SegmentType;
  criteria: SegmentCriteria;
  isArchived: boolean;
  logreachLinked: boolean; // linked to a LogReach outreach flow
  createdAt: string;
};

export const SEGMENT_TYPE_META: Record<
  SegmentType,
  { label: string; badgeCls: string; icon: string }
> = {
  auto: { label: "IA Auto", badgeCls: "bg-primary/10 text-primary", icon: "sparkles" },
  manual: { label: "Manuel", badgeCls: "bg-surface-hover text-muted", icon: "folder" },
  competitor_audience: { label: "Audience concurrent", badgeCls: "bg-[#C13584]/10 text-[#C13584]", icon: "users" },
};

// Sectors with detection hints (matched against company + job title).
export const SEGMENT_SECTORS: { value: string; hints: string[] }[] = [
  { value: "SaaS", hints: ["saas", "software", "app", "platform", "cloud", "tech"] },
  { value: "Agence", hints: ["agence", "agency", "studio", "consult"] },
  { value: "BTP", hints: ["btp", "construction", "bâtiment", "immobilier", "real estate"] },
  { value: "E-commerce", hints: ["ecommerce", "e-commerce", "shop", "store", "retail online", "shopify"] },
  { value: "RH", hints: ["rh", "hr", "recrutement", "recruit", "talent", "people"] },
  { value: "Finance", hints: ["finance", "fintech", "bank", "invest", "capital", "compta"] },
  { value: "Santé", hints: ["santé", "health", "medtech", "med", "clinic", "care"] },
  { value: "Education", hints: ["education", "edtech", "school", "learn", "formation", "academy"] },
  { value: "Retail", hints: ["retail", "magasin", "boutique", "commerce"] },
  { value: "Tech", hints: ["tech", "ai", "ia", "data", "dev", "engineer", "digital"] },
];

export type LeadEventType =
  | "added"
  | "status_changed"
  | "note_added"
  | "email_sent"
  | "enriched"
  | "scored";

export type LeadEvent = {
  id: string;
  leadId: string;
  type: LeadEventType;
  data: Record<string, unknown>;
  createdAt: string;
};

// ----- LogReach (Inbox) ------------------------------------------------------
// Contact leads without leaving the app. Email in V1; LinkedIn/Reddit DM V1.2.

export type ConversationChannel = "email" | "linkedin" | "reddit";

export type ConversationStatus =
  | "unread" // an inbound message hasn't been read (V1.2 — inbound sync)
  | "contacted" // conversation opened, nothing sent yet
  | "waiting" // outbound sent, awaiting a reply
  | "replied" // the lead answered
  | "resolved"; // closed by the founder

export type Conversation = {
  id: string;
  workspaceId: string;
  leadId: string;
  channel: ConversationChannel;
  status: ConversationStatus;
  lastMessageAt: string | null;
  createdAt: string;
};

export type InboxMessage = {
  id: string;
  conversationId: string;
  direction: "outbound" | "inbound";
  content: string;
  sentAt: string;
  isAiGenerated: boolean;
  readAt: string | null;
};

// ----- LogAgent (CMO IA conversationnel — plan Pro, bêta) -------------------

export type AgentRole = "user" | "assistant";

// Structured payload the UI renders as cards under an assistant message.
export type AgentPayload =
  | { kind: "leads"; items: { id: string; name: string; subtitle: string; unread: number; date: string }[] }
  | { kind: "messages"; items: { id: string; name: string; subtitle: string; unread: number; date: string }[] }
  | { kind: "content"; platform: string; body: string }
  | { kind: "report"; rows: { label: string; value: string }[] }
  | null;

export type AgentMessage = {
  id: string;
  conversationId: string;
  role: AgentRole;
  content: string;
  payload?: AgentPayload;
  reasoning?: string; // short "réflexion" trace shown above the answer
  credits: number; // credits charged for this message (assistant only)
  createdAt: string;
};

export type AgentConversation = {
  id: string;
  workspaceId: string;
  title: string; // first user message, truncated
  createdAt: string;
  updatedAt: string;
};

// Credit cost per action type.
export type AgentAction =
  | "chat"
  | "search_leads"
  | "generate_content"
  | "analyze"
  | "reply"
  | "report";

export const AGENT_CREDIT_COSTS: Record<AgentAction, number> = {
  chat: 10,
  search_leads: 50,
  generate_content: 100,
  analyze: 200,
  reply: 75,
  report: 150,
};

export const AGENT_MONTHLY_QUOTA = 30_000;

export const AGENT_SUGGESTIONS = [
  "Trouver des leads qualifiés",
  "Analyser la concurrence",
  "Créer des posts",
  "Répondre aux leads",
];

export type WorkspaceRole = "owner" | "member";

export type WorkspaceMember = {
  id: string;
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
  createdAt: string;
};

export type Profile = {
  id: string;
  workspaceId: string;
  saasName: string;
  offer: string;
  valueProp: string;
  icp: string;
  competitors: string[]; // up to 3 direct competitors
  tone: Tone;
  platforms: Platform[]; // content-format platforms (linkedin/instagram/tiktok)
  networks?: AlgoNetwork[]; // distribution networks chosen at onboarding (LinkedIn/X/Instagram/Reddit)
  goal: Goal;
  // Enrichment collected by the onboarding wizard (optional — older profiles
  // may not have these). Injected into generation prompts.
  orgType?: OrgType; // drives interface vocabulary + recommendations
  siteUrl?: string;
  sector?: string;
  companySizes?: CompanySize[];
  problem?: string;
  competitorDiffs?: string[]; // aligned by index with `competitors`
  frequency?: Frequency;
  // ----- Prospecting onboarding (v2) -----
  profileType?: string; // agency | sales | freelance | founder | local | other
  preferredSources?: ProspectSource[]; // sources chosen at onboarding
  // Onboarding checklist (dashboard getting-started block). Only steps that
  // can't be derived from data are persisted here (e.g. "algo_insider" visit,
  // "connections"); the rest is computed live from content/analyses.
  checklistSteps?: string[];
  checklistDismissed?: boolean;
  createdAt: string;
  updatedAt: string;
};

// Per-step autosave for the onboarding wizard (mirrors an onboarding_progress
// table). `data` accumulates the wizard answers; `completedAt` marks the finish.
export type OnboardingProgress = {
  id: string;
  workspaceId: string;
  step: number;
  data: Record<string, unknown>;
  completedAt: string | null;
  updatedAt: string;
};

export type ContentType =
  | "linkedin_post"
  | "reel_script"
  | "instagram_caption"
  | "story";

export const CONTENT_TYPES: {
  value: ContentType;
  label: string;
  platform: Platform;
}[] = [
  { value: "linkedin_post", label: "Post LinkedIn", platform: "linkedin" },
  { value: "reel_script", label: "Script Reel / TikTok", platform: "tiktok" },
  {
    value: "instagram_caption",
    label: "Légende Instagram",
    platform: "instagram",
  },
  { value: "story", label: "Story", platform: "instagram" },
];

export type ContentSource = "brief" | "clone" | "template" | "cmo";
export type ContentStatus = "draft" | "scheduled" | "published";

export const CONTENT_STATUS_META: Record<
  ContentStatus,
  { label: string; cls: string; dot: string }
> = {
  draft: { label: "Brouillon", cls: "border-line text-muted", dot: "#94A3B8" },
  scheduled: { label: "Prêt à publier", cls: "border-primary/20 bg-primary/5 text-primary", dot: "#0051FF" },
  published: { label: "Publié", cls: "border-success/20 bg-success/5 text-success", dot: "#12B76A" },
};

export type ContentItem = {
  id: string;
  workspaceId: string;
  type: ContentType;
  platform: Platform;
  title: string;
  body: string;
  source: ContentSource;
  status: ContentStatus;
  scheduledDate: string | null; // YYYY-MM-DD when scheduled
  scheduledTime?: string | null; // "HH:MM" publish time (defaults to 09:00 when scheduled)
  createdAt: string;
};

// ----- Algo Insider --------------------------------------------------------
// AI-generated, niche-specific algorithm guide, per social network.

export type AlgoNetwork = "linkedin" | "x" | "instagram" | "reddit";

// V1 is centered on LinkedIn, X and Reddit. Instagram is `comingSoon` — greyed
// with a "Bientôt" badge everywhere a network is selectable.
export const ALGO_NETWORKS: {
  value: AlgoNetwork;
  label: string;
  dot: string;
  comingSoon?: boolean;
  contentType?: ContentType; // for "Créer un contenu" deep-link into the Studio
}[] = [
  { value: "linkedin", label: "LinkedIn", dot: "#0A66C2", contentType: "linkedin_post" },
  { value: "x", label: "X", dot: "#0E1525" },
  { value: "reddit", label: "Reddit", dot: "#FF4500" },
  { value: "instagram", label: "Instagram", dot: "#C13584", comingSoon: true, contentType: "instagram_caption" },
];

// The 3 networks live in V1; Instagram is filtered out of active selectors.
export const V1_NETWORKS: AlgoNetwork[] = ["linkedin", "x", "reddit"];
export const INSTAGRAM_SOON_TOOLTIP =
  "Instagram arrive très prochainement. Active les notifications pour être averti.";

export function algoNetworkLabel(n: AlgoNetwork): string {
  return ALGO_NETWORKS.find((x) => x.value === n)?.label ?? n;
}

export type AlgoFormat = { name: string; why: string };
export type AlgoHook = { type: string; example: string };
export type AlgoTechnique = { title: string; description: string; example: string };

export type AlgoNetworkInsight = {
  network: AlgoNetwork;
  bestTimes: string; // "Quand poster"
  formats: AlgoFormat[]; // "Quoi poster"
  hooks: AlgoHook[]; // "Comment capter l'attention"
  techniques: AlgoTechnique[]; // "Techniques de mise en avant SaaS"
  avoid: string[]; // "Ce qu'il faut éviter"
  trend: string; // "L'algorithme en ce moment"
};

export type AlgoInsights = {
  workspaceId: string;
  generatedAt: string;
  demo: boolean;
  networks: AlgoNetworkInsight[];
};

// ----- IA Visibility ---------------------------------------------------------
// Scan whether the founder's SaaS is mentioned/recommended by the big LLMs.

export type VisibilityLLM =
  | "chatgpt"
  | "claude"
  | "gemini"
  | "perplexity"
  | "grok"
  | "mistral";

export type VisibilityStatus = "mentioned" | "partial" | "not_detected";

export const VISIBILITY_LLMS: {
  value: VisibilityLLM;
  label: string;
  color: string; // brand accent for the tile
  chartColor: string; // distinct series color, readable in light & dark
  envKey: string; // env var that unlocks the real API call
}[] = [
  { value: "chatgpt", label: "ChatGPT", color: "#0F172A", chartColor: "#10A37F", envKey: "OPENAI_API_KEY" },
  { value: "claude", label: "Claude", color: "#D97706", chartColor: "#D97706", envKey: "ANTHROPIC_API_KEY" },
  { value: "gemini", label: "Gemini", color: "#1A73E8", chartColor: "#1A73E8", envKey: "GEMINI_API_KEY" },
  { value: "perplexity", label: "Perplexity", color: "#20808D", chartColor: "#20808D", envKey: "PERPLEXITY_API_KEY" },
  { value: "grok", label: "Grok", color: "#0F172A", chartColor: "#7C3AED", envKey: "XAI_API_KEY" },
  { value: "mistral", label: "Mistral", color: "#FF7000", chartColor: "#FF7000", envKey: "MISTRAL_API_KEY" },
];

export const VISIBILITY_STATUS_META: Record<
  VisibilityStatus,
  { label: string; emojiLabel: string }
> = {
  mentioned: { label: "Mentionné", emojiLabel: "✅ Mentionné" },
  partial: { label: "Partiel", emojiLabel: "🟡 Partiel" },
  not_detected: { label: "Non détecté", emojiLabel: "❌ Non détecté" },
};

export type VisibilityLLMResult = {
  llm: VisibilityLLM;
  status: VisibilityStatus;
  query: string; // the query whose answer is shown
  excerpt: string; // response excerpt around the mention (or start of answer)
  position: string | null; // e.g. "2e mention"
  tone: string | null; // e.g. "Recommandation positive"
  demo: boolean; // true when produced without a real API key
};

export type VisibilityRecommendation = { title: string; text: string };

// ----- GEO (Generative Engine Optimization) — v2 of IA Visibility ----------
// A scan asks each LLM every generated query; rows aggregate per query,
// llmScores aggregate per LLM (0-100).

export type GeoQueryGroup = "niche" | "competitor" | "brand";

export type GeoQueryRow = {
  query: string;
  group: GeoQueryGroup;
  perLLM: Partial<Record<VisibilityLLM, VisibilityStatus>>;
  score: number; // 0-100 across LLMs (mentioned=100, partial=50)
  topLLM: VisibilityLLM | null; // best-ranking LLM on this query
  topCompetitor: string | null; // competitor cited instead of the SaaS
  linksToSite: boolean; // at least one LLM linked the site URL
  linkedCount: number; // how many LLMs linked the site URL on this query
  excerpt: string; // best answer excerpt for this query
};

// Competitor visibility on the same queries (0-100 per LLM, like llmScores).
export type GeoCompetitorScore = {
  name: string;
  scores: Partial<Record<VisibilityLLM, number>>;
  avg: number;
};

// What feeds a competitor's LLM visibility (Pro) — detected sources, the
// queries it dominates, and how to counter it.
export type GeoCompetitorInsight = {
  name: string;
  sources: { label: string; count: number }[];
  dominantQueries: { query: string; score: number }[];
  counters: string[];
};

export type GeoActionImpact = "critical" | "high" | "medium";
export type GeoActionEffort = "quick" | "medium" | "long";

export type GeoAction = {
  id: string;
  title: string;
  impact: GeoActionImpact;
  effort: GeoActionEffort;
  points: number; // estimated GEO score gain
  why: string;
  steps: string[];
  cta: {
    label: string;
    kind: "studio" | "schema" | "analyzer";
    brief?: string; // Studio IA brief (kind=studio)
    faq?: string[]; // FAQ questions to build JSON-LD from (kind=schema)
  };
};

export const GEO_IMPACT_META: Record<GeoActionImpact, { label: string; cls: string }> = {
  critical: { label: "Critique", cls: "bg-danger/10 text-danger" },
  high: { label: "Élevé", cls: "bg-warning/10 text-warning" },
  medium: { label: "Moyen", cls: "bg-info/10 text-info" },
};

export const GEO_EFFORT_META: Record<GeoActionEffort, string> = {
  quick: "Rapide (1-2h)",
  medium: "Moyen (1 jour)",
  long: "Long (1 semaine)",
};

export type VisibilityScan = {
  id: string;
  workspaceId: string;
  url: string;
  results: VisibilityLLMResult[];
  globalScore: number; // legacy scans: X/6 · GEO scans (queryRows set): 0-100
  recommendations: VisibilityRecommendation[];
  createdAt: string;
  // GEO fields (absent on legacy scans)
  queryRows?: GeoQueryRow[];
  llmScores?: Partial<Record<VisibilityLLM, number>>; // 0-100 per LLM
  competitorScores?: GeoCompetitorScore[];
  competitorInsights?: GeoCompetitorInsight[];
  actionPlan?: GeoAction[];
};

// ----- Content Analyzer -----------------------------------------------------
// Paste a post/video URL (+ its text/transcript) → graded report with actions.

export type AnalysisKind = "video" | "post";
export type AnalysisVerdict = "good" | "warn" | "bad";

export type AnalysisCriterion = {
  name: string;
  score: number; // 0-100
  verdict: AnalysisVerdict;
  feedback: string;
};

export type ContentAnalysis = {
  id: string;
  workspaceId: string;
  url: string;
  platform: string; // detected label, e.g. "LinkedIn"
  kind: AnalysisKind;
  globalScore: number; // 0-100
  criteria: AnalysisCriterion[];
  summary: { good: string[]; improve: string[]; change: string[] };
  rewriteBrief: string; // concise brief to pre-fill the Studio rewrite
  createdAt: string;
};

// A single generated variant (hook / body / cta), used by the viral clone.
export type Variant = {
  hook: string;
  body: string;
  cta: string;
  hookScore?: number;
  hookReason?: string;
};

// Structured feedback scores (0-100 each) for a generated content.
export type VariantScores = {
  hook: number;
  structure: number;
  voice: number;
  platform: number;
};

// Studio brief generation → 3 distinct variants (different angle each).
export type BriefVariant = {
  content: string; // full, ready-to-paste
  hookScore: number; // mirrors scores.hook (used by the editor badge)
  hookReason: string;
  hookType: string; // e.g. "Chiffre surprenant", "Affirmation contrariante"
  angle: string; // e.g. "Contrarian", "Storytelling personnel"
  whyNiche: string; // 1 phrase: why it fits the niche
  scores: VariantScores;
  strengths: string[]; // "Ce qui est fort"
  improvements: string[]; // "Ce qu'on peut améliorer" (actionable)
};

// Studio formats per network. `contentType`/`platform` are the storage mapping
// used when saving to the content library (X & Reddit fall back to a text post).
export type StudioFormat = {
  value: string;
  label: string;
  contentType: ContentType;
  platform: Platform;
  comingSoon?: boolean; // Instagram formats — shown greyed with a "Bientôt" badge
};
// X & Reddit have no native content type yet, so they store as a text post.
export const STUDIO_FORMATS: Record<AlgoNetwork, StudioFormat[]> = {
  linkedin: [
    { value: "post_short", label: "Post texte court", contentType: "linkedin_post", platform: "linkedin" },
    { value: "post_long", label: "Post long / storytelling", contentType: "linkedin_post", platform: "linkedin" },
    { value: "carousel", label: "Structure carrousel", contentType: "linkedin_post", platform: "linkedin" },
    { value: "build_public", label: "Post build in public", contentType: "linkedin_post", platform: "linkedin" },
  ],
  x: [
    { value: "tweet", label: "Tweet unique percutant", contentType: "linkedin_post", platform: "linkedin" },
    { value: "thread", label: "Thread", contentType: "linkedin_post", platform: "linkedin" },
    { value: "build_public", label: "Build in public tweet", contentType: "linkedin_post", platform: "linkedin" },
  ],
  reddit: [
    { value: "question", label: "Post question ouverte", contentType: "linkedin_post", platform: "linkedin" },
    { value: "learning", label: "Post partage d'apprentissage", contentType: "linkedin_post", platform: "linkedin" },
    { value: "reply", label: "Réponse à une discussion", contentType: "linkedin_post", platform: "linkedin" },
    { value: "ama", label: "Post d'introduction AMA", contentType: "linkedin_post", platform: "linkedin" },
  ],
  instagram: [
    { value: "reel", label: "Script Reel", contentType: "reel_script", platform: "instagram", comingSoon: true },
    { value: "caption", label: "Légende Instagram", contentType: "instagram_caption", platform: "instagram", comingSoon: true },
    { value: "story", label: "Story Instagram", contentType: "story", platform: "instagram", comingSoon: true },
  ],
};

// Character budgets per network, used by the editor length indicator.
export const NETWORK_LIMITS: Record<AlgoNetwork, { max: number; ideal: [number, number] }> = {
  linkedin: { max: 3000, ideal: [700, 1500] },
  x: { max: 280, ideal: [120, 270] },
  instagram: { max: 2200, ideal: [300, 1000] },
  reddit: { max: 20000, ideal: [500, 3000] },
};

// ----- Studio IA v3 (guided assistant) -------------------------------------
// Constants driving the multi-step generation wizard. The tone/objective/format
// values are passed to Claude as free-form labels (the generation engine already
// reasons about them via genSystem/formatStructure), so no enum coupling.

export const LANGUAGES: { value: string; label: string; flag: string }[] = [
  { value: "fr", label: "Français", flag: "🇫🇷" },
  { value: "en", label: "English", flag: "🇬🇧" },
  { value: "es", label: "Español", flag: "🇪🇸" },
  { value: "de", label: "Deutsch", flag: "🇩🇪" },
  { value: "it", label: "Italiano", flag: "🇮🇹" },
  { value: "pt", label: "Português", flag: "🇵🇹" },
  { value: "nl", label: "Nederlands", flag: "🇳🇱" },
];

export function languageLabel(value: string): string {
  return LANGUAGES.find((l) => l.value === value)?.label ?? "Français";
}

// The 9 tone chips (superset of TONES — adds Provocateur, Vulnérable, etc.).
export const WIZARD_TONES = [
  "Professionnel",
  "Storytelling",
  "Provocateur",
  "Éducatif",
  "Inspirant",
  "Humoristique",
  "Direct",
  "Challenger",
  "Vulnérable",
] as const;

// The 10 objective chips.
export const POST_OBJECTIVES: { value: string; label: string }[] = [
  { value: "leads", label: "Générer des leads" },
  { value: "announce", label: "Annoncer une nouveauté" },
  { value: "audience", label: "Construire une audience" },
  { value: "launch", label: "Lancer un produit" },
  { value: "rex", label: "Partager un REX" },
  { value: "comments", label: "Obtenir des commentaires" },
  { value: "recruit", label: "Recruter" },
  { value: "educate", label: "Éduquer ma cible" },
  { value: "debate", label: "Provoquer le débat" },
  { value: "build_public", label: "Build in public" },
];

export function objectiveLabel(value: string): string {
  return POST_OBJECTIVES.find((o) => o.value === value)?.label ?? value;
}

// The 12 format chips (icon + label). Label is passed straight to generation.
export const POST_FORMATS: { value: string; label: string; emoji: string }[] = [
  { value: "story", label: "Histoire personnelle", emoji: "📝" },
  { value: "list", label: "Liste", emoji: "📋" },
  { value: "tutorial", label: "Tutoriel", emoji: "🎓" },
  { value: "comparison", label: "Comparaison", emoji: "⚖️" },
  { value: "opinion", label: "Opinion forte", emoji: "💬" },
  { value: "case_study", label: "Étude de cas", emoji: "📊" },
  { value: "framework", label: "Framework", emoji: "🔧" },
  { value: "analysis", label: "Analyse", emoji: "🔍" },
  { value: "question", label: "Question", emoji: "❓" },
  { value: "thread", label: "Thread X", emoji: "🧵" },
  { value: "longform", label: "Long-form", emoji: "📖" },
  { value: "contrarian", label: "Contrarian", emoji: "🔥" },
];

export function postFormatLabel(value: string): string {
  return POST_FORMATS.find((f) => f.value === value)?.label ?? value;
}

// ----- Campaigns (multichannel distribution) -------------------------------
// A core message declined into one native variant per channel, each scheduled
// into the LogLead calendar. Publication is internal (no social OAuth yet);
// lead attribution is real (leads link to a publication's content item).

export type CampaignChannel = "linkedin" | "x" | "reddit" | "email";

export type CampaignStatus = "draft" | "scheduled" | "active" | "completed";

export const CAMPAIGN_CHANNELS: {
  value: CampaignChannel;
  label: string;
  dot: string;
  format: string; // native format label per channel
}[] = [
  { value: "linkedin", label: "LinkedIn", dot: "#0A66C2", format: "Post texte" },
  { value: "x", label: "X", dot: "#0F1419", format: "Thread" },
  { value: "reddit", label: "Reddit", dot: "#FF4500", format: "Post r/SaaS" },
  { value: "email", label: "Email", dot: "#12B76A", format: "Newsletter" },
];

export function campaignChannelLabel(c: CampaignChannel): string {
  return CAMPAIGN_CHANNELS.find((x) => x.value === c)?.label ?? c;
}

export type CampaignPublicationStatus = "scheduled" | "published";

export type CampaignPublication = {
  id: string;
  channel: CampaignChannel;
  content: string;
  subject?: string; // email only
  contentItemId: string | null; // linked calendar content (attribution + calendar)
  scheduledDate: string | null; // YYYY-MM-DD
  scheduledTime: string | null; // HH:MM
  status: CampaignPublicationStatus;
  // Seeded engagement figures (no live social data yet).
  views: number;
  likes: number;
  comments: number;
};

export type Campaign = {
  id: string;
  workspaceId: string;
  name: string;
  coreMessage: string;
  status: CampaignStatus;
  publications: CampaignPublication[];
  createdAt: string;
};

// Viral clone: analysis of the source + an adapted, ready-to-publish content.
export type CloneResult = {
  platform: string; // detected source platform label
  hookType: string; // e.g. "Question", "Chiffre", "Affirmation contrariante"
  narrativeStructure: string; // e.g. "Problème → Solution"
  retention: string; // main retention technique
  viralityTrigger: string; // émotion / curiosité / controverse / utilité
  viralityScore: number; // /100
  content: string; // adapted content, ready to publish
  hookScore: number; // /100
  whyItWorks: string; // pourquoi cette structure va marcher pour ce founder
  improvementTip: string; // 1 suggestion pour personnaliser encore plus
};

// Curated template catalog entry.
export type TemplateCategory =
  | "linkedin_storytelling"
  | "linkedin_contrarian"
  | "linkedin_list"
  | "linkedin_case_study"
  | "reel_hook"
  | "lead_magnet";

export type Template = {
  id: string;
  category: TemplateCategory;
  platform: Platform;
  contentType: ContentType;
  title: string;
  description: string;
  structure: string; // the reusable skeleton, with {{placeholders}}
};

export const TEMPLATE_CATEGORIES: {
  value: TemplateCategory;
  label: string;
}[] = [
  { value: "linkedin_storytelling", label: "LinkedIn · Storytelling" },
  { value: "linkedin_contrarian", label: "LinkedIn · Contrarian take" },
  { value: "linkedin_list", label: "LinkedIn · Liste" },
  { value: "linkedin_case_study", label: "LinkedIn · Étude de cas" },
  { value: "reel_hook", label: "Reels / TikTok · Hook" },
  { value: "lead_magnet", label: "Lead magnet" },
];

// Helpers
export function platformLabel(p: Platform): string {
  return PLATFORMS.find((x) => x.value === p)?.label ?? p;
}

export function contentTypeLabel(t: ContentType): string {
  return CONTENT_TYPES.find((x) => x.value === t)?.label ?? t;
}

// ----- Market Intelligence (Apify posts → Claude analysis) -----------------

export type MarketTrend = {
  topic: string;
  summary: string;
  momentum: "hot" | "rising" | "steady";
};

export type MarketSignal = {
  title: string;
  who: string; // company/person the signal is about
  why: string; // why it's an opportunity
  kind: string; // e.g. "Hiring", "Funding", "New entrant", "Pain point"
};

// One stored market report per workspace (overwritten on each refresh).
export type MarketReport = {
  workspaceId: string;
  marketScore: number; // 0-100
  headline: string; // 2-3 sentence analyst brief
  trends: MarketTrend[];
  audienceTopics: string[];
  audienceQuestions: string[];
  audiencePainPoints: string[];
  signals: MarketSignal[];
  recommendations: string[];
  postsAnalyzed: number;
  queries: string[];
  createdAt: string; // ISO
};

// ----- LogAgent: searches + prospects (product refonte) --------------------

export type SearchIntent = "prospect_search" | "pipeline_analysis" | "message_generation" | "general";

export type ProspectSource =
  | "linkedin_jobs"
  | "linkedin_company"
  | "google_maps"
  | "google_search"
  | "reddit"
  | "instagram"
  | "tiktok"
  | "facebook"
  | "twitter"
  | "manual";

// Parsed search criteria extracted from the natural-language query by Claude.
export type SearchCriteria = {
  type?: "company" | "person" | "local_business";
  sector?: string;
  signal?: string; // e.g. "job_posting", "no_website", "low_rating"
  jobTitle?: string;
  location?: string;
  sizeMin?: number;
  sizeMax?: number;
  keywords?: string[];
};

export type Search = {
  id: string;
  workspaceId: string;
  query: string;
  intent: SearchIntent;
  criteria: SearchCriteria;
  sources: ProspectSource[];
  title: string; // AI-generated title
  totalResults: number;
  qualifiedResults: number;
  creditsUsed: number;
  status: "pending" | "running" | "done" | "error";
  isFirstSearch?: boolean; // created by the onboarding flow
  createdAt: string;
};

export type ProspectStage = "new" | "hot" | "to_contact" | "contacted" | "converted" | "archived";

export type ContactStatus =
  | "to_contact"
  | "message_sent"
  | "replied"
  | "meeting_booked"
  | "converted"
  | "not_interested";

export type ProspectSignal = { level: "hot" | "warm" | "cold"; text: string };

export type Prospect = {
  id: string;
  workspaceId: string;
  searchId: string | null;
  companyName: string;
  companyLogoUrl?: string;
  companyDomain?: string;
  companySize?: string;
  companySector?: string;
  companyLocation?: string;
  contactName?: string;
  contactEmail?: string | null; // encrypted at rest
  contactPhone?: string | null; // encrypted at rest
  contactLinkedinUrl?: string;
  source: ProspectSource;
  signalType?: string;
  signalDescription?: string;
  signalDate?: string;
  fitScore: number; // 0-100
  fitReasoning?: string;
  signals?: ProspectSignal[];
  stage: ProspectStage;
  notes?: string;
  lastMessageGenerated?: string;
  inPipeline: boolean; // added to the Pipeline module
  // ----- Contact module (outreach tracking) -----
  inContact?: boolean;
  contactStatus?: ContactStatus;
  contactAddedAt?: string;
  lastMessageSentAt?: string;
  lastReplyReceived?: string;
  lastReplyAt?: string;
  enrichedAt?: string;
  createdAt: string;
  updatedAt: string;
};
