"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/validation";
import { SiteFooter } from "@/components/SiteFooter";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(() => !searchParams.get("code"));

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) return;

    const supabase = createClient();
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        setError("Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen Reset-Link an.");
      }
      setReady(true);
    });
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(password)) {
      setError("Bitte alle Passwort-Anforderungen erfüllen.");
      return;
    }

    if (password !== passwordConfirm) {
      setError("Die Passwörter stimmen nicht überein.");
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
    <div className="flex min-h-screen flex-col">
      <main className="flex flex-1 items-center justify-center p-4">
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
              disabled={!ready}
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

          <div>
            <FieldLabel required htmlFor="password_confirm">
              Neues Passwort bestätigen
            </FieldLabel>
            <input
              id="password_confirm"
              type="password"
              required
              disabled={!ready}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading || !ready}
            className={`${buttonPrimaryClass} w-full`}
          >
            {loading ? "Wird gespeichert…" : "Passwort speichern"}
          </button>
        </form>
      </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
