import { NextResponse } from "next/server";
import { z } from "zod";
import { askMarket } from "@/lib/ai";
import { profiles } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({ question: z.string().min(2).max(500) });

// "Ask your market" — free-form market Q&A powered by Claude over the workspace
// profile context. Requires Claude credits; degrades to a clear error otherwise.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Question invalide." }, { status: 400 });
  }

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json({ error: "Profil requis." }, { status: 400 });
  }

  try {
    const answer = await askMarket(profile, parsed.data.question);
    return NextResponse.json({ answer });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyse impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
