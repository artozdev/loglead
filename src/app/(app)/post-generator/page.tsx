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

  // Recent LinkedIn posts, so the user never loses track of what they generated.
  const all = await contentItems.listByWorkspace(workspace.id);
  const history = all
    .filter((c) => c.platform === "linkedin")
    .slice(0, 40)
    .map((c) => ({
      id: c.id,
      title: c.title,
      body: c.body,
      status: c.status,
      scheduledDate: c.scheduledDate,
      scheduledTime: c.scheduledTime ?? null,
      createdAt: c.createdAt,
    }));

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
      editingId={item?.id ?? null}
      history={history}
    />
  );
}
