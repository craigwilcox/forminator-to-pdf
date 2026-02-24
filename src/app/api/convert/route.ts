// src/app/api/convert/route.ts
import { NextRequest, NextResponse } from "next/server";
import { parseForminatorCSV } from "@/lib/csv-parser";
import { generatePDFs } from "@/lib/pdf-generator";
import JSZip from "jszip";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("csv") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No CSV file provided" }, { status: 400 });
    }

    const csvText = await file.text();
    const transform = request.nextUrl.searchParams.get("transform");
    const { headers, rows } = parseForminatorCSV(csvText, {
      skipTransform: transform !== "moores",
    });

    if (rows.length === 0) {
      return NextResponse.json({ error: "CSV contains no data rows" }, { status: 400 });
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
