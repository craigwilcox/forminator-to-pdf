import Papa from "papaparse";

export function parseCSV(csvText: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  const [rawHeaders, ...rawRows] = parsed.data;

  const rows = rawRows.map((row) => {
    const record: Record<string, string> = {};
    rawHeaders.forEach((h, i) => {
      record[h] = row[i] ?? "";
    });
    return record;
  });

  return { headers: rawHeaders, rows };
}
