import { NextResponse } from "next/server";
import { workspaces } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// Clear the stored LinkedIn OAuth connection for the active workspace.
export async function POST() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  await workspaces.clearLinkedIn(ctx.workspace.id);
  return NextResponse.json({ ok: true });
}
