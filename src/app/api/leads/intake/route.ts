import { NextResponse } from "next/server";
import { z } from "zod";
import { contentItems, leadEvents, leads, workspaces } from "@/lib/db";
import { notifyNewLead } from "@/lib/emails/triggers";

// Public intake webhook for site forms (Tally/Typeform/native). Identified by
// the workspace token in ?w=. UTM params map the lead to its source content.
const schema = z.object({
  firstName: z.string().min(1).default("Visiteur"),
  lastName: z.string().default(""),
  email: z.string().nullish(),
  phone: z.string().nullish(),
  company: z.string().optional(),
  utm_source: z.string().optional(),
  utm_content: z.string().optional(),
});

export async function POST(req: Request) {
  const wid = new URL(req.url).searchParams.get("w");
  if (!wid || !workspaces.findById(wid)) {
    return NextResponse.json({ error: "Webhook invalide" }, { status: 404 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }
  const d = parsed.data;
  const sourceContentId =
    d.utm_content && contentItems.findById(d.utm_content, wid) ? d.utm_content : null;

  const lead = leads.create(wid, {
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email || null,
    phone: d.phone || null,
    company: d.company,
    channel: "website",
    sourceContentId,
    status: "new",
  });
  leadEvents.create(lead.id, "added", {
    channel: "website",
    utm_source: d.utm_source ?? null,
  });
  void notifyNewLead(lead); // Email 9 (respects the settings toggle)
  return NextResponse.json({ ok: true, leadId: lead.id });
}
