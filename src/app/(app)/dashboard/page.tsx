import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardTable } from "@/components/DashboardTable";
import { buttonPrimaryClass } from "@/components/ui/formStyles";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("*, categories(name)")
    .order("start_date", { ascending: true });

  const rows = (subscriptions ?? []).map((sub) => ({
    ...sub,
    category_name: (sub as { categories?: { name: string } | null }).categories?.name ?? "–",
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Abo-Übersicht</h1>
        <Link href="/subscriptions/new" className={buttonPrimaryClass}>
          + Neues Abo
        </Link>
      </div>
      <DashboardTable subscriptions={rows} />
    </div>
  );
}
