"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateProfileName } from "@/app/actions/profile";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";
import { PASSWORD_RULES, isPasswordValid } from "@/lib/validation";

export function AccountForm({ name, email }: { name: string; email: string }) {
  const [nameValue, setNameValue] = useState(name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameInfo, setNameInfo] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwInfo, setPwInfo] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleNameSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNameError(null);
    setNameInfo(null);
    setNameLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfileName(formData);
    setNameLoading(false);
    if (result.error) {
      setNameError(result.error);
    } else {
      setNameInfo("Name gespeichert.");
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwInfo(null);

    if (!isPasswordValid(newPassword)) {
      setPwError("Bitte alle Passwort-Anforderungen für das neue Passwort erfüllen.");
      return;
    }

    setPwLoading(true);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: currentPassword,
    });
    if (signInError) {
      setPwLoading(false);
      setPwError("Aktuelles Passwort ist falsch.");
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setPwLoading(false);

    if (updateError) {
      setPwError(updateError.message);
      return;
    }

    setPwInfo("Passwort erfolgreich geändert.");
    setCurrentPassword("");
    setNewPassword("");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleNameSubmit} className={`${cardClass} space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900">Profil</h2>

        <div>
          <FieldLabel htmlFor="email">E-Mail-Adresse</FieldLabel>
          <input id="email" type="email" value={email} disabled readOnly className={inputClass} />
        </div>

        <div>
          <FieldLabel required htmlFor="name">
            Name
          </FieldLabel>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            className={inputClass}
          />
        </div>

        {nameError && <p className="text-sm text-red-600">{nameError}</p>}
        {nameInfo && <p className="text-sm text-green-700">{nameInfo}</p>}

        <button type="submit" disabled={nameLoading} className={buttonPrimaryClass}>
          {nameLoading ? "Wird gespeichert…" : "Name speichern"}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className={`${cardClass} space-y-4`}>
        <h2 className="text-lg font-semibold text-gray-900">Passwort ändern</h2>

        <div>
          <FieldLabel required htmlFor="current_password">
            Aktuelles Passwort
          </FieldLabel>
          <input
            id="current_password"
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel required htmlFor="new_password">
            Neues Passwort
          </FieldLabel>
          <input
            id="new_password"
            type="password"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
          />
          <ul className="mt-2 space-y-0.5 text-xs">
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

        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        {pwInfo && <p className="text-sm text-green-700">{pwInfo}</p>}

        <button type="submit" disabled={pwLoading} className={buttonPrimaryClass}>
          {pwLoading ? "Wird geändert…" : "Passwort ändern"}
        </button>
      </form>
    </div>
  );
}
