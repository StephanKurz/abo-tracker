"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { RecommendWidget } from "@/components/RecommendWidget";
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
    <div className="w-full max-w-md space-y-4">
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element -- statische App-Icon-Route, keine Optimierung nötig */}
        <img src="/icon.png" alt="" className="mx-auto h-20 w-20" />
        <h1 className="mt-2 text-center text-3xl font-bold text-orange-600">Abo-Radar</h1>
        <p className="mt-1 text-center text-sm text-gray-600">Dein intelligenter Abo-Wächter</p>
      </div>
      <div className={cardClass}>
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Anmelden</h2>
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
            <PasswordInput
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
      </div>

      <div className={`${cardClass} flex justify-center`}>
        <RecommendWidget />
      </div>
    </div>
  );
}
