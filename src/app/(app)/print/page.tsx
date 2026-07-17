import { createClient } from "@/lib/supabase/server";
import { PrintView } from "@/components/PrintView";

export default async function PrintPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: subscriptions }, { data: profile }] = await Promise.all([
    supabase.from("subscriptions").select("*, categories(name)").order("name"),
    user
      ? supabase.from("profiles").select("name, email").eq("id", user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  const rows = (subscriptions ?? []).map((sub) => ({
    ...sub,
    category_name: (sub as { categories?: { name: string } | null }).categories?.name ?? "Ohne Kategorie",
  }));

  return (
    <PrintView
      subscriptions={rows}
      userName={profile?.name ?? ""}
      userEmail={profile?.email ?? user?.email ?? ""}
    />
  );
}
