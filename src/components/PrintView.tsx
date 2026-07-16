"use client";

import { BILLING_CYCLE_LABELS, formatCurrency, formatDate } from "@/lib/subscriptions";
import { buttonPrimaryClass } from "@/components/ui/formStyles";
import type { Subscription } from "@/lib/subscriptions";

type Row = Subscription & { category_name: string };

export function PrintView({ subscriptions }: { subscriptions: Row[] }) {
  const groups = new Map<string, Row[]>();
  for (const sub of subscriptions) {
    const key = sub.category_name;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(sub);
  }
  const categoryNames = [...groups.keys()].sort((a, b) => a.localeCompare(b, "de"));
  const grandTotal = subscriptions.reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Abos drucken</h1>
        <button onClick={() => window.print()} className={buttonPrimaryClass}>
          Jetzt drucken
        </button>
      </div>

      <div className="space-y-6 rounded-lg bg-white p-6 shadow-md print:shadow-none">
        <h2 className="text-xl font-bold text-gray-900">Alle Abos nach Kategorie</h2>

        {categoryNames.length === 0 && (
          <p className="text-sm text-gray-600">Keine Abos vorhanden.</p>
        )}

        {categoryNames.map((categoryName) => {
          const rows = groups.get(categoryName)!;
          const subtotal = rows.reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);
          return (
            <div key={categoryName} className="break-inside-avoid">
              <h3 className="mb-2 border-b border-gray-300 pb-1 text-lg font-semibold text-gray-900">
                {categoryName}
              </h3>
              <table className="w-full text-left text-sm">
                <thead className="text-gray-600">
                  <tr>
                    <th className="py-1 pr-2">Name</th>
                    <th className="py-1 pr-2">Abrechnung</th>
                    <th className="py-1 pr-2">Betrag</th>
                    <th className="py-1 pr-2">Jahreskosten</th>
                    <th className="py-1 pr-2">Abschlussdatum</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((sub) => (
                    <tr key={sub.id} className="border-t border-gray-100">
                      <td className="py-1 pr-2">{sub.name}</td>
                      <td className="py-1 pr-2">
                        {BILLING_CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle}
                      </td>
                      <td className="py-1 pr-2">{formatCurrency(sub.amount)}</td>
                      <td className="py-1 pr-2">{formatCurrency(sub.yearly_cost)}</td>
                      <td className="py-1 pr-2">{formatDate(sub.start_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-1 text-right text-sm font-semibold text-gray-800">
                Zwischensumme: {formatCurrency(subtotal)} / Jahr
              </p>
            </div>
          );
        })}

        <p className="border-t border-gray-300 pt-3 text-right text-lg font-bold text-gray-900">
          Gesamtsumme: {formatCurrency(grandTotal)} / Jahr
        </p>
      </div>
    </div>
  );
}
