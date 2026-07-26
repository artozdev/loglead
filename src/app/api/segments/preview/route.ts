import { NextResponse } from "next/server";
import { z } from "zod";
import { leads as leadsRepo } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { matchesCriteria } from "@/lib/segments";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  sectors: z.array(z.string()).optional(),
  channels: z.array(z.enum(["reddit", "linkedin", "x", "instagram", "website", "manual"])).optional(),
  statuses: z.array(z.enum(["new", "contacted", "in_discussion", "converted", "lost"])).optional(),
  minScore: z.number().int().optional(),
});

// POST — live count of leads matching the given criteria (create-modal preview).
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ count: 0 });

  const count = (await leadsRepo.listByWorkspace(ctx.workspace.id))
    .filter((l) => matchesCriteria(l, parsed.data)).length;
  return NextResponse.json({ count });
}
