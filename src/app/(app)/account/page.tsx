import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/components/AccountForm";
import { ShareAccessCard } from "@/components/ShareAccessCard";
import { MyInvitesCard } from "@/components/MyInvitesCard";
import type { CollaboratorStatus, InvitePermission } from "@/lib/sharing";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: ownRating }, { data: ownOverview }] = await Promise.all([
    supabase.from("profiles").select("name, email, notify_days_before").eq("id", user.id).single(),
    supabase.from("app_ratings").select("is_positive").eq("user_id", user.id).maybeSingle(),
    supabase.from("overviews").select("owner_id").eq("owner_id", user.id).maybeSingle(),
  ]);

  const [{ data: outgoingRaw }, { data: incomingRaw }] = await Promise.all([
    ownOverview
      ? supabase
          .from("overview_collaborators")
          .select("id, invited_email, permission, status, collaborator_id, created_at, responded_at")
          .eq("overview_owner_id", user.id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("overview_collaborators")
      .select("id, permission, status, overview_owner_id")
      .eq("collaborator_id", user.id)
      .in("status", ["pending", "accepted"])
      .order("created_at", { ascending: false }),
  ]);

  const outgoing = outgoingRaw ?? [];
  const incoming = incomingRaw ?? [];

  const collaboratorIds = outgoing
    .map((o) => o.collaborator_id)
    .filter((id): id is string => id != null);
  const ownerIds = incoming.map((i) => i.overview_owner_id);
  const profileIds = [...new Set([...collaboratorIds, ...ownerIds])];

  const names = new Map<string, string>();
  if (profileIds.length > 0) {
    const { data: profiles } = await supabase.from("profiles").select("id, name").in("id", profileIds);
    for (const p of profiles ?? []) names.set(p.id, p.name);
  }

  const outgoingCollaborators = outgoing.map((o) => ({
    id: o.id,
    label: o.collaborator_id ? (names.get(o.collaborator_id) ?? o.invited_email) : o.invited_email,
    permission: o.permission as InvitePermission,
    status: o.status as CollaboratorStatus,
    invitedAt: o.created_at,
    respondedAt: o.responded_at,
  }));

  const incomingInvites = incoming.map((i) => ({
    id: i.id,
    ownerName: names.get(i.overview_owner_id) ?? "Unbekannt",
    permission: i.permission as InvitePermission,
    status: i.status as "pending" | "accepted",
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Mein Konto</h1>
      <div className="columns-1 gap-4 sm:columns-2">
        <AccountForm
          name={profile?.name ?? ""}
          email={profile?.email ?? user.email ?? ""}
          notifyDaysBefore={profile?.notify_days_before ?? null}
          rating={ownRating?.is_positive ?? null}
        />
        <ShareAccessCard hasOverview={!!ownOverview} collaborators={outgoingCollaborators} />
        <MyInvitesCard invites={incomingInvites} />
      </div>
    </div>
  );
}
