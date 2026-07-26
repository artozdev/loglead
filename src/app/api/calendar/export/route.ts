import { contentItems } from "@/lib/db";
import { contentTypeLabel, platformLabel, type ContentItem } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

// Export the scheduled calendar so it can be pushed to Buffer / Make / Zapier
// or imported into any calendar app. Supports CSV and iCalendar (.ics).

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function toCSV(items: ContentItem[]): string {
  const header = ["date", "plateforme", "type", "titre", "contenu"];
  const rows = items.map((i) =>
    [
      i.scheduledDate ?? "",
      platformLabel(i.platform),
      contentTypeLabel(i.type),
      i.title,
      i.body.replace(/\r?\n/g, " "),
    ]
      .map(csvCell)
      .join(","),
  );
  return [header.map(csvCell).join(","), ...rows].join("\r\n");
}

function icsEscape(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toICS(items: ContentItem[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LogLead//Calendrier éditorial//FR",
    "CALSCALE:GREGORIAN",
  ];
  for (const i of items) {
    if (!i.scheduledDate) continue;
    const date = i.scheduledDate.replace(/-/g, "");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${i.id}@loglead`,
      `DTSTART;VALUE=DATE:${date}`,
      `SUMMARY:${icsEscape(`[${platformLabel(i.platform)}] ${i.title}`)}`,
      `DESCRIPTION:${icsEscape(i.body)}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export async function GET(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return new Response("Non authentifié", { status: 401 });

  const format = new URL(req.url).searchParams.get("format") === "ics"
    ? "ics"
    : "csv";
  const scheduled = contentItems
    .listByWorkspace(ctx.workspace.id)
    .filter((i) => i.scheduledDate)
    .sort((a, b) => (a.scheduledDate! < b.scheduledDate! ? -1 : 1));

  if (format === "ics") {
    return new Response(toICS(scheduled), {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="loglead-calendrier.ics"',
      },
    });
  }
  return new Response(toCSV(scheduled), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="loglead-calendrier.csv"',
    },
  });
}
