"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import {
  PLATFORMS,
  platformLabel,
  TEMPLATE_CATEGORIES,
  type Platform,
  type TemplateCategory,
} from "@/lib/types";

export default function TemplatesGrid() {
  const router = useRouter();
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const [platform, setPlatform] = useState<Platform | "all">("all");

  const filtered = useMemo(
    () =>
      TEMPLATES.filter(
        (t) =>
          (category === "all" || t.category === category) &&
          (platform === "all" || t.platform === platform),
      ),
    [category, platform],
  );

  function adapt(templateTitle: string, structure: string, type: string) {
    const topic = `Adapte ce template « ${templateTitle} » à mon profil. Structure à suivre :\n${structure}`;
    router.push(
      `/studio?tab=brief&type=${encodeURIComponent(type)}&topic=${encodeURIComponent(topic)}`,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <select
          className="input max-w-xs"
          value={category}
          onChange={(e) =>
            setCategory(e.target.value as TemplateCategory | "all")
          }
        >
          <option value="all">Toutes les catégories</option>
          {TEMPLATE_CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <button
            onClick={() => setPlatform("all")}
            className={`chip cursor-pointer ${
              platform === "all"
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-muted"
            }`}
          >
            Toutes
          </button>
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPlatform(p.value)}
              className={`chip cursor-pointer ${
                platform === p.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line text-muted"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <span className="ml-auto text-sm text-muted">
          {filtered.length} template{filtered.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((t) => (
          <div key={t.id} className="card flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="chip border-line text-muted">
                {platformLabel(t.platform)}
              </span>
              <span className="chip border-primary/20 bg-primary/5 text-primary">
                {TEMPLATE_CATEGORIES.find((c) => c.value === t.category)?.label ??
                  t.category}
              </span>
            </div>
            <div>
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-sm text-muted">{t.description}</p>
            </div>
            <pre className="flex-1 whitespace-pre-wrap rounded-xl border border-line bg-canvas p-3 text-xs leading-relaxed text-muted">
              {t.structure}
            </pre>
            <button
              onClick={() => adapt(t.title, t.structure, t.contentType)}
              className="btn-primary w-full"
            >
              Adapter à mon profil
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-sm text-muted">
          Aucun template pour ce filtre.
        </p>
      )}
    </div>
  );
}
