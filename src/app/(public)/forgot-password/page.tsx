"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
      <div className={`${cardClass} w-full max-w-md`}>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Passwort vergessen</h1>
        <p className="mb-6 text-sm text-gray-600">
          Gib deine E-Mail-Adresse ein. Wir senden dir einen Link zum Zurücksetzen deines Passworts.
        </p>

        {sent ? (
          <p className="text-sm text-green-700">
            Falls die E-Mail-Adresse registriert ist, wurde eine Nachricht mit einem Reset-Link gesendet.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <FieldLabel required htmlFor="email">
                E-Mail-Adresse
              </FieldLabel>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={loading} className={`${buttonPrimaryClass} w-full`}>
              {loading ? "Wird gesendet…" : "Link senden"}
            </button>
          </form>
        )}

        <p className="mt-4 text-sm text-gray-600">
          <Link href="/login" className="text-orange-600 hover:underline">
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
  );
}
