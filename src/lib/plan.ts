import type { Plan } from "./types";

export type GatedFeature = "leads" | "cmo" | "inbox" | "agent" | "campaigns";

// Which plans unlock which modules.
export function planAllows(plan: Plan, feature: GatedFeature): boolean {
  switch (feature) {
    case "cmo":
    case "agent": // LogAgent — Pro only (bêta)
      return plan === "pro";
    case "leads":
    case "inbox":
    case "campaigns": // multichannel campaigns — Growth & Pro
      return plan === "growth" || plan === "pro";
    default:
      return false;
  }
}

// LogReach — monthly outbound-message quota per plan.
export function inboxMonthlyQuota(plan: Plan): number {
  return plan === "pro" ? Infinity : plan === "growth" ? 100 : 0;
}
