"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createOwnOverview } from "@/app/actions/sharing";
import { buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";

export function CreateOverviewCard() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);
    const result = await createOwnOverview();
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className={`${cardClass} max-w-lg space-y-3 text-center`}>
      <h1 className="text-xl font-bold text-gray-900">Du hast noch keine eigene Abo-Übersicht</h1>
      <p className="text-sm text-gray-600">
        Lege deine eigene Übersicht an, um Abos zu erfassen. Wurdest du von jemand anderem eingeladen,
        findest du die Einladung unter „Mein Konto”.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="button" onClick={handleCreate} disabled={loading} className={buttonPrimaryClass}>
        {loading ? "Wird angelegt…" : "Jetzt eigene Übersicht anlegen"}
      </button>
    </div>
  );
}
