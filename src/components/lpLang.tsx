"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Landing i18n — a tiny FR/EN switch. Components call useTr() and pass both
// variants inline: t("English", "Français"). Auto-detects from the browser
// locale (region) on first load, then remembers the user's choice.

type Lang = "en" | "fr";

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("loglead_lang");
    if (saved === "fr" || saved === "en") {
      setLangState(saved);
      return;
    }
    // Auto-detect from the visitor's region / browser language.
    const nav = (navigator.languages?.[0] || navigator.language || "en").toLowerCase();
    setLangState(nav.startsWith("fr") ? "fr" : "en");
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("loglead_lang", l);
    } catch {
      /* ignore */
    }
  };

  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}

// Returns t(en, fr) — picks the string for the current language.
export function useTr() {
  const { lang } = useContext(LangCtx);
  return function t<T = React.ReactNode>(en: T, fr: T): T {
    return lang === "fr" ? fr : en;
  };
}
