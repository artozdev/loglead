import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { declineCampaign, isDemoMode } from "@/lib/ai";
import { campaignLeads, planSlot, seedMetrics } from "@/lib/campaign";
import { campaigns, contentItems, profiles } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { rateLimit } from "@/lib/ratelimit";
import {
  campaignChannelLabel,
  type CampaignChannel,
  type CampaignPublication,
} from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

function firstNameOf(email: string) {
  const local = (email.split("@")[0] || email).replace(/[._-]+/g, " ").trim();
  return local.charAt(0).toUpperCase() + local.split(" ")[0].slice(1);
}

function deriveName(coreMessage: string): string {
  const first = (coreMessage.split(/[.\n]/)[0] || coreMessage).trim().slice(0, 60);
  return `« ${first} »`;
}

const schema = z.object({
  coreMessage: z.string().min(1, "Le message central est requis."),
  channels: z.array(z.enum(["linkedin", "x", "reddit", "email"])).min(1, "Choisis au moins un canal."),
  name: z.string().optional(),
});

export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "campaigns")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }
  const list = await Promise.all(
    (await campaigns.listByWorkspace(ctx.workspace.id)).map(async (c) => {
      const roll = await campaignLeads(ctx.workspace.id, c);
      return { ...c, leadsCount: roll.total, avgScore: roll.avgScore };
    }),
  );
  return NextResponse.json({ campaigns: list });
}

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "campaigns")) {
    return NextResponse.json({ error: "Les campagnes multicanales sont réservées aux offres Growth et Pro." }, { status: 403 });
  }

  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!profile) {
    return NextResponse.json({ error: "Complète ton profil avant de lancer une campagne." }, { status: 400 });
  }
  if (!rateLimit(`gen:${ctx.workspace.id}`, 6, 60_000)) {
    return NextResponse.json({ error: "Trop de campagnes d'affilée — réessaie dans une minute." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide" }, { status: 400 });
  }
  const { coreMessage, channels, name } = parsed.data;
  const campaignName = name?.trim() || deriveName(coreMessage);

  let variants;
  try {
    variants = await declineCampaign(profile, coreMessage, channels as CampaignChannel[], {
      firstName: firstNameOf(ctx.user.email),
      existingPosts: (await contentItems.listByWorkspace(ctx.workspace.id)).map((c) => c.body),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Déclinaison impossible.";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Create the campaign first so publication ids/metrics can seed off its id.
  const campaign = await campaigns.create(ctx.workspace.id, {
    name: campaignName,
    coreMessage,
    status: "scheduled",
    publications: [],
  });

  const publications: CampaignPublication[] = [];
  for (const v of variants) {
    const slot = planSlot(v.channel);
    const item = await contentItems.create(ctx.workspace.id, {
      type: "linkedin_post",
      platform: "linkedin",
      title: `${campaignName} · ${campaignChannelLabel(v.channel)}`,
      body: v.content,
      source: "brief",
      status: "scheduled",
      scheduledDate: slot.date,
      scheduledTime: slot.time,
    });
    const m = seedMetrics(campaign.id, v.channel);
    publications.push({
      id: randomUUID(),
      channel: v.channel,
      content: v.content,
      subject: v.subject || undefined,
      contentItemId: item.id,
      scheduledDate: slot.date,
      scheduledTime: slot.time,
      status: "scheduled",
      views: m.views,
      likes: m.likes,
      comments: m.comments,
    });
  }

  const full = await campaigns.update(campaign.id, ctx.workspace.id, { publications });
  return NextResponse.json({ campaign: full, demo: isDemoMode() });
}
