import { NextResponse } from "next/server";
import { z } from "zod";
import { leadEvents, leads, segments as segmentsRepo } from "@/lib/db";
import { notifyNewLead } from "@/lib/emails/triggers";
import { planAllows } from "@/lib/plan";
import { matchesCriteria, primarySegment } from "@/lib/segments";
import { currentWorkspace } from "@/lib/workspace";

const PAGE_SIZES = [10, 25, 50, 100];

function within(period: string | null, createdAt: string): boolean {
  if (!period || period === "all") return true;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "3m" ? 90 : 0;
  if (!days) return true;
  return new Date(createdAt).getTime() >= Date.now() - days * 86_400_000;
}

export async function GET(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").toLowerCase().trim();
  const channel = sp.get("channel");
  const status = sp.get("status");
  const period = sp.get("period");
  const source = sp.get("source");
  const sort = sp.get("sort") || "recent";
  const segmentId = sp.get("segment");
  const page = Math.max(1, Number(sp.get("page") || "1"));
  const requestedSize = Number(sp.get("pageSize") || "10");
  const pageSize = PAGE_SIZES.includes(requestedSize) ? requestedSize : 10;

  const segs = segmentsRepo.listByWorkspace(ctx.workspace.id);
  let list = await leads.listByWorkspace(ctx.workspace.id);
  // Restrict to one segment's members (segment detail view).
  if (segmentId) {
    const seg = segs.find((s) => s.id === segmentId);
    if (seg) list = list.filter((l) => matchesCriteria(l, seg.criteria));
  }
  if (channel && channel !== "all") list = list.filter((l) => l.channel === channel);
  if (status && status !== "all") list = list.filter((l) => l.status === status);
  if (source && source !== "all") list = list.filter((l) => l.sourceContentId === source);
  list = list.filter((l) => within(period, l.createdAt));
  if (q) {
    list = list.filter(
      (l) =>
        `${l.firstName} ${l.lastName}`.toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.company || "").toLowerCase().includes(q),
    );
  }
  if (sort === "name") {
    list = [...list].sort((a, b) =>
      `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`),
    );
  } else if (sort === "status") {
    list = [...list].sort((a, b) => a.status.localeCompare(b.status));
  } else if (sort === "channel") {
    list = [...list].sort((a, b) => a.channel.localeCompare(b.channel));
  } else {
    list = [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  const total = list.length;
  const start = (page - 1) * pageSize;
  const pageLeads = list.slice(start, start + pageSize);
  // Attach each lead's primary (non-archived) segment for the table badge.
  const withSegment = pageLeads.map((l) => {
    const seg = primarySegment(l, segs);
    return { ...l, segment: seg ? { id: seg.id, name: seg.name } : null };
  });
  return NextResponse.json({ leads: withSegment, total, page, pageSize });
}

const createSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().default(""),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  company: z.string().optional(),
  jobTitle: z.string().optional(),
  linkedinUrl: z.string().optional(),
  channel: z
    .enum(["reddit", "linkedin", "x", "instagram", "website", "manual"])
    .default("manual"),
  sourceContentId: z.string().nullish(),
  status: z
    .enum(["new", "contacted", "in_discussion", "converted", "lost"])
    .default("new"),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Requête invalide" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const lead = await leads.create(ctx.workspace.id, {
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email || null,
    phone: d.phone || null,
    company: d.company,
    jobTitle: d.jobTitle,
    linkedinUrl: d.linkedinUrl,
    channel: d.channel,
    sourceContentId: d.sourceContentId || null,
    status: d.status,
    notes: d.notes,
  });
  await leadEvents.create(lead.id, "added", { channel: lead.channel });
  void notifyNewLead(lead); // Email 9 (respects the settings toggle)
  return NextResponse.json({ lead });
}
