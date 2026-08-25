import { NextResponse } from "next/server";
import { z } from "zod";
import { draftProspectMessage } from "@/lib/ai";
import { insufficientResponse, spend } from "@/lib/creditGuard";
import { profiles, prospects } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ channel: z.enum(["linkedin", "email", "whatsapp"]).default("linkedin") });

// Generate a personalized outreach message for a prospect. Charges generate_message.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const p = await prospects.findById(id, ctx.workspace.id);
  if (!p) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) return NextResponse.json({ error: "Profil requis pour générer un message." }, { status: 400 });

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  const channel = parsed.success ? parsed.data.channel : "linkedin";

  const charge = await spend(ctx.workspace.id, "generate_message");
  if (!charge.ok) return insufficientResponse("generate_message", charge.balance);

  let result;
  try {
    result = await draftProspectMessage(
      profile,
      { companyName: p.companyName, contactName: p.contactName, signalDescription: p.signalDescription, fitReasoning: p.fitReasoning, companySector: p.companySector },
      channel,
    );
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Génération impossible." }, { status: 502 });
  }

  await prospects.update(id, ctx.workspace.id, { lastMessageGenerated: result.message });
  return NextResponse.json({ ...result, channel });
}
