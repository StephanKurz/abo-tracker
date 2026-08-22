"use client";

import { useState } from "react";
import {
  BILLING_CYCLE_LABELS,
  formatCurrency,
  formatDate,
  getEffectiveCancellationDate,
  isFullyExpired,
} from "@/lib/subscriptions";
import type { DashboardRow } from "@/components/DashboardTable";

// jsPDFs Standardschriften decken nur WinAnsi (cp1252/Latin-1) ab. Intl kann je
// nach Laufzeit-ICU ein geschütztes oder schmales Leerzeichen zwischen Betrag
// und Währungssymbol einfügen, das außerhalb dieses Zeichensatzes liegt -
// defensiv auf ein normales Leerzeichen vereinheitlichen.
function pdfCurrency(amount: number | null | undefined): string {
  return formatCurrency(amount).replace(/[\u00A0\u202F]/g, " ");
}

export function PrintPdfButton({ rows }: { rows: DashboardRow[] }) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const [{ jsPDF }, { autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const active = rows.filter((s) => !isFullyExpired(s));
      const totalYearly = active.reduce((sum, s) => sum + (s.yearly_cost ?? 0), 0);
      const totalMonthly = totalYearly / 12;
      const activeUncanceled = active.filter((s) => !s.canceled_at);
      const totalYearlyUncanceled = activeUncanceled.reduce(
        (sum, s) => sum + (s.yearly_cost ?? 0),
        0,
      );
      const totalMonthlyUncanceled = totalYearlyUncanceled / 12;

      // Gleiche Standardsortierung wie der Anfangszustand der Übersicht
      // ("nextCancellation", aufsteigend).
      const sorted = [...rows].sort((a, b) => {
        const da = getEffectiveCancellationDate(a)?.getTime() ?? Infinity;
        const db = getEffectiveCancellationDate(b)?.getTime() ?? Infinity;
        return da - db;
      });

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const marginX = 14;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(234, 88, 12); // orange-600
      doc.text("Abo-Übersicht", marginX, 16);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text(`Stand: ${formatDate(new Date())}`, marginX, 22);

      function summaryBox(x: number, width: number, title: string, stats: [string, string][]) {
        const y = 28;
        const height = 26;
        doc.setDrawColor(209, 213, 219); // gray-300
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(x, y, width, height, 2, 2, "FD");

        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(55, 65, 81); // gray-700
        doc.text(title, x + 4, y + 7);

        const colWidth = width / stats.length;
        stats.forEach(([label, value], i) => {
          const cx = x + colWidth * i + colWidth / 2;
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(234, 88, 12); // orange-600
          doc.text(label, cx, y + 14, { align: "center" });
          doc.setFontSize(12);
          doc.setTextColor(17, 24, 39); // gray-900
          doc.text(value, cx, y + 21, { align: "center" });
        });
      }

      const boxWidth = (pageWidth - marginX * 2 - 8) / 2;
      summaryBox(marginX, boxWidth, "Alle Abos", [
        ["Pro Jahr", pdfCurrency(totalYearly)],
        ["Pro Monat", pdfCurrency(totalMonthly)],
        ["Anzahl", String(active.length)],
      ]);
      summaryBox(marginX + boxWidth + 8, boxWidth, "Ungekündigte Abos", [
        ["Pro Jahr", pdfCurrency(totalYearlyUncanceled)],
        ["Pro Monat", pdfCurrency(totalMonthlyUncanceled)],
        ["Anzahl", String(activeUncanceled.length)],
      ]);

      autoTable(doc, {
        startY: 60,
        margin: { left: marginX, right: marginX },
        styles: { fontSize: 8, cellPadding: 2, textColor: [55, 65, 81] },
        headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 18, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 32 },
          3: { cellWidth: 24 },
          4: { cellWidth: 22, halign: "right" },
          5: { cellWidth: 26, halign: "right" },
          6: { cellWidth: 26, halign: "right" },
          7: { cellWidth: 26, halign: "right" },
        },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index === 0) {
            const sub = sorted[data.row.index];
            data.cell.styles.textColor = sub.canceled_at ? [220, 38, 38] : [22, 163, 74];
            data.cell.styles.fontStyle = "bold";
          }
        },
        head: [
          [
            "Status",
            "Name",
            "Kategorie",
            "Abrechnung",
            "Betrag",
            "Jahreskosten",
            "Abschlussdatum",
            "Kündbar bis",
          ],
        ],
        body: sorted.map((sub) => {
          const nextCancellation = getEffectiveCancellationDate(sub);
          return [
            sub.canceled_at ? "Gekündigt" : "Aktiv",
            sub.name,
            sub.category_name,
            BILLING_CYCLE_LABELS[sub.billing_cycle] ?? sub.billing_cycle,
            pdfCurrency(sub.amount),
            pdfCurrency(sub.yearly_cost),
            formatDate(sub.start_date),
            nextCancellation ? formatDate(nextCancellation) : "–",
          ];
        }),
      });

      const stamp = new Date().toISOString().slice(0, 10);
      doc.save(`abo-uebersicht-${stamp}.pdf`);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={generating}
      aria-label="PDF herunterladen"
      title="PDF herunterladen"
      className="inline-flex items-center justify-center rounded-md border border-gray-400 bg-white p-2 text-gray-800 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
    </button>
  );
}
