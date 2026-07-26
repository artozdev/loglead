import { contentItems, leads } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import { leadChannelLabel, leadStatusLabel } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

const cell = (v: string) => `"${(v ?? "").replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return new Response("Non authentifié", { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return new Response("Réservé aux offres Growth et Pro.", { status: 403 });
  }

  const idsParam = new URL(req.url).searchParams.get("ids");
  const ids = idsParam ? new Set(idsParam.split(",")) : null;
  const titleById = new Map(
    contentItems.listByWorkspace(ctx.workspace.id).map((c) => [c.id, c.title]),
  );

  let list = leads.listByWorkspace(ctx.workspace.id);
  if (ids) list = list.filter((l) => ids.has(l.id));

  const header = [
    "Prénom", "Nom", "Email", "Téléphone", "Entreprise", "Poste",
    "Canal", "Contenu source", "Statut", "Date d'entrée",
  ];
  const rows = list.map((l) =>
    [
      l.firstName, l.lastName, l.email ?? "", l.phone ?? "", l.company ?? "",
      l.jobTitle ?? "", leadChannelLabel(l.channel),
      l.sourceContentId ? titleById.get(l.sourceContentId) ?? "" : "",
      leadStatusLabel(l.status), l.createdAt.slice(0, 10),
    ].map(cell).join(","),
  );
  const csv = [header.map(cell).join(","), ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="loglead-leads.csv"',
    },
  });
}
