import Papa from "papaparse";

export function parseCSV(csvText: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const { headers, rawRows } = parseCSVRaw(csvText);

  const rows = rawRows.map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((h, i) => {
      record[h] = row[i] ?? "";
    });
    return record;
  });

  return { headers, rows };
}

export function parseCSVRaw(csvText: string): {
  headers: string[];
  rawRows: string[][];
} {
  const parsed = Papa.parse<string[]>(csvText, {
    skipEmptyLines: true,
  });

  const [headers, ...rawRows] = parsed.data;
  return { headers, rawRows };
}
