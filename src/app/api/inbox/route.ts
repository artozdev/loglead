import { NextResponse } from "next/server";
import { z } from "zod";
import {
  contentItems,
  conversations,
  inboxMessages,
  leadEvents,
  leads,
  segments as segmentsRepo,
} from "@/lib/db";
import { inboxMonthlyQuota, planAllows } from "@/lib/plan";
import { detectSector, primarySegment } from "@/lib/segments";
import { LEAD_CHANNELS, leadChannelLabel, leadStatusLabel, type LeadEvent } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

// Human label for a lead-event, for the fiche-lead history timeline.
function eventLabel(e: LeadEvent): string {
  const d = e.data as Record<string, string>;
  switch (e.type) {
    case "added":
      return d.channel ? `Lead ajouté depuis ${leadChannelLabel(d.channel as never)}` : "Lead ajouté";
    case "status_changed":
      return `Statut : ${leadStatusLabel(d.from as never)} → ${leadStatusLabel(d.to as never)}`;
    case "email_sent":
      return "Message envoyé";
    case "note_added":
      return "Note ajoutée";
    case "enriched":
      return "Enrichi par l'IA";
    default:
      return e.type;
  }
}

// GET — conversations (joined with their lead + last message) and the four
// headline metrics. POST — open a conversation for a lead.
export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "inbox")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const wid = ctx.workspace.id;
  const allLeads = await leads.listByWorkspace(wid);
  const leadById = new Map(allLeads.map((l) => [l.id, l]));
  const segs = await segmentsRepo.listByWorkspace(wid);

  const convs = (
    await Promise.all(
      (await conversations.listByWorkspace(wid)).map(async (c) => {
        const lead = leadById.get(c.leadId);
        if (!lead) return null; // lead deleted since (RGPD) — hide the thread
        const messages = await inboxMessages.listByConversation(c.id);
        const last = messages[messages.length - 1];
        const source = lead.sourceContentId
          ? (await contentItems.findById(lead.sourceContentId, wid))?.title ?? null
          : null;
        const seg = primarySegment(lead, segs);
        // Unread = the last message is an inbound one we haven't read.
        const unread = last?.direction === "inbound" && !last.readAt;
        const events = (await leadEvents.listByLead(lead.id)).map((e) => ({ label: eventLabel(e), at: e.createdAt }));
        return {
          id: c.id,
          channel: c.channel,
          status: c.status,
          lastMessageAt: c.lastMessageAt,
          createdAt: c.createdAt,
          unread,
          lead: {
            id: lead.id,
            firstName: lead.firstName,
            lastName: lead.lastName,
            email: lead.email,
            phone: lead.phone,
            company: lead.company ?? null,
            jobTitle: lead.jobTitle ?? null,
            linkedinUrl: lead.linkedinUrl ?? null,
            channel: lead.channel,
            status: lead.status,
            notes: lead.notes ?? "",
            sector: detectSector(lead),
            sourceTitle: source,
            segment: seg ? { id: seg.id, name: seg.name } : null,
            events,
          },
          messages,
          preview: last?.content.slice(0, 90) ?? null,
        };
      }),
    )
  ).filter((x): x is NonNullable<typeof x> => x !== null);

  // Channel counts for the left-hand channel tabs (by lead acquisition channel).
  const channelCounts = Object.fromEntries(
    LEAD_CHANNELS.map((ch) => [ch.value, convs.filter((c) => c.lead.channel === ch.value).length]),
  );

  // Metrics — sent this month, reply rate, waiting, converted.
  const monthPrefix = new Date().toISOString().slice(0, 7);
  const all = await inboxMessages.listByWorkspace(wid);
  const sentThisMonth = all.filter(
    (m) => m.direction === "outbound" && m.sentAt.startsWith(monthPrefix),
  ).length;
  const contacted = convs.filter((c) => c.messages.some((m) => m.direction === "outbound"));
  const replied = contacted.filter((c) => c.messages.some((m) => m.direction === "inbound"));
  const converted = contacted.filter((c) => c.lead.status === "converted").length;

  const quota = inboxMonthlyQuota(ctx.workspace.plan);
  return NextResponse.json({
    conversations: convs,
    channelCounts,
    unreadTotal: convs.filter((c) => c.unread).length,
    metrics: {
      sentThisMonth,
      replyRate:
        contacted.length === 0 ? 0 : Math.round((replied.length / contacted.length) * 100),
      waiting: convs.filter((c) => c.status === "waiting").length,
      converted,
    },
    quota: quota === Infinity ? null : quota,
    // Leads with an email address and no conversation yet → "+ Nouveau message".
    contactableLeads: allLeads
      .filter((l) => l.email && !convs.some((c) => c.lead.id === l.id))
      .map((l) => ({
        id: l.id,
        firstName: l.firstName,
        lastName: l.lastName,
        email: l.email,
        company: l.company ?? null,
      })),
  });
}

const createSchema = z.object({ leadId: z.string().min(1) });

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "inbox")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const lead = await leads.findById(parsed.data.leadId, ctx.workspace.id);
  if (!lead) return NextResponse.json({ error: "Lead introuvable." }, { status: 404 });
  if (!lead.email) {
    return NextResponse.json(
      { error: "Ce lead n'a pas d'adresse email — complète sa fiche d'abord." },
      { status: 400 },
    );
  }

  const existing = await conversations.findByLead(lead.id, ctx.workspace.id);
  const conv = existing ?? await conversations.create(ctx.workspace.id, lead.id);
  return NextResponse.json({ conversation: conv });
}
