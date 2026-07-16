import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar name={profile?.name ?? user.email ?? ""} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
      <footer className="no-print border-t border-gray-300 bg-white px-4 py-3 text-center text-xs text-gray-500">
        <Link href="/datenschutz" className="hover:underline">
          Datenschutzhinweise
        </Link>
      </footer>
    </div>
  );
}
