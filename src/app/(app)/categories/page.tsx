import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "@/components/CategoriesManager";
import { CreateOverviewCard } from "@/components/CreateOverviewCard";
import { resolveActiveOverview } from "@/lib/activeOverview";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { active } = await resolveActiveOverview(supabase, user);
  if (!active) return <CreateOverviewCard />;

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", active.ownerId)
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Kategorienverwaltung</h1>
      <CategoriesManager
        categories={categories ?? []}
        viewerId={user.id}
        role={active.role}
        overviewOwnerId={active.ownerId}
      />
    </div>
  );
}
