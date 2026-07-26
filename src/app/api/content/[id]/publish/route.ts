import { NextResponse } from "next/server";
import { contentItems } from "@/lib/db";
import { platformLabel } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

// Auto-publish via a third-party aggregator (Ayrshare / Unipile) — Growth & Pro
// only. MVP: the aggregator call is mocked; we just flip the status to published.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (ctx.workspace.plan !== "growth" && ctx.workspace.plan !== "pro") {
    return NextResponse.json(
      { error: "La publication automatique est réservée aux offres Growth et Pro." },
      { status: 403 },
    );
  }

  const { id } = await params;
  const existing = await contentItems.findById(id, ctx.workspace.id);
  if (!existing) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (!existing.scheduledDate) {
    return NextResponse.json(
      { error: "Place d'abord ce contenu sur une date." },
      { status: 400 },
    );
  }

  const item = await contentItems.update(id, ctx.workspace.id, { status: "published" });
  return NextResponse.json({
    item,
    message: `Publié sur ${platformLabel(existing.platform)} via l'agrégateur (démo).`,
  });
}
