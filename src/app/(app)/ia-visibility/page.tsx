import { redirect } from "next/navigation";

// IA Visibility became the GEO module — keep old links working.
export default function IaVisibilityRedirect() {
  redirect("/geo");
}
