import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

export type Role = "owner" | "full" | "full_own" | "read";
export type InvitePermission = "full" | "full_own" | "read";
export type CollaboratorStatus = "pending" | "accepted" | "declined" | "revoked" | "left";
export type OverviewOption = { ownerId: string; ownerName: string; role: Role };

export const ACTIVE_OVERVIEW_COOKIE = "active_overview_owner";

export const PERMISSION_LABELS: Record<Role, string> = {
  owner: "Eigentümer",
  full: "Vollzugriff",
  full_own: "Vollzugriff (nur eigene Abos)",
  read: "Nur lesen",
};

export const STATUS_LABELS: Record<CollaboratorStatus, string> = {
  pending: "Ausstehend",
  accepted: "Aktiv",
  declined: "Abgelehnt",
  revoked: "Widerrufen",
  left: "Verlassen",
};

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const formatted = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
  return `${formatted} Uhr`;
}

export function canWriteAny(role: Role): boolean {
  return role === "owner" || role === "full" || role === "full_own";
}

export function canWriteRow(role: Role, viewerId: string, createdBy: string): boolean {
  if (role === "owner" || role === "full") return true;
  if (role === "full_own") return createdBy === viewerId;
  return false;
}

type Client = SupabaseClient<Database>;

export async function listOverviewOptions(
  supabase: Client,
  user: User,
): Promise<OverviewOption[]> {
  const [{ data: ownOverview }, { data: memberships }, { data: ownProfile }] = await Promise.all([
    supabase.from("overviews").select("owner_id").eq("owner_id", user.id).maybeSingle(),
    supabase
      .from("overview_collaborators")
      .select("overview_owner_id, permission")
      .eq("collaborator_id", user.id)
      .eq("status", "accepted"),
    supabase.from("profiles").select("name").eq("id", user.id).single(),
  ]);

  const overviews: OverviewOption[] = [];

  if (ownOverview) {
    overviews.push({
      ownerId: user.id,
      ownerName: ownProfile?.name ?? "Meine Übersicht",
      role: "owner",
    });
  }

  const ownerIds = (memberships ?? []).map((m) => m.overview_owner_id);
  const ownerNames = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", ownerIds);
    for (const o of owners ?? []) ownerNames.set(o.id, o.name);
  }

  for (const m of memberships ?? []) {
    overviews.push({
      ownerId: m.overview_owner_id,
      ownerName: ownerNames.get(m.overview_owner_id) ?? "Unbekannt",
      role: m.permission as Role,
    });
  }

  return overviews;
}

export async function countPendingInvites(supabase: Client, user: User): Promise<number> {
  const { count } = await supabase
    .from("overview_collaborators")
    .select("id", { count: "exact", head: true })
    .eq("collaborator_id", user.id)
    .eq("status", "pending");
  return count ?? 0;
}

export async function getRoleForOwner(
  supabase: Client,
  user: User,
  ownerId: string,
): Promise<Role | null> {
  const overviews = await listOverviewOptions(supabase, user);
  return overviews.find((o) => o.ownerId === ownerId)?.role ?? null;
}
