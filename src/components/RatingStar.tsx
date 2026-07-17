"use client";

import { useState } from "react";
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
        title={`${Math.round(clamped)}% bewerten den Abo-Tracker als "Super Tool" — klicken zum Bewerten`}
        className="relative inline-block h-5 w-5 shrink-0 text-xl leading-none"
      >
        <span className="absolute inset-0 overflow-hidden whitespace-nowrap text-gray-300">★</span>
        <span
          className="absolute inset-0 overflow-hidden whitespace-nowrap text-yellow-400"
          style={{ width: `${clamped}%` }}
        >
          ★
        </span>
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
          <p className="mb-2 font-medium text-gray-900">Wie findest du den Abo-Tracker?</p>
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
