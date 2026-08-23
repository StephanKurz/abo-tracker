import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/ProfileCard";
import { PasswordCard } from "@/components/PasswordCard";
import { ShareAccessCard } from "@/components/ShareAccessCard";
import type { CollaboratorStatus, InvitePermission } from "@/lib/sharing";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // "Zugriff erteilen" bezieht sich immer auf die EIGENE Übersicht der
  // angemeldeten Person (user.id) - unabhängig davon, welche Übersicht
  // gerade über den Umschalter in der Navigation aktiv ist. Eine Person,
  // die selbst nur Mitnutzerin einer fremden Übersicht ist, hat daher hier
  // keine eigene Übersicht (ownOverview ist null) und sieht entsprechend
  // keine Möglichkeit, Zugriff zu erteilen.
  const [{ data: profile }, { data: ownOverview }] = await Promise.all([
    supabase.from("profiles").select("name, email").eq("id", user.id).single(),
    supabase.from("overviews").select("owner_id").eq("owner_id", user.id).maybeSingle(),
  ]);

  const { data: outgoingRaw } = ownOverview
    ? await supabase
        .from("overview_collaborators")
        .select("id, invited_email, permission, status, collaborator_id, created_at, responded_at")
        .eq("overview_owner_id", user.id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const outgoing = outgoingRaw ?? [];
  const collaboratorIds = outgoing
    .map((o) => o.collaborator_id)
    .filter((id): id is string => id != null);

  const names = new Map<string, string>();
  if (collaboratorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", collaboratorIds);
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Profil</h1>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1">
          <ProfileCard name={profile?.name ?? ""} email={profile?.email ?? user.email ?? ""} />
        </div>
        <div className="flex-1">
          <PasswordCard />
        </div>
      </div>
      <ShareAccessCard hasOverview={!!ownOverview} collaborators={outgoingCollaborators} />
    </div>
  );
}
