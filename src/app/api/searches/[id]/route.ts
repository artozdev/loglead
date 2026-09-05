import { NextResponse } from "next/server";
import { z } from "zod";
import { prospects, searches } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// A "segment" is a search: rename (PATCH) or delete it with all its prospects.
const patchSchema = z.object({ title: z.string().min(1).max(80) });

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Titre invalide" }, { status: 400 });
  const updated = await searches.update(id, ctx.workspace.id, { title: parsed.data.title.trim() });
  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ search: updated });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const { id } = await params;
  await prospects.deleteBySearch(id, ctx.workspace.id);
  await searches.delete(id, ctx.workspace.id);
  return NextResponse.json({ ok: true });
}
