"use client";

import { useState } from "react";
import { sendRecommendation } from "@/app/actions/recommend";
import { buttonPrimaryClass, buttonSecondaryClass, inputClass } from "@/components/ui/formStyles";

function makeChallenge() {
  return { a: Math.ceil(Math.random() * 9), b: Math.ceil(Math.random() * 9) };
}

export function RecommendWidget() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [challenge, setChallenge] = useState(makeChallenge);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const result = await sendRecommendation(email, {
      a: challenge.a,
      b: challenge.b,
      answer: Number(answer),
    });
    setLoading(false);
    setChallenge(makeChallenge());
    setAnswer("");
    if (result.error) {
      setError(result.error);
    } else {
      setInfo("Danke! Die Empfehlung wurde versendet.");
      setEmail("");
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={buttonSecondaryClass}>
        Abo Tracker empfehlen
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="recommend-email" className="mb-1 block text-sm font-medium text-gray-700">
          E-Mail-Adresse
        </label>
        <input
          id="recommend-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="recommend-answer" className="mb-1 block text-sm font-medium text-gray-700">
          Was ist {challenge.a} + {challenge.b}?
        </label>
        <input
          id="recommend-answer"
          type="number"
          required
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}

      <button type="submit" disabled={loading} className={buttonPrimaryClass}>
        {loading ? "Wird gesendet…" : "Senden"}
      </button>
    </form>
  );
}
