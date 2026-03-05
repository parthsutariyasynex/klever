import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

const ALL_COLUMNS = [
  "klever_sku", "product_source", "source_name", "sku", "product_url",
  "product_name", "tyre_marking", "cost", "price", "set_price",
  "fitting_price", "offers", "brand", "brand_category", "plain_size",
  "size", "load_index", "runflat", "vehicle_type", "country", "year",
  "product_image_url", "source_date",
];

const NUMERIC_FIELDS = ["cost", "price", "set_price", "fitting_price", "year"];

export async function POST(req: NextRequest) {
  try {
    // console.log("API HIT");
    await connectDB();
    // console.log("DB Connected");
    const body = await req.json();
    // console.log("Body: ", body);
    const rows: Record<string, string>[] = body.data;
    // console.log("Rows length:", rows.length);
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    // Only require "sku" column
    const csvColumns = Object.keys(rows[0]);
    if (!csvColumns.includes("sku")) {
      return NextResponse.json(
        { error: "Missing required column: sku" },
        { status: 400 }
      );
    }

    // Process rows
    const operations: any[] = [];
    const skipped: { row: number; reason: string }[] = [];
    const failed: { row: number; reason: string }[] = [];

    // Get existing SKUs
    const existingSkus = new Set(
      (await Product.find({}, { sku: 1 }).lean()).map((p: any) => p.sku)
    );

    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const rowNum = i + 1;

      // Validate required field: sku
      if (!raw.sku || raw.sku.trim() === "") {
        failed.push({ row: rowNum, reason: "Missing SKU" });
        continue;
      }

      const trimmedSku = raw.sku.trim();

      // Skip duplicate SKUs
      if (existingSkus.has(trimmedSku)) {
        skipped.push({ row: rowNum, reason: `Duplicate SKU: ${trimmedSku}` });
        continue;
      }

      // Build document from whatever columns exist
      const doc: Record<string, any> = {};
      for (const col of ALL_COLUMNS) {
        if (NUMERIC_FIELDS.includes(col)) {
          const num = parseFloat(raw[col]);
          doc[col] = isNaN(num) ? 0 : num;
        } else {
          doc[col] = (raw[col] ?? "").trim();
        }
      }

      existingSkus.add(trimmedSku);

      operations.push({
        insertOne: { document: doc },
      });
    }

    let imported = 0;
    if (operations.length > 0) {
      const result = await Product.bulkWrite(operations, { ordered: false });
      imported = result.insertedCount;
    }

    return NextResponse.json({
      message: `Imported ${imported} product${imported !== 1 ? "s" : ""}. Skipped ${skipped.length}, Failed ${failed.length}.`,
      imported,
      skipped: skipped.length,
      failed: failed.length,
      details: { skipped: skipped.slice(0, 20), failed: failed.slice(0, 20) },
    });
  } catch (error: any) {
    console.error("POST /api/upload-csv error:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}
