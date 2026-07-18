import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { updateSubscription, deleteSubscription } from "@/app/actions/subscriptions";
import { canWriteRow } from "@/lib/sharing";
import { resolveActiveOverview } from "@/lib/activeOverview";

export default async function EditSubscriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { active } = await resolveActiveOverview(supabase, user);
  if (!active) notFound();

  const [{ data: subscription }, { data: categories }] = await Promise.all([
    supabase.from("subscriptions").select("*").eq("id", id).single(),
    supabase.from("categories").select("*").eq("user_id", active.ownerId).order("name"),
  ]);

  if (!subscription || subscription.user_id !== active.ownerId) {
    notFound();
  }

  const readOnly = !canWriteRow(active.role, user.id, subscription.created_by);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">
        {readOnly ? "Abo ansehen" : "Abo bearbeiten"}
      </h1>
      <SubscriptionForm
        categories={categories ?? []}
        initial={subscription}
        action={readOnly ? undefined : updateSubscription.bind(null, id)}
        onDelete={readOnly ? undefined : deleteSubscription.bind(null, id)}
        readOnly={readOnly}
      />
    </div>
  );
}
