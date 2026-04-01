import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

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

        // ── Build filter — NO is_latest filter, fetch ALL versions ───────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: Record<string, any> = {
            product_source: source === "competitor" ? "competitor" : { $ne: "competitor" },
        };

        if (sku) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const orConds: any[] = [
                { sku: { $in: [sku, ...(isNaN(Number(sku)) ? [] : [Number(sku)])] } },
            ];
            if (/^[0-9a-fA-F]{24}$/.test(sku)) {
                const { ObjectId } = require("mongodb");
                orConds.push({ _id: new ObjectId(sku) });
            }
            filter.$or = orConds;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const orConds: any[] = [
                { item_code: { $in: [itemCode, ...(isNaN(Number(itemCode)) ? [] : [Number(itemCode)])] } },
                { sku: { $in: [itemCode, ...(isNaN(Number(itemCode)) ? [] : [Number(itemCode)])] } },
            ];
            if (/^[0-9a-fA-F]{24}$/.test(itemCode)) {
                const { ObjectId } = require("mongodb");
                const target = await Product.collection.findOne({ _id: new ObjectId(itemCode) });
                if (target) {
                    filter.$or = [
                        { _id: new ObjectId(itemCode) },
                        { brand: target.brand, tyre_pattern: target.tyre_pattern, size: target.size, source_name: target.source_name },
                    ];
                } else {
                    orConds.push({ _id: new ObjectId(itemCode) });
                    filter.$or = orConds;
                }
            } else {
                filter.$or = orConds;
            }
        }

        // ── SERVER LOG 1: what are we querying? ──────────────────────────────
        console.log("\n========= price-history API =========");
        console.log("SKU      :", sku || "(none)");
        console.log("item_code:", itemCode || "(none)");
        console.log("source   :", source);
        console.log("priceField:", priceField);
        console.log("DB filter:", JSON.stringify(filter, null, 2));

        // ── Fetch ALL records — sort by newest first to prioritize recent data if we hit the limit ──
        const records = await Product.collection
            .find(filter)
            .project({ source_date: 1, [priceField]: 1, createdAt: 1, is_latest: 1 })
            .sort({ createdAt: -1 })
            .limit(1000)
            .toArray();

        // ── SERVER LOG 2: what did the DB return? ─────────────────────────────
        console.log(`\nDB returned: ${records.length} record(s)`);

        // ── Multi-format date parser ──────────────────────────────────────────
        const currentYear = new Date().getUTCFullYear();

        function parseAnyDate(raw: unknown): dayjs.Dayjs | null {
            if (raw == null) return null;

            // If it's a native Date object (createdAt from MongoDB)
            if (raw instanceof Date) {
                const d = dayjs(raw);
                return d.isValid() ? d : null;
            }

            const s = String(raw).trim();
            if (!s || s === "—") return null;

            // ISO / YYYY-... prefix  →  dayjs auto-parse
            if (/^\d{4}/.test(s)) {
                const d = dayjs(s);
                return d.isValid() ? d : null;
            }

            // Normalize separators: remove periods (e.g. from "Feb."), replace slashes/spaces with dashes
            // then remove any leading/trailing dashes and convert to title case for dayjs MMM
            let cleaned = s.replace(/\./g, "").replace(/[/\s_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

            // Try common formats
            const formats = [
                "DD-MMM-YYYY",
                "DD-MMMM-YYYY",
                "DD-MMM-YY",
                "DD-MMMM-YY",
                "DD-MMM",
                "DD-MMMM",
                "DD-MM-YYYY",
                "DD-MM-YY",
                "YYYY-MM-DD",
                "YYYY/MM/DD",
                "MM-DD-YYYY",
                "MM/DD/YYYY"
            ];

            for (const fmt of formats) {
                const p = dayjs(cleaned, fmt, true);
                if (p.isValid()) {
                    // If no year was provided, default to current year
                    if (!fmt.includes("YY")) {
                        return p.year(currentYear);
                    }
                    return p;
                }
            }

            // Last resort: non-strict dayjs parse
            const lastResort = dayjs(s);
            if (lastResort.isValid()) return lastResort;

            return null;
        }

        // ── Build rows — ALL records, no deduplication ────────────────────────
        const rows: { iso: string; value: number; ts: number; dateUsed: string }[] = [];

        for (const r of records) {
            const value = r[priceField];
            if (value == null || value === "") continue;

            // Try source_date first, then createdAt
            let parsed = parseAnyDate(r.source_date);
            let dateUsed = `source_date="${r.source_date}"`;
            if (!parsed) {
                parsed = parseAnyDate(r.createdAt);
                dateUsed = `createdAt="${r.createdAt}"`;
            }

            if (!parsed) {
                console.log(`  ⚠ Skipped record (unparseable date): source_date="${r.source_date}" createdAt="${r.createdAt}"`);
                continue;
            }

            rows.push({
                iso: parsed.toISOString(),
                value: Number(value),
                ts: parsed.valueOf(),
                dateUsed,
            });
        }

        // ── Sort ascending ────────────────────────────────────────────────────
        rows.sort((a, b) => a.ts - b.ts);

        const data = rows.map(({ iso, value }) => ({ date: iso, value }));

        // ── SERVER LOG 3: final output ────────────────────────────────────────
        console.log(`\nFINAL API DATA (${data.length} points):`);
        console.log("FINAL API DATA:", data)
        rows.forEach((r, i) => {
            console.log(`  [${i}] ${r.iso}  →  ${priceField}=${r.value}  (from ${r.dateUsed})`);
        });
        console.log("=====================================\n");

        return NextResponse.json({
            data,
            priceField,
            total: records.length,   // total DB records found
            parsed: data.length,      // records that had a parseable date + value
        });

    } catch (error: unknown) {
        console.error("GET /api/products/price-history error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch price history" },
            { status: 500 }
        );
    }
}
