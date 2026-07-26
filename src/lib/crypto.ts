import "server-only";
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "crypto";

// Field-level encryption at rest (RGPD) for lead email/phone.
// AES-256-GCM with a key derived from SESSION_SECRET. Not KMS-grade, but it
// keeps PII out of the plaintext JSON store.

function key(): Buffer {
  const secret =
    process.env.SESSION_SECRET ||
    "loglead-dev-secret-change-me-in-production-0051FF";
  return scryptSync(secret, "loglead-field-enc-v1", 32);
}

export function encryptField(plain: string | null | undefined): string | null {
  if (plain == null || plain === "") return plain ?? null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${iv.toString("base64")}:${tag.toString("base64")}:${ct.toString("base64")}`;
}

export function decryptField(stored: string | null | undefined): string | null {
  if (stored == null) return null;
  if (!stored.startsWith("enc:v1:")) return stored || null; // legacy plaintext
  try {
    const [, , ivB, tagB, ctB] = stored.split(":");
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(ivB, "base64"));
    decipher.setAuthTag(Buffer.from(tagB, "base64"));
    const pt = Buffer.concat([
      decipher.update(Buffer.from(ctB, "base64")),
      decipher.final(),
    ]);
    return pt.toString("utf8");
  } catch {
    return null;
  }
}
