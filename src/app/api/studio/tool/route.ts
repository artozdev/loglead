import { NextResponse } from "next/server";
import { z } from "zod";
import { applyStudioTool, isDemoMode } from "@/lib/ai";
import { contentItems, profiles } from "@/lib/db";
import { firstNameFromEmail } from "@/lib/emails/send";
import { rateLimit } from "@/lib/ratelimit";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  content: z.string().min(1, "Écris d'abord un peu de contenu."),
  tool: z.enum(["expand", "optimise", "wrapup", "concise", "grammar", "hook"]),
  network: z.enum(["linkedin", "x", "instagram", "reddit"]),
  format: z.string().min(1).default("Post"),
});

// POST — apply a one-click Studio tool to the current draft.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) return NextResponse.json({ error: "Profil requis." }, { status: 400 });

  if (!rateLimit(`gen:${ctx.workspace.id}`, 12, 60_000)) {
    return NextResponse.json(
      { error: "Trop de retouches d'affilée — réessaie dans un instant." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  try {
    const existingPosts = (await contentItems.listByWorkspace(ctx.workspace.id)).map((c) => c.body);
    const content = await applyStudioTool({
      profile,
      firstName: firstNameFromEmail(ctx.user.email),
      content: parsed.data.content,
      tool: parsed.data.tool,
      network: parsed.data.network,
      format: parsed.data.format,
      existingPosts,
    });
    return NextResponse.json({ content, demo: isDemoMode() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "La retouche a échoué." },
      { status: 502 },
    );
  }
}
