import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { workspaceMembers } from "@/lib/db";
import { setActiveWorkspace } from "@/lib/workspace";

const schema = z.object({ workspaceId: z.string().min(1) });

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  if (!await workspaceMembers.isMember(user.id, parsed.data.workspaceId)) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  await setActiveWorkspace(parsed.data.workspaceId);
  return NextResponse.json({ ok: true });
}
