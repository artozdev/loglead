import { NextResponse } from "next/server";
import { FREE_CREDITS } from "@/lib/credits";
import { workspaces } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Start the free offer: grants the 200 one-time credits (no trial, no renewal)
// and unlocks the dashboard. Paid plans go through /api/billing/checkout
// (Stripe subscription) instead.
export async function POST() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const updated = await workspaces.grantFree(ctx.workspace.id, FREE_CREDITS);
  if (!updated) return NextResponse.json({ error: "Workspace introuvable" }, { status: 404 });

  return NextResponse.json({ ok: true, plan: updated.plan, credits: updated.credits });
}
