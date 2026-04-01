import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import type { InferSchemaType } from "mongoose";
import dayjs from "dayjs";

type ProductType = InferSchemaType<typeof Product.schema>;

interface CSVRow {
    [key: string]: unknown;
}

/* ─── Column alias map ─── */
const HEADER_ALIASES: Record<string, string> = {
    source: "source", source_name: "source", sourcename: "source",
    product_source: "source", supplier: "source",
    item_code: "item_code", itemcode: "item_code", "item code": "item_code",
    code: "item_code", sku: "item_code", product_code: "item_code",
    category: "category", brand_category: "category", brandcategory: "category",
    brand: "brand",
    tyre_pattern: "tyre_pattern", tyrepattern: "tyre_pattern", pattern: "tyre_pattern",
    product_name: "tyre_pattern", productname: "tyre_pattern", name: "tyre_pattern",
    tyre_name: "tyre_pattern",
    size: "size", load_index: "load_index", loadindex: "load_index",
    runflat: "runflat", run_flat: "runflat", is_runflat: "runflat",
    year: "year", country: "country",
    price: "price", cost: "cost",
    set_price: "set_price", setprice: "set_price",
    // ── date fields → stored raw (ISO / whatever CSV has) ──
    date: "source_date", source_date: "source_date", sourcedate: "source_date",
    created_at: "source_date", import_date: "source_date",
    url: "url", link: "url", product_url: "url", producturl: "url",
};

function normalizeRow(row: CSVRow): CSVRow {
    const out: CSVRow = {};
    for (const [key, value] of Object.entries(row)) {
        const lk = key.trim().toLowerCase().replace(/\s+/g, "_");
        const mk = HEADER_ALIASES[lk] || HEADER_ALIASES[key.trim().toLowerCase()] || lk;
        if (!(mk in out)) out[mk] = value;
    }
    return out;
}

function parseNumber(v: unknown): number | null {
    if (v == null) return null;
    const n = Number(String(v).trim());
    return isNaN(n) ? null : n;
}

function safeString(v: unknown): string | null {
    if (v == null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
}

function detectRunflatFromUrl(url: string | undefined | null): boolean {
    return url ? /run[\s_-]?flat/i.test(url) : false;
}

/** Store raw date string from CSV; fall back to today's ISO date */
function rawDate(v: unknown): string {
    const s = String(v ?? "").trim();
    return s || dayjs().format("YYYY-MM-DD");
}

const PRICE_FIELDS = ["cost", "price", "set_price", "fitting_price"] as const;

/**
 * Version-aware upsert — creates a new historical record when prices change.
 * Old record → is_latest=0 (archived). New record → is_latest=1.
 */
async function versionedUpsert(
    filter: Record<string, unknown>,
    newData: Record<string, unknown>
): Promise<"inserted" | "updated" | "skipped"> {
    const col = Product.collection;
    const existing = await col.findOne({ ...filter, is_latest: 1 });

    if (!existing) {
        await col.insertOne({ ...newData, is_latest: 1 });
        return "inserted";
    }

    const priceChanged = PRICE_FIELDS.some(
        (f) => newData[f] != null && newData[f] !== existing[f]
    );
    const dateChanged = newData.source_date && newData.source_date !== existing.source_date;

    if (!priceChanged && !dateChanged) return "skipped";

    await col.updateOne({ _id: existing._id }, { $set: { is_latest: 0 } });
    await col.insertOne({ ...newData, is_latest: 1, created_by: existing._id });
    return "updated";
}

function transformRow(rawRow: CSVRow): Partial<ProductType> & { item_code: string } {
    const row = normalizeRow(rawRow);
    const price = parseNumber(row.price) ?? parseNumber(row.cost) ?? 0;
    const url = safeString(row.url) ?? "";

    let runflat = "No";
    if (row.runflat != null && String(row.runflat).trim() !== "") {
        runflat = ["true", "yes", "1"].includes(String(row.runflat).trim().toLowerCase()) ? "Yes" : "No";
    } else if (detectRunflatFromUrl(url)) {
        runflat = "Yes";
    }

    return {
        product_source: "competitor",
        source_name: safeString(row.source) ?? "",
        item_code: safeString(row.item_code) ?? "",
        category: safeString(row.category) ?? "",
        brand: safeString(row.brand) ?? "",
        tyre_pattern: safeString(row.tyre_pattern) ?? "",
        size: safeString(row.size) ?? "",
        load_index: safeString(row.load_index) ?? "",
        runflat,
        year: parseNumber(row.year) ?? 0,
        country: safeString(row.country) ?? "",
        price,
        set_price: parseNumber(row.set_price) ?? 0,
        source_date: rawDate(row.source_date),   // ← raw, never formatted
        url,
    } as Partial<ProductType> & { item_code: string };
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

        const originalHeaders = Object.keys(rows[0]);
        const normalizedFirstRow = normalizeRow(rows[0]);
        const transformedFirstRow = transformRow(rows[0]);

        console.log("=== COMPETITOR CSV IMPORT DEBUG ===");
        console.log("Original CSV headers:", originalHeaders);
        console.log("Normalized keys:", Object.keys(normalizedFirstRow));
        console.log("First row (transformed):", transformedFirstRow);
        console.log("==================================");

        let inserted = 0;
        let updated = 0;
        let skipped = 0;
        let failed = 0;
        const errors: string[] = [];

        const batchSize = 50;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);

            for (let j = 0; j < batch.length; j++) {
                const data = transformRow(batch[j]);

                if (!data.item_code) {
                    failed++;
                    errors.push(`Row ${i + j + 1}: Missing required field 'item_code'`);
                    continue;
                }

                try {
                    const res = await versionedUpsert(
                        { item_code: data.item_code, product_source: "competitor" },
                        { ...(data as Record<string, unknown>), product_source: "competitor" }
                    );
                    if (res === "inserted") inserted++;
                    else if (res === "updated") updated++;
                    else skipped++;
                } catch (e: any) {
                    failed++;
                    errors.push(`Row ${i + j + 1}: ${e.message}`);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: `Import complete: ${inserted} inserted, ${updated} updated, ${skipped} skipped, ${failed} failed`,
            details: { inserted, updated, skipped, failed, total: rows.length },
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
            debug: { originalHeaders, normalizedKeys: Object.keys(normalizedFirstRow), firstRowTransformed: transformedFirstRow },
        });
    } catch (error) {
        console.error("POST /api/competitor-products/import error:", error);
        return NextResponse.json({ error: "Failed to import competitor products" }, { status: 500 });
    }
}
