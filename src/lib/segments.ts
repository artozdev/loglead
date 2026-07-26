import "server-only";
import { contentScore } from "./score";
import {
  SEGMENT_SECTORS,
  type Lead,
  type Segment,
  type SegmentCriteria,
} from "./types";

// ---------------------------------------------------------------------------
// Segment logic. Membership is derived from criteria: a lead belongs to a
// segment when it matches, so auto-segmentation is automatic (a new lead shows
// up in every matching segment the moment it's created).
// ---------------------------------------------------------------------------

// Lightweight sector detection from company + job title keywords (stands in for
// a Clearbit-style enrichment). Returns null when nothing matches.
export function detectSector(lead: Lead): string | null {
  const hay = `${lead.company ?? ""} ${lead.jobTitle ?? ""} ${lead.linkedinUrl ?? ""}`.toLowerCase();
  if (!hay.trim()) return null;
  for (const s of SEGMENT_SECTORS) {
    if (s.hints.some((h) => hay.includes(h))) return s.value;
  }
  return null;
}

// A lead's qualification score (reuses the shared deterministic scorer).
export function leadScore(lead: Lead): number {
  return contentScore(lead.id);
}

export function matchesCriteria(lead: Lead, c: SegmentCriteria): boolean {
  if (c.channels?.length && !c.channels.includes(lead.channel)) return false;
  if (c.statuses?.length && !c.statuses.includes(lead.status)) return false;
  if (c.minScore && leadScore(lead) < c.minScore) return false;
  if (c.sectors?.length) {
    const sector = detectSector(lead);
    if (!sector || !c.sectors.includes(sector)) return false;
  }
  return true;
}

export function leadsInSegment(leads: Lead[], seg: Segment): Lead[] {
  return leads.filter((l) => matchesCriteria(l, seg.criteria));
}

// A lead is enriched when it has an email OR a LinkedIn profile.
export function isEnriched(lead: Lead): boolean {
  return Boolean(lead.email || lead.linkedinUrl);
}

export type SegmentMetrics = {
  leads: number;
  enriched: number;
  enrichedPct: number;
  contacted: number;
  qualified: number;
};

export function segmentMetrics(members: Lead[]): SegmentMetrics {
  const enriched = members.filter(isEnriched).length;
  return {
    leads: members.length,
    enriched,
    enrichedPct: members.length === 0 ? 0 : Math.round((enriched / members.length) * 100),
    contacted: members.filter((l) => l.status !== "new").length,
    qualified: members.filter((l) => l.status === "converted").length,
  };
}

// The first non-archived segment a lead belongs to (for the table badge).
export function primarySegment(lead: Lead, segs: Segment[]): Segment | null {
  return segs.find((s) => !s.isArchived && matchesCriteria(lead, s.criteria)) ?? null;
}
