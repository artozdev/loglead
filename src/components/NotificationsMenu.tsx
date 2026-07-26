"use client";

import { useEffect, useRef, useState } from "react";

export type AppNotification = {
  id: string;
  title: string;
  detail?: string;
  time: string;
};

export default function NotificationsMenu({
  notifications,
}: {
  notifications: AppNotification[];
}) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const badge = seen ? 0 : notifications.length;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          setOpen((o) => !o);
          setSeen(true);
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-[10px] text-muted hover:bg-canvas"
        aria-label="Notifications"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 rounded-xl border border-line bg-surface p-2 shadow-soft">
          <p className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">
            Notifications
          </p>
          {notifications.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-muted">
              Rien de nouveau.
            </p>
          ) : (
            <ul className="max-h-80 space-y-0.5 overflow-y-auto">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className="rounded-lg px-2 py-2 hover:bg-canvas"
                >
                  <div className="text-sm font-medium text-ink">
                    {n.title}
                  </div>
                  {n.detail && (
                    <div className="truncate text-xs text-muted">
                      {n.detail}
                    </div>
                  )}
                  <div className="mt-0.5 text-[11px] text-muted">{n.time}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
