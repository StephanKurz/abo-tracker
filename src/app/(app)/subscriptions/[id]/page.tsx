import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { updateSubscription, deleteSubscription } from "@/app/actions/subscriptions";

export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: subscription }, { data: categories }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (!subscription) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Abo bearbeiten</h1>
      <SubscriptionForm
        categories={categories ?? []}
        initial={subscription}
        action={updateSubscription.bind(null, id)}
        onDelete={deleteSubscription.bind(null, id)}
      />
    </div>
  );
}
