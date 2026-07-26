import { NextResponse } from "next/server";
import { z } from "zod";
import { cloneStructure, isDemoMode } from "@/lib/ai";
import { detectSource } from "@/lib/analyze";
import { contentItems, profiles } from "@/lib/db";
import { rateLimit } from "@/lib/ratelimit";
import type { AlgoNetwork } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

function firstNameOf(email: string) {
  const local = (email.split("@")[0] || email).replace(/[._-]+/g, " ").trim();
  return local.charAt(0).toUpperCase() + local.split(" ")[0].slice(1);
}

const schema = z.object({
  url: z.string().optional().default(""),
  text: z.string().optional().default(""),
  targetNetwork: z.enum(["linkedin", "x", "instagram", "reddit"]).optional(),
});

// Map a detected source platform label to one of the 4 target networks.
const PLATFORM_TO_NETWORK: Record<string, AlgoNetwork> = {
  LinkedIn: "linkedin",
  X: "x",
  Instagram: "instagram",
  Reddit: "reddit",
  YouTube: "linkedin",
  TikTok: "instagram",
};

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json(
      { error: "Complète ton profil avant de cloner une structure." },
      { status: 400 },
    );
  }

  if (!rateLimit(`clone:${ctx.workspace.id}`, 10, 60_000)) {
    return NextResponse.json(
      { error: "Trop d'analyses d'affilée — réessaie dans une minute." },
      { status: 429 },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  // MVP: real extraction (YouTube/Whisper/scraping) is stubbed — the founder can
  // paste the source text as a fallback. We still detect the source platform.
  const { platform } = detectSource(parsed.data.url);
  const targetNetwork = parsed.data.targetNetwork ?? PLATFORM_TO_NETWORK[platform] ?? "linkedin";

  try {
    const existingPosts = (await contentItems.listByWorkspace(ctx.workspace.id)).map((c) => c.body);
    const result = await cloneStructure(
      profile,
      { url: parsed.data.url, text: parsed.data.text, platform, targetNetwork },
      { firstName: firstNameOf(ctx.user.email), existingPosts },
    );
    return NextResponse.json({ result, demo: isDemoMode() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erreur de clonage.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
