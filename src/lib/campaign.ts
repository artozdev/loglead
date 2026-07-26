import "server-only";
import { leads as leadsRepo } from "./db";
import type { Campaign, CampaignChannel } from "./types";

// Per-channel optimal slot (Algo Insider heuristic): spaced across the week so
// the same campaign never floods the audience on one day.
// X Mon 12:00 · LinkedIn Tue 08:30 · Reddit Wed 14:00 · Email Fri 09:00.
const SLOT_PLAN: Record<CampaignChannel, { dayOffset: number; time: string }> = {
  x: { dayOffset: 0, time: "12:00" },
  linkedin: { dayOffset: 1, time: "08:30" },
  reddit: { dayOffset: 2, time: "14:00" },
  email: { dayOffset: 4, time: "09:00" },
};

function nextMonday(from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const day = d.getDay(); // 0 Sun..6 Sat
  const delta = ((8 - day) % 7) || 7; // strictly next Monday
  d.setDate(d.getDate() + delta);
  return d;
}

// Local YYYY-MM-DD (never toISOString — that shifts the day in +UTC timezones).
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function planSlot(channel: CampaignChannel): { date: string; time: string } {
  const monday = nextMonday();
  const plan = SLOT_PLAN[channel];
  const d = new Date(monday);
  d.setDate(d.getDate() + plan.dayOffset);
  return { date: toYMD(d), time: plan.time };
}

function seed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic engagement figures per publication (no live social data yet).
export function seedMetrics(campaignId: string, channel: CampaignChannel): {
  views: number;
  likes: number;
  comments: number;
} {
  const h = seed(`${campaignId}:${channel}`);
  const base = channel === "email" ? 800 : channel === "reddit" ? 3000 : channel === "x" ? 3500 : 12000;
  const views = base + (h % Math.round(base * 0.6));
  const likes = Math.round(views * (0.02 + ((h >> 4) % 5) / 100));
  const comments = Math.round(likes * (0.15 + ((h >> 8) % 20) / 100));
  return { views, likes, comments };
}

export type CampaignLeadRollup = {
  total: number;
  avgScore: number;
  perChannel: Partial<Record<CampaignChannel, number>>;
  leads: { id: string; name: string; score: number; channel: CampaignChannel }[];
};

// Real attribution: a lead belongs to the campaign when its sourceContentId is
// one of the campaign's publication content items.
export async function campaignLeads(workspaceId: string, campaign: Campaign): Promise<CampaignLeadRollup> {
  const contentToChannel = new Map<string, CampaignChannel>();
  for (const p of campaign.publications) {
    if (p.contentItemId) contentToChannel.set(p.contentItemId, p.channel);
  }
  const matched = (await leadsRepo.listByWorkspace(workspaceId)).filter(
    (l) => l.sourceContentId && contentToChannel.has(l.sourceContentId),
  );

  const perChannel: Partial<Record<CampaignChannel, number>> = {};
  const leads = matched.map((l) => {
    const channel = contentToChannel.get(l.sourceContentId!)!;
    perChannel[channel] = (perChannel[channel] ?? 0) + 1;
    return {
      id: l.id,
      name: `${l.firstName} ${l.lastName}`.trim(),
      score: l.score ?? 0,
      channel,
    };
  });
  const scored = await leads.filter((l) => l.score > 0);
  const avgScore = scored.length
    ? Math.round(scored.reduce((a, l) => a + l.score, 0) / scored.length)
    : 0;
  return { total: leads.length, avgScore, perChannel, leads };
}
