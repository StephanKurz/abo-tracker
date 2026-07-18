import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintView } from "@/components/PrintView";
import { resolveActiveOverview } from "@/lib/activeOverview";

export default async function PrintPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { active } = await resolveActiveOverview(supabase, user);

  if (!active) {
    return <p className="text-sm text-gray-600">Noch keine Abo-Übersicht vorhanden.</p>;
  }

  const [{ data: subscriptions }, { data: profile }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*, categories(name)")
      .eq("user_id", active.ownerId)
      .order("name"),
    supabase.from("profiles").select("name, email").eq("id", active.ownerId).single(),
  ]);

  const rows = (subscriptions ?? []).map((sub) => ({
    ...sub,
    category_name: (sub as { categories?: { name: string } | null }).categories?.name ?? "Ohne Kategorie",
  }));

  return (
    <PrintView
      subscriptions={rows}
      userName={profile?.name ?? ""}
      userEmail={profile?.email ?? ""}
    />
  );
}
