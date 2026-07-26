"use client";

import { useTheme } from "./ThemeProvider";

// Compact pill toggle in the header. Flips light ⇆ dark only; the tri-state
// "system" mode lives in Paramètres > Apparence.
export default function DarkModeToggle() {
  const { resolved, toggle } = useTheme();
  const dark = resolved === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      onClick={toggle}
      title={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      aria-label={dark ? "Passer en mode clair" : "Passer en mode sombre"}
      className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line bg-surface"
    >
      <span
        className="absolute flex h-[18px] w-[18px] items-center justify-center rounded-full text-[10px] shadow-sm"
        style={{
          left: dark ? "calc(100% - 20px)" : "2px",
          backgroundColor: dark ? "#1E2235" : "#FFFFFF",
          transition: "left 200ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        {dark ? "🌙" : "☀️"}
      </span>
    </button>
  );
}
