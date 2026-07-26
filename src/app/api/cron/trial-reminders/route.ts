import { NextResponse } from "next/server";
import TrialEndedEmail from "../../../../../emails/trial-ended";
import TrialEndingEmail from "../../../../../emails/trial-ending";
import { contentAnalyses, contentItems, users, visibilityScans, workspaces } from "@/lib/db";
import { cronAuthorized } from "@/lib/emails/cron";
import { appUrl, firstNameFromEmail, sendEmail } from "@/lib/emails/send";

// Emails 4 & 5 — J-3 reminder and end-of-trial notice. Only workspaces with
// a `trialEndsAt` date are concerned (set when a trial starts). Scheduled via
// vercel.json (09:00 UTC daily).
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const in3days = new Date(Date.now() + 3 * 86_400_000).toISOString().slice(0, 10);
  let sent = 0;

  for (const ws of await workspaces.listAll()) {
    if (!ws.trialEndsAt) continue;
    const endDay = ws.trialEndsAt.slice(0, 10);
    const owner = await users.findById(ws.ownerId);
    if (!owner) continue;
    const firstName = firstNameFromEmail(owner.email);

    if (endDay === in3days) {
      const geo = (await visibilityScans.listByWorkspace(ws.id)).find((s) => s.queryRows);
      await sendEmail({
        to: owner.email,
        subject: "Il te reste 3 jours d'essai — ne perds pas ta progression",
        template: TrialEndingEmail({
          firstName,
          stats: {
            generated: (await contentItems.listByWorkspace(ws.id)).length,
            analyses: (await contentAnalyses.listByWorkspace(ws.id)).length,
            geoScore: geo?.globalScore ?? null,
          },
          appUrl: appUrl(),
        }),
      });
      sent++;
    } else if (endDay === today) {
      await sendEmail({
        to: owner.email,
        subject: "Ton essai LogLead vient de se terminer",
        template: TrialEndedEmail({ firstName, appUrl: appUrl() }),
      });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
