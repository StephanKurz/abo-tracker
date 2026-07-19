"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteCollaboratorRow,
  inviteCollaborator,
  lookupInviteEmail,
  revokeCollaborator,
  updateCollaboratorPermission,
} from "@/app/actions/sharing";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { inputClass, buttonPrimaryClass, cardClass } from "@/components/ui/formStyles";
import { formatDateTime, PERMISSION_LABELS, STATUS_LABELS } from "@/lib/sharing";
import type { CollaboratorStatus, InvitePermission } from "@/lib/sharing";

type CollaboratorRow = {
  id: string;
  label: string;
  permission: InvitePermission;
  status: CollaboratorStatus;
  invitedAt: string;
  respondedAt: string | null;
};

function statusText(row: CollaboratorRow): string {
  if (row.status === "pending") return `Eingeladen am ${formatDateTime(row.invitedAt)}`;
  if (row.status === "revoked" && row.respondedAt) {
    return `Widerrufen am ${formatDateTime(row.respondedAt)}`;
  }
  return STATUS_LABELS[row.status];
}

export function ShareAccessCard({
  hasOverview,
  collaborators,
}: {
  hasOverview: boolean;
  collaborators: CollaboratorRow[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<InvitePermission>("full");
  const [checkInfo, setCheckInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!hasOverview) return null;

  async function handleEmailBlur() {
    setCheckInfo(null);
    if (!email.trim()) return;
    const result = await lookupInviteEmail(email);
    if (result.error) return;
    setCheckInfo(
      result.found
        ? `Konto gefunden: ${result.name}`
        : "Noch kein Konto mit dieser E-Mail-Adresse — die Einladung erscheint automatisch, sobald sich diese Person registriert.",
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await inviteCollaborator(formData);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setInfo("Einladung versendet.");
      setEmail("");
      setCheckInfo(null);
      router.refresh();
    }
  }

  async function handlePermissionChange(id: string, value: string) {
    await updateCollaboratorPermission(id, value);
    router.refresh();
  }

  async function handleRevoke(id: string) {
    if (!window.confirm("Zugriff wirklich entziehen?")) return;
    await revokeCollaborator(id);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Diesen Eintrag wirklich endgültig löschen?")) return;
    await deleteCollaboratorRow(id);
    router.refresh();
  }

  return (
    <div className={`${cardClass} space-y-3 p-4 sm:p-5`}>
      <h2 className="text-lg font-semibold text-gray-900">Zugriff teilen</h2>
      <p className="text-sm text-gray-600">
        Lade eine andere Person ein, deine Abo-Übersicht einzusehen oder zu bearbeiten.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <FieldLabel required htmlFor="invite-email">
            E-Mail-Adresse
          </FieldLabel>
          <input
            id="invite-email"
            name="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            className={inputClass}
          />
          {checkInfo && <p className="mt-1 text-xs text-gray-500">{checkInfo}</p>}
        </div>
        <div className="min-w-[200px]">
          <FieldLabel required htmlFor="invite-permission">
            Berechtigung
          </FieldLabel>
          <select
            id="invite-permission"
            name="permission"
            required
            value={permission}
            onChange={(e) => setPermission(e.target.value as InvitePermission)}
            className={inputClass}
          >
            <option value="full">{PERMISSION_LABELS.full}</option>
            <option value="full_own">{PERMISSION_LABELS.full_own}</option>
            <option value="read">{PERMISSION_LABELS.read}</option>
          </select>
        </div>
        <button type="submit" disabled={loading} className={buttonPrimaryClass}>
          {loading ? "Wird eingeladen…" : "Einladen"}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {info && <p className="text-sm text-green-700">{info}</p>}

      {collaborators.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {collaborators.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex-1 text-gray-900">{c.label}</span>
              <span className="text-xs text-gray-500">{statusText(c)}</span>
              {(c.status === "pending" || c.status === "accepted") && (
                <>
                  <select
                    value={c.permission}
                    onChange={(e) => handlePermissionChange(c.id, e.target.value)}
                    className="rounded-md border border-gray-400 bg-white px-2 py-1 text-sm"
                  >
                    <option value="full">{PERMISSION_LABELS.full}</option>
                    <option value="full_own">{PERMISSION_LABELS.full_own}</option>
                    <option value="read">{PERMISSION_LABELS.read}</option>
                  </select>
                  <button
                    onClick={() => handleRevoke(c.id)}
                    className="text-sm text-red-700 hover:underline"
                  >
                    Widerrufen
                  </button>
                </>
              )}
              {c.status === "revoked" && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-sm text-red-700 hover:underline"
                >
                  Löschen
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
