import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

const ALLOWED_SORT = [
  "createdAt",
  "price",
  "cost",
  "year",
  "brand",
  "product_name",
  "sku",
];

export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.min(Math.max(1, parseInt(searchParams.get("page") ?? "1")), 100);
    const limit = Math.min(500, Math.max(1, parseInt(searchParams.get("limit") ?? "200")));

    const search = searchParams.get("search") ?? "";
    const rawSortBy = searchParams.get("sortBy") ?? "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const sortBy = ALLOWED_SORT.includes(rawSortBy) ? rawSortBy : "createdAt";

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
    const qty = searchParams.get("qty") ?? "";
    const latest = searchParams.get("latest") === "true";
    const priceMin = searchParams.get("price_min") ?? "";
    const priceMax = searchParams.get("price_max") ?? "";
    const costMin = searchParams.get("cost_min") ?? "";
    const costMax = searchParams.get("cost_max") ?? "";

    const filter: any = {};

    /* SEARCH */
    // if (search) {
    //   filter.$or = [
    //     { product_name: { $regex: search, $options: "i" } },
    //     { brand: { $regex: search, $options: "i" } },
    //     { sku: { $regex: search, $options: "i" } },
    //     { size: { $regex: search, $options: "i" } },
    //   ];
    // }
    /* SEARCH */
    if (search) {
      console.log(`\n[SIZE DEBUG] --- Processing Search Input ---`);
      console.log(`[SIZE DEBUG] Raw Search String Received: "${search}"`);

      const numericString = search.replace(/\D/g, "");
      const normalizedSize = numericString ? Number(numericString) : null;

      console.log(`[SIZE DEBUG] Extracted Numerics: "${numericString}" -> Converted To Number: ${normalizedSize}`);

      const orConditions: any[] = [
        { product_name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
        { size: { $regex: search, $options: "i" } },
      ];

      if (normalizedSize !== null) {
        orConditions.push({ plain_size: normalizedSize });
        console.log(`[SIZE DEBUG] Appended to $or conditions: { plain_size: ${normalizedSize} }`);
      } else {
        console.log(`[SIZE DEBUG] Skipped plain_size matching inside $or since no valid number was found.`);
      }

      filter.$or = orConditions;
    }

    /* BASIC FILTERS */
    if (brand) filter.brand = { $regex: brand, $options: "i" };
    if (brandCategory) filter.brand_category = brandCategory;
    if (vehicleType) filter.vehicle_type = vehicleType;
    if (country) filter.country = country;
    if (runflat) filter.runflat = runflat;
    if (tyreMarking) filter.tyre_marking = tyreMarking;
    if (loadIndex) filter.load_index = loadIndex;
    if (sourceName) filter.source_name = sourceName;

    /* YEAR */
    if (year) {
      const parsedYear = parseInt(year);
      if (!isNaN(parsedYear)) filter.year = parsedYear;
    }

    /* SIZE FILTER */
    if (size) {
      const escaped = size.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.size = { $regex: escaped, $options: "i" };
    } else if (plainSize) {
      filter.plain_size = Number(plainSize);
    }

    /* QTY */
    if (qty) {
      const parsedQty = Number(qty);
      if (!isNaN(parsedQty)) filter.qty = { $gte: parsedQty };
    }

    /* LATEST PRODUCTS */
    if (latest) {
      const mostRecent = await Product.findOne()
        .sort({ createdAt: -1 })
        .select("createdAt")
        .lean();

      if (mostRecent?.createdAt) {
        const latestDate = new Date(mostRecent.createdAt);
        latestDate.setHours(0, 0, 0, 0);
        filter.createdAt = { $gte: latestDate };
      } else {
        filter.createdAt = { $gte: new Date(Date.now() - 86400000) };
      }
    }

    /* PRICE RANGE */
    if (priceMin || priceMax) {
      const priceFilter: Record<string, number> = {};

      if (priceMin && !isNaN(parseFloat(priceMin)))
        priceFilter.$gte = parseFloat(priceMin);

      if (priceMax && !isNaN(parseFloat(priceMax)))
        priceFilter.$lte = parseFloat(priceMax);

      if (Object.keys(priceFilter).length) filter.price = priceFilter;
    }

    /* COST RANGE */
    if (costMin || costMax) {
      const costFilter: Record<string, number> = {};

      if (costMin && !isNaN(parseFloat(costMin)))
        costFilter.$gte = parseFloat(costMin);

      if (costMax && !isNaN(parseFloat(costMax)))
        costFilter.$lte = parseFloat(costMax);

      if (Object.keys(costFilter).length) filter.cost = costFilter;
    }

    const skip = (page - 1) * limit;

    console.log("\n=========================================");
    console.log("           MONGOOSE EXECUTION DEBUGS       ");
    console.log("=========================================");
    console.log("1. Request Query Params: ", Object.fromEntries(searchParams.entries()));
    console.log("2. Generated MongoDB Filter Object:");
    console.dir(filter, { depth: null, colors: true });
    console.log("3. Pagination & Sorting:");
    console.log(`   Page: ${page}, Limit: ${limit}, Skip: ${skip}`);
    console.log(`   Sort: { "${sortBy}": ${sortOrder} }`);
    console.log("=========================================\n");

    const [products, total, summaryAgg] = await Promise.all([
      Product.find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .lean(),

      Product.countDocuments(filter),

      Product.aggregate([
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

    return NextResponse.json({
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalProducts: summaryData.totalProducts || 0,
        averagePrice: summaryData.averagePrice || 0,
        averageCost: summaryData.averageCost || 0,
        totalBrands: summaryData.totalBrands || 0,
      },
      filterOptions: {
        brands: (summaryData.brands || []).filter(Boolean).sort(),
        brandCategories: (summaryData.brandCategories || []).filter(Boolean).sort(),
        vehicleTypes: (summaryData.vehicleTypes || []).filter(Boolean).sort(),
        countries: (summaryData.countries || []).filter(Boolean).sort(),
        years: (summaryData.years || []).filter(Boolean).sort((a: number, b: number) => b - a),
        runflatOptions: (summaryData.runflatOpts || []).filter(Boolean).sort(),
        tyreMarkings: (summaryData.tyreMarkings || []).filter(Boolean).sort(),
        sizes: (summaryData.sizes || []).filter(Boolean).sort(),
        plainSizes: (summaryData.plainSizes || []).filter(Boolean).sort((a: number, b: number) => a - b),
        loadIndexes: (summaryData.loadIndexes || []).filter(Boolean).sort(),
        sourceNames: (summaryData.sourceNames || []).filter(Boolean).sort(),
      },
    });
  } catch (error: any) {
    console.error("GET /api/products error:", error);

    return NextResponse.json(
      {
        error: error.message || "Failed to fetch products",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const data = await req.json();

    if (data.size && !data.plain_size) {
      data.plain_size = Number(data.size.replace(/\D/g, ""));
    }

    const newProduct = await Product.create(data);

    return NextResponse.json(
      { success: true, product: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/products error:", error);

    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}