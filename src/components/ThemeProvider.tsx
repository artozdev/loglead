"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type Theme = "light" | "dark" | "system";
export type Resolved = "light" | "dark";

const STORAGE_KEY = "loglead-theme";

type Ctx = {
  theme: Theme; // the user's choice (may be "system")
  resolved: Resolved; // the actually-applied theme
  setTheme: (t: Theme) => void;
  toggle: () => void; // light ⇆ dark (used by the header switch)
};

const ThemeContext = createContext<Ctx | null>(null);

function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(theme: Theme): Resolved {
  if (theme === "system") return systemPrefersDark() ? "dark" : "light";
  return theme;
}

function apply(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", resolve(theme));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start from what the inline anti-flash script already applied, so the first
  // client render matches the DOM and there is no flash.
  const [theme, setThemeState] = useState<Theme>("light");
  const [resolved, setResolved] = useState<Resolved>("light");

  useEffect(() => {
    const saved = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "light";
    setThemeState(saved);
    setResolved(resolve(saved));
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    setResolved(resolve(t));
    localStorage.setItem(STORAGE_KEY, t);
    apply(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(resolved === "dark" ? "light" : "dark");
  }, [resolved, setTheme]);

  // Follow OS preference changes in real time while in "system" mode.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(STORAGE_KEY) as Theme) === "system") {
        setResolved(systemPrefersDark() ? "dark" : "light");
        apply("system");
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolved, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
