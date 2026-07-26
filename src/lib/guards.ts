import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { profiles } from "./db";
import type { Profile, User, Workspace } from "./types";
import { getActiveWorkspace } from "./workspace";

// Server-side gates for the authenticated app routes.

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireWorkspace(): Promise<{
  user: User;
  workspace: Workspace;
}> {
  const user = await requireUser();
  const workspace = await getActiveWorkspace(user);
  // Every user gets a workspace at signup; the only way here is the edge case
  // of a user with zero memberships → send them to the account page to create
  // one (avoids any loop with /onboarding).
  if (!workspace) redirect("/settings");
  return { user, workspace };
}

export async function requireProfile(): Promise<{
  user: User;
  workspace: Workspace;
  profile: Profile;
}> {
  const { user, workspace } = await requireWorkspace();
  const profile = await profiles.findByWorkspace(workspace.id);
  if (!profile) redirect("/onboarding");
  return { user, workspace, profile };
}
