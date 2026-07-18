import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardTable } from "@/components/DashboardTable";
import { CreateOverviewCard } from "@/components/CreateOverviewCard";
import { buttonPrimaryClass } from "@/components/ui/formStyles";
import { resolveActiveOverview } from "@/lib/activeOverview";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { active } = await resolveActiveOverview(supabase, user);

  if (!active) {
    return <CreateOverviewCard />;
  }

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, categories(name)")
    .eq("user_id", active.ownerId)
    .order("start_date", { ascending: true });

  const contributorIds = [
    ...new Set(
      (subscriptions ?? []).flatMap((s) => [s.created_by, s.updated_by].filter((v): v is string => !!v)),
    ),
  ];
  const contributorNames = new Map<string, string>();
  if (contributorIds.length > 0) {
    const { data: contributors } = await supabase
      .from("profiles")
      .select("id, name")
      .in("id", contributorIds);
    for (const p of contributors ?? []) contributorNames.set(p.id, p.name);
  }

  const rows = (subscriptions ?? []).map((sub) => ({
    ...sub,
    category_name: (sub as { categories?: { name: string } | null }).categories?.name ?? "–",
    created_by_name: contributorNames.get(sub.created_by) ?? "Unbekannt",
    updated_by_name: sub.updated_by ? (contributorNames.get(sub.updated_by) ?? "Unbekannt") : null,
  }));

  const canCreate = active.role !== "read";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Abo-Übersicht</h1>
        {canCreate && (
          <Link href="/subscriptions/new" className={buttonPrimaryClass}>
            + Neues Abo
          </Link>
        )}
      </div>
      <DashboardTable subscriptions={rows} viewerId={user.id} role={active.role} />
    </div>
  );
}
