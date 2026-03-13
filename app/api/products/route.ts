import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

/* ─────────────────────────────────────────────────────────────
   Allowed sort fields per table type
───────────────────────────────────────────────────────────── */
const ALLOWED_SUPPLIER_SORT = [
  "createdAt", "price", "cost", "year", "brand",
  "product_name", "sku", "size", "source_name", "source_date",
];

const ALLOWED_COMPETITOR_SORT = [
  "createdAt", "source_name", "item_code", "category", "brand",
  "tyre_pattern", "size", "year", "country", "price", "set_price", "source_date",
];

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* ─────────────────────────────────────────────────────────────
   Build shared filter from query params.
   Applied to BOTH supplier and competitor sub-queries.
───────────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildSharedFilter(searchParams: URLSearchParams): Record<string, any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};

  const search = searchParams.get("search") ?? "";
  const brand = searchParams.get("brand") ?? "";
  const brandCategory = searchParams.get("brand_category") ?? "";
  const size = searchParams.get("size") ?? "";
  const year = searchParams.get("year") ?? "";
  const country = searchParams.get("country") ?? "";
  const latestParam = searchParams.get("latest");

  /* ── 1 & 2. is_latest filter ── */
  if (latestParam === "1") {
    filter.is_latest = 1;
  } else if (latestParam === "0") {
    filter.is_latest = 0;
  }

  /* ── 3. Search filter ── */
  if (search) {
    const searchTokens = search
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const tokenConditions = searchTokens.map((token) => {
      const escapedToken = escapeRegex(token);
      const numericOnly = token.replace(/\D/g, "");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const conditions: any[] = [
        { product_name: { $regex: escapedToken, $options: "i" } },
        { sku: { $regex: escapedToken, $options: "i" } },
        { brand: { $regex: escapedToken, $options: "i" } },
        { brand_category: { $regex: escapedToken, $options: "i" } },
        { category: { $regex: escapedToken, $options: "i" } },
        { country: { $regex: escapedToken, $options: "i" } },
        { runflat: { $regex: escapedToken, $options: "i" } },
        { size: { $regex: escapedToken, $options: "i" } },
        // Also search competitor-specific equivalents
        { tyre_pattern: { $regex: escapedToken, $options: "i" } },
        { item_code: { $regex: escapedToken, $options: "i" } },
      ];

      // Year search (if numeric)
      if (/^\d{4}$/.test(token)) {
        conditions.push({ year: parseInt(token) });
      }

      // plain_size search
      if (numericOnly) {
        conditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$plain_size" },
              regex: numericOnly,
            },
          },
        });
      }

      return { $or: conditions };
    });

    if (tokenConditions.length > 0) {
      filter.$and = filter.$and || [];
      filter.$and.push(...tokenConditions);
    }
  }

  /* ── Brand filter ── */
  if (brand) {
    const brands = brand.split(",").map((b) => b.trim()).filter(Boolean);
    filter.brand = {
      $in: brands.map((b) => new RegExp(escapeRegex(b), "i")),
    };
  }

  /* ── Brand category filter ── */
  if (brandCategory) {
    filter.$and = filter.$and || [];
    filter.$and.push({
      $or: [
        { brand_category: { $regex: escapeRegex(brandCategory), $options: "i" } },
        { category: { $regex: escapeRegex(brandCategory), $options: "i" } },
      ],
    });
  }

  /* ── Country filter ── */
  if (country) {
    const countries = country.split(",").map((c) => c.trim()).filter(Boolean);
    filter.country = {
      $in: countries.map((c) => new RegExp(escapeRegex(c), "i")),
    };
  }

  /* ── 5. Size filter (applied to both) ── */
  if (size) {
    const sizes = size.split(",").map((s) => s.trim()).filter(Boolean);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sizeConditions: any[] = sizes.map((sz) => {
      const normalizedInput = sz.replace(/\D/g, "");
      const escapedOriginal = escapeRegex(sz.trim());

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const innerConditions: any[] = [];

      // Match against the normalized numeric sequence (plain_size)
      if (normalizedInput) {
        innerConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$plain_size" },
              regex: normalizedInput,
            },
          },
        });
      }

      // Match against the original formatted size string
      innerConditions.push({
        size: { $regex: escapedOriginal, $options: "i" },
      });

      return { $or: innerConditions };
    });

    if (sizeConditions.length > 0) {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: sizeConditions });
    }
  }

  /* ── Year filter ── */
  if (year) {
    const years = year.split(",").map((y) => parseInt(y.trim())).filter((y) => !isNaN(y));
    if (years.length > 0) {
      filter.year = { $in: years };
    }
  }

  return filter;
}

