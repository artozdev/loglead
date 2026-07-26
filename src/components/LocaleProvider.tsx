"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { type Locale, type Vars, translate } from "@/lib/i18n";

const STORAGE_KEY = "loglead-lang";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Vars) => string;
};

const LocaleContext = createContext<Ctx | null>(null);

// Initial locale passed from the server (read from the cookie) so client + server
// render agree and there is no flash of the wrong language.
export function LocaleProvider({
  initialLocale = "en",
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if ((saved === "en" || saved === "fr") && saved !== locale) setLocaleState(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(
    (l: Locale) => {
      setLocaleState(l);
      localStorage.setItem(STORAGE_KEY, l);
      // Cookie so server components (dashboard data, etc.) localize too.
      document.cookie = `${STORAGE_KEY}=${l}; path=/; max-age=31536000; samesite=lax`;
      document.documentElement.setAttribute("lang", l);
      // Re-render server components with the new locale.
      router.refresh();
    },
    [router],
  );

  const t = useCallback((key: string, vars?: Vars) => translate(key, locale, vars), [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Ctx {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
