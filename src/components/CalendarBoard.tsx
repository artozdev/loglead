"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CONTENT_STATUS_META,
  contentTypeLabel,
  platformLabel,
  type ContentItem,
  type ContentType,
  type Plan,
  type Platform,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Linear-style editorial calendar. Week view is an hourly time grid (7h→22h);
// planned publications are positioned at their publish time and colored per
// platform. Also offers a day view and a compressed month view.
// ---------------------------------------------------------------------------

const MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const MONTHS_SHORT = [
  "jan", "fév", "mar", "avr", "mai", "juin",
  "juil", "août", "sep", "oct", "nov", "déc",
];
const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const HOUR_START = 7;
const HOUR_END = 22;
const HOUR_H = 56; // px per hour row
const GRID_H = (HOUR_END - HOUR_START) * HOUR_H;
const EVENT_MIN = 52; // visual duration of an event, in minutes-equivalent height

// Recommended publish hours on an "optimal" day (Algo Insider heuristic).
const RECO_HOURS = [8, 12, 18];

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); // Monday
  return x;
}

function timeToMin(t: string | null | undefined): number {
  if (!t) return 9 * 60;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

// Deterministic per-item content score /100 (stand-in until real scoring).
function scoreFor(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 62 + (h % 37); // 62..98
}

// Platform → contentType for quick-create.
const TYPE_FOR: Record<Platform, ContentType> = {
  linkedin: "linkedin_post",
  instagram: "instagram_caption",
  tiktok: "reel_script",
};

// Colors come from theme variables so events re-tint in dark mode.
const PLATFORM_STYLE: Record<Platform, { bg: string; border: string; text: string }> = {
  linkedin: { bg: "var(--color-linkedin-bg)", border: "var(--color-linkedin)", text: "var(--color-linkedin)" },
  instagram: { bg: "var(--color-instagram-bg)", border: "var(--color-instagram)", text: "var(--color-instagram)" },
  tiktok: { bg: "var(--color-x-bg)", border: "var(--color-x)", text: "var(--color-x)" },
};

type DayCell = { date: Date; key: string; inMonth: boolean };
type Mode = "day" | "week" | "month";

function monthMatrix(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
    cells.push({ date: d, key: ymd(d), inMonth: d.getMonth() === month });
  }
  return cells.slice(0, cells.slice(35).every((c) => !c.inMonth) ? 35 : 42);
}

// Assign side-by-side lanes to a day's events so overlaps sit next to each other.
function layoutDay(events: ContentItem[]) {
  const withRange = events
    .map((ev) => {
      const start = timeToMin(ev.scheduledTime);
      return { ev, start, end: start + EVENT_MIN };
    })
    .sort((a, b) => a.start - b.start);
  const laneEnds: number[] = [];
  const placed = withRange.map((it) => {
    let lane = laneEnds.findIndex((end) => end <= it.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(it.end);
    } else {
      laneEnds[lane] = it.end;
    }
    return { ...it, lane };
  });
  return { placed, lanes: Math.max(1, laneEnds.length) };
}

