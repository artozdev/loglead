import { redirect } from "next/navigation";
import InboxModule from "@/components/InboxModule";
import { requireProfile } from "@/lib/guards";
import { planAllows } from "@/lib/plan";

export default async function InboxPage() {
  const { workspace, user } = await requireProfile();
  // LogReach is a Growth/Pro module — send everyone else to the pricing page.
  if (!planAllows(workspace.plan, "inbox")) {
    redirect("/pricing");
  }

  const local = (user.email.split("@")[0] || user.email).replace(/[._-]+/g, " ").trim();
  const firstName =
    (local.split(" ")[0] || "toi").charAt(0).toUpperCase() + (local.split(" ")[0] || "").slice(1);

  return <InboxModule founderFirstName={firstName} />;
}
