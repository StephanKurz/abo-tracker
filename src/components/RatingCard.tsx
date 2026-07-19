"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitRating } from "@/app/actions/rating";
import { RecommendWidget } from "@/components/RecommendWidget";
import { buttonPrimaryClass, buttonSecondaryClass, cardClass } from "@/components/ui/formStyles";

export function RatingCard({ rating }: { rating: boolean | null }) {
  const router = useRouter();
  const [ratingValue, setRatingValue] = useState(rating);
  const [ratingLoading, setRatingLoading] = useState(false);

  async function handleRate(isPositive: boolean) {
    setRatingLoading(true);
    await submitRating(isPositive);
    setRatingLoading(false);
    setRatingValue(isPositive);
    router.refresh();
  }

  return (
    <div className={`${cardClass} space-y-3 p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold text-gray-900">Deine Bewertung</h2>
      <p className="text-sm text-gray-600">
        {ratingValue == null
          ? "Du hast den Abo-Tracker noch nicht bewertet."
          : ratingValue
            ? "Du hast den Abo-Tracker als „Super Tool” bewertet."
            : "Du hast den Abo-Tracker als „taugt nix” bewertet."}
      </p>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={ratingLoading}
          onClick={() => handleRate(true)}
          className={
            ratingValue === true ? `${buttonPrimaryClass} gap-2` : `${buttonSecondaryClass} gap-2`
          }
        >
          <span className="text-yellow-400">★</span> Super Tool
        </button>
        <button
          type="button"
          disabled={ratingLoading}
          onClick={() => handleRate(false)}
          className={
            ratingValue === false ? `${buttonPrimaryClass} gap-2` : `${buttonSecondaryClass} gap-2`
          }
        >
          <span className="text-gray-400">★</span> Taugt nix
        </button>
      </div>

      {ratingValue === true && (
        <div className="border-t border-gray-200 pt-3">
          <RecommendWidget />
        </div>
      )}
    </div>
  );
}
