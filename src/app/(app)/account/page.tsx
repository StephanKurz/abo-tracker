import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NotificationSettingsCard } from "@/components/NotificationSettingsCard";
import { RatingCard } from "@/components/RatingCard";
import { FeedbackCard } from "@/components/FeedbackCard";
import { MyInvitesCard } from "@/components/MyInvitesCard";
import { CheckinCard } from "@/components/CheckinCard";
import { CategoriesManager } from "@/components/CategoriesManager";
import { resolveActiveOverview } from "@/lib/activeOverview";
import type { InvitePermission } from "@/lib/sharing";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { active } = await resolveActiveOverview(supabase, user);

  const [
    { data: profile },
    { data: ownRating },
    { data: feedbackRaw },
    { data: checkinSettingsRaw },
    { data: checkinItemsRaw },
    { data: categoriesRaw },
  ] = await Promise.all([
    supabase.from("profiles").select("notify_days_before").eq("id", user.id).single(),
    supabase.from("app_ratings").select("is_positive").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("feedback")
      .select("id, text, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("checkin_settings")
      .select("checkin_email, imap_host, imap_port, imap_user, enabled, last_polled_at, last_error")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("checkin_items")
      .select("id, raw_subject, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    active
      ? supabase.from("categories").select("*").eq("user_id", active.ownerId).order("name")
      : Promise.resolve({ data: null }),
  ]);

  const feedbackEntries = (feedbackRaw ?? []).map((f) => ({
    id: f.id,
    text: f.text,
    createdAt: f.created_at,
  }));

  const checkinSettings = checkinSettingsRaw
    ? {
        checkinEmail: checkinSettingsRaw.checkin_email,
        imapHost: checkinSettingsRaw.imap_host,
        imapPort: checkinSettingsRaw.imap_port,
        imapUser: checkinSettingsRaw.imap_user,
        hasPassword: true,
        enabled: checkinSettingsRaw.enabled,
        lastPolledAt: checkinSettingsRaw.last_polled_at,
        lastError: checkinSettingsRaw.last_error,
      }
    : null;

  const checkinItems = (checkinItemsRaw ?? []).map((i) => ({
    id: i.id,
    subject: i.raw_subject ?? "",
    status: i.status,
    createdAt: i.created_at,
  }));

  const { data: incomingRaw } = await supabase
    .from("overview_collaborators")
    .select("id, permission, status, overview_owner_id")
    .eq("collaborator_id", user.id)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  const incoming = incomingRaw ?? [];
  const ownerIds = [...new Set(incoming.map((i) => i.overview_owner_id))];

  const ownerNames = new Map<string, string>();
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.rpc("get_invite_owner_names", {
      p_owner_ids: ownerIds,
    });
    for (const o of owners ?? []) ownerNames.set(o.id, o.name);
  }

  const incomingInvites = incoming.map((i) => ({
    id: i.id,
    ownerName: ownerNames.get(i.overview_owner_id) ?? "Unbekannt",
    permission: i.permission as InvitePermission,
    status: i.status as "pending" | "accepted",
  }));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Einstellungen</h1>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex flex-1 flex-col gap-4">
          <NotificationSettingsCard notifyDaysBefore={profile?.notify_days_before ?? null} />
          <RatingCard rating={ownRating?.is_positive ?? null} />
          <FeedbackCard entries={feedbackEntries} />
        </div>
        <div className="flex flex-1 flex-col gap-4">
          <CheckinCard settings={checkinSettings} items={checkinItems} />
          <MyInvitesCard invites={incomingInvites} />
        </div>
      </div>
      {active && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">Kategorien</h2>
          <CategoriesManager
            categories={categoriesRaw ?? []}
            viewerId={user.id}
            role={active.role}
            overviewOwnerId={active.ownerId}
          />
        </div>
      )}
    </div>
  );
}
