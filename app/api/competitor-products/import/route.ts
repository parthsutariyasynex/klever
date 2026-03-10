import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CompetitorProduct from "@/models/CompetitorProduct";
import type { AnyBulkWriteOperation, InferSchemaType } from "mongoose";

type CompetitorProductType = InferSchemaType<typeof CompetitorProduct.schema>;

interface CSVRow {
    [key: string]: unknown;
}

/* ──────────────────────────────────────────────
   Column alias map
   Maps all known CSV header variations to our
   competitor_products field names.
   Keys are lowercase, spaces → underscores.
   ────────────────────────────────────────────── */
const HEADER_ALIASES: Record<string, string> = {
    // source
    source: "source",
    source_name: "source",
    sourcename: "source",
    product_source: "source",
    supplier: "source",

    // item_code
    item_code: "item_code",
    itemcode: "item_code",
    "item code": "item_code",
    code: "item_code",
    sku: "item_code",
    product_code: "item_code",

    // category
    category: "category",
    brand_category: "category",
    brandcategory: "category",

    // brand
    brand: "brand",

    // tyre_pattern
    tyre_pattern: "tyre_pattern",
    tyrepattern: "tyre_pattern",
    pattern: "tyre_pattern",
    product_name: "tyre_pattern",
    productname: "tyre_pattern",
    name: "tyre_pattern",
    tyre_name: "tyre_pattern",

    // size
    size: "size",

    // runflat
    runflat: "runflat",
    run_flat: "runflat",
    is_runflat: "runflat",

    // year
    year: "year",

    // country
    country: "country",

    // price
    price: "price",
    cost: "price",

    // set_price
    set_price: "set_price",
    setprice: "set_price",

    // date
    date: "date",
    source_date: "date",
    sourcedate: "date",
    created_at: "date",
    import_date: "date",

    // url
    url: "url",
    link: "url",
    product_url: "url",
    producturl: "url",
};

/** Normalize a row's keys using HEADER_ALIASES */
function normalizeRow(row: CSVRow): CSVRow {
    const normalized: CSVRow = {};
    for (const [key, value] of Object.entries(row)) {
        const lowerKey = key.trim().toLowerCase().replace(/\s+/g, "_");
        const mappedKey = HEADER_ALIASES[lowerKey] || HEADER_ALIASES[key.trim().toLowerCase()] || lowerKey;
        // Only set if not already set (first match wins)
        if (!(mappedKey in normalized)) {
            normalized[mappedKey] = value;
        }
    }
    return normalized;
}

function parseNumber(value: unknown): number | null {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    if (str === "") return null;
    const num = Number(str);
    return isNaN(num) ? null : num;
}

function parseBoolean(value: unknown): boolean {
    if (value === null || value === undefined) return false;
    const str = String(value).trim().toLowerCase();
    return ["true", "yes", "1"].includes(str);
}

function safeString(value: unknown): string | null {
    if (value === null || value === undefined) return null;
    const str = String(value).trim();
    return str === "" ? null : str;
}

function transformRow(rawRow: CSVRow): Partial<CompetitorProductType> & { item_code: string } {
    const row = normalizeRow(rawRow);
    return {
        source: safeString(row.source) ?? null,
        item_code: safeString(row.item_code) ?? "",
        category: safeString(row.category) ?? null,
        brand: safeString(row.brand) ?? null,
        tyre_pattern: safeString(row.tyre_pattern) ?? null,
        size: safeString(row.size) ?? null,
        runflat: parseBoolean(row.runflat),
        year: parseNumber(row.year) ?? null,
        country: safeString(row.country) ?? null,
        price: parseNumber(row.price) ?? null,
        set_price: parseNumber(row.set_price) ?? null,
        date: safeString(row.date) ?? null,
        url: safeString(row.url) ?? null,
    } as Partial<CompetitorProductType> & { item_code: string };
}

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

        // ── DEBUG: Log CSV headers and first row ──
        const originalHeaders = Object.keys(rows[0]);
        const normalizedFirstRow = normalizeRow(rows[0]);
        const transformedFirstRow = transformRow(rows[0]);
        console.log("=== COMPETITOR CSV IMPORT DEBUG ===");
        console.log("Original CSV headers:", originalHeaders);
        console.log("Normalized keys:", Object.keys(normalizedFirstRow));
        console.log("First row (original):", rows[0]);
        console.log("First row (normalized):", normalizedFirstRow);
        console.log("First row (transformed):", transformedFirstRow);
        console.log("==================================");

        let inserted = 0;
        let updated = 0;
        let failed = 0;
        const errors: string[] = [];

        const batchSize = 100;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const operations: AnyBulkWriteOperation<CompetitorProductType>[] = [];

            for (let j = 0; j < batch.length; j++) {
                const row = batch[j];
                const data = transformRow(row);

                if (!data.item_code) {
                    failed++;
                    errors.push(`Row ${i + j + 1}: Missing required field 'item_code'`);
                    continue;
                }

                operations.push({
                    updateOne: {
                        filter: { item_code: data.item_code },
                        update: { $set: data },
                        upsert: true,
                    },
                });
            }

            if (operations.length > 0) {
                const result = await CompetitorProduct.bulkWrite(operations, { ordered: false });
                inserted += result.upsertedCount || 0;
                updated += result.modifiedCount || 0;
            }
        }

        return NextResponse.json({
            success: true,
            message: `Import complete: ${inserted} inserted, ${updated} updated, ${failed} failed`,
            details: { inserted, updated, failed, total: rows.length },
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
            debug: {
                originalHeaders,
                normalizedKeys: Object.keys(normalizedFirstRow),
                firstRowOriginal: rows[0],
                firstRowTransformed: transformedFirstRow,
            },
        });
    } catch (error) {
        console.error("POST /api/competitor-products/import error:", error);
        return NextResponse.json(
            { error: "Failed to import competitor products" },
            { status: 500 }
        );
    }
}
