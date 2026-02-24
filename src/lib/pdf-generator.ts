// src/lib/pdf-generator.ts
import { jsPDF } from "jspdf";

function sanitizeText(text: string): string {
  return text
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ");
}

function sanitizeFilename(text: string): string {
  return text
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "_")
    .slice(0, 80) || "row";
}

function createPDF(
  headers: string[],
  row: Record<string, string>,
  titleColumn?: string
): ArrayBuffer {
  const doc = new jsPDF();
  let y = 20;

  const name =
    (titleColumn ? row[titleColumn]?.trim() : null) ||
    row["Customer Name"]?.trim() ||
    row[headers[0]] ||
    "Survey Response";
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(sanitizeText(name), 14, y);
  y += 10;

  for (const header of headers) {
    const value = (row[header] ?? "").trim();
    if (!value) continue;

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(80, 80, 80);
    doc.text(sanitizeText(header), 14, y);
    y += 5;

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(sanitizeText(value), 180);
    for (const line of lines) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 14, y);
      y += 6;
    }
    y += 4;
  }

  return doc.output("arraybuffer");
}

export function generatePDFs(
  headers: string[],
  rows: Record<string, string>[],
  titleColumn?: string
): { filename: string; data: ArrayBuffer }[] {
  return rows.map((row, i) => {
    const nameCol = titleColumn || "Customer Name";
    const name = row[nameCol]?.trim() || `row_${i + 1}`;
    const filename = `${sanitizeFilename(name)}.pdf`;
    const data = createPDF(headers, row, titleColumn);
    return { filename, data };
  });
}
