import { redirect } from "next/navigation";

// Brand profile now lives inside Paramètres (/settings).
export default function ProfilePage() {
  redirect("/settings");
}
