import { createClient } from "@/lib/supabase/server";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { createSubscription } from "@/app/actions/subscriptions";

export default async function NewSubscriptionPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Neues Abo erfassen</h1>
      <SubscriptionForm categories={categories ?? []} action={createSubscription} />
    </div>
  );
}
