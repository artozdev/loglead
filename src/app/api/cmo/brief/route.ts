import { NextResponse } from "next/server";
import { z } from "zod";
import { cmoActions, cmoConfig } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({ instruction: z.string().min(1).max(500) });

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Message vide." }, { status: 400 });
  }

  const instruction = parsed.data.instruction.trim();
  await cmoConfig.upsert(ctx.workspace.id, { lastInstruction: instruction });

  const action = await cmoActions.create(ctx.workspace.id, {
    type: "strategy",
    title: "Brief intégré",
    message: `Compris. J'intègre « ${instruction} » dans le plan de la semaine et j'ajuste les prochains contenus en conséquence.`,
    body: `Nouvelle priorité prise en compte : ${instruction}`,
    status: "approved",
  });
  return NextResponse.json({ action });
}
