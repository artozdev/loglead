import { NextResponse } from "next/server";
import { contentItems, leadEvents, leads, type LeadInput } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import type { LeadChannel, LeadStatus } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

type Demo = {
  firstName: string;
  lastName: string;
  email: string | null;
  phone?: string | null;
  company?: string;
  jobTitle?: string;
  channel: LeadChannel;
  status: LeadStatus;
};

const DEMO: Demo[] = [
  { firstName: "Camille", lastName: "Rousseau", email: "camille.rousseau@growthlab.io", phone: "+33 6 12 34 56 78", company: "GrowthLab", jobTitle: "Founder", channel: "linkedin", status: "new" },
  { firstName: "Thomas", lastName: "Mercier", email: "t.mercier@stackflow.com", company: "StackFlow", jobTitle: "Head of Product", channel: "linkedin", status: "contacted" },
  { firstName: "Léa", lastName: "Dubois", email: null, company: "Indie maker", channel: "reddit", status: "new" },
  { firstName: "Marco", lastName: "Bianchi", email: "marco@datawise.co", company: "DataWise", jobTitle: "CEO", channel: "website", status: "in_discussion" },
  { firstName: "Sophie", lastName: "Laurent", email: "sophie.laurent@gmail.com", company: "Solo", channel: "instagram", status: "new" },
  { firstName: "Yanis", lastName: "Benali", email: "yanis@scaleup.fr", company: "ScaleUp", jobTitle: "COO", channel: "x", status: "converted" },
  { firstName: "Emma", lastName: "Fischer", email: "emma.fischer@b2bsaas.de", company: "B2B SaaS", channel: "website", status: "contacted" },
  { firstName: "Hugo", lastName: "Petit", email: null, channel: "reddit", status: "lost" },
  { firstName: "Inès", lastName: "Moreau", email: "ines@founderlab.io", company: "FounderLab", jobTitle: "Founder", channel: "linkedin", status: "in_discussion" },
  { firstName: "Lucas", lastName: "Garcia", email: "lucas.garcia@example.com", company: "Indie SaaS", channel: "manual", status: "new" },
];

export async function POST() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  if (leads.listByWorkspace(ctx.workspace.id).length > 0) {
    return NextResponse.json({ skipped: true });
  }

  const srcId = contentItems.listByWorkspace(ctx.workspace.id)[0]?.id ?? null;
  let created = 0;
  DEMO.forEach((d, i) => {
    const input: LeadInput = {
      firstName: d.firstName,
      lastName: d.lastName,
      email: d.email,
      phone: d.phone ?? null,
      company: d.company,
      jobTitle: d.jobTitle,
      channel: d.channel,
      sourceContentId: i % 3 === 0 ? srcId : null,
      status: d.status,
    };
    const lead = leads.create(ctx.workspace.id, input);
    leadEvents.create(lead.id, "added", { channel: d.channel, demo: true });
    if (d.status !== "new") {
      leadEvents.create(lead.id, "status_changed", { from: "new", to: d.status });
    }
    created++;
  });
  return NextResponse.json({ created });
}
