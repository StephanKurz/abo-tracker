"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LINKS = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/subscriptions/new", label: "Neues Abo" },
  { href: "/categories", label: "Kategorien" },
  { href: "/print", label: "Drucken" },
  { href: "/account", label: "Mein Konto" },
];

export function NavBar({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="no-print border-b border-gray-300 bg-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold text-gray-900">Abo-Tracker</span>
          <nav className="flex gap-4 text-sm">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
                    ? "font-semibold text-orange-600"
                    : "text-gray-700 hover:text-orange-600"
                }
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <span>{name}</span>
          <button
            onClick={handleSignOut}
            className="rounded-md border border-gray-400 px-3 py-1 hover:bg-gray-50"
          >
            Abmelden
          </button>
        </div>
      </div>
    </header>
  );
}
