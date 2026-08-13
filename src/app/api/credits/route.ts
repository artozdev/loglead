import { NextResponse } from "next/server";
import { credits } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// Live credit state for the header badge + modal. Never cached (Part 9, rule 6).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const ws = ctx.workspace;
  const balance = ws.credits ?? 0;
  const quota = ws.monthlyCreditsLimit ?? 0;
  const transactions = await credits.transactions(ws.id, 100);

  return NextResponse.json(
    {
      balance,
      quota,
      plan: ws.plan,
      planChosen: Boolean(ws.planChosen),
      trialEndsAt: ws.trialEndsAt ?? null,
      renewAt: ws.creditsRenewAt ?? ws.trialEndsAt ?? null,
      transactions,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
