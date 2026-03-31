import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

/**
 * GET /api/products/price-history
 *
 * Returns historical price data for a single product (matched by SKU / item_code).
 * Used to render a "Price vs Date" chart in the modal.
 *
 * Query params:
 *   sku           – supplier product SKU
 *   item_code     – competitor product item code
 *   source        – "supplier" | "competitor"
 *   priceField    – field to chart, e.g. "cost", "fitting_price", "price", "set_price"
 */
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);

        const sku = searchParams.get("sku") ?? "";
        const itemCode = searchParams.get("item_code") ?? "";
        const source = searchParams.get("source") ?? "supplier";
        const priceField = searchParams.get("priceField") ?? "cost";

        if (!sku && !itemCode) {
            return NextResponse.json({ error: "sku or item_code is required" }, { status: 400 });
        }

        // Build filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: Record<string, any> = {
            product_source: source === "competitor" ? "competitor" : { $ne: "competitor" },
        };

        if (sku) {
            const orConditions: any[] = [
                { sku: { $in: [sku, ...(isNaN(Number(sku)) ? [] : [Number(sku)])] } }
            ];
            if (/^[0-9a-fA-F]{24}$/.test(sku)) {
                const { ObjectId } = require('mongodb');
                orConditions.push({ _id: new ObjectId(sku) });
            }
            filter.$or = orConditions;
        } else if (itemCode) {
            const orConditions: any[] = [
                { item_code: { $in: [itemCode, ...(isNaN(Number(itemCode)) ? [] : [Number(itemCode)])] } },
                { sku: { $in: [itemCode, ...(isNaN(Number(itemCode)) ? [] : [Number(itemCode)])] } }
            ];

            // If itemCode is an ObjectID, it means this competitor product lacks an item_code/sku.
            // We must find its history by matching its core identifiers instead!
            if (/^[0-9a-fA-F]{24}$/.test(itemCode)) {
                const { ObjectId } = require('mongodb');
                const targetDoc = await Product.collection.findOne({ _id: new ObjectId(itemCode) });
                if (targetDoc) {
                    // Match historical products with the same core attributes
                    filter.$or = [
                        { _id: new ObjectId(itemCode) },
                        {
                            brand: targetDoc.brand,
                            tyre_pattern: targetDoc.tyre_pattern,
                            size: targetDoc.size,
                            source_name: targetDoc.source_name
                        }
                    ];
                } else {
                    orConditions.push({ _id: new ObjectId(itemCode) });
                    filter.$or = orConditions;
                }
            } else {
                filter.$or = orConditions;
            }
        }

        const records = await Product.collection.find(filter)
            .project({ source_date: 1, [priceField]: 1, createdAt: 1 })
            .sort({ source_date: 1, createdAt: 1 })
            .limit(100)
            .toArray();

        const data = records
            .map((r: any) => ({
                date: r.source_date ?? r.createdAt,
                value: r[priceField] ?? null,
            }))
            .filter((d) => d.value !== null && d.value !== undefined);

        return NextResponse.json({ data, priceField });
    } catch (error: unknown) {
        console.error("GET /api/products/price-history error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch price history" },
            { status: 500 }
        );
    }
}
