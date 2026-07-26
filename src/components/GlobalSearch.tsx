"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { TEMPLATES } from "@/lib/templates";
import {
  contentTypeLabel,
  platformLabel,
  type ContentItem,
} from "@/lib/types";

export default function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // Lazy-load the workspace's content the first time the user searches.
  useEffect(() => {
    if (open && items === null) {
      fetch("/api/content")
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then((d) => setItems(d.items ?? []))
        .catch(() => setItems([]));
    }
  }, [open, items]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const q = query.trim().toLowerCase();

  const contentResults = useMemo(() => {
    if (!q || !items) return [];
    return items
      .filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.body.toLowerCase().includes(q),
      )
      .slice(0, 5);
  }, [q, items]);

  const templateResults = useMemo(() => {
    if (!q) return [];
    return TEMPLATES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [q]);

  const hasResults = contentResults.length > 0 || templateResults.length > 0;

  function openTemplate(title: string, structure: string, type: string) {
    const topic = `Adapte ce template « ${title} » à mon profil. Structure à suivre :\n${structure}`;
    router.push(
      `/studio?tab=brief&type=${encodeURIComponent(type)}&topic=${encodeURIComponent(topic)}`,
    );
    setOpen(false);
    setQuery("");
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-xl">
      <div className="flex items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 focus-within:border-primary focus-within:bg-[color:var(--bg-input)] focus-within:ring-2 focus-within:ring-primary/15">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Rechercher dans LogLead"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
        />
      </div>

      {open && q.length > 0 && (
        <div className="absolute left-0 right-0 z-40 mt-2 max-h-96 overflow-y-auto rounded-xl border border-line bg-surface p-2 shadow-soft">
          {!hasResults && (
            <p className="px-3 py-4 text-center text-sm text-muted">
              Aucun résultat pour « {query} ».
            </p>
          )}

          {contentResults.length > 0 && (
            <div className="mb-1">
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Mes contenus
              </p>
              {contentResults.map((i) => (
                <button
                  key={i.id}
                  onClick={() => {
                    router.push("/dashboard");
                    setOpen(false);
                  }}
                  className="block w-full rounded-lg px-2 py-2 text-left hover:bg-canvas"
                >
                  <div className="truncate text-sm font-medium text-ink">
                    {i.title}
                  </div>
                  <div className="text-xs text-muted">
                    {platformLabel(i.platform)} · {contentTypeLabel(i.type)}
                  </div>
                </button>
              ))}
            </div>
          )}

          {templateResults.length > 0 && (
            <div>
              <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
                Templates
              </p>
              {templateResults.map((t) => (
                <button
                  key={t.id}
                  onClick={() => openTemplate(t.title, t.structure, t.contentType)}
                  className="block w-full rounded-lg px-2 py-2 text-left hover:bg-canvas"
                >
                  <div className="truncate text-sm font-medium text-ink">
                    {t.title}
                  </div>
                  <div className="truncate text-xs text-muted">
                    {t.description}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
