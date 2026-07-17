"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RatingStar } from "@/components/RatingStar";

const LINKS = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/subscriptions/new", label: "Neues Abo" },
  { href: "/categories", label: "Kategorien" },
  { href: "/print", label: "Drucken" },
  { href: "/account", label: "Mein Konto" },
];

export function NavBar({
  name,
  ratingPercentage,
  hasRated,
}: {
  name: string;
  ratingPercentage: number;
  hasRated: boolean;
}) {
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
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-gray-900">Abo-Tracker</span>
            <RatingStar percentage={ratingPercentage} hasRated={hasRated} />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 sm:hidden">
            <span className="truncate">{name}</span>
            <button
              onClick={handleSignOut}
              className="shrink-0 rounded-md border border-gray-400 px-3 py-1 hover:bg-gray-50"
            >
              Abmelden
            </button>
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
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

        <div className="hidden shrink-0 items-center gap-3 text-sm text-gray-700 sm:flex">
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
