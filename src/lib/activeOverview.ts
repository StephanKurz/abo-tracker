import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { ACTIVE_OVERVIEW_COOKIE, listOverviewOptions } from "@/lib/sharing";
import type { OverviewOption } from "@/lib/sharing";

type Client = SupabaseClient<Database>;

/**
 * Resolves which overview the current request should read/write. The
 * active_overview_owner cookie is only a hint — it's always cross-checked
 * against the real, live list of overviews this user may access, so a
 * stale or forged cookie value silently falls back instead of leaking
 * access to a since-revoked overview.
 */
export async function resolveActiveOverview(
  supabase: Client,
  user: User,
): Promise<{ overviews: OverviewOption[]; active: OverviewOption | null }> {
  const overviews = await listOverviewOptions(supabase, user);
  const cookieValue = (await cookies()).get(ACTIVE_OVERVIEW_COOKIE)?.value;

  const active =
    overviews.find((o) => o.ownerId === cookieValue) ??
    overviews.find((o) => o.role === "owner") ??
    overviews[0] ??
    null;

  return { overviews, active };
}

/**
 * Attaches this user's identity to any not-yet-claimed invite addressed to
 * their (verified) email — the only way to link an invite that was sent
 * before the person had an account, since the profiles-creation trigger on
 * auth.users lives outside this repo and can't be extended to do this.
 * Safe as a plain authenticated update: RLS + a DB trigger restrict this
 * write path to setting collaborator_id only, matched against the
 * server-verified JWT email, never a client-supplied value.
 */
export async function claimPendingInvitesForCurrentUser(
  supabase: Client,
  user: User,
): Promise<void> {
  if (!user.email) return;
  await supabase
    .from("overview_collaborators")
    .update({ collaborator_id: user.id })
    .is("collaborator_id", null)
    .eq("status", "pending")
    .eq("invited_email", user.email.toLowerCase());
}
