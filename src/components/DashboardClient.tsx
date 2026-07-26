"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  contentTypeLabel,
  platformLabel,
  type ContentItem,
} from "@/lib/types";

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

type DayCell = { date: Date; key: string; inMonth: boolean };

function monthMatrix(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  // Monday-first offset (JS getDay: 0=Sun).
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date: d, key: ymd(d), inMonth: d.getMonth() === month });
  }
  // Trim trailing empty week if it's fully outside the month.
  return cells.slice(0, cells.slice(35).every((c) => !c.inMonth) ? 35 : 42);
}

export default function DashboardClient({
  initialItems,
}: {
  initialItems: ContentItem[];
}) {
  const today = new Date();
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [view, setView] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  });
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const drafts = useMemo(
    () => items.filter((i) => i.status === "draft"),
    [items],
  );
  const scheduledByDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const i of items) {
      if (!i.scheduledDate) continue;
      const arr = map.get(i.scheduledDate) ?? [];
      arr.push(i);
      map.set(i.scheduledDate, arr);
    }
    return map;
  }, [items]);

  const cells = useMemo(
    () => monthMatrix(view.year, view.month),
    [view],
  );

  function applyUpdated(updated: ContentItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  async function patch(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/content/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) applyUpdated(data.item);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setBusy(false);
    }
  }

  function onDayClick(key: string) {
    if (!selectedDraftId) return;
    void patch(selectedDraftId, { scheduledDate: key });
    setSelectedDraftId(null);
  }

  function changeMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  const isEmpty = items.length === 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      {/* À programmer */}
      <aside className="space-y-4">
        <div className="card">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="text-base font-semibold">À programmer</h2>
            <span className="chip border-gray-200 text-gray-500">
              {drafts.length}
            </span>
          </div>
          <p className="mb-3 text-xs text-gray-500">
            Sélectionne un contenu, puis clique un jour du calendrier pour le
            placer.
          </p>

          {drafts.length === 0 ? (
            <p className="rounded-lg bg-gray-50 px-3 py-4 text-center text-sm text-gray-400">
              Rien en attente. Génère du contenu dans le{" "}
              <Link href="/studio" className="font-medium text-primary">
                Studio
              </Link>
              .
            </p>
          ) : (
            <ul className="space-y-2">
              {drafts.map((d) => {
                const selected = selectedDraftId === d.id;
                return (
                  <li
                    key={d.id}
                    className={`rounded-xl border p-3 transition ${
                      selected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <button
                      onClick={() =>
                        setSelectedDraftId(selected ? null : d.id)
                      }
                      className="block w-full text-left"
                    >
                      <div className="text-xs font-medium text-gray-400">
                        {platformLabel(d.platform)} · {contentTypeLabel(d.type)}
                      </div>
                      <div className="line-clamp-2 text-sm font-medium text-gray-800">
                        {d.title}
                      </div>
                    </button>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-primary">
                        {selected ? "Choisis un jour →" : "Cliquer pour placer"}
                      </span>
                      <button
                        onClick={() => remove(d.id)}
                        className="text-xs text-gray-400 hover:text-red-500"
                      >
                        Supprimer
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card space-y-3">
          <Link href="/studio" className="btn-primary w-full">
            Ouvrir le Studio IA
          </Link>
          <div className="flex gap-2">
            <a
              href="/api/calendar/export?format=csv"
              className="btn-secondary flex-1"
            >
              Export CSV
            </a>
            <a
              href="/api/calendar/export?format=ics"
              className="btn-secondary flex-1"
            >
              Export .ics
            </a>
          </div>
          <p className="text-xs text-gray-400">
            Branche l&apos;export à Buffer, Make ou Zapier pour publier
            automatiquement.
          </p>
        </div>
      </aside>

      {/* Calendrier */}
      <section className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold capitalize">
            {MONTHS[view.month]} {view.year}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => changeMonth(-1)} className="btn-ghost !px-3">
              ←
            </button>
            <button
              onClick={() =>
                setView({
                  year: today.getFullYear(),
                  month: today.getMonth(),
                })
              }
              className="btn-ghost !px-3 text-sm"
            >
              Aujourd&apos;hui
            </button>
            <button onClick={() => changeMonth(1)} className="btn-ghost !px-3">
              →
            </button>
          </div>
        </div>

        {isEmpty && (
          <p className="mb-4 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm text-primary">
            Ton calendrier est vide. Génère 5 contenus dans le Studio puis
            place-les ici en quelques clics.
          </p>
        )}

        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl bg-gray-100 text-sm">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-500"
            >
              {w}
            </div>
          ))}
          {cells.map((cell) => {
            const dayItems = scheduledByDate.get(cell.key) ?? [];
            const isToday = cell.key === ymd(today);
            const clickable = Boolean(selectedDraftId);
            return (
              <div
                key={cell.key}
                onClick={() => onDayClick(cell.key)}
                className={`min-h-[96px] bg-surface p-1.5 transition ${
                  cell.inMonth ? "" : "bg-gray-50/60 text-gray-300"
                } ${
                  clickable
                    ? "cursor-pointer hover:bg-primary/5 hover:ring-1 hover:ring-inset hover:ring-primary/40"
                    : ""
                }`}
              >
                <div
                  className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    isToday
                      ? "bg-brand-gradient font-bold text-white"
                      : "text-gray-500"
                  }`}
                >
                  {cell.date.getDate()}
                </div>
                <div className="space-y-1">
                  {dayItems.map((it) => (
                    <button
                      key={it.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        void patch(it.id, { scheduledDate: null });
                      }}
                      title="Cliquer pour retirer du calendrier"
                      className="block w-full truncate rounded-md border border-primary/20 bg-primary/5 px-1.5 py-1 text-left text-[11px] font-medium text-primary hover:bg-primary/10"
                    >
                      {platformLabel(it.platform)[0]} · {it.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {busy && (
          <p className="mt-3 text-right text-xs text-gray-400">
            Mise à jour…
          </p>
        )}
      </section>
    </div>
  );
}
