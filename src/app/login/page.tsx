"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";
import { isEmail } from "@/lib/validation";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    let email = identifier.trim();
    if (!isEmail(email)) {
      const { data: resolvedEmail, error: resolveError } = await supabase.rpc(
        "resolve_login_email",
        { identifier: email },
      );
      if (resolveError || !resolvedEmail) {
        setLoading(false);
        setError("Benutzername oder Passwort ist falsch.");
        return;
      }
      email = resolvedEmail;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (signInError) {
      if (signInError.message.toLowerCase().includes("confirm")) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError("Benutzername oder Passwort ist falsch.");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className={`${cardClass} w-full max-w-md`}>
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Anmelden</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel required htmlFor="identifier">
              Benutzername oder E-Mail-Adresse
            </FieldLabel>
            <input
              id="identifier"
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
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
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" disabled={loading} className={`${buttonPrimaryClass} w-full`}>
            {loading ? "Wird geprüft…" : "Anmelden"}
          </button>
        </form>

        <div className="mt-4 flex justify-between text-sm">
          <Link href="/register" className="text-orange-600 hover:underline">
            Registrieren
          </Link>
          <Link href="/forgot-password" className="text-orange-600 hover:underline">
            Passwort vergessen?
          </Link>
        </div>
        <p className="mt-3 text-center text-xs text-gray-500">
          <Link href="/datenschutz" className="hover:underline">
            Datenschutzhinweise
          </Link>
        </p>
      </div>
    </main>
  );
}
