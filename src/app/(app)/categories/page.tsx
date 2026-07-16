import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "@/components/CategoriesManager";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Kategorienverwaltung</h1>
      <CategoriesManager categories={categories ?? []} />
    </div>
  );
}
