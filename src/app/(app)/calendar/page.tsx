import CalendarBoard from "@/components/CalendarBoard";
import { contentItems } from "@/lib/db";
import { requireProfile } from "@/lib/guards";
import type { Platform } from "@/lib/types";

// Recommended publishing days per primary platform (0=dim … 6=sam), derived from
// the Algo Insider best-practices. Surfaced as tinted "créneaux recommandés".
const RECOMMENDED_DAYS: Record<Platform, number[]> = {
  linkedin: [2, 4], // mardi, jeudi
  instagram: [1, 3, 5], // lundi, mercredi, vendredi
  tiktok: [2, 4, 0], // mardi, jeudi, dimanche
};

export default async function CalendarPage() {
  const { workspace, profile } = await requireProfile();
  const items = contentItems.listByWorkspace(workspace.id);
  const primary = profile.platforms[0] ?? "linkedin";

  return (
    <CalendarBoard
      initialItems={items}
      plan={workspace.plan}
      recommendedDays={RECOMMENDED_DAYS[primary]}
    />
  );
}
