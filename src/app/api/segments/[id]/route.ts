import { NextResponse } from "next/server";
import { z } from "zod";
import { segments as segmentsRepo } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isArchived: z.boolean().optional(),
  logreachLinked: z.boolean().optional(),
  criteria: z
    .object({
      sectors: z.array(z.string()).optional(),
      channels: z.array(z.enum(["reddit", "linkedin", "x", "instagram", "website", "manual"])).optional(),
      statuses: z.array(z.enum(["new", "contacted", "in_discussion", "converted", "lost"])).optional(),
      minScore: z.number().int().optional(),
    })
    .optional(),
});

async function guard() {
  const ctx = await currentWorkspace();
  if (!ctx) return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return { error: NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 }) };
  }
  return { ctx };
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await guard();
  if (error) return error;
  const { id } = await params;

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const segment = segmentsRepo.update(id, ctx!.workspace.id, parsed.data);
  if (!segment) return NextResponse.json({ error: "Segment introuvable." }, { status: 404 });
  return NextResponse.json({ segment });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { ctx, error } = await guard();
  if (error) return error;
  const { id } = await params;
  const ok = segmentsRepo.remove(id, ctx!.workspace.id);
  if (!ok) return NextResponse.json({ error: "Segment introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
