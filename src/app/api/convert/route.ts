import { NextRequest, NextResponse } from "next/server";
import { parseCSV } from "@/lib/csv-parser";
import { generatePDFs } from "@/lib/pdf-generator";
import { getTransform } from "@/lib/transforms";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("csv") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No CSV file provided" },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const transformSlug = request.nextUrl.searchParams.get("transform");

    let headers: string[];
    let rows: Record<string, string>[];

    if (transformSlug) {
      const config = await getTransform(transformSlug);
      if (!config) {
        return NextResponse.json(
          { error: `Transform "${transformSlug}" not found` },
          { status: 404 }
        );
      }

      const parsed = parseCSV(csvText);

      headers = config.columns.map((col) => col.outputName);
      rows = parsed.rows.map((rawRow) => {
        const record: Record<string, string> = {};
        const rawValues = Object.values(rawRow);
        for (const col of config.columns) {
          record[col.outputName] = rawValues[col.sourceIndex] ?? "";
        }
        return record;
      });
    } else {
      const parsed = parseCSV(csvText);
      headers = parsed.headers;
      rows = parsed.rows;
    }

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "CSV contains no data rows" },
        { status: 400 }
      );
    }

    const pdfs = generatePDFs(headers, rows);

    const zip = new JSZip();
    for (const pdf of pdfs) {
      zip.file(pdf.filename, pdf.data);
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="survey-responses.zip"',
      },
    });
  } catch (error) {
    console.error("Conversion error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV" },
      { status: 500 }
    );
  }
}
