import StudioAssistant from "@/components/StudioAssistant";
import { contentItems } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

// Post Generator — the guided assistant (integrated editor + live LinkedIn
// preview). `?content=<id>` loads an existing post into the editor; `?brief` /
// `?topic` seed the editor with an angle.
export default async function PostGeneratorPage({
  searchParams,
}: {
  searchParams: Promise<{ topic?: string; brief?: string; content?: string }>;
}) {
  const { user, workspace, profile } = await requireProfile();
  const sp = await searchParams;

  const item = sp.content ? await contentItems.findById(sp.content, workspace.id) : undefined;

  const local = (user.email.split("@")[0] || user.email).replace(/[._-]+/g, " ").trim();
  const firstName =
    (local.split(" ")[0] || "").charAt(0).toUpperCase() + (local.split(" ")[0] || "").slice(1) || "Toi";

  return (
    <StudioAssistant
      firstName={firstName}
      brand={{
        saas: profile.saasName,
        icp: profile.icp,
        niche: profile.sector || profile.icp,
        tone: profile.tone,
      }}
      initialAngle={item ? item.body : sp.brief ?? sp.topic ?? ""}
      initialGenerated={Boolean(item)}
    />
  );
}
