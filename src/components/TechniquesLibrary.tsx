"use client";

import { useMemo, useState } from "react";
import {
  fillTemplate,
  TECHNIQUE_CATEGORIES,
  TECHNIQUES,
  type Brand,
  type TechniqueCategory,
} from "@/lib/techniques";
import { contentTypeLabel } from "@/lib/types";

// Studio — Fonctionnalité C : 30 techniques de mise en avant SaaS. Chaque carte
// montre un exemple concret adapté à la niche du founder et envoie l'angle au
// brief via onUse (le Studio bascule alors sur l'onglet de génération).

export default function TechniquesLibrary({
  brand,
  onUse,
}: {
  brand: Brand;
  onUse: (topic: string, technique: string) => void;
}) {
  const [cat, setCat] = useState<TechniqueCategory | "all">("all");

  const list = useMemo(
    () => (cat === "all" ? TECHNIQUES : TECHNIQUES.filter((t) => t.category === cat)),
    [cat],
  );

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted">
        30 techniques prêtes à l&apos;emploi pour mettre {brand.saas || "ton SaaS"} en avant sans avoir l&apos;air de
        faire de la pub. Choisis-en une — on pré-remplit le brief avec l&apos;angle, adapté à ta niche.
      </p>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        <FilterChip active={cat === "all"} onClick={() => setCat("all")}>
          Toutes ({TECHNIQUES.length})
        </FilterChip>
        {TECHNIQUE_CATEGORIES.map((c) => (
          <FilterChip key={c.value} active={cat === c.value} onClick={() => setCat(c.value)}>
            {c.emoji} {c.label}
          </FilterChip>
        ))}
      </div>

      {/* Techniques grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((t) => {
          const example = fillTemplate(t.example, brand);
          return (
            <div key={t.id} className="card flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-semibold text-ink">{t.title}</h3>
                <span className="chip shrink-0 border-line text-muted">{contentTypeLabel(t.contentType)}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{t.description}</p>
              <div className="mt-3 flex-1 rounded-lg bg-canvas px-3 py-2 text-sm italic text-ink/70">
                {example}
              </div>
              <button onClick={() => onUse(example, t.title)} className="btn-secondary mt-4 !py-2 text-sm">
                Générer un contenu avec cette technique
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`chip cursor-pointer ${active ? "border-primary bg-primary/10 text-primary" : "border-line text-muted"}`}
    >
      {children}
    </button>
  );
}
