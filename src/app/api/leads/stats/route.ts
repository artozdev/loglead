import { NextResponse } from "next/server";
import { leads } from "@/lib/db";
import { planAllows } from "@/lib/plan";
import type { Lead } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

const WEEK = 7 * 86_400_000;

// Counts leads created in [now - WEEK, now) and [now - 2*WEEK, now - WEEK).
function weekSplit(list: Lead[]): { thisWeek: number; prevWeek: number } {
  const now = Date.now();
  let thisWeek = 0;
  let prevWeek = 0;
  for (const l of list) {
    const t = new Date(l.createdAt).getTime();
    if (t >= now - WEEK) thisWeek++;
    else if (t >= now - 2 * WEEK) prevWeek++;
  }
  return { thisWeek, prevWeek };
}

export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (!planAllows(ctx.workspace.plan, "leads")) {
    return NextResponse.json({ error: "Réservé aux offres Growth et Pro." }, { status: 403 });
  }

  const all = leads.listByWorkspace(ctx.workspace.id);
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();

  const added = weekSplit(all);
  const qualified = all.filter((l) => l.status === "converted");
  const lost = all.filter((l) => l.status === "lost");

  return NextResponse.json({
    total: all.length,
    addedThisWeek: added.thisWeek,
    addedPrevWeek: added.prevWeek,
    newThisMonth: all.filter((l) => new Date(l.createdAt).getTime() >= monthStart).length,
    qualified: qualified.length,
    qualifiedShare: all.length === 0 ? 0 : (qualified.length / all.length) * 100,
    qualifiedWeek: weekSplit(qualified),
    lost: lost.length,
    lostWeek: weekSplit(lost),
  });
}
