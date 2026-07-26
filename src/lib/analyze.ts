import "server-only";
import { analyzeContent } from "./ai";
import { contentAnalyses } from "./db";
import type { AnalysisKind, ContentAnalysis, Profile } from "./types";

// Content Analyzer orchestrator: detect the source from the URL, run the
// Claude analysis on the pasted text/transcript, and persist to the history.
//
// MVP note: auto-fetch + video transcription are mocked — the founder pastes
// the content text/transcript (the analysis itself is real once a key is set).

export function detectSource(url: string): { platform: string; kind: AnalysisKind } {
  const u = (url || "").toLowerCase();
  if (/youtube\.com|youtu\.be/.test(u)) return { platform: "YouTube", kind: "video" };
  if (/tiktok\.com/.test(u)) return { platform: "TikTok", kind: "video" };
  if (/instagram\.com/.test(u)) return { platform: "Instagram", kind: "video" };
  if (/linkedin\.com/.test(u)) return { platform: "LinkedIn", kind: "post" };
  if (/twitter\.com|x\.com/.test(u)) return { platform: "X", kind: "post" };
  if (/reddit\.com/.test(u)) return { platform: "Reddit", kind: "post" };
  return { platform: "ton réseau", kind: "post" };
}

export async function runAnalysis(
  workspaceId: string,
  profile: Profile,
  input: { url: string; text: string },
): Promise<ContentAnalysis> {
  const { platform, kind } = detectSource(input.url);
  const result = await analyzeContent(profile, {
    url: input.url,
    text: input.text,
    kind,
    platform,
  });
  return contentAnalyses.create(workspaceId, {
    url: input.url,
    platform,
    kind,
    globalScore: result.globalScore,
    criteria: result.criteria,
    summary: result.summary,
    rewriteBrief: result.rewriteBrief,
  });
}
