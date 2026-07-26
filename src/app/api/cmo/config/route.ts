import { NextResponse } from "next/server";
import { z } from "zod";
import { cmoConfig } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// First-run setup.
const setupSchema = z.object({
  briefHour: z.string().regex(/^\d{2}:\d{2}$/).default("08:00"),
  autonomyLevel: z.number().int().min(1).max(5),
  priorities: z.array(z.string()).max(3).default([]),
  priorityChannels: z
    .array(z.enum(["linkedin", "instagram", "tiktok"]))
    .default([]),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = setupSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  const config = await cmoConfig.upsert(ctx.workspace.id, {
    ...parsed.data,
    priorities: parsed.data.priorities.map((p) => p.trim()).filter(Boolean),
    activatedAt: new Date().toISOString(),
    status: "active",
  });
  return NextResponse.json({ config });
}

// Runtime updates (pause/autopilot/autonomy).
const patchSchema = z.object({
  status: z.enum(["active", "paused"]).optional(),
  autonomyLevel: z.number().int().min(1).max(5).optional(),
  autopilot: z.boolean().optional(),
  briefHour: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export async function PATCH(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  // Autonomy 5 implies autopilot, and vice-versa.
  const patch = { ...parsed.data };
  if (patch.autopilot === true) patch.autonomyLevel = 5;
  const config = await cmoConfig.upsert(ctx.workspace.id, patch);
  return NextResponse.json({ config });
}
