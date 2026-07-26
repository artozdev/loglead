import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { workspaceMembers, workspaces } from "@/lib/db";
import { setActiveWorkspace } from "@/lib/workspace";

// Leave a workspace (removes the membership). Blocks leaving your last one.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const list = await workspaces.listForUser(user.id);
  if (!list.some((w) => w.id === id)) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (list.length <= 1) {
    return NextResponse.json(
      { error: "Tu dois garder au moins une startup." },
      { status: 400 },
    );
  }

  await workspaceMembers.remove(user.id, id);
  // Point the active workspace at a remaining one.
  const remaining = list.find((w) => w.id !== id)!;
  await setActiveWorkspace(remaining.id);
  return NextResponse.json({ ok: true, activeWorkspaceId: remaining.id });
}
