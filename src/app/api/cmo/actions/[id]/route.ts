import { NextResponse } from "next/server";
import { z } from "zod";
import { cmoActions, cmoConfig, contentItems } from "@/lib/db";
import type { ContentType, Platform } from "@/lib/types";
import { currentWorkspace } from "@/lib/workspace";

const schema = z.object({
  op: z.enum(["approve", "reject", "edit", "publish", "cancel"]),
  body: z.string().optional(),
});

const contentTypeFor: Record<Platform, ContentType> = {
  linkedin: "linkedin_post",
  instagram: "instagram_caption",
  tiktok: "reel_script",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const action = await cmoActions.findById(id, ctx.workspace.id);
  if (!action) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const wid = ctx.workspace.id;
  const nowIso = new Date().toISOString();

  switch (parsed.data.op) {
    case "approve": {
      const updated = await cmoActions.update(id, wid, {
        status: "approved",
        approvedAt: nowIso,
      });
      return NextResponse.json({ action: updated });
    }
    case "reject": {
      const updated = await cmoActions.update(id, wid, { status: "rejected" });
      return NextResponse.json({ action: updated });
    }
    case "edit": {
      const updated = await cmoActions.update(id, wid, {
        body: parsed.data.body ?? action.body,
      });
      return NextResponse.json({ action: updated });
    }
    case "publish": {
      if (action.type !== "content" || !action.platform) {
        return NextResponse.json(
          { error: "Seuls les contenus peuvent être publiés." },
          { status: 400 },
        );
      }
      const item = await contentItems.create(wid, {
        type: contentTypeFor[action.platform],
        platform: action.platform,
        title: action.title,
        body: action.body,
        source: "cmo",
      });
      const autopilot = (await cmoConfig.get(wid)).autopilot;
      const updated = await cmoActions.update(id, wid, {
        status: "published",
        publishedAt: nowIso,
        contentItemId: item.id,
        cancelUntil: autopilot
          ? new Date(Date.now() + 30 * 60 * 1000).toISOString()
          : null,
      });
      return NextResponse.json({ action: updated });
    }
    case "cancel": {
      if (action.contentItemId) await contentItems.remove(action.contentItemId, wid);
      const updated = await cmoActions.update(id, wid, {
        status: "pending",
        publishedAt: null,
        cancelUntil: null,
        contentItemId: null,
      });
      return NextResponse.json({ action: updated });
    }
  }
}
