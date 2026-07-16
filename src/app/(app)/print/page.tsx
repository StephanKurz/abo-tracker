import { createClient } from "@/lib/supabase/server";
import { PrintView } from "@/components/PrintView";

export default async function PrintPage() {
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, categories(name)")
    .order("name");

  const rows = (subscriptions ?? []).map((sub) => ({
    ...sub,
    category_name: (sub as { categories?: { name: string } | null }).categories?.name ?? "Ohne Kategorie",
  }));

  return <PrintView subscriptions={rows} />;
}
