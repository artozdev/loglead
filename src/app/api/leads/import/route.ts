import { NextResponse } from "next/server";
import { z } from "zod";
import { leadEvents, leads } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({ csv: z.string().min(1) });

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false;
      } else field += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") { row.push(field); field = ""; }
    else if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (ch !== "\r") field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Fichier vide." }, { status: 400 });
  }

  const rows = parseCSV(parsed.data.csv);
  if (rows.length < 2) {
    return NextResponse.json({ error: "Aucune ligne à importer." }, { status: 400 });
  }
  const header = rows[0].map((h) => h.toLowerCase().trim());
  const find = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h.includes(n)));
  const fi = find("first", "prénom", "prenom");
  const li = find("last", "nom");
  const ni = find("name", "nom complet");
  const ci = find("company", "entreprise");
  const ti = find("title", "poste", "titre");
  const ei = find("email", "mail");
  const ui = find("profile", "linkedin", "url");

  let imported = 0;
  for (const r of rows.slice(1)) {
    let first = fi >= 0 ? (r[fi] ?? "").trim() : "";
    let last = li >= 0 ? (r[li] ?? "").trim() : "";
    if (!first && ni >= 0) {
      const parts = (r[ni] ?? "").trim().split(/\s+/);
      first = parts[0] ?? "";
      last = parts.slice(1).join(" ");
    }
    if (!first) continue;
    const lead = await leads.create(ctx.workspace.id, {
      firstName: first,
      lastName: last,
      email: ei >= 0 && r[ei]?.trim() ? r[ei].trim() : null,
      phone: null,
      company: ci >= 0 ? r[ci]?.trim() || undefined : undefined,
      jobTitle: ti >= 0 ? r[ti]?.trim() || undefined : undefined,
      linkedinUrl: ui >= 0 ? r[ui]?.trim() || undefined : undefined,
      channel: "linkedin",
      sourceContentId: null,
      status: "new",
    });
    await leadEvents.create(lead.id, "added", { channel: "linkedin", imported: true });
    imported++;
  }
  return NextResponse.json({ imported });
}
