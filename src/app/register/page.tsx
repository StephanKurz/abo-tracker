"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/validation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className={`${cardClass} w-full max-w-md`}>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Registrieren</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel required htmlFor="name">
              Name
            </FieldLabel>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

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

          <div>
            <FieldLabel required htmlFor="password">
              Passwort
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
                  <li
                    key={rule.id}
                    className={ok ? "text-green-700" : "text-gray-500"}
                  >
                    {ok ? "✓" : "○"} {rule.label}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <FieldLabel required htmlFor="password_confirm">
              Passwort bestätigen
            </FieldLabel>
            <input
              id="password_confirm"
              type="password"
              required
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={inputClass}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className={`${buttonPrimaryClass} w-full`}>
            {loading ? "Wird gesendet…" : "Registrieren"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Bereits registriert?{" "}
          <Link href="/login" className="text-orange-600 hover:underline">
            Anmelden
          </Link>
        </p>
        <p className="mt-3 text-center text-xs text-gray-500">
          <Link href="/datenschutz" className="hover:underline">
            Datenschutzhinweise
          </Link>
        </p>
      </div>
    </main>
  );
}
