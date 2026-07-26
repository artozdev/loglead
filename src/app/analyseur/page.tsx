import { redirect } from "next/navigation";

// Public-facing alias for the content analyzer. The analyzer is no longer in
// the app navigation but stays reachable at /analyseur.
export default function AnalyseurAlias() {
  redirect("/content-analyzer");
}
