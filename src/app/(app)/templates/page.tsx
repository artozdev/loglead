import TemplatesGrid from "@/components/TemplatesGrid";
import { requireProfile } from "@/lib/guards";

export default async function TemplatesPage() {
  await requireProfile();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Bibliothèque de templates</h1>
        <p className="mt-1 text-muted">
          Des structures qui marchent. Clique « Adapter à mon profil » pour les
          personnaliser en un clic via le Studio.
        </p>
      </div>
      <TemplatesGrid />
    </div>
  );
}
