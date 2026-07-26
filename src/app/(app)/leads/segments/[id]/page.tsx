import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import LeadsModule from "@/components/LeadsModule";
import { contentItems, leads as leadsRepo, segments as segmentsRepo } from "@/lib/db";
import { requireProfile } from "@/lib/guards";
import { planAllows } from "@/lib/plan";
import { leadsInSegment, segmentMetrics } from "@/lib/segments";
import { SEGMENT_TYPE_META } from "@/lib/types";

export default async function SegmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { workspace } = await requireProfile();
  if (!planAllows(workspace.plan, "leads")) redirect("/pricing");

  const { id } = await params;
  const segment = segmentsRepo.findById(id, workspace.id);
  if (!segment) notFound();

  const members = leadsInSegment(leadsRepo.listByWorkspace(workspace.id), segment);
  const m = segmentMetrics(members);
  const meta = SEGMENT_TYPE_META[segment.type];
  const contents = contentItems.listByWorkspace(workspace.id).map((c) => ({ id: c.id, title: c.title }));

  const created = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(
    new Date(segment.createdAt),
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-3">
        <Link
          href="/leads"
          className="flex h-8 items-center gap-1.5 rounded-lg border border-line px-2.5 text-[13px] text-muted hover:bg-surface-hover hover:text-ink"
        >
          ← Segments
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[22px] font-medium tracking-tight">{segment.name}</h1>
          <p className="mt-0.5 text-sm text-muted">
            {m.leads} lead{m.leads > 1 ? "s" : ""} · Créé le {created}
          </p>
          <span className={`mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${meta.badgeCls}`}>
            {meta.label}
          </span>
          {segment.description && <p className="mt-1 text-sm text-muted">{segment.description}</p>}
        </div>
      </div>

      {/* Segment metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric value={m.leads} label="leads" />
        <Metric value={`${m.enrichedPct}%`} label="enrichis" />
        <Metric value={m.contacted} label="contactés" />
        <Metric value={m.qualified} label="qualifiés" />
      </div>

      {/* Leads of this segment (reuses the leads table, filtered) */}
      <LeadsModule
        isPro={workspace.plan === "pro"}
        workspaceId={workspace.id}
        contents={contents}
        embedded
        segmentId={segment.id}
      />
    </div>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-xl border-[0.5px] border-line bg-surface px-4 py-3">
      <div className="num text-2xl font-semibold text-ink">{value}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
