"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { submitRating } from "@/app/actions/rating";

export function RatingStar({
  percentage,
  hasRated,
}: {
  percentage: number;
  hasRated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const gradientId = useId();
  const clamped = Math.max(0, Math.min(100, percentage));

  async function handleRate(isPositive: boolean) {
    setLoading(true);
    await submitRating(isPositive);
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={`${Math.round(clamped)}% bewerten Abo-Radar als "Super Tool" — klicken zum Bewerten`}
        className="inline-flex shrink-0 items-center"
      >
        {/* Ein einzelner SVG-Stern; der Farbverlauf teilt Gelb/Grau exakt am
            Prozentwert — kein Überlagern zweier Glyphen mehr */}
        <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset={`${clamped}%`} stopColor="#facc15" />
              <stop offset={`${clamped}%`} stopColor="#d1d5db" />
            </linearGradient>
          </defs>
          <path
            d="M12 1.8l3.1 6.28 6.93 1.01-5.02 4.89 1.19 6.9L12 17.62l-6.2 3.26 1.19-6.9-5.02-4.89 6.93-1.01L12 1.8z"
            fill={`url(#${gradientId})`}
          />
        </svg>
      </button>

      {!hasRated && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="hidden text-xs font-medium text-orange-600 hover:underline sm:inline"
        >
          Jetzt bewerten
        </button>
      )}

      {open && (
        <div className="absolute left-0 top-full z-20 mt-2 w-52 rounded-md border border-gray-300 bg-white p-3 text-sm shadow-lg">
          <p className="mb-2 font-medium text-gray-900">Wie findest du Abo-Radar?</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleRate(true)}
            className="mb-1 flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-gray-50"
          >
            <span className="text-yellow-400">★</span> Super Tool
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleRate(false)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-gray-50"
          >
            <span className="text-gray-400">★</span> Taugt nix
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-2 text-xs text-gray-500 hover:underline"
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  );
}