export default function CalendarBoard({
  initialItems,
  plan,
  recommendedDays,
}: {
  initialItems: ContentItem[];
  plan: Plan;
  recommendedDays: number[];
}) {
  const today = new Date();
  const [items, setItems] = useState<ContentItem[]>(initialItems);
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState<Date>(today);
  const [query, setQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all" | "draft">("all");
  const [now, setNow] = useState(() => new Date());
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ kind: "ok" | "warn"; msg: string } | null>(null);

  // Popover for a clicked event, and the planning drawer.
  const [popover, setPopover] = useState<{ id: string; x: number; y: number } | null>(null);
  const [drawer, setDrawer] = useState<{ date: string; time: string } | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);
  const [viewMenu, setViewMenu] = useState(false);

  // Mobile → default to day view.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 768) setMode("day");
  }, []);

  // Live "now" line — refresh each minute.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ⌘K / Ctrl+K focuses search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "Escape") {
        setPopover(null);
        setDrawer(null);
        setViewMenu(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const scheduled = useMemo(
    () => items.filter((i) => i.scheduledDate && i.status !== "draft"),
    [items],
  );
  const drafts = useMemo(() => items.filter((i) => i.status === "draft"), [items]);

  const q = query.trim().toLowerCase();
  const matches = (i: ContentItem) => {
    if (q && !i.title.toLowerCase().includes(q)) return false;
    if (platformFilter === "all" || platformFilter === "draft") return true;
    return i.platform === platformFilter;
  };

  const byDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const i of scheduled) {
      if (!matches(i)) continue;
      const arr = map.get(i.scheduledDate!) ?? [];
      arr.push(i);
      map.set(i.scheduledDate!, arr);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduled, q, platformFilter]);

  const selectedItem = popover ? items.find((i) => i.id === popover.id) ?? null : null;

  const cells: DayCell[] = useMemo(() => {
    if (mode === "month") return monthMatrix(anchor.getFullYear(), anchor.getMonth());
    if (mode === "day") return [{ date: anchor, key: ymd(anchor), inMonth: true }];
    const s = startOfWeek(anchor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s.getFullYear(), s.getMonth(), s.getDate() + i);
      return { date: d, key: ymd(d), inMonth: true };
    });
  }, [mode, anchor]);

  // ----- Mutations ----------------------------------------------------------
  function applyUpdated(u: ContentItem) {
    setItems((prev) => prev.map((i) => (i.id === u.id ? u : i)));
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

  async function publish(id: string) {
    setBusy(true);
    setToast(null);
    try {
      const res = await fetch(`/api/content/${id}/publish`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        applyUpdated(data.item);
        setToast({ kind: "ok", msg: data.message ?? "Contenu publié." });
      } else {
        setToast({ kind: "warn", msg: data.error ?? "Publication impossible." });
      }
    } finally {
      setBusy(false);
      setPopover(null);
    }
  }

  async function remove(id: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/content/${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setBusy(false);
      setPopover(null);
    }
  }

  async function createItem(input: {
    platform: Platform;
    title: string;
    body: string;
    date: string;
    time: string;
    status: "draft" | "scheduled";
  }) {
    setBusy(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: TYPE_FOR[input.platform],
          platform: input.platform,
          title: input.title,
          body: input.body,
          source: "brief",
          scheduledDate: input.status === "scheduled" ? input.date : null,
          scheduledTime: input.status === "scheduled" ? input.time : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [data.item, ...prev]);
        setToast({ kind: "ok", msg: "Contenu ajouté au calendrier." });
      }
    } finally {
      setBusy(false);
      setDrawer(null);
    }
  }

  // ----- Navigation ---------------------------------------------------------
  function shift(delta: number) {
    setAnchor((a) => {
      const d = new Date(a);
      if (mode === "month") d.setMonth(d.getMonth() + delta);
      else if (mode === "day") d.setDate(d.getDate() + delta);
      else d.setDate(d.getDate() + delta * 7);
      return d;
    });
  }

  const weekStart = startOfWeek(anchor);
  const weekEnd = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6);
  const rangeLabel =
    mode === "month"
      ? `1 ${MONTHS_SHORT[anchor.getMonth()]} – ${new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0).getDate()} ${MONTHS_SHORT[anchor.getMonth()]} ${anchor.getFullYear()}`
      : mode === "day"
        ? `${anchor.getDate()} ${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`
        : `${weekStart.getDate()} ${MONTHS_SHORT[weekStart.getMonth()]} – ${weekEnd.getDate()} ${MONTHS_SHORT[weekEnd.getMonth()]} ${weekEnd.getFullYear()}`;

  const titleMonth = `${MONTHS[anchor.getMonth()]} ${anchor.getFullYear()}`;

  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowVisible = nowMin >= HOUR_START * 60 && nowMin <= HOUR_END * 60;
  const nowTop = ((nowMin - HOUR_START * 60) / 60) * HOUR_H;

  // V1 is LinkedIn / X / Reddit — all stored under the "linkedin" text platform,
  // so a single "Publications" filter covers them; Instagram/TikTok are out in V1.
  const filters: { value: Platform | "all" | "draft"; label: string }[] = [
    { value: "all", label: "Tout afficher" },
    { value: "linkedin", label: "Publications" },
    { value: "draft", label: "Brouillons" },
  ];

  const VIEW_LABELS: Record<Mode, string> = { day: "Vue jour", week: "Vue semaine", month: "Vue mois" };

  return (
    <section className="card overflow-hidden !p-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="font-display text-[22px] font-medium capitalize leading-tight text-ink">
            {titleMonth}
          </h2>
          <p className="num text-xs text-muted">{rangeLabel}</p>
        </div>

        {/* Search */}
        <div className="relative order-last w-full md:order-none md:w-72">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un contenu…"
            className="input !py-2 !pl-9 !pr-12 text-sm"
          />
          <kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-line bg-canvas px-1.5 py-0.5 text-[10px] font-medium text-muted">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <button onClick={() => shift(-1)} aria-label="Précédent" className="btn-ghost !px-2.5 !py-2">←</button>
            <button onClick={() => setAnchor(new Date())} className="btn-secondary !px-3 !py-2 text-sm">Aujourd&apos;hui</button>
            <button onClick={() => shift(1)} aria-label="Suivant" className="btn-ghost !px-2.5 !py-2">→</button>
          </div>

          {/* View dropdown */}
          <div className="relative">
            <button
              onClick={() => setViewMenu((v) => !v)}
              className="btn-secondary !px-3 !py-2 text-sm"
            >
              {VIEW_LABELS[mode]} <span className="text-xs">▾</span>
            </button>
            {viewMenu && (
              <>
                <button className="fixed inset-0 z-10 cursor-default" aria-hidden onClick={() => setViewMenu(false)} />
                <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-pop">
                  {(["day", "week", "month"] as Mode[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => { setMode(m); setViewMenu(false); }}
                      className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-canvas ${mode === m ? "font-semibold text-primary" : "text-ink"}`}
                    >
                      {VIEW_LABELS[m]}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => setDrawer({ date: ymd(today), time: "09:00" })}
            className="btn-primary !px-3.5 !py-2 text-sm"
          >
            <span className="text-base leading-none">+</span> Planifier
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setPlatformFilter(f.value)}
              className={`rounded-lg px-2.5 py-1.5 text-sm font-medium transition ${
                platformFilter === f.value ? "bg-primary/10 text-primary" : "text-muted hover:bg-canvas"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 text-xs">
          <a href="/api/calendar/export?format=csv" className="text-muted hover:text-ink">Export CSV</a>
          <a href="/api/calendar/export?format=ics" className="text-muted hover:text-ink">Export .ics</a>
        </div>
      </div>

      {toast && (
        <p className={`mx-4 mt-3 rounded-lg px-3 py-2 text-sm ${toast.kind === "ok" ? "border border-success/20 bg-success/5 text-success" : "border border-warning/30 bg-warning/5 text-warning"}`}>
          {toast.msg}
        </p>
      )}

      {/* Body */}
      {platformFilter === "draft" ? (
        <DraftPanel drafts={drafts.filter(matches)} onSchedule={(d) => setDrawer(d)} />
      ) : mode === "month" ? (
        <MonthGrid
          cells={cells}
          byDate={byDate}
          today={today}
          onEventClick={(id, e) => setPopover({ id, x: e.clientX, y: e.clientY })}
          onEmptyClick={(key) => setDrawer({ date: key, time: "09:00" })}
        />
      ) : (
        <TimeGrid
          cells={cells}
          byDate={byDate}
          today={today}
          recommendedDays={recommendedDays}
          nowVisible={nowVisible}
          nowTop={nowTop}
          onEventClick={(id, e) => setPopover({ id, x: e.clientX, y: e.clientY })}
          onEmptyClick={(key, hour) => setDrawer({ date: key, time: `${String(hour).padStart(2, "0")}:00` })}
        />
      )}

      {busy && <p className="px-4 py-2 text-right text-xs text-muted">Mise à jour…</p>}

      {/* Event popover */}
      {selectedItem && popover && (
        <EventPopover
          item={selectedItem}
          x={popover.x}
          y={popover.y}
          plan={plan}
          busy={busy}
          onClose={() => setPopover(null)}
          onPublish={() => publish(selectedItem.id)}
          onReschedule={() => { setDrawer({ date: selectedItem.scheduledDate!, time: selectedItem.scheduledTime ?? "09:00" }); setPopover(null); }}
          onUnschedule={() => patch(selectedItem.id, { scheduledDate: null })}
          onDelete={() => remove(selectedItem.id)}
        />
      )}

      {/* Planning drawer */}
      {drawer && (
        <PlanDrawer
          initial={drawer}
          drafts={drafts}
          busy={busy}
          onClose={() => setDrawer(null)}
          onScheduleDraft={(id, date, time) => { void patch(id, { scheduledDate: date, scheduledTime: time }); setDrawer(null); }}
          onCreate={createItem}
        />
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Time grid (day / week)
// ---------------------------------------------------------------------------
function TimeGrid({
  cells,
  byDate,
  today,
  recommendedDays,
  nowVisible,
  nowTop,
  onEventClick,
  onEmptyClick,
}: {
  cells: DayCell[];
  byDate: Map<string, ContentItem[]>;
  today: Date;
  recommendedDays: number[];
  nowVisible: boolean;
  nowTop: number;
  onEventClick: (id: string, e: React.MouseEvent) => void;
  onEmptyClick: (key: string, hour: number) => void;
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const todayKey = ymd(today);

  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[720px]">
        {/* Hour gutter */}
        <div className="w-14 shrink-0 pt-[34px]">
          {hours.map((h) => (
            <div key={h} className="relative" style={{ height: HOUR_H }}>
              <span className="absolute -top-2 right-2 text-[11px] text-muted">{h}h</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        <div className="grid flex-1" style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}>
          {cells.map((cell) => {
            const isToday = cell.key === todayKey;
            const reco = recommendedDays.includes(cell.date.getDay());
            const dayItems = byDate.get(cell.key) ?? [];
            const { placed, lanes } = layoutDay(dayItems);
            return (
              <div key={cell.key} className={`border-l border-line ${isToday ? "bg-primary/[0.04]" : ""}`}>
                {/* Column header */}
                <div className="flex h-[34px] items-center justify-center gap-1.5 border-b border-line text-xs">
                  <span className={`font-medium ${isToday ? "text-primary" : "text-muted"}`}>
                    {WEEKDAYS[(cell.date.getDay() + 6) % 7]}
                  </span>
                  <span
                    className={`num flex h-5 min-w-5 items-center justify-center rounded-full px-1 font-semibold ${
                      isToday ? "bg-primary text-white" : "text-ink"
                    }`}
                  >
                    {cell.date.getDate()}
                  </span>
                </div>

                {/* Time canvas */}
                <div className="relative" style={{ height: GRID_H }}>
                  {/* Hour cells (click → create) */}
                  {hours.map((h) => {
                    const optimal = reco && RECO_HOURS.includes(h);
                    return (
                      <button
                        key={h}
                        onClick={() => onEmptyClick(cell.key, h)}
                        title={optimal ? "⚡ Créneau optimal" : undefined}
                        className={`group/slot absolute inset-x-0 block border-b border-line text-left transition hover:bg-primary/[0.04] ${
                          optimal ? "bg-primary/[0.06]" : ""
                        }`}
                        style={{ top: (h - HOUR_START) * HOUR_H, height: HOUR_H }}
                      >
                        {/* half-hour dashed line */}
                        <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-line/70" />
                        {optimal && (
                          <span className="pointer-events-none absolute left-1 top-1 rounded bg-primary/10 px-1 py-0.5 text-[9px] font-semibold text-primary opacity-0 transition group-hover/slot:opacity-100">
                            ⚡ Optimal
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* Now line */}
                  {isToday && nowVisible && (
                    <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowTop }}>
                      <div className="relative">
                        <span className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-primary" />
                        <span className="block border-t-[1.5px] border-primary" />
                      </div>
                    </div>
                  )}

                  {/* Events */}
                  {placed.map(({ ev, start, lane }) => {
                    const st = PLATFORM_STYLE[ev.platform];
                    const top = ((start - HOUR_START * 60) / 60) * HOUR_H;
                    const width = 100 / lanes;
                    return (
                      <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onEventClick(ev.id, e); }}
                        title={ev.title}
                        className="absolute z-10 overflow-hidden rounded-md px-1.5 py-1 text-left shadow-sm transition hover:shadow-pop"
                        style={{
                          top: Math.max(0, top),
                          height: (EVENT_MIN / 60) * HOUR_H - 3,
                          left: `calc(${lane * width}% + 2px)`,
                          width: `calc(${width}% - 4px)`,
                          backgroundColor: st.bg,
                          borderLeft: `3px solid ${st.border}`,
                          color: st.text,
                        }}
                      >
                        <div className="flex items-center gap-1 text-[11px] font-semibold leading-none">
                          <PlatformDot platform={ev.platform} />
                          <span className="num">{ev.scheduledTime ?? "09:00"}</span>
                        </div>
                        <div className="mt-0.5 truncate text-[11px] font-medium leading-tight">{ev.title}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Month grid
// ---------------------------------------------------------------------------
function MonthGrid({
  cells,
  byDate,
  today,
  onEventClick,
  onEmptyClick,
}: {
  cells: DayCell[];
  byDate: Map<string, ContentItem[]>;
  today: Date;
  onEventClick: (id: string, e: React.MouseEvent) => void;
  onEmptyClick: (key: string) => void;
}) {
  const todayKey = ymd(today);
  return (
    <div className="p-4">
      <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-line">
        {WEEKDAYS.map((w) => (
          <div key={w} className="border-b border-l border-line bg-canvas py-2 text-center text-xs font-semibold text-muted first:border-l-0">
            {w}
          </div>
        ))}
        {cells.map((cell) => {
          const dayItems = byDate.get(cell.key) ?? [];
          const isToday = cell.key === todayKey;
          const load = dayItems.length;
          const loadBg = load === 0 ? "" : load <= 2 ? "bg-primary/[0.03]" : "bg-primary/[0.07]";
          return (
            <div
              key={cell.key}
              onClick={() => onEmptyClick(cell.key)}
              className={`min-h-[104px] cursor-pointer border-b border-l border-line p-1.5 transition hover:bg-primary/[0.04] first:border-l-0 ${
                cell.inMonth ? loadBg : "bg-canvas/60"
              }`}
            >
              <div
                className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs num ${
                  isToday ? "bg-primary font-bold text-white" : cell.inMonth ? "text-ink" : "text-gray-300"
                }`}
              >
                {cell.date.getDate()}
              </div>
              <div className="space-y-1">
                {dayItems.slice(0, 3).map((it) => {
                  const st = PLATFORM_STYLE[it.platform];
                  return (
                    <button
                      key={it.id}
                      onClick={(e) => { e.stopPropagation(); onEventClick(it.id, e); }}
                      title={it.title}
                      className="flex w-full items-center gap-1 truncate rounded px-1 py-0.5 text-left text-[11px] font-medium"
                      style={{ backgroundColor: st.bg, borderLeft: `2px solid ${st.border}`, color: st.text }}
                    >
                      <span className="num shrink-0">{it.scheduledTime ?? "09:00"}</span>
                      <span className="truncate">{it.title}</span>
                    </button>
                  );
                })}
                {load > 3 && (
                  <div className="px-1 text-[10px] font-medium text-muted">+{load - 3} autres</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draft panel (Brouillons filter)
// ---------------------------------------------------------------------------
function DraftPanel({
  drafts,
  onSchedule,
}: {
  drafts: ContentItem[];
  onSchedule: (d: { date: string; time: string }) => void;
}) {
  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
        <span className="text-3xl">📝</span>
        <p className="mt-3 text-sm font-medium text-ink">Aucun brouillon en attente</p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          Génère du contenu dans le{" "}
          <Link href="/studio" className="font-medium text-primary">Studio IA</Link>, il apparaîtra ici prêt à planifier.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
      {drafts.map((d) => {
        const st = PLATFORM_STYLE[d.platform];
        return (
          <div key={d.id} className="rounded-xl border border-line p-3" style={{ borderLeft: `3px solid ${st.border}` }}>
            <div className="text-xs font-medium text-muted">
              {platformLabel(d.platform)} · {contentTypeLabel(d.type)}
            </div>
            <div className="mt-1 line-clamp-2 text-sm font-medium text-ink">{d.title}</div>
            <button
              onClick={() => onSchedule({ date: new Date().toISOString().slice(0, 10), time: "09:00" })}
              className="btn-secondary mt-3 w-full !py-1.5 text-xs"
            >
              Planifier ce contenu
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Event popover
// ---------------------------------------------------------------------------
function EventPopover({
  item,
  x,
  y,
  plan,
  busy,
  onClose,
  onPublish,
  onReschedule,
  onUnschedule,
  onDelete,
}: {
  item: ContentItem;
  x: number;
  y: number;
  plan: Plan;
  busy: boolean;
  onClose: () => void;
  onPublish: () => void;
  onReschedule: () => void;
  onUnschedule: () => void;
  onDelete: () => void;
}) {
  const W = 320;
  const left = Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 1200) - W - 12);
  const top = Math.min(y, (typeof window !== "undefined" ? window.innerHeight : 800) - 300);
  const meta = CONTENT_STATUS_META[item.status];
  const score = scoreFor(item.id);

  return (
    <>
      <button className="fixed inset-0 z-40 cursor-default" aria-label="Fermer" onClick={onClose} />
      <div
        className="fixed z-50 w-80 rounded-2xl border border-line bg-surface p-4 shadow-pop"
        style={{ left: Math.max(12, left), top: Math.max(12, top) }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <PlatformDot platform={item.platform} />
            <span className="text-xs font-medium text-muted">
              {platformLabel(item.platform)} · {item.scheduledDate} · {item.scheduledTime ?? "09:00"}
            </span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Fermer">✕</button>
        </div>

        <h3 className="mt-2 text-sm font-semibold text-ink">{item.title}</h3>
        <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-muted">{item.body}</p>

        <div className="mt-3 flex items-center justify-between rounded-lg bg-canvas px-3 py-2">
          <span className={`chip ${meta.cls}`}>{meta.label}</span>
          <div className="text-right">
            <div className="num text-lg font-semibold leading-none text-ink">{score}<span className="text-xs text-muted">/100</span></div>
            <div className="text-[10px] text-muted">Score du contenu</div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href="/studio" className="btn-secondary !py-2 text-xs">Modifier</Link>
          <button onClick={onReschedule} disabled={busy} className="btn-secondary !py-2 text-xs">Reprogrammer</button>
          {item.status === "scheduled" && (
            <button onClick={onPublish} disabled={busy} className="btn-primary col-span-2 !py-2 text-xs">
              Publier maintenant
            </button>
          )}
          <button onClick={onUnschedule} disabled={busy} className="btn-secondary !py-2 text-xs">Retirer</button>
          <button onClick={onDelete} disabled={busy} className="!py-2 text-xs font-medium text-muted hover:text-danger">Supprimer</button>
        </div>
        {plan === "starter" && item.status === "scheduled" && (
          <p className="mt-2 text-[11px] text-muted">La publication automatique est incluse dans Growth et Pro.</p>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Planning drawer
// ---------------------------------------------------------------------------
function PlanDrawer({
  initial,
  drafts,
  busy,
  onClose,
  onScheduleDraft,
  onCreate,
}: {
  initial: { date: string; time: string };
  drafts: ContentItem[];
  busy: boolean;
  onClose: () => void;
  onScheduleDraft: (id: string, date: string, time: string) => void;
  onCreate: (input: {
    platform: Platform;
    title: string;
    body: string;
    date: string;
    time: string;
    status: "draft" | "scheduled";
  }) => void;
}) {
  const [platform, setPlatform] = useState<Platform>("linkedin");
  const [text, setText] = useState("");
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [status, setStatus] = useState<"draft" | "scheduled">("scheduled");

  // V1 stores LinkedIn/X/Reddit content under the "linkedin" text platform.
  const platforms: Platform[] = ["linkedin"];
  const canSave = text.trim().length > 0;

  function save() {
    const trimmed = text.trim();
    const title = trimmed.split("\n")[0].slice(0, 80) || "Nouveau contenu";
    onCreate({ platform, title, body: trimmed, date, time, status });
  }

  return (
    <div className="fixed inset-0 z-50">
      <button className="absolute inset-0 modal-overlay backdrop-blur-sm" aria-label="Fermer" onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-pop">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-lg font-semibold">Planifier un contenu</h2>
          <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Fermer">✕</button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {/* Platform chips */}
          <div>
            <span className="label">Plateforme</span>
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => {
                const st = PLATFORM_STYLE[p];
                const on = platform === p;
                return (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`chip cursor-pointer ${on ? "border-transparent text-white" : "border-line text-ink"}`}
                    style={on ? { backgroundColor: st.border } : undefined}
                  >
                    <PlatformDot platform={p} mono={on} />
                    {platformLabel(p)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text */}
          <div>
            <span className="label">Contenu</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="Écris ton post, ou génère-le avec le Studio IA…"
              className="input resize-none"
            />
            <Link href="/studio" className="btn-secondary mt-2 w-full !py-2 text-sm">
              ✨ Générer avec le Studio IA
            </Link>
          </div>

          {/* Date + time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="plan-date">Date</label>
              <input id="plan-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input !py-2" />
            </div>
            <div>
              <label className="label" htmlFor="plan-time">Heure</label>
              <input id="plan-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input !py-2" />
            </div>
          </div>

          {/* Status */}
          <div>
            <span className="label">Statut</span>
            <div className="inline-flex rounded-xl border border-line p-1">
              {([["draft", "Brouillon"], ["scheduled", "Prêt à publier"]] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setStatus(v)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${status === v ? "bg-primary/10 text-primary" : "text-muted"}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Existing drafts to place */}
          {drafts.length > 0 && (
            <div className="border-t border-line pt-4">
              <span className="label">Ou planifie un brouillon existant</span>
              <ul className="space-y-2">
                {drafts.slice(0, 6).map((d) => (
                  <li key={d.id} className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2">
                    <PlatformDot platform={d.platform} />
                    <span className="min-w-0 flex-1 truncate text-sm text-ink">{d.title}</span>
                    <button
                      onClick={() => onScheduleDraft(d.id, date, time)}
                      className="btn-secondary !px-2 !py-1 text-xs"
                    >
                      Placer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="border-t border-line px-5 py-4">
          <button onClick={save} disabled={!canSave || busy} className="btn-primary w-full">
            Enregistrer au calendrier
          </button>
        </div>
      </div>
    </div>
  );
}

// A small platform initial badge.
function PlatformDot({ platform, mono }: { platform: Platform; mono?: boolean }) {
  const st = PLATFORM_STYLE[platform];
  const initial = platformLabel(platform).charAt(0);
  return (
    <span
      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold"
      style={{
        backgroundColor: mono ? "rgba(255,255,255,0.25)" : st.border,
        // --bg-app contrasts against every platform border in both themes
        color: mono ? "#fff" : "var(--bg-app)",
      }}
    >
      {initial}
    </span>
  );
}
