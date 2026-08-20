import "server-only";
import type { Plan, Workspace } from "./types";
import { hasApify, scrapeMyEngagers, type Engager } from "./apify";
import { credits, leads, workspaces, type LeadInput } from "./db";

// Shared engagement → leads detection, used by both the on-demand API route and
// the cron. Enforces cost/rate guards so we never scrape at a loss.
//
// Billing: charged PER NEW LEAD actually imported. A run that only finds
// already-known people (or nothing) costs 0 credits.

export const DETECT_CREDITS_PER_LEAD = 5; // credits per new lead imported
export const DETECT_COOLDOWN_MS = 24 * 60 * 60 * 1000; // manual: one run / 24h
const MAX_IMPORT = 40;

// Automatic (cron) cadence per plan: Growth/Pro daily, others every 3 days.
// A 1h grace absorbs the daily cron's timing jitter so a run is never skipped.
export function planDetectIntervalMs(plan: Plan): number {
  const hours = plan === "growth" || plan === "pro" ? 24 : 72;
  return (hours - 1) * 60 * 60 * 1000;
}

export type DetectResult =
  | { ok: true; created: number; skipped: number; found: number; balance: number }
  | {
      ok: false;
      reason: "no_url" | "no_apify" | "cooldown" | "insufficient" | "no_engagement";
      hoursLeft?: number;
      balance?: number;
      needed?: number;
    };

function norm(url?: string | null): string {
  if (!url) return "";
  return url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split("?")[0].replace(/\/$/, "");
}

export async function runLeadDetection(
  workspace: Workspace,
  opts: { cooldownMs?: number } = {},
): Promise<DetectResult> {
  const cooldown = opts.cooldownMs ?? DETECT_COOLDOWN_MS;
  const profileUrl = workspace.linkedinProfileUrl;
  if (!profileUrl) return { ok: false, reason: "no_url" };
  if (!hasApify()) return { ok: false, reason: "no_apify" };

  // Rate limit — bounds our Apify spend per workspace (24h for manual runs,
  // plan-based interval when called by the cron).
  if (workspace.lastLeadDetectAt) {
    const elapsed = Date.now() - new Date(workspace.lastLeadDetectAt).getTime();
    if (elapsed < cooldown) {
      return { ok: false, reason: "cooldown", hoursLeft: Math.ceil((cooldown - elapsed) / 3.6e6) };
    }
  }

  // Balance pre-check BEFORE scraping — need enough for at least one lead,
  // otherwise never pay Apify.
  const balance = await credits.balance(workspace.id);
  if (balance < DETECT_CREDITS_PER_LEAD) {
    return { ok: false, reason: "insufficient", balance, needed: DETECT_CREDITS_PER_LEAD };
  }

  let engagers: Engager[];
  try {
    engagers = await scrapeMyEngagers(profileUrl);
  } catch {
    engagers = [];
  }
  // Stamp the cooldown as soon as we've scraped (bounds repeated scraping).
  await workspaces.markLeadDetect(workspace.id);
  if (engagers.length === 0) return { ok: false, reason: "no_engagement" };

  // Dedupe against existing leads by LinkedIn URL.
  const existing = await leads.listByWorkspace(workspace.id);
  const known = new Set(existing.map((l) => norm(l.linkedinUrl)).filter(Boolean));
  const fresh = engagers.filter((e) => {
    const key = norm(e.linkedinUrl);
    return !(key && known.has(key));
  });

  // Nothing new → no charge (this is the whole point: pay only for new leads).
  if (fresh.length === 0) {
    return { ok: true, created: 0, skipped: engagers.length, found: engagers.length, balance };
  }

  // Import only as many new leads as the balance covers (5 credits each).
  const affordable = Math.floor(balance / DETECT_CREDITS_PER_LEAD);
  const toImport = fresh.slice(0, Math.min(affordable, MAX_IMPORT));
  for (const e of toImport) {
    const input: LeadInput = {
      firstName: e.firstName || e.name,
      lastName: e.lastName,
      email: null,
      phone: null,
      jobTitle: e.headline,
      linkedinUrl: e.linkedinUrl,
      channel: "linkedin",
      status: "new",
      score: e.kind === "comment" ? 55 : 40,
      notes: e.kind === "comment" ? "A commenté un de tes posts" : "A réagi à un de tes posts",
    };
    await leads.create(workspace.id, input);
  }

  // Charge exactly for the new leads imported.
  const charge = await credits.consume(
    workspace.id,
    "detect_leads",
    toImport.length * DETECT_CREDITS_PER_LEAD,
  );

  return {
    ok: true,
    created: toImport.length,
    skipped: engagers.length - toImport.length,
    found: engagers.length,
    balance: charge.ok ? charge.balance : balance,
  };
}
