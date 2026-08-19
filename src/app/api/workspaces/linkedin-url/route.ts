import { NextResponse } from "next/server";
import { z } from "zod";
import { workspaces } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  url: z
    .string()
    .trim()
    .max(300)
    .refine((u) => u === "" || /linkedin\.com\/in\//i.test(u), {
      message: "URL LinkedIn invalide (ex. https://www.linkedin.com/in/ton-profil).",
    }),
  autoDetect: z.boolean().optional(),
});

// Save the user's public LinkedIn profile URL + the daily auto-detect opt-in.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "URL invalide" },
      { status: 400 },
    );
  }
  await workspaces.setLinkedInProfileUrl(ctx.workspace.id, parsed.data.url);
  // Auto-detect only makes sense with a URL set.
  if (parsed.data.autoDetect !== undefined) {
    await workspaces.setAutoDetectLeads(ctx.workspace.id, Boolean(parsed.data.url) && parsed.data.autoDetect);
  }
  return NextResponse.json({ ok: true, url: parsed.data.url });
}
