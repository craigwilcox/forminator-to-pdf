/**
 * Seed script to populate the Moores transform in Vercel KV.
 *
 * Run with: npx tsx scripts/seed-moores.ts
 *
 * Requires KV_REST_API_URL and KV_REST_API_TOKEN environment variables.
 *
 * This recreates the hardcoded Moores column mapping that was previously
 * built into csv-parser.ts. The mapping assumes the raw Forminator export
 * has these columns in order:
 *   [0] Customer Name
 *   [1] Email
 *   [2] Number (→ Clothing/Garment)
 *   [3] Number (→ Home Decor)
 *   [4] Number (→ Quilting/Applique)
 *   [5] Number (→ Embroidery/Applique)
 *   [6] Number (→ Business/Craft Fairs)
 *   [7] Number (→ Other)
 *   [8] Number (→ All of the Above?)
 *   ... remaining columns
 *
 * Adjust sourceIndex values below to match the actual Moores CSV structure.
 * The easiest way: use /setup with an actual raw + corrected CSV pair.
 */

import { kv } from "@vercel/kv";

async function main() {
  const config = {
    slug: "moores",
    title: "Moores Survey CSV to PDF",
    description:
      "Upload a Forminator survey CSV export to generate per-respondent PDFs.",
    columns: [
      { outputName: "Customer Name", sourceIndex: 0 },
      { outputName: "Email", sourceIndex: 1 },
      { outputName: "Clothing/Garment", sourceIndex: 2 },
      {
        outputName: "Home Decor (Sewing/Quilting/Embroidery)",
        sourceIndex: 3,
      },
      { outputName: "Quilting/Applique", sourceIndex: 4 },
      { outputName: "Embroidery/Applique", sourceIndex: 5 },
      { outputName: "Business/Craft Fairs/Items for Sale", sourceIndex: 6 },
      { outputName: "Other", sourceIndex: 7 },
      { outputName: "All of the Above?", sourceIndex: 8 },
    ],
  };

  await kv.set(`transform:${config.slug}`, config);
  console.log("Seeded Moores transform to KV");
}

main().catch(console.error);
