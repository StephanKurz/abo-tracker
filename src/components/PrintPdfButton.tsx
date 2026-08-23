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
import { APP_VERSION } from "@/lib/version";

// jsPDFs Standardschriften decken nur WinAnsi (cp1252/Latin-1) ab. Intl kann je
// nach Laufzeit-ICU ein geschütztes oder schmales Leerzeichen zwischen Betrag
// und Währungssymbol einfügen, das außerhalb dieses Zeichensatzes liegt -
// defensiv auf ein normales Leerzeichen vereinheitlichen.
function pdfCurrency(amount: number | null | undefined): string {
  return formatCurrency(amount).replace(/[\u00A0\u202F]/g, " ");
}

// Lädt das App-Icon als Data-URL für den PDF-Kopf. Best-effort: schlägt der
// Abruf fehl, wird die PDF trotzdem erzeugt, nur ohne Icon.
async function loadAppIconDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/icon.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function PrintPdfButton({ rows, ownerName }: { rows: DashboardRow[]; ownerName: string }) {
  const [generating, setGenerating] = useState(false);

  async function handleDownload() {
    setGenerating(true);
    try {
      const [{ jsPDF }, { autoTable }, iconDataUrl] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
        loadAppIconDataUrl(),
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

      const iconSize = 10;
      const titleX = iconDataUrl ? marginX + iconSize + 3 : marginX;
      if (iconDataUrl) {
        doc.addImage(iconDataUrl, "PNG", marginX, 5, iconSize, iconSize);
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(234, 88, 12); // orange-600
      doc.text(`Abo-Radar — ${ownerName}`, titleX, 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(107, 114, 128); // gray-500
      doc.text(`Stand: ${formatDate(new Date())}`, titleX, 19);

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

      const pageHeight = doc.internal.pageSize.getHeight();
      function drawFooter(pageNumber: number) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(107, 114, 128); // gray-500
        doc.text(`Abo-Radar ${APP_VERSION}`, marginX, pageHeight - 8);
        doc.text(`Seite ${pageNumber}`, pageWidth - marginX, pageHeight - 8, { align: "right" });
      }

      const CENTER_COLUMNS = new Set([0]);
      const RIGHT_COLUMNS = new Set([4, 5, 6, 7]);

      autoTable(doc, {
        startY: 60,
        margin: { left: marginX, right: marginX, bottom: 16 },
        styles: { fontSize: 8, cellPadding: 2, textColor: [55, 65, 81] },
        headStyles: {
          fillColor: [234, 88, 12],
          textColor: 255,
          fontStyle: "bold",
          overflow: "visible", // Spaltenköpfe dürfen nie umbrechen
        },
        didDrawPage: (data) => drawFooter(data.pageNumber),
        columnStyles: {
          0: { cellWidth: 18 },
          1: { cellWidth: "auto" },
          2: { cellWidth: 30 },
          3: { cellWidth: 22 },
          4: { cellWidth: 22 },
          5: { cellWidth: 26 },
          6: { cellWidth: 32 },
          7: { cellWidth: 26 },
        },
        didParseCell: (data) => {
          // Ausrichtung des Spaltenkopfs folgt immer der Ausrichtung des Inhalts.
          if (CENTER_COLUMNS.has(data.column.index)) data.cell.styles.halign = "center";
          if (RIGHT_COLUMNS.has(data.column.index)) data.cell.styles.halign = "right";
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
      const nameSlug = ownerName
        .normalize("NFKD")
        .replace(/[\u0300-\u036F]/g, "")
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase();
      doc.save(`abo-uebersicht-${nameSlug}-${stamp}.pdf`);
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
      className="inline-flex items-center justify-center rounded-md bg-orange-600 p-2 text-white shadow-sm hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-gray-400"
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
