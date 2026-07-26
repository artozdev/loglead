import { NextResponse } from "next/server";
import DailyBriefEmail from "../../../../../emails/daily-brief";
import { cmoConfig, contentItems, users, visibilityScans, workspaces } from "@/lib/db";
import { cronAuthorized } from "@/lib/emails/cron";
import { appUrl, firstNameFromEmail, sendEmail } from "@/lib/emails/send";
import { platformLabel } from "@/lib/types";

// Email 3 — daily brief from the CMO IA. Pro plan + CMO activated + the
// "Brief quotidien" toggle on. Scheduled via vercel.json (07:00 UTC).
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;

  for (const ws of workspaces.listAll()) {
    if (ws.plan !== "pro") continue;
    if (!cmoConfig.get(ws.id).activatedAt) continue;
    const owner = users.findById(ws.ownerId);
    if (!owner || owner.emailPrefs?.dailyBrief === false) continue;

    const items = contentItems
      .listByWorkspace(ws.id)
      .filter((c) => c.scheduledDate === today)
      .sort((a, b) => (a.scheduledTime ?? "09:00").localeCompare(b.scheduledTime ?? "09:00"))
      .map((c) => ({
        platform: platformLabel(c.platform),
        time: (c.scheduledTime ?? "09:00").replace(":", "h"),
        title: c.title,
        id: c.id,
      }));
    if (items.length === 0) continue; // nothing planned today → no email

    const scans = visibilityScans.listByWorkspace(ws.id).filter((s) => s.queryRows);
    const geoScore = scans[0]?.globalScore ?? null;
    const geoDelta = scans[0] && scans[1] ? scans[0].globalScore - scans[1].globalScore : null;

    const dateLabel = new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());

    await sendEmail({
      to: owner.email,
      subject: `${firstNameFromEmail(owner.email)}, voici ton contenu du jour — ${dateLabel}`,
      template: DailyBriefEmail({
        firstName: firstNameFromEmail(owner.email),
        dateLabel,
        items,
        geoScore,
        geoDelta,
        appUrl: appUrl(),
      }),
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
