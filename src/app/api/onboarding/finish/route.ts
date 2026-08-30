import { NextResponse } from "next/server";
import { z } from "zod";
import { onboardingProgress, profiles, searches } from "@/lib/db";
import type { OrgType, ProspectSource } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

const SOURCE_MAP: Record<string, ProspectSource> = {
  linkedin: "linkedin_jobs",
  google_maps: "google_maps",
  reddit: "reddit",
};
const ORG_MAP: Record<string, OrgType> = {
  agency: "agency", sales: "sales", freelance: "solo", founder: "startup", local: "smb", other: "smb",
};

const schema = z.object({
  profileType: z.string().min(1),
  offer: z.string().min(1),
  target: z.string().optional().default(""),
  sources: z.array(z.string()).min(1),
  query: z.string().min(1),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données incomplètes" }, { status: 400 });
  const d = parsed.data;

  const preferredSources = [...new Set(d.sources.map((s) => SOURCE_MAP[s]).filter(Boolean) as ProspectSource[])];
  const sources = preferredSources.length ? preferredSources : (["linkedin_jobs"] as ProspectSource[]);

  await profiles.upsert(ctx.workspace.id, {
    saasName: ctx.workspace.name || "Mon activité",
    offer: d.offer,
    valueProp: d.offer,
    icp: d.target || "",
    competitors: [],
    competitorDiffs: [],
    tone: "direct",
    platforms: ["linkedin"],
    networks: [],
    goal: "leads",
    orgType: ORG_MAP[d.profileType] ?? "smb",
    profileType: d.profileType,
    preferredSources,
  });

  const search = await searches.create({
    workspaceId: ctx.workspace.id,
    query: d.query.slice(0, 150),
    intent: "prospect_search",
    criteria: {},
    sources,
    title: d.query.slice(0, 60),
    totalResults: 0,
    qualifiedResults: 0,
    creditsUsed: 0,
    status: "pending",
    isFirstSearch: true,
  });

  await onboardingProgress.complete(ctx.workspace.id);
  return NextResponse.json({ ok: true, searchId: search.id, query: d.query });
}
