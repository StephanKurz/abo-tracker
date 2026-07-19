"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitFeedback } from "@/app/actions/feedback";
import { buttonPrimaryClass, cardClass, textareaClass } from "@/components/ui/formStyles";
import { formatDateTime } from "@/lib/sharing";

type FeedbackEntry = { id: string; text: string; createdAt: string };

export function FeedbackCard({ entries }: { entries: FeedbackEntry[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const result = await submitFeedback(text);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setInfo("Danke für dein Feedback!");
      setText("");
      router.refresh();
    }
  }

  return (
    <div className={`${cardClass} space-y-3 p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold text-gray-900">Mein Feedback</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="feedback-text" className="mb-1 block text-sm font-medium text-gray-700">
            Das würde ich mir noch wünschen:
          </label>
          <textarea
            id="feedback-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            className={textareaClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}

        <button type="submit" disabled={loading || !text.trim()} className={buttonPrimaryClass}>
          {loading ? "Wird gesendet…" : "Absenden"}
        </button>
      </form>

      {entries.length > 0 && (
        <div className="space-y-2 border-t border-gray-200 pt-3">
          <h3 className="text-sm font-semibold text-gray-700">Bisher gesendet</h3>
          <ul className="space-y-2">
            {entries.map((entry) => (
              <li key={entry.id} className="text-sm text-gray-700">
                <p className="whitespace-pre-wrap">{entry.text}</p>
                <p className="text-xs text-gray-500">{formatDateTime(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
