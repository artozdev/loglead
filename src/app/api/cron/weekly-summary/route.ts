import { NextResponse } from "next/server";
import WeeklySummaryEmail from "../../../../../emails/weekly-summary";
import {
  contentAnalyses,
  contentItems,
  profiles,
  users,
  visibilityScans,
  workspaces,
} from "@/lib/db";
import { cronAuthorized } from "@/lib/emails/cron";
import { appUrl, firstNameFromEmail, sendEmail } from "@/lib/emails/send";

const WEEK_MS = 7 * 86_400_000;

// Email 8 — Monday-morning recap, gated by the "Résumé hebdomadaire" toggle.
// Scheduled via vercel.json (08:00 UTC on Mondays).
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const since = Date.now() - WEEK_MS;
  const inWeek = (iso: string) => new Date(iso).getTime() >= since;
  let sent = 0;

  for (const ws of workspaces.listAll()) {
    const owner = users.findById(ws.ownerId);
    const profile = profiles.findByWorkspace(ws.id);
    if (!owner || !profile) continue;
    if (owner.emailPrefs?.weeklySummary === false) continue;

    const content = contentItems.listByWorkspace(ws.id).filter((c) => inWeek(c.createdAt));
    const analyses = contentAnalyses.listByWorkspace(ws.id).filter((a) => inWeek(a.createdAt));
    if (content.length === 0 && analyses.length === 0) continue; // idle week → skip

    const avgScore =
      analyses.length === 0
        ? 0
        : Math.round(analyses.reduce((a, x) => a + x.globalScore, 0) / analyses.length);

    const scans = visibilityScans.listByWorkspace(ws.id).filter((s) => s.queryRows);
    const geoScore = scans[0]?.globalScore ?? null;
    const geoDelta = scans[0] && scans[1] ? scans[0].globalScore - scans[1].globalScore : null;

    // "Best content" = the analysis with the highest score this week.
    const best = [...analyses].sort((a, b) => b.globalScore - a.globalScore)[0];
    const bestItem = content[0];

    const recommendation =
      geoScore !== null && geoScore < 50
        ? "Ton score GEO est encore bas — consulte le plan d'action GEO, la page « Alternative à ton concurrent » est l'action au meilleur ratio impact/effort."
        : content.length < 3
          ? "Tu as publié peu de contenus cette semaine. La régularité est le premier levier de croissance : planifie 3 créneaux dans ton calendrier éditorial."
          : "Bonne cadence cette semaine ! Pense à recycler ton meilleur contenu sur un autre réseau via le Studio IA.";

    const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long" });
    const weekLabel = `${fmt.format(new Date(since))} – ${fmt.format(new Date())}`;

    await sendEmail({
      to: owner.email,
      subject: `Tes stats LogLead de la semaine — ${weekLabel}`,
      template: WeeklySummaryEmail({
        firstName: firstNameFromEmail(owner.email),
        saasName: profile.saasName,
        weekLabel,
        stats: {
          generated: content.length,
          published: content.filter((c) => c.status === "published").length,
          avgScore,
          geoScore,
          geoDelta,
        },
        bestContent: bestItem
          ? { title: best ? `${bestItem.title} (${best.globalScore}/100)` : bestItem.title, id: bestItem.id }
          : null,
        recommendation,
        appUrl: appUrl(),
      }),
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
