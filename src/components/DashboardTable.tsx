"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BILLING_CYCLE_LABELS,
  getEffectiveCancellationDate,
  isFullyExpired,
  formatCurrency,
  formatDate,
} from "@/lib/subscriptions";
import { canWriteRow } from "@/lib/sharing";
import type { Subscription } from "@/lib/subscriptions";
import type { Role } from "@/lib/sharing";

type Row = Subscription & { category_name: string };
type SortColumn = "startDate" | "nextCancellation";

export function DashboardTable({
  subscriptions,
  viewerId,
  role,
}: {
  subscriptions: Row[];
  viewerId: string;
  role: Role;
}) {
  const [sortColumn, setSortColumn] = useState<SortColumn>("nextCancellation");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const nextCancellationById = useMemo(() => {
    const map = new Map<string, Date | null>();
    for (const sub of subscriptions) {
      map.set(sub.id, getEffectiveCancellationDate(sub));
    }
    return map;
  }, [subscriptions]);

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      const da =
        sortColumn === "startDate"
          ? a.start_date
            ? new Date(a.start_date).getTime()
            : Infinity
          : (nextCancellationById.get(a.id)?.getTime() ?? Infinity);
      const db =
        sortColumn === "startDate"
          ? b.start_date
            ? new Date(b.start_date).getTime()
            : Infinity
          : (nextCancellationById.get(b.id)?.getTime() ?? Infinity);
      return sortDir === "asc" ? da - db : db - da;
    });
  }, [subscriptions, sortColumn, sortDir, nextCancellationById]);

  const active = subscriptions.filter((s) => !isFullyExpired(s));
  const totalYearly = active.reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);
  const totalMonthly = totalYearly / 12;

  const activeUncanceled = active.filter((s) => !s.canceled_at);
  const totalYearlyUncanceled = activeUncanceled.reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);
  const totalMonthlyUncanceled = totalYearlyUncanceled / 12;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-1 flex-wrap gap-6 rounded-lg bg-white p-4 shadow-md">
          <h2 className="w-full text-sm font-semibold text-gray-700">Alle Abos</h2>
          <div>
            <p className="text-xs text-gray-500">Gesamtsumme pro Jahr</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalYearly)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Gesamtsumme pro Monat</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalMonthly)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Anzahl Abos</p>
            <p className="text-xl font-bold text-gray-900">{subscriptions.length}</p>
          </div>
        </div>

        <div className="flex flex-1 flex-wrap gap-6 rounded-lg bg-white p-4 shadow-md">
          <h2 className="w-full text-sm font-semibold text-gray-700">Ungekündigte Abos</h2>
          <div>
            <p className="text-xs text-gray-500">Gesamtsumme pro Jahr</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalYearlyUncanceled)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Gesamtsumme pro Monat</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalMonthlyUncanceled)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Anzahl Abos</p>
            <p className="text-xl font-bold text-gray-900">{activeUncanceled.length}</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-md">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-gray-200 bg-white text-gray-600">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Kategorie</th>
              <th className="px-4 py-3">Abrechnung</th>
              <th className="px-4 py-3 text-right">Betrag</th>
              <th className="px-4 py-3 text-right">Jahreskosten</th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => toggleSort("startDate")}
                  className="flex w-full items-center justify-end gap-1 whitespace-nowrap font-medium hover:text-orange-600"
                >
                  <span>Abschlussdatum</span>
                  {sortColumn === "startDate" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => toggleSort("nextCancellation")}
                  className="flex w-full items-center justify-end gap-1 whitespace-nowrap font-medium hover:text-orange-600"
                >
                  <span>Kündbar bis</span>
                  {sortColumn === "nextCancellation" && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                </button>
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sorted.map((sub) => {
              const nextCancellation = nextCancellationById.get(sub.id) ?? null;
              return (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center">
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
                  <td className="px-4 py-3 font-medium text-gray-900">{sub.name}</td>
                  <td className="px-4 py-3 text-gray-700">{sub.category_name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {BILLING_CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(sub.amount)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(sub.yearly_cost)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatDate(sub.start_date)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">
                    {nextCancellation ? formatDate(nextCancellation) : "–"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/subscriptions/${sub.id}`}
                      className="text-orange-600 hover:underline"
                    >
                      {canWriteRow(role, viewerId, sub.created_by) ? "Bearbeiten" : "Ansehen"}
                    </Link>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-500">
                  Noch keine Abos erfasst.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
