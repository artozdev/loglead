"use client";

import { FolderKanban, RotateCw, Users } from "lucide-react";
import { useState } from "react";
import LeadsModule from "./LeadsModule";
import SegmentsBoard from "./SegmentsBoard";

type ContentRef = { id: string; title: string };

// Leads hub — centered pill tabs over the two views (all leads · segments).
export default function LeadsHub({
  isPro,
  workspaceId,
  contents,
}: {
  isPro: boolean;
  workspaceId: string;
  contents: ContentRef[];
}) {
  const [tab, setTab] = useState<"leads" | "segments">("leads");
  const [nonce, setNonce] = useState(0); // bump to force a remount (refresh)

  return (
    <div className="space-y-5">
      <div className="flex items-center">
        <div className="mx-auto flex rounded-xl bg-surface-hover p-1">
          <TabPill icon={<Users size={15} />} label="Tous les leads" active={tab === "leads"} onClick={() => setTab("leads")} />
          <TabPill icon={<FolderKanban size={15} />} label="Segments" active={tab === "segments"} onClick={() => setTab("segments")} />
        </div>
        <button
          onClick={() => setNonce((n) => n + 1)}
          title="Rafraîchir"
          aria-label="Rafraîchir"
          className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line text-muted hover:bg-surface-hover hover:text-ink"
        >
          <RotateCw size={15} strokeWidth={1.5} />
        </button>
      </div>

      {tab === "leads" ? (
        <LeadsModule key={`leads-${nonce}`} isPro={isPro} workspaceId={workspaceId} contents={contents} embedded />
      ) : (
        <SegmentsBoard key={`seg-${nonce}`} />
      )}
    </div>
  );
}

function TabPill({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium transition ${
        active ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
