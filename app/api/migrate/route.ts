import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

/*
  GET /api/migrate

  One-time migration: sets product_source = "supplier" on all documents
  that don't have product_source yet.

  Call this ONCE:  http://localhost:3000/api/migrate
*/
export async function GET() {
    try {
        await connectDB();

        // Count docs missing product_source
        const before = await Product.countDocuments({
            product_source: { $exists: false },
        });

        console.log(`[migrate] Found ${before} documents without product_source`);

        if (before === 0) {
            return NextResponse.json({
                message: "No migration needed — all documents already have product_source.",
                updated: 0,
            });
        }

        // Set all old docs to "supplier"
        const result = await Product.updateMany(
            { product_source: { $exists: false } },
            { $set: { product_source: "supplier" } }
        );

        console.log(`[migrate] Updated ${result.modifiedCount} documents → product_source: "supplier"`);

        return NextResponse.json({
            message: `Migration done! ${result.modifiedCount} documents updated to product_source: "supplier".`,
            updated: result.modifiedCount,
        });
    } catch (error: unknown) {
        console.error("[migrate] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Migration failed" },
            { status: 500 }
        );
    }
}
