import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AccountForm } from "@/components/AccountForm";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ data: profile }, { data: ownRating }] = await Promise.all([
    supabase.from("profiles").select("name, email, notify_days_before").eq("id", user.id).single(),
    supabase.from("app_ratings").select("is_positive").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Mein Konto</h1>
      <AccountForm
        name={profile?.name ?? ""}
        email={profile?.email ?? user.email ?? ""}
        notifyDaysBefore={profile?.notify_days_before ?? null}
        rating={ownRating?.is_positive ?? null}
      />
    </div>
  );
}
