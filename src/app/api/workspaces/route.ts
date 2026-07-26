import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { workspaces } from "@/lib/db";
import { setActiveWorkspace } from "@/lib/workspace";

const createSchema = z.object({
  name: z.string().min(1, "Nom de la startup requis").max(60),
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return NextResponse.json({ workspaces: workspaces.listForUser(user.id) });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const workspace = workspaces.create(parsed.data.name.trim(), user.id);
  await setActiveWorkspace(workspace.id);
  return NextResponse.json({ workspace });
}
