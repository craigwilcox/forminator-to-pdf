import Papa from "papaparse";

const CATEGORY_COLUMNS = [
  "Clothing/Garment",
  "Home Decor (Sewing/Quilting/Embroidery)",
  "Quilting/Applique",
  "Embroidery/Applique",
  "Business/Craft Fairs/Items for Sale",
  "Other",
  "All of the Above?",
];

function needsTransform(headers: string[]): boolean {
  return (
    headers.filter((h) => h === "Checkbox").length > 0 &&
    headers.filter((h) => h === "Number").length > 0
  );
}

function transformRows(
  rawHeaders: string[],
  rawRows: string[][]
): { headers: string[]; rows: Record<string, string>[] } {
  const cbIndices = rawHeaders
    .map((h, i) => (h === "Checkbox" ? i : -1))
    .filter((i) => i >= 0);
  const numIndices = rawHeaders
    .map((h, i) => (h === "Number" ? i : -1))
    .filter((i) => i >= 0);
  const drop = new Set([...cbIndices, ...numIndices]);

  const insertPos = cbIndices.length > 0 ? cbIndices[0] : rawHeaders.length;

  const newHeaders: string[] = [];
  for (let i = 0; i < rawHeaders.length; i++) {
    if (i === insertPos) newHeaders.push(...CATEGORY_COLUMNS);
    if (!drop.has(i)) newHeaders.push(rawHeaders[i]);
  }

  const rows: Record<string, string>[] = rawRows.map((rawRow) => {
    while (rawRow.length < rawHeaders.length) rawRow.push("");

    const catValues: string[] = CATEGORY_COLUMNS.map((_, idx) => {
      if (idx < numIndices.length) return rawRow[numIndices[idx]];
      if (idx < cbIndices.length) return rawRow[cbIndices[idx]];
      return "";
    });

    const newRow: string[] = [];
    for (let i = 0; i < rawRow.length; i++) {
      if (i === insertPos) newRow.push(...catValues);
      if (!drop.has(i)) newRow.push(rawRow[i]);
    }

    const record: Record<string, string> = {};
    newHeaders.forEach((h, i) => {
      record[h] = newRow[i] ?? "";
    });
    return record;
  });

  return { headers: newHeaders, rows };
}

export function parseForminatorCSV(
  csvText: string,
  { skipTransform = false }: { skipTransform?: boolean } = {}
): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  const [rawHeaders, ...rawRows] = parsed.data;

  if (!skipTransform && needsTransform(rawHeaders)) {
    return transformRows(rawHeaders, rawRows);
  }

  const rows = rawRows.map((row) => {
    const record: Record<string, string> = {};
    rawHeaders.forEach((h, i) => {
      record[h] = row[i] ?? "";
    });
    return record;
  });

  return { headers: rawHeaders, rows };
}
