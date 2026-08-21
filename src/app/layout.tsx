import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { cookies } from "next/headers";
import CrispChat from "@/components/CrispChat";
import JsonLd from "@/components/JsonLd";
import { LocaleProvider } from "@/components/LocaleProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { localeFromCookie } from "@/lib/i18n";
import { organizationSchema, websiteSchema } from "@/lib/schema";
import { SITE } from "@/lib/seo.config";
import "./globals.css";

// Runs before first paint to set data-theme from the saved preference, so there
// is no flash of the wrong theme (FOUT). Kept dependency-free and inlined.
const THEME_INIT = `(function(){try{var t=localStorage.getItem('loglead-theme')||'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');}catch(e){}})();`;

// Sets <html lang> from the saved language (default English) before paint.
const LANG_INIT = `(function(){try{var l=localStorage.getItem('loglead-lang')||'en';document.documentElement.setAttribute('lang',l);}catch(e){}})();`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Inter is used for both body and display (headings) — single typeface.
const interDisplay = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.defaultTitle,
    template: SITE.titleTemplate,
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    locale: SITE.locale,
    url: SITE.url,
    siteName: SITE.name,
    title: SITE.defaultTitle,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.defaultTitle,
    description: SITE.description,
    creator: SITE.twitter,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = localeFromCookie((await cookies()).get("loglead-lang")?.value);
  return (
    <html
      lang={locale}
      data-theme="light"
      suppressHydrationWarning
      className={`${inter.variable} ${interDisplay.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_INIT }} />
      </head>
      <body className="font-sans">
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider>{children}</ThemeProvider>
        </LocaleProvider>
        <JsonLd data={organizationSchema()} />
        <JsonLd data={websiteSchema()} />
        <CrispChat />
      </body>
    </html>
  );
}
