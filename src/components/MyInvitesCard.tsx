"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { acceptInvite, declineInvite, leaveOverview } from "@/app/actions/sharing";
import { buttonPrimaryClass, buttonSecondaryClass, cardClass } from "@/components/ui/formStyles";
import { PERMISSION_LABELS } from "@/lib/sharing";
import type { InvitePermission } from "@/lib/sharing";

type InviteRow = {
  id: string;
  ownerName: string;
  permission: InvitePermission;
  status: "pending" | "accepted";
};

export function MyInvitesCard({ invites }: { invites: InviteRow[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  if (invites.length === 0) return null;

  async function run(action: (id: string) => Promise<{ error: string | null }>, id: string) {
    setLoadingId(id);
    setError(null);
    const result = await action(id);
    setLoadingId(null);
    if (result.error) setError(result.error);
    else router.refresh();
  }

  const pending = invites.filter((i) => i.status === "pending");
  const active = invites.filter((i) => i.status === "accepted");

  return (
    <div className={`${cardClass} space-y-3 p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold text-gray-900">Einladungen</h2>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {pending.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Ausstehend</h3>
          <ul className="divide-y divide-gray-200">
            {pending.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex-1">
                  <span className="block text-gray-900">Aboverwaltung {i.ownerName}</span>
                  <span className="block text-xs text-gray-500">{PERMISSION_LABELS[i.permission]}</span>
                </span>
                <button
                  disabled={loadingId === i.id}
                  onClick={() => run(acceptInvite, i.id)}
                  className={buttonPrimaryClass}
                >
                  Annehmen
                </button>
                <button
                  disabled={loadingId === i.id}
                  onClick={() => run(declineInvite, i.id)}
                  className={buttonSecondaryClass}
                >
                  Ablehnen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700">Aktive Freigaben</h3>
          <ul className="divide-y divide-gray-200">
            {active.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex-1">
                  <span className="block text-gray-900">Aboverwaltung {i.ownerName}</span>
                  <span className="block text-xs text-gray-500">{PERMISSION_LABELS[i.permission]}</span>
                </span>
                <button
                  disabled={loadingId === i.id}
                  onClick={() => run(leaveOverview, i.id)}
                  className="text-sm text-red-700 hover:underline"
                >
                  Verlassen
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
