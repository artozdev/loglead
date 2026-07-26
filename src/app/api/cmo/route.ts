import { NextResponse } from "next/server";
import { cmoActions, cmoConfig } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

export async function GET() {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  return NextResponse.json({
    plan: ctx.workspace.plan,
    config: cmoConfig.get(ctx.workspace.id),
    actions: cmoActions.listByWorkspace(ctx.workspace.id),
  });
}
