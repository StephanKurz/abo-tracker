"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FieldLabel } from "@/components/ui/FieldLabel";
import {
  inputClass,
  textareaClass,
  buttonPrimaryClass,
  buttonSecondaryClass,
  cardClass,
} from "@/components/ui/formStyles";
import {
  BILLING_CYCLE_LABELS,
  CANCELLATION_MODE_LABELS,
  NOTICE_PERIOD_LABELS,
  computeNextCancellationDate,
  computeYearlyCost,
  formatAmountInput,
  formatCurrency,
  formatDate,
  parseGermanAmount,
} from "@/lib/subscriptions";
import type { Category, Subscription } from "@/lib/subscriptions";

type ActionResult = { error: string | null } | void;

export function SubscriptionForm({
  categories,
  initial,
  action,
  onDelete,
}: {
  categories: Category[];
  initial?: Subscription;
  action: (formData: FormData) => Promise<ActionResult>;
  onDelete?: () => Promise<ActionResult>;
}) {
  const router = useRouter();
  const [startDate, setStartDate] = useState(initial?.start_date ?? "");
  const [billingCycle, setBillingCycle] = useState(initial?.billing_cycle ?? "monthly");
  const [minTermMonths, setMinTermMonths] = useState(
    initial?.min_term_months != null ? String(initial.min_term_months) : "",
  );
  const [amount, setAmount] = useState(
    initial?.amount != null ? formatAmountInput(initial.amount) : "",
  );
  const [cancellationMode, setCancellationMode] = useState(initial?.cancellation_mode ?? "");
  const [noticePeriod, setNoticePeriod] = useState(initial?.notice_period ?? "");
  const [canceledAt, setCanceledAt] = useState(initial?.canceled_at ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const yearlyCost = useMemo(() => {
    const n = parseGermanAmount(amount);
    if (!amount || Number.isNaN(n)) return null;
    return computeYearlyCost(n, billingCycle);
  }, [amount, billingCycle]);

  const earliestCancellation = useMemo(() => {
    if (!startDate || !minTermMonths) return null;
    const start = new Date(startDate);
    const result = new Date(start);
    result.setMonth(result.getMonth() + Number(minTermMonths));
    return result;
  }, [startDate, minTermMonths]);

  const nextCancellation = useMemo(() => {
    return computeNextCancellationDate(
      {
        start_date: startDate || null,
        min_term_months: minTermMonths ? Number(minTermMonths) : null,
        cancellation_mode: cancellationMode || null,
        notice_period: noticePeriod || null,
      },
      canceledAt ? new Date(canceledAt) : new Date(),
    );
  }, [startDate, minTermMonths, cancellationMode, noticePeriod, canceledAt]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await action(formData);
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  async function handleDelete() {
    if (!onDelete) return;
    if (!window.confirm("Dieses Abo wirklich löschen?")) return;
    const result = await onDelete();
    if (result?.error) setError(result.error);
  }

  return (
    <form onSubmit={handleSubmit} className={`${cardClass} space-y-5`}>
      <div>
        <FieldLabel required htmlFor="name">
          Name
        </FieldLabel>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={initial?.name}
          className={inputClass}
        />
      </div>

      <div>
        <FieldLabel htmlFor="description">Beschreibung</FieldLabel>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={initial?.description ?? ""}
          className={textareaClass}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="start_date">Abschlussdatum</FieldLabel>
          <input
            id="start_date"
            name="start_date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel required htmlFor="billing_cycle">
            Abrechnung
          </FieldLabel>
          <select
            id="billing_cycle"
            name="billing_cycle"
            required
            value={billingCycle}
            onChange={(e) => setBillingCycle(e.target.value)}
            className={inputClass}
          >
            <option value="monthly">{BILLING_CYCLE_LABELS.monthly}</option>
            <option value="yearly">{BILLING_CYCLE_LABELS.yearly}</option>
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="min_term_months">Mindestlaufzeit (Monate)</FieldLabel>
          <input
            id="min_term_months"
            name="min_term_months"
            type="number"
            min={0}
            value={minTermMonths}
            onChange={(e) => setMinTermMonths(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel>Frühestes Kündigungsdatum</FieldLabel>
          <input
            type="text"
            disabled
            readOnly
            value={earliestCancellation ? formatDate(earliestCancellation) : "wird berechnet"}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel required htmlFor="amount">
            Betrag pro Abrechnungseinheit (€)
          </FieldLabel>
          <input
            id="amount"
            name="amount"
            type="text"
            inputMode="decimal"
            required
            value={amount}
            onChange={(e) =>
              setAmount(e.target.value.replace(/[^0-9,]/g, "").replace(/(,.*),/g, "$1"))
            }
            onBlur={() => {
              const n = parseGermanAmount(amount);
              if (amount && !Number.isNaN(n)) setAmount(formatAmountInput(n));
            }}
            placeholder="0,00"
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel>Jahreskosten</FieldLabel>
          <input
            type="text"
            disabled
            readOnly
            value={yearlyCost != null ? formatCurrency(yearlyCost) : "wird berechnet"}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel required htmlFor="category_id">
            Kategorie
          </FieldLabel>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={initial?.category_id ?? ""}
            className={inputClass}
          >
            <option value="" disabled>
              Bitte wählen…
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Noch keine Kategorien.{" "}
              <Link href="/categories" className="text-orange-600 hover:underline">
                Jetzt anlegen
              </Link>
            </p>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="cancellation_mode">Kündigungsmodus</FieldLabel>
          <select
            id="cancellation_mode"
            name="cancellation_mode"
            value={cancellationMode}
            onChange={(e) => setCancellationMode(e.target.value)}
            className={inputClass}
          >
            <option value="">–</option>
            {Object.entries(CANCELLATION_MODE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="notice_period">Kündigungsfrist</FieldLabel>
          <select
            id="notice_period"
            name="notice_period"
            value={noticePeriod}
            onChange={(e) => setNoticePeriod(e.target.value)}
            className={inputClass}
          >
            <option value="">–</option>
            {Object.entries(NOTICE_PERIOD_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <FieldLabel htmlFor="canceled_at">Gekündigt am</FieldLabel>
          <input
            id="canceled_at"
            name="canceled_at"
            type="date"
            value={canceledAt}
            onChange={(e) => setCanceledAt(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <FieldLabel>
            {canceledAt ? "Vertragsende" : "Nächstes Kündigungsdatum"}
          </FieldLabel>
          <input
            type="text"
            disabled
            readOnly
            value={nextCancellation ? formatDate(nextCancellation) : "wird berechnet"}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={loading} className={buttonPrimaryClass}>
          {loading ? "Wird gespeichert…" : "Speichern"}
        </button>
        <button type="button" onClick={() => router.push("/dashboard")} className={buttonSecondaryClass}>
          Abbrechen
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="ml-auto rounded-md border border-red-300 px-4 py-2 font-semibold text-red-700 hover:bg-red-50"
          >
            Löschen
          </button>
        )}
      </div>
    </form>
  );
}
