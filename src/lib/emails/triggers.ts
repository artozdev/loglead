import "server-only";
import NewLeadEmail from "../../../emails/new-lead";
import { contentItems, users, workspaces } from "../db";
import { leadChannelLabel, type Lead } from "../types";
import { appUrl, firstNameFromEmail, sendEmail } from "./send";

// Email 9 — notify the workspace owner that a lead just landed. Fire-and-
// forget: callers `void` it, and sendEmail never throws.
export async function notifyNewLead(lead: Lead): Promise<void> {
  const workspace = workspaces.findById(lead.workspaceId);
  const owner = workspace ? users.findById(workspace.ownerId) : undefined;
  if (!owner) return;
  // Respect the "Nouveau lead capté" settings toggle (default: on).
  if (owner.emailPrefs?.newLead === false) return;

  const sourceTitle = lead.sourceContentId
    ? contentItems.findById(lead.sourceContentId, lead.workspaceId)?.title ?? null
    : null;
  const leadName = `${lead.firstName} ${lead.lastName}`.trim();

  await sendEmail({
    to: owner.email,
    subject: `Nouveau lead depuis ${leadChannelLabel(lead.channel)} — ${leadName}`,
    template: NewLeadEmail({
      firstName: firstNameFromEmail(owner.email),
      leadName,
      channel: leadChannelLabel(lead.channel),
      sourceTitle,
      capturedAt: new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(lead.createdAt)),
      appUrl: appUrl(),
    }),
  });
}
