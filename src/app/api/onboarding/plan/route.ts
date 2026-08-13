import { NextResponse } from "next/server";
import { z } from "zod";
import { PLAN_MONTHLY_CREDITS, TRIAL_CREDITS, TRIAL_DAYS } from "@/lib/credits";
import { workspaces } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["starter", "growth", "pro"]),
  billing: z.enum(["monthly", "annual"]).optional().default("monthly"),
});

// Mandatory post-onboarding plan pick — starts the 7-day trial and grants the
// 200 trial credits. Idempotent-ish: re-selecting simply updates the plan.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Plan invalide" },
      { status: 400 },
    );
  }

  const updated = await workspaces.selectPlan(ctx.workspace.id, parsed.data.plan, {
    trialCredits: TRIAL_CREDITS,
    trialDays: TRIAL_DAYS,
    monthlyLimit: PLAN_MONTHLY_CREDITS[parsed.data.plan],
  });
  if (!updated) return NextResponse.json({ error: "Workspace introuvable" }, { status: 404 });

  return NextResponse.json({ ok: true, plan: updated.plan, credits: updated.credits });
}
