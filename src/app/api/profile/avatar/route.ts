import { NextResponse } from "next/server";
import { z } from "zod";
import { users } from "@/lib/db";
import { currentWorkspace } from "@/lib/workspace";

// Accepts a downscaled data-URL image (client resizes to keep the store lean).
const schema = z.object({
  dataUrl: z.string().nullable(), // null clears the photo
});

const MAX_BYTES = 1_500_000; // ~1.5MB safety cap on the stored data URL

export async function POST(req: Request) {
  const ctx = await currentWorkspace();
  if (!ctx) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const { dataUrl } = parsed.data;
  if (dataUrl !== null) {
    if (!/^data:image\/(png|jpeg|webp);base64,/.test(dataUrl)) {
      return NextResponse.json({ error: "Format d'image non supporté" }, { status: 400 });
    }
    if (dataUrl.length > MAX_BYTES) {
      return NextResponse.json({ error: "Image trop lourde" }, { status: 400 });
    }
  }

  await users.updateAvatar(ctx.user.id, dataUrl);
  return NextResponse.json({ avatarUrl: dataUrl });
}
