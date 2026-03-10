import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

/*
  GET /api/migrate

  One-time migration: sets source_type = "supplier" on all documents
  that don't have source_type yet.

  Call this ONCE:  http://localhost:3000/api/migrate
*/
export async function GET() {
    try {
        await connectDB();

        // Count docs missing source_type
        const before = await Product.countDocuments({
            source_type: { $exists: false },
        });

        console.log(`[migrate] Found ${before} documents without source_type`);

        if (before === 0) {
            return NextResponse.json({
                message: "No migration needed — all documents already have source_type.",
                updated: 0,
            });
        }

        // Set all old docs to "supplier"
        const result = await Product.updateMany(
            { source_type: { $exists: false } },
            { $set: { source_type: "supplier" } }
        );

        console.log(`[migrate] Updated ${result.modifiedCount} documents → source_type: "supplier"`);

        return NextResponse.json({
            message: `Migration done! ${result.modifiedCount} documents updated to source_type: "supplier".`,
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
