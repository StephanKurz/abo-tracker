import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionForm } from "@/components/SubscriptionForm";
import { createSubscription } from "@/app/actions/subscriptions";
import { canWriteAny } from "@/lib/sharing";
import { resolveActiveOverview } from "@/lib/activeOverview";

export default async function NewSubscriptionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { active } = await resolveActiveOverview(supabase, user);
  if (!active || !canWriteAny(active.role)) {
    redirect("/dashboard");
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", active.ownerId)
    .order("name");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Neues Abo erfassen</h1>
      <SubscriptionForm
        categories={categories ?? []}
        action={createSubscription}
        overviewOwnerId={active.ownerId}
      />
    </div>
  );
}
