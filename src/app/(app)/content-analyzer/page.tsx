import ContentAnalyzerBoard from "@/components/ContentAnalyzerBoard";
import { contentAnalyses } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function ContentAnalyzerPage() {
  const { workspace } = await requireProfile();
  const history = contentAnalyses.listByWorkspace(workspace.id);
  return <ContentAnalyzerBoard history={history} />;
}
