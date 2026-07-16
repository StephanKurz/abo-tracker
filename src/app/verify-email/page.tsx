"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, cardClass } from "@/components/ui/formStyles";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "signup",
    });
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message);
      return;
    }

    router.push("/dashboard");
  }

  async function handleResend() {
    setError(null);
    setInfo(null);
    setResending(true);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });
    setResending(false);
    if (resendError) {
      setError(resendError.message);
    } else {
      setInfo("Ein neuer Code wurde gesendet.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className={`${cardClass} w-full max-w-md`}>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">E-Mail bestätigen</h1>
        <p className="mb-6 text-sm text-gray-600">
          Wir haben einen sechsstelligen Code an <strong>{email || "deine E-Mail-Adresse"}</strong> gesendet.
          Bitte gib ihn hier ein, um deinen Account freizuschalten.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel required htmlFor="code">
              Bestätigungscode
            </FieldLabel>
            <input
              id="code"
              type="text"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              className={`${inputClass} text-center text-lg tracking-[0.5em]`}
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {info && <p className="text-sm text-green-700">{info}</p>}

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className={`${buttonPrimaryClass} w-full`}
          >
            {loading ? "Wird geprüft…" : "Account freischalten"}
          </button>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !email}
            className={`${buttonSecondaryClass} w-full`}
          >
            {resending ? "Wird gesendet…" : "Code erneut senden"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailForm />
    </Suspense>
  );
}
