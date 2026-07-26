import { NextResponse } from "next/server";
import { z } from "zod";
import { conversations } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  status: z.enum(["unread", "contacted", "waiting", "replied", "resolved"]),
});

// PATCH — change a conversation's status (e.g. "Marquer comme résolu").
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "inbox")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const { id } = await params;
  const conv = conversations.findById(id, ctx.workspace.id);
  if (!conv) return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  conversations.setStatus(id, parsed.data.status);
  return NextResponse.json({ ok: true });
}
