import { NextResponse } from "next/server";
import { z } from "zod";
import { generateFirstSearchQuery } from "@/lib/ai";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  offer: z.string().min(1),
  target: z.string().optional().default(""),
  profileType: z.string().optional().default(""),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
  const query = await generateFirstSearchQuery(parsed.data);
  return NextResponse.json({ query });
}
