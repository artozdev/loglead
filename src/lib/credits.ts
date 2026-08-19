import type { Plan } from "./types";

// ---------------------------------------------------------------------------
// Credit system — single source of truth for costs, quotas and pricing.
// Pure module (no server-only imports) so both the API routes and the client
// widgets can import it.
// ---------------------------------------------------------------------------

// Credits consumed per action.
export const CREDIT_COSTS = {
  // Content Studio
  generate_post: 10,
  generate_post_variant: 5,
  improve_post: 5,
  clone_viral_structure: 15,

  // Market Intelligence
  refresh_market_data: 30,
  analyze_competitor: 20,
  detect_trends: 15,
  detect_buying_signals: 25,

  // Leads
  find_prospects: 50,
  enrich_lead_email: 20,
  enrich_lead_phone: 20,
  enrich_lead_full: 35,
  calculate_lead_score: 10,
  generate_message: 10,

  // AI Growth Partner
  ai_chat_message: 10,
  ai_market_analysis: 50,
  ai_prospect_search: 100,
  ai_weekly_report: 50,

  // AI Visibility (GEO)
  geo_scan: 100,
  geo_competitor_scan: 50,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// Post generation cost varies by format: heavier outputs (threads, carousels,
// video scripts) cost more than a simple post; short formats (story) cost less.
// `generate_post` (10) stays the baseline default.
export function postGenerationCost(input: { network?: string; format?: string }): number {
  const f = (input.format ?? "").toLowerCase();
  // Long / structured formats → more work, more tokens.
  if (/thread|carrou|carou|s[ée]quence|script|reel|vid[ée]o|long|newsletter|article/.test(f)) {
    return 15;
  }
  // Short formats.
  if (/story|stories|tweet court|punchline/.test(f)) return 5;
  // Standard post (LinkedIn text, caption, X post…).
  return CREDIT_COSTS.generate_post;
}

// One-time credits granted on the free offer (no renewal, expire once spent).
export const FREE_CREDITS = 100;
// Back-compat alias (older imports).
export const TRIAL_CREDITS = FREE_CREDITS;
export const TRIAL_DAYS = 7;

// Monthly quota granted at each plan's renewal date. Free gets none.
export const PLAN_MONTHLY_CREDITS: Record<Plan, number> = {
  free: 0,
  starter: 2000,
  growth: 5000,
  pro: 10000,
};

// Subscription price (€/month) per paid plan. Annual billing applies -20%.
export const PLAN_PRICE_MONTHLY: Record<Exclude<Plan, "free">, number> = {
  starter: 29,
  growth: 59,
  pro: 99,
};

// Amount charged in EUR cents for a Stripe subscription line item.
export function subscriptionAmountCents(
  plan: Exclude<Plan, "free">,
  billing: "monthly" | "annual",
): number {
  const monthly = PLAN_PRICE_MONTHLY[plan];
  return billing === "annual"
    ? Math.round(monthly * 12 * 0.8 * 100) // yearly, 20% off
    : Math.round(monthly * 100);
}

// Marketing card content for the mandatory plan screen.
export type PlanCard = {
  id: Plan;
  name: string;
  priceMonthly: number; // €/mo
  monthly: number; // monthly credits after trial
  popular?: boolean;
  features: string[];
};

export const PLAN_CARDS: PlanCard[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    monthly: 2000,
    features: ["Market (basic)", "500 leads/mo", "Post Generator", "Content Calendar", "Email support"],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 59,
    monthly: 5000,
    popular: true,
    features: ["Market Intelligence", "2,000 leads/mo", "Post Generator", "Content Calendar", "Priority support"],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 99,
    monthly: 10000,
    features: ["Market Intelligence", "Unlimited leads", "Post Generator", "Content Calendar", "AI Growth Partner", "Dedicated support"],
  },
];

// Credit top-up packs (1 credit = 0.01 €).
export const CREDIT_PRICE_PER = 0.01;
export const CREDIT_MIN = 500;
export const CREDIT_MAX = 50000;
export const CREDIT_STEP = 500;
export const QUICK_PACKS = [2000, 5000, 10000];

// Price in € for a given credit amount (1 credit = 1 cent).
export function creditsPrice(credits: number): number {
  return Math.round(credits * CREDIT_PRICE_PER * 100) / 100;
}

// Clamp + snap a requested amount to the allowed slider range/step.
export function normalizeCredits(n: number): number {
  const clamped = Math.min(CREDIT_MAX, Math.max(CREDIT_MIN, Math.round(n)));
  return Math.round(clamped / CREDIT_STEP) * CREDIT_STEP;
}

// Header badge color by remaining ratio of the monthly quota.
export function creditColor(balance: number, quota: number): "ok" | "warn" | "danger" {
  const ratio = quota > 0 ? balance / quota : 1;
  if (ratio < 0.2) return "danger";
  if (ratio < 0.5) return "warn";
  return "ok";
}
