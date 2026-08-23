"use client";

import { useState } from "react";
import { updateProfileName } from "@/app/actions/profile";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";

export function ProfileCard({ name, email }: { name: string; email: string }) {
  const [nameValue, setNameValue] = useState(name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameInfo, setNameInfo] = useState<string | null>(null);
  const [nameLoading, setNameLoading] = useState(false);

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

  return (
    <form onSubmit={handleNameSubmit} className={`${cardClass} space-y-3 p-4 sm:p-5`}>
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
  );
}
