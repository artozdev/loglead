import ContactBoard from "@/components/ContactBoard";
import { prospects } from "@/lib/db";
import { requireProfile } from "@/lib/guards";

export default async function ContactPage() {
  const { workspace } = await requireProfile();
  const list = await prospects.listPipeline(workspace.id); // inPipeline = in contact list
  // Also include prospects explicitly flagged inContact.
  const all = await prospects.listByWorkspace(workspace.id);
  const inContact = all.filter((p) => p.inContact);
  const merged = [...new Map([...list, ...inContact].map((p) => [p.id, p])).values()];
  return <ContactBoard prospects={merged} />;
}
