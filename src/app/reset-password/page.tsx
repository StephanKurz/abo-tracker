"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/validation";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(password)) {
      setError("Bitte alle Passwort-Anforderungen erfüllen.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className={`${cardClass} w-full max-w-md`}>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Neues Passwort festlegen</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel required htmlFor="password">
              Neues Passwort
            </FieldLabel>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
            <ul className="mt-2 space-y-0.5 text-xs">
              {PASSWORD_RULES.map((rule) => {
                const ok = rule.test(password);
                return (
                  <li key={rule.id} className={ok ? "text-green-700" : "text-gray-500"}>
                    {ok ? "✓" : "○"} {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className={`${buttonPrimaryClass} w-full`}>
            {loading ? "Wird gespeichert…" : "Passwort speichern"}
          </button>
        </form>
      </div>
    </main>
  );
}
