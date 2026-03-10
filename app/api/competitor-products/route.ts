import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import CompetitorProduct from "@/models/CompetitorProduct";

const ALLOWED_SORT = [
    "createdAt",
    "source",
    "item_code",
    "category",
    "brand",
    "tyre_pattern",
    "size",
    "year",
    "country",
    "price",
    "set_price",
    "date",
];

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);

        // Pagination
        const page = Math.min(Math.max(1, parseInt(searchParams.get("page") ?? "1")), 1000);
        const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "10")));

        // Search
        const search = searchParams.get("search") ?? "";

        // Sorting — accept both sort/order and sortBy/sortOrder
        const rawSort = searchParams.get("sort") || searchParams.get("sortBy") || "createdAt";
        const sortField = ALLOWED_SORT.includes(rawSort) ? rawSort : "createdAt";
        const orderParam = (searchParams.get("order") || searchParams.get("sortOrder") || "desc").toLowerCase();
        const sortOrder = orderParam === "asc" ? 1 : -1;

        // Individual filters (mapped to competitor field names)
        const brand = searchParams.get("brand") ?? "";
        const sourceName = searchParams.get("source_name") ?? "";
        const brandCategory = searchParams.get("brand_category") ?? "";
        const size = searchParams.get("size") ?? "";
        const year = searchParams.get("year") ?? "";
        const country = searchParams.get("country") ?? "";

        // Build filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: Record<string, any> = {};

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.$or = [
                { source: { $regex: escapedSearch, $options: "i" } },
                { item_code: { $regex: escapedSearch, $options: "i" } },
                { category: { $regex: escapedSearch, $options: "i" } },
                { brand: { $regex: escapedSearch, $options: "i" } },
                { tyre_pattern: { $regex: escapedSearch, $options: "i" } },
                { size: { $regex: escapedSearch, $options: "i" } },
                { country: { $regex: escapedSearch, $options: "i" } },
            ];
        }

        // Individual field filters
        if (brand) {
            const brands = brand.split(",").map(b => b.trim()).filter(Boolean);
            filter.brand = {
                $in: brands.map(b =>
                    new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")
                ),
            };
        }

        // source_name maps to "source" field in competitor_products
        if (sourceName) {
            filter.source = { $regex: sourceName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        }

        // brand_category maps to "category" field in competitor_products
        if (brandCategory) {
            filter.category = { $regex: brandCategory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        }

        if (size) {
            const escapedSize = size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            filter.size = { $regex: escapedSize, $options: "i" };
        }

        if (year) {
            const years = year.split(",").map(y => parseInt(y.trim())).filter(y => !isNaN(y));
            if (years.length > 0) {
                filter.year = { $in: years };
            }
        }

        if (country) {
            filter.country = { $regex: country.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
        }

        const skip = (page - 1) * limit;

        const [products, total] = await Promise.all([
            CompetitorProduct.find(filter)
                .sort({ [sortField]: sortOrder, _id: sortOrder })
                .skip(skip)
                .limit(limit)
                .lean(),
            CompetitorProduct.countDocuments(filter),
        ]);

        return NextResponse.json({
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch (error: unknown) {
        console.error("GET /api/competitor-products error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to fetch competitor products" },
            { status: 500 }
        );
    }
}
