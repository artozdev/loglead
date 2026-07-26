import "server-only";
import { cookies } from "next/headers";
import { getCurrentUser, makeToken, verifyToken } from "./auth";
import { workspaces } from "./db";
import type { User, Workspace } from "./types";

// Tracks the active workspace via a signed cookie. Membership is always
// re-verified server-side, so a tampered cookie just falls back to the user's
// first workspace.

const COOKIE_NAME = "loglead_workspace";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function setActiveWorkspace(id: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, makeToken(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

// Returns the active workspace for the user, or null if they have none yet.
export async function getActiveWorkspace(user: User): Promise<Workspace | null> {
  const list = await workspaces.listForUser(user.id);
  if (list.length === 0) return null;

  const store = await cookies();
  const cookieId = verifyToken(store.get(COOKIE_NAME)?.value);
  const active = cookieId && list.find((w) => w.id === cookieId);
  return active || list[0];
}

// Route-handler helper: resolve the authenticated user + their active
// workspace, or null when unauthenticated / workspace-less.
export async function currentWorkspace(): Promise<{
  user: User;
  workspace: Workspace;
} | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const workspace = await getActiveWorkspace(user);
  if (!workspace) return null;
  return { user, workspace };
}
