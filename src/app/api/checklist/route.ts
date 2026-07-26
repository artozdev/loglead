import { NextResponse } from "next/server";
import { z } from "zod";
import { profiles } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// Steps that are persisted (the others are derived live from data).
const PERSISTED_STEPS = ["algo_insider", "connections"] as const;

const schema = z.object({
  step: z.enum(PERSISTED_STEPS).optional(),
  dismissed: z.boolean().optional(),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  if (parsed.data.step) {
    profiles.completeChecklistStep(ctx.workspace.id, parsed.data.step);
  }
  if (parsed.data.dismissed !== undefined) {
    profiles.setChecklistDismissed(ctx.workspace.id, parsed.data.dismissed);
  }
  return NextResponse.json({ ok: true });
}
