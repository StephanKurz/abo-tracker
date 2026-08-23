"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/validation";

export function PasswordCard() {
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwInfo, setPwInfo] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwInfo(null);

    if (!isPasswordValid(newPassword)) {
      setPwError("Bitte alle Passwort-Anforderungen für das neue Passwort erfüllen.");
      return;
    }

    if (newPassword !== newPasswordConfirm) {
      setPwError("Die Passwörter stimmen nicht überein.");
      return;
    }

    setPwLoading(true);
    const supabase = createClient();

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);

    if (updateError) {
      setPwError(updateError.message);
      return;
    }

    setPwInfo("Passwort erfolgreich geändert.");
    setNewPassword("");
    setNewPasswordConfirm("");
  }

  return (
    <form onSubmit={handlePasswordSubmit} className={`${cardClass} space-y-3 p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold text-gray-900">Passwort ändern</h2>

      <div>
        <FieldLabel required htmlFor="new_password">
          Neues Passwort
        </FieldLabel>
        <PasswordInput
          id="new_password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
          {PASSWORD_RULES.map((rule) => {
            const ok = rule.test(newPassword);
            return (
              <li key={rule.id} className={ok ? "text-green-700" : "text-gray-500"}>
                {ok ? "✓" : "○"} {rule.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <FieldLabel required htmlFor="new_password_confirm">
          Neues Passwort bestätigen
        </FieldLabel>
        <PasswordInput
          id="new_password_confirm"
          required
          value={newPasswordConfirm}
          onChange={(e) => setNewPasswordConfirm(e.target.value)}
        />
      </div>

      {pwError && <p className="text-sm text-red-600">{pwError}</p>}
      {pwInfo && <p className="text-sm text-green-700">{pwInfo}</p>}

      <button type="submit" disabled={pwLoading} className={buttonPrimaryClass}>
        {pwLoading ? "Wird geändert…" : "Passwort ändern"}
      </button>
    </form>
  );
}
