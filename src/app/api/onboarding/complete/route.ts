import { NextResponse } from "next/server";
import { z } from "zod";
import WelcomeEmail from "../../../../../emails/welcome";
import { onboardingProgress, profiles, workspaces } from "@/lib/db";
import { appUrl, firstNameFromEmail, sendEmail } from "@/lib/emails/send";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  saasName: z.string().min(1, "Le nom du SaaS est requis"),
  offer: z.string().min(1, "La description de l'offre est requise"),
  valueProp: z.string().min(1, "La proposition de valeur est requise"),
  icp: z.string().min(1, "L'audience cible est requise"),
  competitors: z.array(z.string()).max(3).default([]),
  competitorDiffs: z.array(z.string()).max(3).default([]),
  tone: z.enum(["direct", "expert", "storytelling", "challenger", "fun"]),
  platforms: z
    .array(z.enum(["linkedin", "instagram", "tiktok"]))
    .min(1, "Choisis au moins une plateforme"),
  networks: z.array(z.enum(["linkedin", "x", "instagram", "reddit"])).default([]),
  goal: z.enum(["notoriety", "leads", "recruiting", "convert", "both"]),
  orgType: z.enum(["startup", "smb", "midmarket", "sales", "agency", "solo"]).optional(),
  siteUrl: z.string().optional().default(""),
  sector: z.string().optional().default(""),
  companySizes: z
    .array(z.enum(["solo", "1_10", "10_50", "50_200", "200_plus"]))
    .default([]),
  problem: z.string().optional().default(""),
  frequency: z.enum(["weekly_1_2", "weekly_3_5", "daily", "more"]).optional(),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données incomplètes" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  const competitors = d.competitors.map((c) => c.trim()).filter(Boolean).slice(0, 3);

  const profile = profiles.upsert(ctx.workspace.id, {
    saasName: d.saasName,
    offer: d.offer,
    valueProp: d.valueProp,
    icp: d.icp,
    competitors,
    competitorDiffs: d.competitorDiffs.slice(0, 3),
    tone: d.tone,
    platforms: d.platforms,
    networks: d.networks,
    goal: d.goal,
    orgType: d.orgType,
    siteUrl: d.siteUrl || undefined,
    sector: d.sector || undefined,
    companySizes: d.companySizes,
    problem: d.problem || undefined,
    frequency: d.frequency,
  });
  workspaces.rename(ctx.workspace.id, d.saasName);
  onboardingProgress.complete(ctx.workspace.id);

  // Email 2 — welcome brief. Sent immediately in the MVP (the spec's 5-minute
  // delay needs a job queue — swap `void sendEmail` for a queued job later).
  void sendEmail({
    to: ctx.user.email,
    subject: "Ton espace LogLead est prêt — voici par où commencer",
    template: WelcomeEmail({
      firstName: firstNameFromEmail(ctx.user.email),
      saasName: d.saasName,
      appUrl: appUrl(),
    }),
  });

  return NextResponse.json({ profile });
}
