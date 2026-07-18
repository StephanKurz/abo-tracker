"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RatingStar } from "@/components/RatingStar";
import { switchActiveOverview } from "@/app/actions/sharing";
import { PERMISSION_LABELS } from "@/lib/sharing";
import type { OverviewOption } from "@/lib/sharing";

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
  overviews,
  activeOwnerId,
  pendingInviteCount,
}: {
  name: string;
  ratingPercentage: number;
  hasRated: boolean;
  overviews: OverviewOption[];
  activeOwnerId: string | null;
  pendingInviteCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function handleSwitch(ownerId: string) {
    setSwitching(true);
    await switchActiveOverview(ownerId);
    setSwitching(false);
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

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
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
              {link.href === "/account" && pendingInviteCount > 0 && (
                <span className="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-600 px-1 text-[10px] font-semibold text-white">
                  {pendingInviteCount}
                </span>
              )}
            </Link>
          ))}
          {overviews.length > 1 && (
            <select
              value={activeOwnerId ?? ""}
              disabled={switching}
              onChange={(e) => handleSwitch(e.target.value)}
              className="rounded-md border border-gray-400 bg-white px-2 py-1 text-sm text-gray-700"
            >
              {overviews.map((o) => (
                <option key={o.ownerId} value={o.ownerId}>
                  {o.role === "owner"
                    ? "Meine Übersicht"
                    : `Übersicht von ${o.ownerName} (${PERMISSION_LABELS[o.role]})`}
                </option>
              ))}
            </select>
          )}
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
