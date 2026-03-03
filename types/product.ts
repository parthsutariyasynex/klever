export interface IProduct {
    _id: string;
    klever_sku: string;
    product_source: string;
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
