import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import Papa from "papaparse";
import { saveTransform, TransformConfig } from "@/lib/transforms";

const anthropic = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rawCsvFile = formData.get("rawCsv") as File | null;
    const correctedCsvFile = formData.get("correctedCsv") as File | null;
    const slug = (formData.get("slug") as string)?.trim();
    const title = (formData.get("title") as string)?.trim();
    const description = (formData.get("description") as string)?.trim();

    if (!rawCsvFile || !correctedCsvFile) {
      return NextResponse.json(
        { error: "Both raw and corrected CSV files are required" },
        { status: 400 }
      );
    }
    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title are required" },
        { status: 400 }
      );
    }

    const rawText = await rawCsvFile.text();
    const correctedText = await correctedCsvFile.text();

    const rawParsed = Papa.parse<string[]>(rawText, { skipEmptyLines: true });
    const correctedParsed = Papa.parse<string[]>(correctedText, {
      skipEmptyLines: true,
    });

    const rawHeaders = rawParsed.data[0];
    const rawSample = rawParsed.data.slice(1, 6);
    const correctedHeaders = correctedParsed.data[0];
    const correctedSample = correctedParsed.data.slice(1, 6);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: `You are a data analyst. I have two CSVs: a "raw" export and a manually "corrected" version. I need you to figure out the column mapping from raw to corrected.

RAW CSV HEADERS (with column indices):
${rawHeaders.map((h, i) => `  [${i}] "${h}"`).join("\n")}

RAW SAMPLE ROWS:
${rawSample.map((row) => row.map((v) => `"${v}"`).join(", ")).join("\n")}

CORRECTED CSV HEADERS:
${correctedHeaders.map((h) => `  "${h}"`).join("\n")}

CORRECTED SAMPLE ROWS:
${correctedSample.map((row) => row.map((v) => `"${v}"`).join(", ")).join("\n")}

For each column in the CORRECTED CSV, determine which column index from the RAW CSV provides its data. Match by comparing the actual data values between raw and corrected rows.

Respond with ONLY a JSON array (no markdown, no explanation) where each element is:
{ "outputName": "<corrected column name>", "sourceIndex": <raw column index> }

The array should have one entry per corrected column, in the same order as the corrected headers.`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Failed to get AI response" },
        { status: 500 }
      );
    }

    let columns;
    try {
      columns = JSON.parse(textBlock.text);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON", raw: textBlock.text },
        { status: 500 }
      );
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      return NextResponse.json(
        { error: "AI returned invalid column mapping" },
        { status: 500 }
      );
    }

    for (const col of columns) {
      if (
        typeof col.outputName !== "string" ||
        typeof col.sourceIndex !== "number"
      ) {
        return NextResponse.json(
          { error: "Invalid column mapping entry", entry: col },
          { status: 500 }
        );
      }
    }

    const config: TransformConfig = {
      slug,
      title,
      description: description || `Upload a CSV for ${title}`,
      columns,
    };

    await saveTransform(config);

    return NextResponse.json(config);
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: "Failed to generate transform" },
      { status: 500 }
    );
  }
}
