import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

const ALLOWED_SORT = ["createdAt", "price", "cost", "year", "brand", "product_name", "sku"];

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    // const supplierId = getSupplierId(req);
    // if (!supplierId) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const { searchParams } = new URL(req.url);
    const page = Math.min(Math.max(1, parseInt(searchParams.get("page") ?? "1")), 100);
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
    // const filter: Record<string, unknown> = { supplierId };
    const filter: Record<string, unknown> = {};


    if (search) {
      filter.$or = [
        { product_name: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { klever_sku: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
      ];
    }

    if (brand) filter.brand = { $regex: brand, $options: "i" };
    if (brandCategory) filter.brand_category = brandCategory;
    if (vehicleType) filter.vehicle_type = vehicleType;
    if (country) filter.country = country;
    if (year) {
      const parsedYear = parseInt(year);
      if (!isNaN(parsedYear)) filter.year = parsedYear;
    }
    if (runflat) filter.runflat = runflat;
    if (tyreMarking) filter.tyre_marking = tyreMarking;
    if (size) filter.size = { $regex: size, $options: "i" };
    if (plainSize) filter.plain_size = plainSize;
    if (loadIndex) filter.load_index = loadIndex;
    if (sourceName) filter.source_name = sourceName;

    // Price range
    if (priceMin || priceMax) {
      const priceFilter: Record<string, number> = {};
      if (priceMin && !isNaN(parseFloat(priceMin))) priceFilter.$gte = parseFloat(priceMin);
      if (priceMax && !isNaN(parseFloat(priceMax))) priceFilter.$lte = parseFloat(priceMax);
      if (Object.keys(priceFilter).length > 0) filter.price = priceFilter;
    }

    // Cost range
    if (costMin || costMax) {
      const costFilter: Record<string, number> = {};
      if (costMin && !isNaN(parseFloat(costMin))) costFilter.$gte = parseFloat(costMin);
      if (costMax && !isNaN(parseFloat(costMax))) costFilter.$lte = parseFloat(costMax);
      if (Object.keys(costFilter).length > 0) filter.cost = costFilter;
    }

    const skip = (page - 1) * limit;

    // if (!mongoose.Types.ObjectId.isValid(supplierId)) {
    //   return NextResponse.json({ error: "Invalid supplier ID format" }, { status: 400 });
    // }
    // const supplierObjectId = new mongoose.Types.ObjectId(supplierId);

    /* ---- parallel queries ---- */
    const [products, total, summaryAgg] = await Promise.all([
      Product.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),

      Product.aggregate([
        // { $match: { supplierId: supplierObjectId } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            averagePrice: { $avg: "$price" },
            averageCost: { $avg: "$cost" },
            brands: { $addToSet: "$brand" },
            brandCategories: { $addToSet: "$brand_category" },
            vehicleTypes: { $addToSet: "$vehicle_type" },
            countries: { $addToSet: "$country" },
            years: { $addToSet: "$year" },
            runflatOpts: { $addToSet: "$runflat" },
            tyreMarkings: { $addToSet: "$tyre_marking" },
            sizes: { $addToSet: "$size" },
            plainSizes: { $addToSet: "$plain_size" },
            loadIndexes: { $addToSet: "$load_index" },
            sourceNames: { $addToSet: "$source_name" },
          },
        },
        {
          $project: {
            _id: 0,
            totalProducts: 1,
            averagePrice: { $round: ["$averagePrice", 2] },
            averageCost: { $round: ["$averageCost", 2] },
            totalBrands: { $size: "$brands" },
            brands: 1,
            brandCategories: 1,
            vehicleTypes: 1,
            countries: 1,
            years: 1,
            runflatOpts: 1,
            tyreMarkings: 1,
            sizes: 1,
            plainSizes: 1,
            loadIndexes: 1,
            sourceNames: 1,
          },
        },
      ]),
    ]);

    const summaryData = summaryAgg[0] || {};

    const summary = {
      totalProducts: summaryData.totalProducts || 0,
      averagePrice: summaryData.averagePrice || 0,
      averageCost: summaryData.averageCost || 0,
      totalBrands: summaryData.totalBrands || 0,
    };

    const brands = summaryData.brands || [];
    const brandCategories = summaryData.brandCategories || [];
    const vehicleTypes = summaryData.vehicleTypes || [];
    const countries = summaryData.countries || [];
    const years = summaryData.years || [];
    const runflatOpts = summaryData.runflatOpts || [];
    const tyreMarkings = summaryData.tyreMarkings || [];
    const sizes = summaryData.sizes || [];
    const plainSizes = summaryData.plainSizes || [];
    const loadIndexes = summaryData.loadIndexes || [];
    const sourceNames = summaryData.sourceNames || [];

    console.log(`[DEBUG] GET /api/products — found ${total} products, returning ${products.length} on page ${page}`);

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
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({
      error: error.message || "Failed to fetch products",
      details: error.toString()
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();
    const newProduct = await Product.create(data);

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}