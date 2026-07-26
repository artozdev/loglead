import "server-only";
import fs from "fs";
import path from "path";
import { render } from "@react-email/render";
import { Resend } from "resend";

// ---------------------------------------------------------------------------
// Transactional email dispatch — same philosophy as the AI layer: sends for
// real through Resend when RESEND_API_KEY is set; otherwise renders the
// template to ./data/outbox/*.html so every flow stays testable in dev
// (open the file in a browser to see exactly what would have been sent).
// ---------------------------------------------------------------------------

const FROM = "LogLead <hello@loglead.io>";
const REPLY_TO = "loglead@gmail.com";
const OUTBOX_DIR = path.join(process.cwd(), "data", "outbox");

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

// "jane.doe@x.com" → "Jane" — the store has no first-name field yet.
export function firstNameFromEmail(email: string): string {
  const local = (email.split("@")[0] || "").replace(/[._-]+/g, " ").trim();
  const first = local.split(" ")[0] || "toi";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string;
  subject: string;
  template: React.ReactElement;
}): Promise<void> {
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: FROM,
        replyTo: REPLY_TO,
        to,
        subject,
        react: template,
      });
      if (error) console.error("[emails] Resend error:", error);
      return;
    }
    // Dev outbox — one HTML file per email, newest sortable by filename.
    const html = await render(template);
    fs.mkdirSync(OUTBOX_DIR, { recursive: true });
    const slug = subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    const file = path.join(OUTBOX_DIR, `${Date.now()}-${slug}.html`);
    fs.writeFileSync(
      file,
      `<!-- to: ${to} · subject: ${subject} -->\n${html}`,
      "utf8",
    );
    console.log(`[emails] (dev outbox) "${subject}" → ${to} · ${file}`);
  } catch (err) {
    // Emails must never break the flow that triggered them.
    console.error("[emails] send failed:", err);
  }
}

// Plain-text send for LogReach outreach: personal from-name, replies go to
// the founder's own inbox. Returns false when the send actually failed (the
// caller must not record a message that never left).
export async function sendPlainEmail({
  to,
  subject,
  text,
  fromName,
  replyTo,
}: {
  to: string;
  subject: string;
  text: string;
  fromName: string; // "Arthur via LogLead <hello@loglead.io>"
  replyTo: string; // the founder's email
}): Promise<boolean> {
  try {
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const { error } = await resend.emails.send({
        from: `${fromName} via LogLead <hello@loglead.io>`,
        replyTo,
        to,
        subject,
        text,
      });
      if (error) {
        console.error("[emails] Resend error:", error);
        return false;
      }
      return true;
    }
    fs.mkdirSync(OUTBOX_DIR, { recursive: true });
    const slug = subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    const file = path.join(OUTBOX_DIR, `${Date.now()}-${slug}.html`);
    fs.writeFileSync(
      file,
      `<!-- to: ${to} · reply-to: ${replyTo} · subject: ${subject} -->\n<pre style="font: 14px/1.6 system-ui; max-width: 560px; margin: 40px auto;">${text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")}</pre>`,
      "utf8",
    );
    console.log(`[emails] (dev outbox) "${subject}" → ${to} · ${file}`);
    return true;
  } catch (err) {
    console.error("[emails] send failed:", err);
    return false;
  }
}
