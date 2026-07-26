import { NextResponse } from "next/server";
import { z } from "zod";
import { workspaces } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({ plan: z.enum(["starter", "growth", "pro"]) });

// Demo plan toggle (no billing yet) — drives the CMO IA gating.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  workspaces.setPlan(ctx.workspace.id, parsed.data.plan);
  return NextResponse.json({ ok: true, plan: parsed.data.plan });
}
