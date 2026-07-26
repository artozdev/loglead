import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeSite, isDemoMode } from "@/lib/ai";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({ url: z.string().min(1) });

function normalizeUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    if (!/^https?:$/.test(u.protocol)) return null;
    if (!u.hostname.includes(".")) return null;
    return u;
  } catch {
    return null;
  }
}

// Basic SSRF guard — block localhost / private ranges.
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h.endsWith(".local") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchPageText(url: URL): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url.toString(), {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LogLeadBot/1.0)" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const text = htmlToText(html);
    return text.length >= 80 ? text : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "URL requise" }, { status: 400 });
  }

  const url = normalizeUrl(parsed.data.url);
  // ok:false (200) → the client switches to the manual fallback form.
  if (!url || isPrivateHost(url.hostname)) {
    return NextResponse.json({ ok: false, error: "URL non analysable." });
  }

  let pageText = "";
  if (!isDemoMode()) {
    const text = await fetchPageText(url);
    if (!text) {
      return NextResponse.json({
        ok: false,
        error: "Impossible de lire cette page.",
      });
    }
    pageText = text;
  }

  try {
    const fields = await analyzeSite(pageText, url.toString());
    return NextResponse.json({
      ok: true,
      fields,
      url: url.toString(),
      demo: isDemoMode(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analyse impossible.";
    return NextResponse.json({ ok: false, error: message });
  }
}
