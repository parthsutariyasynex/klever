export interface IProduct {
    _id: string;
    product_source: "supplier" | "competitor";
    klever_sku: string;
    source_name: string;
    sku: string;
    product_url: string;
    product_name: string;
    tyre_marking: string;
    cost: number;
    price: number;
    set_price: number;
    fitting_price: number;
    offers: string;
    brand: string;
    brand_category: string;
    plain_size: string;
    size: string;
    load_index: string;
    runflat: string;
    vehicle_type: string;
    country: string;
    year: number;
    product_image_url: string;
    source_date: string;
    createdAt: string;
    qty?: number;
    // Competitor-specific fields
    item_code?: string;
    category?: string;
    tyre_pattern?: string;
    date?: string;
    url?: string;
}

export interface ICompetitorProduct {
    _id: string;
    product_source: "competitor";
    source_name: string;
    item_code: string;
    category: string;
    brand: string;
    tyre_pattern: string;
    size: string;
    runflat: boolean | string;
    year: number;
    country: string;
    price: number;
    set_price: number;
    date: string;
    url: string;
    createdAt: string;
}

export interface Summary {
    totalProducts: number;
    averagePrice: number;
    averageCost: number;
    totalBrands: number;
}

export interface FilterOptions {
    brands: string[];
    brandCategories: string[];
    vehicleTypes: string[];
    countries: string[];
    years: number[];
    runflatOptions: string[];
    tyreMarkings: string[];
    sizes: string[];
    plainSizes: string[];
    loadIndexes: string[];
    sourceNames: string[];
}

export interface ProductsApiResponse {
    products: IProduct[];
    total: number;
    page: number;
    totalPages: number;
    summary: Summary;
    filterOptions: FilterOptions;
}

export interface ImportApiResponse {
    supplierProducts: IProduct[];
    supplierTotal: number;
    supplierPage: number;
    supplierTotalPages: number;
    competitorProducts: ICompetitorProduct[];
    competitorTotal: number;
    competitorPage: number;
    competitorTotalPages: number;
    summary: Summary;
    filterOptions: FilterOptions;
}
