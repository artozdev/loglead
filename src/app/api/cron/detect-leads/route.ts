import { NextResponse } from "next/server";
import { workspaces } from "@/lib/db";
import { cronAuthorized } from "@/lib/emails/cron";
import { planDetectIntervalMs, runLeadDetection } from "@/lib/leadDetect";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily automatic lead detection — only for workspaces that opted in AND set a
// LinkedIn profile URL. All cost/rate guards live in runLeadDetection, so a
// workspace on cooldown or out of credits is simply skipped (no charge, no
// scrape). Scheduled via vercel.json.
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let runs = 0;
  let created = 0;
  let skipped = 0;

  for (const ws of await workspaces.listAll()) {
    if (!ws.autoDetectLeads || !ws.linkedinProfileUrl) continue;
    // Free plan: automatic detection runs ONCE only. After any run, they must
    // upgrade for recurring detection.
    if (ws.plan === "free" && ws.lastLeadDetectAt) {
      skipped++;
      continue;
    }
    // Cadence for paid plans: Growth/Pro daily, Starter every 3 days.
    // (Free's single run uses no cooldown so it fires the first time.)
    const cooldownMs = ws.plan === "free" ? 0 : planDetectIntervalMs(ws.plan);
    const r = await runLeadDetection(ws, { cooldownMs });
    if (r.ok) {
      runs++;
      created += r.created;
    } else {
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, runs, created, skippedWorkspaces: skipped });
}
