import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import type { AnyBulkWriteOperation, InferSchemaType } from "mongoose";

type ProductType = InferSchemaType<typeof Product.schema>;

interface CSVRow {
  [key: string]: unknown;
}

// ---------- Helper Functions ----------

function parseNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  if (str === "") return undefined;
  const num = Number(str);
  return isNaN(num) ? undefined : num;
}

function safeString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  return str === "" ? undefined : str;
}

/* ── Competitor header aliases (same as /api/competitor-products/import) ── */
const COMPETITOR_ALIASES: Record<string, string> = {
  source: "source_name", source_name: "source_name", sourcename: "source_name",
  supplier: "source_name",
  item_code: "item_code", itemcode: "item_code", "item code": "item_code",
  code: "item_code",
  category: "category", brand_category: "category", brandcategory: "category",
  brand: "brand",
  tyre_pattern: "tyre_pattern", tyrepattern: "tyre_pattern", pattern: "tyre_pattern",
  product_name: "tyre_pattern", productname: "tyre_pattern", name: "tyre_pattern",
  tyre_name: "tyre_pattern",
  size: "size",
  runflat: "runflat", run_flat: "runflat", is_runflat: "runflat",
  year: "year", country: "country",
  price: "price", cost: "price",
  set_price: "set_price", setprice: "set_price",
  date: "date", source_date: "date", sourcedate: "date",
  created_at: "date", import_date: "date",
  url: "url", link: "url", product_url: "url", producturl: "url",
};

function normalizeCompetitorRow(row: CSVRow): CSVRow {
  const normalized: CSVRow = {};
  for (const [key, value] of Object.entries(row)) {
    const lowerKey = key.trim().toLowerCase().replace(/\s+/g, "_");
    const mappedKey = COMPETITOR_ALIASES[lowerKey] || COMPETITOR_ALIASES[key.trim().toLowerCase()] || lowerKey;
    if (!(mappedKey in normalized)) {
      normalized[mappedKey] = value;
    }
  }
  return normalized;
}

/* ── Auto-detect: is this CSV supplier or competitor data? ──
   Supplier CSVs have columns like: sku, product_name, cost, klever_sku, fitting_price
   Competitor CSVs have columns like: item_code, tyre_pattern, category (without sku)
*/
const SUPPLIER_ONLY_HEADERS = ["sku", "klever_sku", "fitting_price", "tyre_marking", "product_image_url", "load_index"];
const COMPETITOR_ONLY_HEADERS = ["item_code", "itemcode", "item code", "code", "tyre_pattern", "tyrepattern", "pattern"];

function detectSourceType(headers: string[]): "supplier" | "competitor" | "mixed" {
  const lower = headers.map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));

  const supplierScore = lower.filter(h => SUPPLIER_ONLY_HEADERS.includes(h)).length;
  const competitorScore = lower.filter(h => COMPETITOR_ONLY_HEADERS.includes(h)).length;
  const hasProductSourceCol = lower.includes("product_source");

  console.log(`[auto-detect] supplier headers found: ${supplierScore}, competitor headers found: ${competitorScore}, has product_source column: ${hasProductSourceCol}`);

  // If CSV has a product_source column, treat as mixed (per-row detection)
  if (hasProductSourceCol) return "mixed";
  // If has sku AND no item_code → supplier
  // If has item_code OR tyre_pattern (without sku) → competitor
  if (competitorScore > supplierScore) return "competitor";
  return "supplier";
}

function transformSupplierRow(row: CSVRow): Partial<ProductType> {
  return {
    product_source: "supplier",
    klever_sku: safeString(row.klever_sku),
    source_name: safeString(row.source_name),
    sku: safeString(row.sku) ?? "",
    product_url: safeString(row.product_url),
    product_name: safeString(row.product_name),
    tyre_marking: safeString(row.tyre_marking),
    tyre_pattern: safeString(row.tyre_pattern),
    category: safeString(row.category),
    item_code: safeString(row.item_code),
    cost: parseNumber(row.cost),
    price: parseNumber(row.price),
    set_price: parseNumber(row.set_price),
    fitting_price: parseNumber(row.fitting_price),
    offers: safeString(row.offers),
    brand: safeString(row.brand),
    brand_category: safeString(row.brand_category),
    plain_size: row.plain_size
      ? parseNumber(row.plain_size)
      : row.size
        ? parseNumber(String(row.size).replace(/[^0-9]/g, ""))
        : undefined,
    size: safeString(row.size),
    load_index: safeString(row.load_index),
    runflat: row.runflat != null && String(row.runflat).trim() !== ""
      ? (["true", "yes", "1"].includes(String(row.runflat).trim().toLowerCase()) ? "Yes" : "No")
      : undefined,
    vehicle_type: safeString(row.vehicle_type),
    country: safeString(row.country),
    year: parseNumber(row.year),
    product_image_url: safeString(row.product_image_url),
    source_date: safeString(row.source_date),
    date: safeString(row.date),
    url: safeString(row.url),
  };
}

