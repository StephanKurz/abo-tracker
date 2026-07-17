"use client";

import { BILLING_CYCLE_LABELS, formatCurrency, formatDate, isFullyExpired } from "@/lib/subscriptions";
import { buttonPrimaryClass } from "@/components/ui/formStyles";
import type { Subscription } from "@/lib/subscriptions";

type Row = Subscription & { category_name: string };

const COLUMN_WIDTHS = ["8%", "30%", "14%", "14%", "14%", "20%"];

function CategoryTable({ rows }: { rows: Row[] }) {
  return (
    <table className="w-full table-fixed text-left text-sm">
      <colgroup>
        {COLUMN_WIDTHS.map((width, i) => (
          <col key={i} style={{ width }} />
        ))}
      </colgroup>
      <thead className="text-gray-600">
        <tr>
          <th className="py-1 pr-2 print:py-0.5">Status</th>
          <th className="py-1 pr-2 print:py-0.5">Name</th>
          <th className="py-1 pr-2 print:py-0.5">Abrechnung</th>
          <th className="py-1 pr-2 print:py-0.5">Betrag</th>
          <th className="py-1 pr-2 print:py-0.5">Jahreskosten</th>
          <th className="py-1 pr-2 print:py-0.5">Abschlussdatum</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((sub) => (
          <tr key={sub.id} className="border-t border-gray-100">
            <td className="py-1 pr-2 print:py-0.5">
              {sub.canceled_at ? (
                <span title="Gekündigt" aria-label="Gekündigt" className="text-red-600">
                  ✗
                </span>
              ) : (
                <span title="Nicht gekündigt" aria-label="Nicht gekündigt" className="text-green-600">
                  ✓
                </span>
              )}
            </td>
            <td className="truncate py-1 pr-2 print:py-0.5">{sub.name}</td>
            <td className="py-1 pr-2 print:py-0.5">{BILLING_CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle}</td>
            <td className="py-1 pr-2 print:py-0.5">{formatCurrency(sub.amount)}</td>
            <td className="py-1 pr-2 print:py-0.5">{formatCurrency(sub.yearly_cost)}</td>
            <td className="py-1 pr-2 print:py-0.5">{formatDate(sub.start_date)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function PrintView({
  subscriptions,
  userName,
  userEmail,
}: {
  subscriptions: Row[];
  userName: string;
  userEmail: string;
}) {
  const active = subscriptions.filter((s) => !isFullyExpired(s));

  const groups = new Map<string, Row[]>();
  for (const sub of subscriptions) {
    const key = sub.category_name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(sub);
  }
  const categoryNames = [...groups.keys()].sort((a, b) => a.localeCompare(b, "de"));
  const grandTotal = active.reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);
  const grandTotalUncanceled = active
    .filter((s) => !s.canceled_at)
    .reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);

  return (
    <div>
      <div className="no-print mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Abos drucken</h1>
        <button onClick={() => window.print()} className={buttonPrimaryClass}>
          Jetzt drucken
        </button>
      </div>

      <div className="print-only mb-2 hidden text-xs text-gray-500">
        {userName} · {userEmail}
      </div>

      <div className="space-y-6 rounded-lg bg-white p-6 shadow-md print:space-y-3 print:rounded-none print:p-0 print:shadow-none">
        <h2 className="text-xl font-bold text-gray-900 print:mb-1 print:text-base">
          Alle Abos nach Kategorie
        </h2>

        {categoryNames.length === 0 && (
          <p className="text-sm text-gray-600">Keine Abos vorhanden.</p>
        )}

        {categoryNames.map((categoryName) => {
          const rows = groups.get(categoryName)!;
          const subtotal = rows
            .filter((s) => !isFullyExpired(s))
            .reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);
          return (
            <div key={categoryName} className="break-inside-avoid">
              <h3 className="mb-1 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-900 print:text-sm">
                {categoryName}
              </h3>
              <CategoryTable rows={rows} />
              <p className="mt-1 text-right text-sm font-semibold text-gray-800 print:text-xs">
                Zwischensumme: {formatCurrency(subtotal)} / Jahr
              </p>
            </div>
          );
        })}

        <div className="border-t border-gray-300 pt-3 text-right print:pt-1">
          <p className="text-lg font-bold text-gray-900 print:text-sm">
            Gesamtsumme: {formatCurrency(grandTotal)} / Jahr
          </p>
          <p className="text-sm font-semibold text-gray-700 print:text-xs">
            Gesamtsumme ungekündigt: {formatCurrency(grandTotalUncanceled)} / Jahr
          </p>
        </div>
      </div>

      <div className="print-only mt-2 hidden text-center text-xs text-gray-500">
        © Kurz Intelligence - Reutlingen - kostenlose App
      </div>
    </div>
  );
}
