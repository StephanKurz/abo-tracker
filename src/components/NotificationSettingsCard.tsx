"use client";

import { useState } from "react";
import { updateNotificationSettings } from "@/app/actions/profile";
import { sendTestNotificationEmail } from "@/app/actions/notifications";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, buttonSecondaryClass, cardClass } from "@/components/ui/formStyles";

export function NotificationSettingsCard({ notifyDaysBefore }: { notifyDaysBefore: number | null }) {
  const [notifyDays, setNotifyDays] = useState(
    notifyDaysBefore != null ? String(notifyDaysBefore) : "",
  );
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [notifyInfo, setNotifyInfo] = useState<string | null>(null);
  const [notifyLoading, setNotifyLoading] = useState(false);

  const [testMailError, setTestMailError] = useState<string | null>(null);
  const [testMailInfo, setTestMailInfo] = useState<string | null>(null);
  const [testMailLoading, setTestMailLoading] = useState(false);

  async function handleNotifySubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setNotifyError(null);
    setNotifyInfo(null);
    setNotifyLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateNotificationSettings(formData);
    setNotifyLoading(false);
    if (result.error) {
      setNotifyError(result.error);
    } else {
      setNotifyInfo("Benachrichtigungseinstellung gespeichert.");
    }
  }

  async function handleSendTestMail() {
    setTestMailError(null);
    setTestMailInfo(null);
    setTestMailLoading(true);
    const result = await sendTestNotificationEmail();
    setTestMailLoading(false);
    if (result.error) {
      setTestMailError(result.error);
    } else {
      setTestMailInfo("Testmail wurde versendet.");
    }
  }

  return (
    <form onSubmit={handleNotifySubmit} className={`${cardClass} space-y-3 p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold text-gray-900">Benachrichtigungen</h2>
      <p className="text-sm text-gray-600">
        Wir ermitteln automatisch das nächstgelegene Kündigungsdatum unter all deinen Abos und
        erinnern dich per E-Mail rechtzeitig vorher. Leer lassen, um keine Erinnerung zu erhalten.
      </p>

      <div>
        <FieldLabel htmlFor="notify_days_before">Tage vor nächstem Kündigungsdatum</FieldLabel>
        <input
          id="notify_days_before"
          name="notify_days_before"
          type="number"
          min={0}
          value={notifyDays}
          onChange={(e) => setNotifyDays(e.target.value.replace(/[^0-9]/g, ""))}
          className={inputClass}
        />
      </div>

      {notifyError && <p className="text-sm text-red-600">{notifyError}</p>}
      {notifyInfo && <p className="text-sm text-green-700">{notifyInfo}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={notifyLoading} className={buttonPrimaryClass}>
          {notifyLoading ? "Wird gespeichert…" : "Speichern"}
        </button>
        <button
          type="button"
          disabled={testMailLoading}
          onClick={handleSendTestMail}
          className={buttonSecondaryClass}
        >
          {testMailLoading ? "Wird gesendet…" : "Testmail senden"}
        </button>
      </div>

      {testMailError && <p className="text-sm text-red-600">{testMailError}</p>}
      {testMailInfo && <p className="text-sm text-green-700">{testMailInfo}</p>}
    </form>
  );
}
