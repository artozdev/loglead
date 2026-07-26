import "server-only";
import { qualifyLead } from "./ai";
import {
  contentItems,
  leadEvents,
  leads,
  leadScoreConfig,
  profiles,
} from "./db";
import {
  DEFAULT_SCORE_WEIGHTS,
  leadChannelLabel,
  leadStatusLabel,
  type Lead,
  type LeadChannel,
  type LeadEvent,
  type LeadStatus,
} from "./types";

// One human-readable line per timeline event, fed to the qualification prompt.
function eventLine(e: LeadEvent): string {
  const d = e.data as Record<string, string>;
  const date = new Date(e.createdAt).toLocaleDateString("fr-FR");
  switch (e.type) {
    case "added":
      return `- ${date} : lead capté${d.channel ? ` depuis ${leadChannelLabel(d.channel as LeadChannel)}` : ""}`;
    case "status_changed":
      return `- ${date} : statut ${leadStatusLabel(d.from as LeadStatus)} → ${leadStatusLabel(d.to as LeadStatus)}`;
    case "note_added":
      return `- ${date} : note ajoutée`;
    case "email_sent":
      return `- ${date} : message envoyé`;
    case "enriched":
      return `- ${date} : profil enrichi par l'IA`;
    case "scored":
      return `- ${date} : score recalculé`;
    default:
      return `- ${date} : ${e.type}`;
  }
}

// The single re-score entry point. Best-effort: it never throws, so callers can
// fire it after a write (status change, note, message, enrichment) without
// risking the request. In demo mode it runs the deterministic mock (free).
export async function scoreLead(
  leadId: string,
  workspaceId: string,
): Promise<Lead | undefined> {
  try {
    const lead = await leads.findById(leadId, workspaceId);
    if (!lead) return undefined;
    const profile = await profiles.findByWorkspace(workspaceId);
    if (!profile) return lead; // can't qualify without the founder's profile / ICP

    const events = await leadEvents.listByLead(leadId);
    const weights = (await leadScoreConfig.get(workspaceId))?.weights ?? DEFAULT_SCORE_WEIGHTS;
    const sourceTitle = lead.sourceContentId
      ? (await contentItems.findById(lead.sourceContentId, workspaceId))?.title
      : undefined;

    const q = await qualifyLead({
      profile,
      lead: {
        firstName: lead.firstName,
        lastName: lead.lastName,
        jobTitle: lead.jobTitle,
        company: lead.company,
        sector: lead.sector,
        interests: lead.interests,
        channel: lead.channel,
        status: lead.status,
      },
      sourceTitle,
      eventsSummary: events.map(eventLine).join("\n"),
      interactionCount: events.length,
      weights,
    });

    return await leads.update(leadId, workspaceId, {
      score: q.total,
      scoreBreakdown: q.breakdown,
      signals: q.signals,
      recommendedActions: q.recommendedActions,
      lastScoreAt: new Date().toISOString(),
    });
  } catch {
    return undefined;
  }
}
