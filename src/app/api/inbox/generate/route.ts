import { NextResponse } from "next/server";
import { z } from "zod";
import { draftReachMessage, draftReachReply } from "@/lib/ai";
import { contentItems, conversations, inboxMessages, leads, profiles } from "@/lib/db";
import { firstNameFromEmail } from "@/lib/emails/send";
import { planAllows } from "@/lib/plan";
import { rateLimit } from "@/lib/ratelimit";
import { leadChannelLabel } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  conversationId: z.string().min(1),
  variant: z.number().int().min(0).max(10).default(0), // bumps on "Régénérer"
  channel: z.string().optional(), // messaging channel label chosen in the composer
});

const DAY = 86_400_000;

// POST — AI draft for the conversation: reply to the lead's last message, a
// soft follow-up if they've gone quiet, or a first-contact if empty.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "inbox")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }
  if (!rateLimit(`reach-gen:${ctx.workspace.id}`, 20, 60_000)) {
    return NextResponse.json({ error: "Trop de générations d'affilée — patiente un instant." }, { status: 429 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const conv = await conversations.findById(parsed.data.conversationId, ctx.workspace.id);
  const lead = conv ? await leads.findById(conv.leadId, ctx.workspace.id) : undefined;
  const profile = await profiles.findByWorkspace(ctx.workspace.id);
  if (!conv || !lead || !profile) {
    return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  }

  const sourceTitle = lead.sourceContentId
    ? (await contentItems.findById(lead.sourceContentId, ctx.workspace.id))?.title
    : undefined;
  const channelLabel = parsed.data.channel || leadChannelLabel(lead.channel);
  const messages = (await inboxMessages.listByConversation(conv.id))
    .map((m) => ({ direction: m.direction, content: m.content }));
  const last = messages[messages.length - 1];

  const founderFirstName = firstNameFromEmail(ctx.user.email);

  try {
    let message: string;
    if (messages.length === 0) {
      // Empty thread → first-contact message.
      message = await draftReachMessage({
        profile,
        founderFirstName,
        leadFirstName: lead.firstName,
        leadCompany: lead.company,
        channel: channelLabel,
        sourceTitle,
        variant: parsed.data.variant,
      });
    } else {
      // Reply to the lead's last message, or nudge if we're the last to speak
      // and it's been 3+ days.
      const silentDays = last ? (Date.now() - new Date(conv.lastMessageAt ?? conv.createdAt).getTime()) / DAY : 0;
      const kind: "reply" | "followup" = last?.direction === "inbound" ? "reply" : silentDays >= 3 ? "followup" : "followup";
      message = await draftReachReply({
        profile,
        founderFirstName,
        leadFirstName: lead.firstName,
        leadCompany: lead.company,
        channel: channelLabel,
        sourceTitle,
        history: messages,
        kind,
        variant: parsed.data.variant,
      });
    }
    return NextResponse.json({ message });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "La génération a échoué." },
      { status: 502 },
    );
  }
}
