"use client";

import LeadsModule from "./LeadsModule";

type ContentRef = { id: string; title: string };

// Leads hub — single "all leads" view (segments switch removed).
export default function LeadsHub({
  isPro,
  workspaceId,
  contents,
}: {
  isPro: boolean;
  workspaceId: string;
  contents: ContentRef[];
}) {
  return (
    <LeadsModule isPro={isPro} workspaceId={workspaceId} contents={contents} embedded />
  );
}
