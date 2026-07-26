import { NextResponse } from "next/server";
import { z } from "zod";
import { contentItems } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

const createSchema = z.object({
  type: z.enum([
    "linkedin_post",
    "reel_script",
    "instagram_caption",
    "story",
  ]),
  platform: z.enum(["linkedin", "instagram", "tiktok"]),
  title: z.string().min(1),
  body: z.string().min(1),
  source: z.enum(["brief", "clone", "template", "cmo"]),
  status: z.enum(["draft", "scheduled", "published"]).optional(),
  scheduledDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .optional(),
  scheduledTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable()
    .optional(),
});

export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return NextResponse.json({ items: contentItems.listByWorkspace(ctx.workspace.id) });
}

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const item = contentItems.create(ctx.workspace.id, {
    ...parsed.data,
    scheduledDate: parsed.data.scheduledDate ?? null,
  });
  return NextResponse.json({ item });
}
