import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

const ALLOWED_SORT = ["createdAt", "price", "cost", "year", "brand", "product_name", "sku"];

const getSupplierId = (req: NextRequest) => {
  const token = req.cookies.get("token")?.value;
  if (!token) return null;
  const decoded = verifyToken(token) as any;
  return decoded ? decoded.supplierId : null;
};

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const supplierId = getSupplierId(req);
    if (!supplierId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "200")));
    const search = searchParams.get("search") ?? "";
    const rawSortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortBy = ALLOWED_SORT.includes(rawSortBy) ? rawSortBy : "createdAt";

    // Extract filters
    const brand = searchParams.get("brand") ?? "";
    const brandCategory = searchParams.get("brand_category") ?? "";
    const vehicleType = searchParams.get("vehicle_type") ?? "";
    const country = searchParams.get("country") ?? "";
    const year = searchParams.get("year") ?? "";
    const runflat = searchParams.get("runflat") ?? "";
    const tyreMarking = searchParams.get("tyre_marking") ?? "";
    const size = searchParams.get("size") ?? "";
    const plainSize = searchParams.get("plain_size") ?? "";
    const loadIndex = searchParams.get("load_index") ?? "";
    const sourceName = searchParams.get("source_name") ?? "";
    const priceMin = searchParams.get("price_min") ?? "";
    const priceMax = searchParams.get("price_max") ?? "";
    const costMin = searchParams.get("cost_min") ?? "";
    const costMax = searchParams.get("cost_max") ?? "";

    /* ---- build filter ---- */
    const filter: Record<string, unknown> = { supplierId };

    if (search) {
      filter.$or = [
        { product_name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { klever_sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (brand) filter.brand = brand;
    if (brandCategory) filter.brand_category = brandCategory;
    if (vehicleType) filter.vehicle_type = vehicleType;
    if (country) filter.country = country;
    if (year) filter.year = parseInt(year);
    if (runflat) filter.runflat = runflat;
    if (tyreMarking) filter.tyre_marking = tyreMarking;
    if (size) filter.size = size;
    if (plainSize) filter.plain_size = plainSize;
    if (loadIndex) filter.load_index = loadIndex;
    if (sourceName) filter.source_name = sourceName;

    // Price range
    if (priceMin || priceMax) {
      const priceFilter: Record<string, number> = {};
      if (priceMin) priceFilter.$gte = parseFloat(priceMin);
      if (priceMax) priceFilter.$lte = parseFloat(priceMax);
      filter.price = priceFilter;
    }

    // Cost range
    if (costMin || costMax) {
      const costFilter: Record<string, number> = {};
      if (costMin) costFilter.$gte = parseFloat(costMin);
      if (costMax) costFilter.$lte = parseFloat(costMax);
      filter.cost = costFilter;
    }

    const skip = (page - 1) * limit;
    const supplierObjectId = new mongoose.Types.ObjectId(supplierId);

    /* ---- parallel queries ---- */
    const [products, total, summaryAgg, filterDistincts] = await Promise.all([
      Product.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),

      Product.aggregate([
        { $match: { supplierId: supplierObjectId } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            averagePrice: { $avg: "$price" },
            averageCost: { $avg: "$cost" },
            brands: { $addToSet: "$brand" },
          },
        },
        {
          $project: {
            _id: 0,
            totalProducts: 1,
            averagePrice: { $round: ["$averagePrice", 2] },
            averageCost: { $round: ["$averageCost", 2] },
            totalBrands: { $size: "$brands" },
          },
        },
      ]),

      // Collect all distinct filter values for the supplier
      Promise.all([
        Product.distinct("brand", { supplierId }),
        Product.distinct("brand_category", { supplierId }),
        Product.distinct("vehicle_type", { supplierId }),
        Product.distinct("country", { supplierId }),
        Product.distinct("year", { supplierId }),
        Product.distinct("runflat", { supplierId }),
        Product.distinct("tyre_marking", { supplierId }),
        Product.distinct("size", { supplierId }),
        Product.distinct("plain_size", { supplierId }),
        Product.distinct("load_index", { supplierId }),
        Product.distinct("source_name", { supplierId }),
      ]),
    ]);

    const summary = summaryAgg[0] ?? {
      totalProducts: 0,
      averagePrice: 0,
      averageCost: 0,
      totalBrands: 0,
    };

    const [brands, brandCategories, vehicleTypes, countries, years, runflatOpts, tyreMarkings, sizes, plainSizes, loadIndexes, sourceNames] = filterDistincts;

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary,
      filterOptions: {
        brands: (brands as string[]).filter(Boolean).sort(),
        brandCategories: (brandCategories as string[]).filter(Boolean).sort(),
        vehicleTypes: (vehicleTypes as string[]).filter(Boolean).sort(),
        countries: (countries as string[]).filter(Boolean).sort(),
        years: (years as number[]).filter(Boolean).sort((a, b) => b - a),
        runflatOptions: (runflatOpts as string[]).filter(Boolean).sort(),
        tyreMarkings: (tyreMarkings as string[]).filter(Boolean).sort(),
        sizes: (sizes as string[]).filter(Boolean).sort(),
        plainSizes: (plainSizes as string[]).filter(Boolean).sort(),
        loadIndexes: (loadIndexes as string[]).filter(Boolean).sort(),
        sourceNames: (sourceNames as string[]).filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const supplierId = getSupplierId(req);
    if (!supplierId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const productData = { ...data, supplierId };
    const newProduct = await Product.create(productData);

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}