/* ─────────────────────────────────────────────────────────────
   Auto-migration: runs ONCE on first request.
   Sets product_source = "supplier" on all old documents that
   don't have it. After first run, migrated = true and it
   never runs again for the lifetime of this server process.
───────────────────────────────────────────────────────────── */
let migrated = false;

async function autoMigrate() {
  if (migrated) return;
  migrated = true; // skip on future requests regardless of outcome

  try {
    const count = await Product.countDocuments({ product_source: { $exists: false } });

    if (count > 0) {
      console.log(`[auto-migrate] Found ${count} docs without product_source. Skipping — over quota or too many docs. Using fallback filter.`);
    } else {
      console.log("[auto-migrate] All documents already have product_source.");
    }
  } catch (err) {
    console.warn("[auto-migrate] Error:", err);
  }
}

/* ─────────────────────────────────────────────────────────────
   GET /api/products

   Returns BOTH supplier and competitor products from the
   single `products` collection, split by `product_source`.
───────────────────────────────────────────────────────────── */
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    // Auto-fix old data on first request (runs only once)
    await autoMigrate();

    const { searchParams } = new URL(req.url);

    /* ── Supplier pagination & sorting ── */
    const supplierPage = Math.min(
      Math.max(1, parseInt(searchParams.get("supplier_page") ?? searchParams.get("page") ?? "1")),
      1000
    );
    const supplierLimit = Math.min(
      500,
      Math.max(1, parseInt(searchParams.get("supplier_limit") ?? searchParams.get("limit") ?? "10"))
    );
    const rawSupplierSort = searchParams.get("sortBy") ?? "createdAt";
    const supplierSortField = ALLOWED_SUPPLIER_SORT.includes(rawSupplierSort) ? rawSupplierSort : "createdAt";
    const supplierSortOrder = (searchParams.get("sortOrder") ?? "desc").toLowerCase() === "asc" ? 1 : -1;

    /* ── Competitor pagination & sorting ── */
    const competitorPage = Math.min(
      Math.max(1, parseInt(searchParams.get("competitor_page") ?? "1")),
      1000
    );
    const competitorLimit = Math.min(
      500,
      Math.max(1, parseInt(searchParams.get("competitor_limit") ?? "10"))
    );
    const rawCompetitorSort = searchParams.get("competitor_sortBy") ?? "createdAt";
    const competitorSortField = ALLOWED_COMPETITOR_SORT.includes(rawCompetitorSort) ? rawCompetitorSort : "createdAt";
    const competitorSortOrder = (searchParams.get("competitor_sortOrder") ?? "desc").toLowerCase() === "asc" ? 1 : -1;

    /* ── Build shared filter ── */
    const sharedFilter = buildSharedFilter(searchParams);

    /* ── Supplier filter ── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supplierFilter: Record<string, any> = {
      ...sharedFilter,
      product_source: { $ne: "competitor" },
    };
    // Preserve $and from shared filter
    if (sharedFilter.$and) {
      supplierFilter.$and = [...sharedFilter.$and];
    }

    // Supplier-only filters
    const sourceName = searchParams.get("source_name") ?? "";
    if (sourceName) {
      supplierFilter.source_name = {
        $regex: escapeRegex(sourceName),
        $options: "i",
      };
    }

    const qty = searchParams.get("qty") ?? "";
    if (qty) {
      const parsedQty = Number(qty);
      if (!isNaN(parsedQty)) supplierFilter.qty = { $gte: parsedQty };
    }

    const priceMin = searchParams.get("price_min") ?? "";
    const priceMax = searchParams.get("price_max") ?? "";
    if (priceMin || priceMax) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const priceFilter: Record<string, any> = {};
      if (priceMin && !isNaN(parseFloat(priceMin))) priceFilter.$gte = parseFloat(priceMin);
      if (priceMax && !isNaN(parseFloat(priceMax))) priceFilter.$lte = parseFloat(priceMax);
      if (Object.keys(priceFilter).length) supplierFilter.price = priceFilter;
    }

    const costMin = searchParams.get("cost_min") ?? "";
    const costMax = searchParams.get("cost_max") ?? "";
    if (costMin || costMax) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const costFilter: Record<string, any> = {};
      if (costMin && !isNaN(parseFloat(costMin))) costFilter.$gte = parseFloat(costMin);
      if (costMax && !isNaN(parseFloat(costMax))) costFilter.$lte = parseFloat(costMax);
      if (Object.keys(costFilter).length) supplierFilter.cost = costFilter;
    }

    /* ── Competitor filter ── */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const competitorFilter: Record<string, any> = {
      ...sharedFilter,
      product_source: "competitor",
    };
    // Deep-clone $and so supplier and competitor don't share array reference
    if (sharedFilter.$and) {
      competitorFilter.$and = [...sharedFilter.$and];
    }

    /* ── Pagination skip ── */
    const supplierSkip = (supplierPage - 1) * supplierLimit;
    const competitorSkip = (competitorPage - 1) * competitorLimit;

    /* ── DEBUG LOGS ── */
    // console.log("\n=== GET /api/products DEBUG ===");
    // console.log("Query params:", Object.fromEntries(searchParams.entries()));
    // console.log("Supplier filter:", JSON.stringify(supplierFilter, null, 2));
    // // console.log("Competitor filter:", JSON.stringify(competitorFilter, null, 2));
    // console.log("Supplier: page=%d, limit=%d, skip=%d, sort=%s %d",
    //   supplierPage, supplierLimit, supplierSkip, supplierSortField, supplierSortOrder);
    // console.log("Competitor: page=%d, limit=%d, skip=%d, sort=%s %d",
    //   competitorPage, competitorLimit, competitorSkip, competitorSortField, competitorSortOrder);

    /* ── Run all queries in parallel ──
       Using distinct() instead of aggregation to avoid
       MongoDB Atlas free-tier 100MB memory limit.
       distinct() is index-backed and uses almost no memory.
    */
    let [
      supplierProducts,
      supplierTotal,
      competitorProducts,
      competitorTotal,
      brands,
      brandCategories,
      vehicleTypes,
      countries,
      years,
      runflatOpts,
      tyreMarkings,
      sizes,
      plainSizes,
      loadIndexes,
      sourceNames,
    ] = await Promise.all([
      // 1. Supplier products (paginated)
      Product.find(supplierFilter)
        .sort({ [supplierSortField]: supplierSortOrder, _id: supplierSortOrder })
        .skip(supplierSkip)
        .limit(supplierLimit)
        .lean(),

      // 2. Supplier count
      Product.countDocuments(supplierFilter),

      // 3. Competitor products (paginated)
      Product.find(competitorFilter)
        .sort({ [competitorSortField]: competitorSortOrder, _id: competitorSortOrder })
        .skip(competitorSkip)
        .limit(competitorLimit)
        .lean(),

      // 4. Competitor count
      Product.countDocuments(competitorFilter),

      // 5–15. Filter options via lightweight distinct() calls
      Product.distinct("brand"),
      Product.distinct("brand_category"),
      Product.distinct("vehicle_type"),
      Product.distinct("country"),
      Product.distinct("year"),
      Product.distinct("runflat"),
      Product.distinct("tyre_marking"),
      Product.distinct("size"),
      Product.distinct("plain_size"),
      Product.distinct("load_index"),
      Product.distinct("source_name"),
    ]);

    /* ── 2. is_latest = 0 extra logic (fetch latest record of same sku/item_code) ── */
    const latestParamForLogic = searchParams.get("latest");
    if (latestParamForLogic === "0") {
      // Create plain objects for safe manipulation
      const rawSuppliers = JSON.parse(JSON.stringify(supplierProducts));
      const rawCompetitors = JSON.parse(JSON.stringify(competitorProducts));

      const supplierSkus = rawSuppliers.map((p: any) => p.sku).filter(Boolean);
      // Competitor key: prefer item_code, fall back to sku
      const competitorKeys = rawCompetitors.map((p: any) => p.item_code || p.sku).filter(Boolean);

      const [latestSuppliers, latestCompetitors] = await Promise.all([
        Product.find({ sku: { $in: supplierSkus }, is_latest: 1, product_source: "supplier" }).lean(),
        Product.find({
          $or: [
            { item_code: { $in: competitorKeys } },
            { sku: { $in: competitorKeys } },
          ],
          is_latest: 1,
          product_source: "competitor",
        }).lean(),
      ]);

      const latestSupplyMap = new Map(latestSuppliers.map((p: any) => [p.sku, p]));
      // Map by both item_code and sku for flexible lookup
      const latestCompMap = new Map<string, any>();
      latestCompetitors.forEach((p: any) => {
        if (p.item_code) latestCompMap.set(p.item_code, p);
        if (p.sku) latestCompMap.set(p.sku, p);
      });

      // ── Build Merged Supplier List ──
      const mergedSuppliers: any[] = [];

      // Group historical records by SKU to insert latest record once per group
      const supplyGroups = new Map<string, any[]>();
      rawSuppliers.forEach((p: any) => {
        if (!supplyGroups.has(p.sku)) supplyGroups.set(p.sku, []);
        supplyGroups.get(p.sku)?.push(p);
      });

      supplyGroups.forEach((history, sku) => {
        const latest = latestSupplyMap.get(sku);
        if (latest) {
          mergedSuppliers.push({ ...latest, is_comparison_header: true });
        }
        mergedSuppliers.push(...history.map(h => ({ ...h, created_by: latest })));
      });
      supplierProducts = mergedSuppliers;

      // ── Build Merged Competitor List ──
      const mergedCompetitors: any[] = [];
      const compGroups = new Map<string, any[]>();
      rawCompetitors.forEach((p: any) => {
        const key = p.item_code || p.sku || p._id;
        if (!compGroups.has(key)) compGroups.set(key, []);
        compGroups.get(key)?.push(p);
      });

      compGroups.forEach((history, key) => {
        const latest = latestCompMap.get(key);
        if (latest) {
          mergedCompetitors.push({ ...latest, is_comparison_header: true });
        }
        mergedCompetitors.push(...history.map(h => ({ ...h, created_by: latest })));
      });
      competitorProducts = mergedCompetitors;
    }

    /* ── DEBUG: result counts ── */
    // console.log("Results → supplier: %d/%d, competitor: %d/%d",
    //   supplierProducts.length, supplierTotal,
    //   competitorProducts.length, competitorTotal);
    // console.log("=== END DEBUG ===\n");

    /* ── Response ── */
    return NextResponse.json({
      // Supplier data
      supplierProducts,
      supplierTotal,
      supplierPage,
      supplierTotalPages: Math.ceil(supplierTotal / supplierLimit),

      // Competitor data
      competitorProducts,
      competitorTotal,
      competitorPage,
      competitorTotalPages: Math.ceil(competitorTotal / competitorLimit),

      // Summary stats
      summary: {
        totalProducts: supplierTotal,
        averagePrice: 0,
        averageCost: 0,
        totalBrands: brands.filter(Boolean).length,
      },

      // Filter dropdown options
      filterOptions: {
        brands: brands.filter(Boolean).sort(),
        brandCategories: brandCategories.filter(Boolean).sort(),
        vehicleTypes: vehicleTypes.filter(Boolean).sort(),
        countries: countries.filter(Boolean).sort(),
        years: years.filter(Boolean).sort((a: number, b: number) => b - a),
        runflatOptions: runflatOpts.filter(Boolean).sort(),
        tyreMarkings: tyreMarkings.filter(Boolean).sort(),
        sizes: sizes.filter(Boolean).sort(),
        plainSizes: plainSizes.filter(Boolean).sort((a: number, b: number) => a - b),
        loadIndexes: loadIndexes.filter(Boolean).sort(),
        sourceNames: sourceNames.filter(Boolean).sort(),
      },
    });
  } catch (error: unknown) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/* ─────────────────────────────────────────────────────────────
   POST /api/products — Create a single product
───────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const data = await req.json();

    // Auto-generate plain_size from size
    if (data.size && !data.plain_size) {
      data.plain_size = Number(data.size.replace(/\D/g, ""));
    }

    // Default product_source to "supplier"
    if (!data.product_source) {
      data.product_source = "supplier";
    }

    const newProduct = await Product.create(data);
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create product" },
      { status: 500 }
    );
  }
}
