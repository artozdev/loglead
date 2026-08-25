import { NextResponse } from "next/server";
import { insufficientResponse, spend } from "@/lib/creditGuard";
import { prospects } from "@/lib/db";
import { domainFromUrl, enrichContact, hasFullEnrich } from "@/lib/fullenrich";
import { currentWorkspace } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort contact enrichment (FullEnrich needs a named person). Charges
// enrich_full. Returns the updated prospect.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const p = await prospects.findById(id, ctx.workspace.id);
  if (!p) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (!hasFullEnrich()) {
    return NextResponse.json({ error: "Enrichissement non configuré (FULLENRICH_API_KEY)." }, { status: 503 });
  }
  const parts = (p.contactName ?? "").trim().split(/\s+/);
  if (parts.length < 2) {
    return NextResponse.json(
      { error: "Pas de contact nommé sur ce prospect — impossible d'enrichir l'email." },
      { status: 422 },
    );
  }

  const charge = await spend(ctx.workspace.id, "enrich_full");
  if (!charge.ok) return insufficientResponse("enrich_full", charge.balance);

  const found = await enrichContact({
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
    companyName: p.companyName,
    domain: domainFromUrl(p.companyDomain) ?? p.companyDomain,
    linkedinUrl: p.contactLinkedinUrl,
  });

  const updated = await prospects.update(id, ctx.workspace.id, {
    contactEmail: found?.workEmail ?? found?.personalEmail ?? p.contactEmail ?? null,
    contactPhone: found?.phone ?? p.contactPhone ?? null,
    enrichedAt: new Date().toISOString(),
  });

  return NextResponse.json({ prospect: updated });
}
