import { NextResponse } from "next/server";
import { runLeadDetection } from "@/lib/leadDetect";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// On-demand: auto-detect leads from the workspace owner's LinkedIn post
// engagement. Guards (24h cooldown, balance pre-check, tight scrape caps) live
// in runLeadDetection so the cron shares them.
export async function POST() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const r = await runLeadDetection(ctx.workspace);
  if (r.ok) {
    return NextResponse.json({ created: r.created, skipped: r.skipped, found: r.found, balance: r.balance });
  }
  switch (r.reason) {
    case "no_url":
      return NextResponse.json(
        { error: "Renseigne d'abord l'URL de ton profil LinkedIn dans les paramètres." },
        { status: 400 },
      );
    case "no_apify":
      return NextResponse.json({ error: "Apify n'est pas configuré." }, { status: 503 });
    case "cooldown":
      return NextResponse.json(
        { error: `Détection déjà lancée récemment. Réessaie dans ${r.hoursLeft} h.` },
        { status: 429 },
      );
    case "insufficient":
      return NextResponse.json(
        { error: "insufficient_credits", action: "detect_leads", needed: r.needed, balance: r.balance },
        { status: 402 },
      );
    case "no_engagement":
      return NextResponse.json(
        { error: "Aucune interaction trouvée sur tes posts récents. Réessaie plus tard." },
        { status: 502 },
      );
  }
}
