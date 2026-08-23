"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveCheckinSettings, testCheckinConnection, deleteCheckinSettings } from "@/app/actions/checkin";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { FieldLabel } from "@/components/ui/FieldLabel";
import {
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
  inputClass,
} from "@/components/ui/formStyles";
import { formatDateTime } from "@/lib/sharing";

export type CheckinSettingsView = {
  checkinEmail: string;
  imapHost: string;
  imapPort: number;
  imapUser: string;
  hasPassword: boolean;
  enabled: boolean;
  lastPolledAt: string | null;
  lastError: string | null;
} | null;

export type CheckinItemView = {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
};

const STATUS_LABELS: Record<string, string> = {
  received: "Empfangen",
  question_sent: "Rückfrage gesendet",
  applied: "Übernommen",
  rejected: "Verworfen",
  failed: "Fehlgeschlagen",
};

export function CheckinCard({ settings }: { settings: CheckinSettingsView }) {
  const router = useRouter();
  const [checkinEmail, setCheckinEmail] = useState(settings?.checkinEmail ?? "");
  const [imapHost, setImapHost] = useState(settings?.imapHost ?? "");
  const [imapPort, setImapPort] = useState(String(settings?.imapPort ?? 993));
  const [imapUser, setImapUser] = useState(settings?.imapUser ?? "");
  const [imapPassword, setImapPassword] = useState("");
  const [enabled, setEnabled] = useState(settings?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState<"save" | "test" | "delete" | null>(null);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy("save");
    const result = await saveCheckinSettings({
      checkinEmail,
      imapHost,
      imapPort: Number(imapPort),
      imapUser,
      imapPassword,
      enabled,
    });
    setBusy(null);
    if (result.error) {
      setError(result.error);
    } else {
      setInfo("Einstellungen gespeichert.");
      setImapPassword("");
      router.refresh();
    }
  }

  async function handleTest() {
    setError(null);
    setInfo(null);
    setBusy("test");
    const result = await testCheckinConnection();
    setBusy(null);
    if (result.error) setError(result.error);
    else setInfo("Verbindung erfolgreich!");
  }

  async function handleDelete() {
    setError(null);
    setInfo(null);
    setBusy("delete");
    const result = await deleteCheckinSettings();
    setBusy(null);
    if (result.error) {
      setError(result.error);
    } else {
      setCheckinEmail("");
      setImapHost("");
      setImapPort("993");
      setImapUser("");
      setImapPassword("");
      setEnabled(true);
      setInfo("Einstellungen gelöscht.");
      router.refresh();
    }
  }

  return (
    <div className={`${cardClass} space-y-3 p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold text-gray-900">E-Mail-Check-in</h2>
      <p className="text-sm text-gray-600">
        Leite Abo-Bestätigungen an dein Check-in-Postfach weiter oder beschreibe ein Abo formlos
        per E-Mail — Abo-Radar liest das Postfach regelmäßig aus und trägt die Abos
        automatisch ein. Bei Unklarheiten bekommst du eine Rückfrage per E-Mail.
      </p>

      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <FieldLabel required htmlFor="checkin_email">
            Check-in-E-Mail-Adresse
          </FieldLabel>
          <input
            id="checkin_email"
            type="email"
            required
            value={checkinEmail}
            onChange={(e) => setCheckinEmail(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <FieldLabel required htmlFor="imap_host">
              IMAP-Host
            </FieldLabel>
            <input
              id="imap_host"
              type="text"
              required
              value={imapHost}
              onChange={(e) => setImapHost(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="w-24">
            <FieldLabel required htmlFor="imap_port">
              Port
            </FieldLabel>
            <input
              id="imap_port"
              type="number"
              required
              value={imapPort}
              onChange={(e) => setImapPort(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <FieldLabel required htmlFor="imap_user">
            IMAP-Benutzername
          </FieldLabel>
          <input
            id="imap_user"
            type="text"
            required
            value={imapUser}
            onChange={(e) => setImapUser(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel required={!settings?.hasPassword} htmlFor="imap_password">
            IMAP-Passwort
          </FieldLabel>
          <PasswordInput
            id="imap_password"
            required={!settings?.hasPassword}
            value={imapPassword}
            onChange={(e) => setImapPassword(e.target.value)}
            autoComplete="new-password"
          />
          {settings?.hasPassword && (
            <p className="mt-1 text-xs text-gray-500">
              Ein Passwort ist gespeichert. Leer lassen, um es zu behalten.
            </p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="h-4 w-4 accent-orange-600"
          />
          Postfach-Überwachung aktiv
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {info && <p className="text-sm text-green-700">{info}</p>}

        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={busy !== null} className={buttonPrimaryClass}>
            {busy === "save" ? "Wird gespeichert…" : "Speichern"}
          </button>
          {settings && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={handleTest}
              className={buttonSecondaryClass}
            >
              {busy === "test" ? "Wird geprüft…" : "Verbindung testen"}
            </button>
          )}
          {settings && (
            <button
              type="button"
              disabled={busy !== null}
              onClick={handleDelete}
              className="text-sm text-red-700 hover:underline"
            >
              Löschen
            </button>
          )}
        </div>
      </form>

      {settings && (
        <p className="text-xs text-gray-500">
          {settings.lastPolledAt
            ? `Letzter Abruf: ${formatDateTime(settings.lastPolledAt)}`
            : "Noch kein Abruf erfolgt."}
          {settings.lastError && (
            <span className="block text-red-600">Letzter Fehler: {settings.lastError}</span>
          )}
        </p>
      )}
    </div>
  );
}

export function CheckinActivityCard({ items }: { items: CheckinItemView[] }) {
  if (items.length === 0) return null;

  return (
    <div className={`${cardClass} space-y-2 p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold text-gray-900">Letzte Aktivität</h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id} className="text-sm text-gray-700">
            <p>{item.subject || "(ohne Betreff)"}</p>
            <p className="text-xs text-gray-500">
              {STATUS_LABELS[item.status] ?? item.status} · {formatDateTime(item.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
