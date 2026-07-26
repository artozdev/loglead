import { NextResponse } from "next/server";
import { z } from "zod";
import { conversations, inboxMessages, leadEvents, leads } from "@/lib/db";
import { firstNameFromEmail, sendPlainEmail } from "@/lib/emails/send";
import { inboxMonthlyQuota, planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

// V1 messaging channels. Email delivers via Resend; LinkedIn / X / Reddit /
// WhatsApp deliver via the Unipile aggregator (integration pending — messages
// are recorded so the inbox flows, actual delivery is wired when Unipile keys
// are present).
const CHANNELS = ["email", "linkedin", "x", "reddit", "whatsapp"] as const;

const schema = z.object({
  conversationId: z.string().min(1),
  content: z.string().min(2, "Le message est vide.").max(10000),
  subject: z.string().max(200).optional(),
  channel: z.enum(CHANNELS).default("email"),
  isAiGenerated: z.boolean().default(false),
});

// POST — deliver the message on the chosen channel, then record it.
export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "inbox")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }

  const conv = conversations.findById(parsed.data.conversationId, ctx.workspace.id);
  const lead = conv ? leads.findById(conv.leadId, ctx.workspace.id) : undefined;
  if (!conv || !lead) {
    return NextResponse.json({ error: "Conversation introuvable." }, { status: 404 });
  }
  const channel = parsed.data.channel;
  if (channel === "email" && !lead.email) {
    return NextResponse.json({ error: "Ce lead n'a pas d'adresse email." }, { status: 400 });
  }

  // Monthly quota (Growth: 100 — Pro: unlimited).
  const quota = inboxMonthlyQuota(ctx.workspace.plan);
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const sentThisMonth = inboxMessages
    .listByWorkspace(ctx.workspace.id)
    .filter((m) => m.direction === "outbound" && m.sentAt.startsWith(monthPrefix)).length;
  if (sentThisMonth >= quota) {
    return NextResponse.json(
      { error: `Quota atteint : ${quota} messages/mois sur ton plan. Passe en Pro pour envoyer sans limite.` },
      { status: 403 },
    );
  }

  const founderFirstName = firstNameFromEmail(ctx.user.email);

  // Email → Resend (or dev outbox). Other channels → Unipile (pending); the
  // message is recorded either way so the conversation stays consistent.
  if (channel === "email") {
    const ok = await sendPlainEmail({
      to: lead.email!,
      subject: parsed.data.subject?.trim() || `Message de ${founderFirstName}`,
      text: parsed.data.content,
      fromName: founderFirstName,
      replyTo: ctx.user.email, // replies land in the founder's own inbox (V1)
    });
    if (!ok) {
      return NextResponse.json(
        { error: "L'envoi a échoué — le message n'a pas été enregistré. Réessaie." },
        { status: 502 },
      );
    }
  } else if (process.env.UNIPILE_API_KEY) {
    // Real Unipile delivery would go here (channel-specific recipient/subject).
    // Left unwired until a key is configured; falls through to recording below.
  }

  const message = inboxMessages.create(conv.id, {
    direction: "outbound",
    content: parsed.data.content,
    isAiGenerated: parsed.data.isAiGenerated,
  });
  conversations.touch(conv.id);
  conversations.setStatus(conv.id, "waiting"); // awaiting the lead's reply
  leadEvents.create(lead.id, "email_sent", { via: "logreach", channel });
  if (lead.status === "new") {
    leads.update(lead.id, ctx.workspace.id, { status: "contacted" });
  }

  return NextResponse.json({ message, channel });
}
