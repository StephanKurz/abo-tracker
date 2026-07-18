import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { SiteFooter } from "@/components/SiteFooter";
import { claimPendingInvitesForCurrentUser, resolveActiveOverview } from "@/lib/activeOverview";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Links a not-yet-registered person's pending invite to their account the
  // moment they first show up here with a matching verified email.
  await claimPendingInvitesForCurrentUser(supabase, user);

  const [
    { data: profile },
    { data: ratingStats },
    { data: ownRating },
    { overviews, active },
    { count: pendingInviteCount },
  ] = await Promise.all([
    supabase.from("profiles").select("name").eq("id", user.id).single(),
    supabase.rpc("get_rating_stats").single(),
    supabase.from("app_ratings").select("is_positive").eq("user_id", user.id).maybeSingle(),
    resolveActiveOverview(supabase, user),
    supabase
      .from("overview_collaborators")
      .select("id", { count: "exact", head: true })
      .eq("collaborator_id", user.id)
      .eq("status", "pending"),
  ]);

  const ratingPercentage =
    ratingStats && ratingStats.total_users > 0
      ? (ratingStats.positive_count / ratingStats.total_users) * 100
      : 0;

  return (
    <div className="flex h-dvh flex-col overflow-hidden print:h-auto print:overflow-visible">
      <NavBar
        name={profile?.name ?? user.email ?? ""}
        ratingPercentage={ratingPercentage}
        hasRated={ownRating != null}
        overviews={overviews}
        activeOwnerId={active?.ownerId ?? null}
        pendingInviteCount={pendingInviteCount ?? 0}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 overflow-y-auto px-4 py-6 print:overflow-visible">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
