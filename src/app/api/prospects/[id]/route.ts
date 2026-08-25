import { NextResponse } from "next/server";
import { z } from "zod";
import { prospects } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  inContact: z.boolean().optional(),
  contactStatus: z
    .enum(["to_contact", "message_sent", "replied", "meeting_booked", "converted", "not_interested"])
    .optional(),
  stage: z.enum(["new", "hot", "to_contact", "contacted", "converted", "archived"]).optional(),
  notes: z.string().max(4000).optional(),
});

// Update a prospect (add to contact, change status/stage, notes).
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const patch = { ...parsed.data } as Record<string, unknown>;
  if (parsed.data.inContact && !("contactStatus" in parsed.data)) {
    patch.contactStatus = "to_contact";
    patch.contactAddedAt = new Date().toISOString();
  }

  const updated = await prospects.update(id, ctx.workspace.id, patch);
  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ prospect: updated });
}
