import { NextResponse } from "next/server";
import { z } from "zod";
import { onboardingProgress } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const p = onboardingProgress.get(ctx.workspace.id);
  return NextResponse.json({
    step: p?.step ?? 1,
    data: p?.data ?? {},
    completed: Boolean(p?.completedAt),
  });
}

const schema = z.object({
  step: z.number().int().min(1).max(6),
  data: z.record(z.unknown()),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  onboardingProgress.upsert(ctx.workspace.id, parsed.data.step, parsed.data.data);
  return NextResponse.json({ ok: true });
}
