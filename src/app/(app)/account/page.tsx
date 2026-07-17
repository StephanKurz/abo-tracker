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

  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", user.id)
    .single();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Mein Konto</h1>
      <AccountForm name={profile?.name ?? ""} email={profile?.email ?? user.email ?? ""} />
    </div>
  );
}