function transformCompetitorRow(rawRow: CSVRow): Partial<ProductType> {
  const row = normalizeCompetitorRow(rawRow);
  return {
    product_source: "competitor",
    source_name: safeString(row.source_name) ?? "",
    item_code: safeString(row.item_code) ?? "",
    category: safeString(row.category) ?? "",
    brand: safeString(row.brand) ?? "",
    tyre_pattern: safeString(row.tyre_pattern) ?? "",
    size: safeString(row.size) ?? "",
    plain_size: row.size
      ? parseNumber(String(row.size).replace(/[^0-9]/g, ""))
      : undefined,
    runflat: row.runflat != null && String(row.runflat).trim() !== ""
      ? (["true", "yes", "1"].includes(String(row.runflat).trim().toLowerCase()) ? "Yes" : "No")
      : "No",
    year: parseNumber(row.year) ?? 0,
    country: safeString(row.country) ?? "",
    price: parseNumber(row.price) ?? 0,
    set_price: parseNumber(row.set_price) ?? 0,
    date: safeString(row.date) ?? "",
    url: safeString(row.url) ?? "",
  };
}

// Increase body size limit for large CSV files (default is ~1MB)
export const config = {
  maxDuration: 60,
};

// ---------- POST /api/products/import — CSV import ----------
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON format. The file may be too large. Try a smaller CSV." },
        { status: 400 }
      );
    }

    const rows: CSVRow[] = body?.data;

    console.log("[import] body keys:", Object.keys(body || {}));
    console.log("[import] rows is array:", Array.isArray(rows), "length:", rows?.length ?? 0);

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: `No data provided. Got body keys: ${Object.keys(body || {}).join(", ")}` },
        { status: 400 }
      );
    }

    // ── Auto-detect product_source from CSV headers ──
    const csvHeaders = Object.keys(rows[0]);
    // Allow override via request body (e.g., { data: [...], product_source: "competitor" })
    const forceType = body?.product_source as string | undefined;
    const detectedType = forceType === "competitor" || forceType === "supplier"
      ? forceType
      : detectSourceType(csvHeaders);

    console.log("\n=== CSV IMPORT DEBUG ===");
    console.log("CSV headers:", csvHeaders);
    console.log("Forced type:", forceType || "none");
    console.log("Detected type:", detectedType);
    console.log("Total rows:", rows.length);
    console.log("First row:", rows[0]);
    console.log("========================\n");

    let inserted = 0;
    let updated = 0;
    let failed = 0;
    let supplierCount = 0;
    let competitorCount = 0;
    const errors: string[] = [];

    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const operations: AnyBulkWriteOperation<ProductType>[] = [];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];

        // 1) Determine product_source for this row
        let rowSourceType: "supplier" | "competitor" = "supplier";

        // Check per-row product_source column first
        const rowType = row.product_source && typeof row.product_source === "string"
          ? row.product_source.trim().toLowerCase()
          : "";
        if (rowType === "competitor" || rowType === "supplier") {
          rowSourceType = rowType;
        } else if (detectedType === "mixed") {
          // Fallback: detect per-row based on fields
          rowSourceType = (row.item_code || row.itemcode) && !row.sku ? "competitor" : "supplier";
        } else {
          rowSourceType = detectedType === "competitor" ? "competitor" : "supplier";
        }





        // transform based on detected type
        if (rowSourceType === "competitor") {
          competitorCount++;
          const data = transformCompetitorRow(row);

          const uniqueKey =
            data.item_code ||
            safeString(row.sku) ||
            safeString(row.item_code);

          if (!uniqueKey) {
            failed++;
            errors.push(`Row ${i + j + 1}: Missing 'item_code'`);
            continue;
          }

          operations.push({
            updateOne: {
              filter: { item_code: uniqueKey, product_source: "competitor" },
              update: { $set: data },
              upsert: true,
            },
          });

        } else {
          supplierCount++;
          const data = transformSupplierRow(row);

          if (!data.sku) {
            failed++;
            errors.push(`Row ${i + j + 1}: Missing required field 'sku'`);
            continue;
          }

          operations.push({
            updateOne: {
              filter: { sku: data.sku, product_source: "supplier" },
              update: { $set: data },
              upsert: true,
            },
          });
        }
      }

      // Execute bulkWrite per batch, OUTSIDE the inner 'j' loop
      if (operations.length > 0) {
        const result = await Product.bulkWrite(operations, { ordered: false });
        inserted += result.upsertedCount || 0;
        updated += result.modifiedCount || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete (${detectedType}): ${inserted} inserted, ${updated} updated, ${failed} failed | supplier: ${supplierCount}, competitor: ${competitorCount}`,
      detectedType,
      details: { inserted, updated, failed, total: rows.length, supplierCount, competitorCount },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error("POST /api/products/import error:", error);
    return NextResponse.json(
      { error: "Failed to import products" },
      { status: 500 }
    );
  }
}