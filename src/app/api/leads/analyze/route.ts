import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeLeadProfile, isDemoMode } from "@/lib/ai";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({ url: z.string().min(1) });

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "URL requise" }, { status: 400 });
  }
  try {
    const fields = await analyzeLeadProfile(parsed.data.url);
    return NextResponse.json({ ok: true, fields, demo: isDemoMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyse impossible.";
    return NextResponse.json({ ok: false, error: message });
  }
}
