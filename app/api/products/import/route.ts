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

function parseBoolean(value: unknown): boolean | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim().toLowerCase();
  if (str === "") return undefined;
  if (["true", "yes", "1"].includes(str)) return true;
  if (["false", "no", "0"].includes(str)) return false;
  return undefined;
}

function parseDate(value: unknown): Date | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  if (str === "") return undefined;
  const date = new Date(str);
  return isNaN(date.getTime()) ? undefined : date;
}

function transformRow(row: CSVRow): Partial<ProductType> {
  return {
    klever_sku: row.klever_sku ? String(row.klever_sku).trim() : undefined,
    product_source: row.product_source ? String(row.product_source).trim() : undefined,
    source_name: row.source_name ? String(row.source_name).trim() : undefined,
    sku: row.sku ? String(row.sku).trim() : "",
    product_url: row.product_url ? String(row.product_url).trim() : undefined,
    product_name: row.product_name ? String(row.product_name).trim() : undefined,
    tyre_marking: row.tyre_marking ? String(row.tyre_marking).trim() : undefined,
    cost: parseNumber(row.cost),
    price: parseNumber(row.price),
    set_price: parseNumber(row.set_price),
    fitting_price: parseNumber(row.fitting_price),
    offers: row.offers ? String(row.offers).trim() : undefined,
    brand: row.brand ? String(row.brand).trim() : undefined,
    brand_category: row.brand_category ? String(row.brand_category).trim() : undefined,
    plain_size: row.plain_size ? String(row.plain_size).trim() : (row.size ? String(row.size).replace(/[^0-9]/g, "") : undefined),
    size: row.size ? String(row.size).trim() : undefined,
    load_index: parseNumber(row.load_index),
    runflat: parseBoolean(row.runflat),
    vehicle_type: row.vehicle_type ? String(row.vehicle_type).trim() : undefined,
    country: row.country ? String(row.country).trim() : undefined,
    year: parseNumber(row.year),
    product_image_url: row.product_image_url
      ? String(row.product_image_url).trim()
      : undefined,
    source_date: parseDate(row.source_date),
  };
}

// ---------- POST /api/products/import — CSV import ----------
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON format. Make sure you are sending proper JSON." },
        { status: 400 }
      );
    }

    const rows: CSVRow[] = body?.data;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json(
        { error: "No data provided. Please upload a valid CSV file." },
        { status: 400 }
      );
    }

    let inserted = 0;
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    const batchSize = 100;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const operations: AnyBulkWriteOperation<ProductType>[] = [];

      for (let j = 0; j < batch.length; j++) {
        const row = batch[j];
        const data = transformRow(row);

        if (!data.sku) {
          failed++;
          errors.push(`Row ${i + j + 1}: Missing required field 'sku'`);
          continue;
        }

        operations.push({
          updateOne: {
            filter: { sku: data.sku },
            update: { $set: data },
            upsert: true,
          },
        });
      }

      if (operations.length > 0) {
        const result = await Product.bulkWrite(operations, { ordered: false });
        inserted += result.upsertedCount || 0;
        updated += result.modifiedCount || 0;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import complete: ${inserted} inserted, ${updated} updated, ${failed} failed`,
      details: { inserted, updated, failed, total: rows.length },
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