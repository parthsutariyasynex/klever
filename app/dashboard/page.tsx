"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import UploadCSV from "@/components/UploadCSV";
import ProductTable from "@/components/ProductTable";
import Pagination from "@/components/Pagination";
import { IProduct, ProductsApiResponse, FilterOptions } from "@/types/product";
import { useToast } from "@/components/ToastProvider";

const EMPTY_FILTERS: FilterOptions = {
  brands: [], brandCategories: [], vehicleTypes: [], countries: [],
  years: [], runflatOptions: [], tyreMarkings: [], sizes: [],
  plainSizes: [], loadIndexes: [], sourceNames: [],
};

export default function DashboardPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Dropdown filters
  const [brand, setBrand] = useState("");
  const [brandCategory, setBrandCategory] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [country, setCountry] = useState("");
  const [year, setYear] = useState("");
  const [runflat, setRunflat] = useState("");
  const [tyreMarking, setTyreMarking] = useState("");
  const [size, setSize] = useState("");
  const [loadIndex, setLoadIndex] = useState("");
  const [sourceName, setSourceName] = useState("");

  // Range filters
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [costMin, setCostMin] = useState("");
  const [costMax, setCostMax] = useState("");

  // Sort
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTERS);
  // const [showFilters, setShowFilters] = useState(false);

  /* ══════════════════════════
     Fetch Products (server-side pagination)
  ══════════════════════════ */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(page), limit: "200", sortBy, sortOrder });

      if (search) params.set("search", search);
      if (brand) params.set("brand", brand);
      if (brandCategory) params.set("brand_category", brandCategory);
      if (vehicleType) params.set("vehicle_type", vehicleType);
      if (country) params.set("country", country);
      if (year) params.set("year", year);
      if (runflat) params.set("runflat", runflat);
      if (tyreMarking) params.set("tyre_marking", tyreMarking);
      if (size) params.set("size", size);
      if (loadIndex) params.set("load_index", loadIndex);
      if (sourceName) params.set("source_name", sourceName);
      if (priceMin) params.set("price_min", priceMin);
      if (priceMax) params.set("price_max", priceMax);
      if (costMin) params.set("cost_min", costMin);
      if (costMax) params.set("cost_max", costMax);

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");

      const data: ProductsApiResponse = await res.json();
      setProducts(data.products);
      setTotalPages(data.totalPages);
      setTotal(data.total);
      setFilterOptions(data.filterOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, brand, brandCategory, vehicleType, country, year, runflat, tyreMarking, size, loadIndex, sourceName, priceMin, priceMax, costMin, costMax]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Debounced Search ── */
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(value); setPage(1); }, 400);
  };

  /* ── Range filter debounce ── */
  const rangeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const applyRangeFilter = (setter: (v: string) => void, value: string) => {
    setter(value);
    if (rangeDebounceRef.current) clearTimeout(rangeDebounceRef.current);
    rangeDebounceRef.current = setTimeout(() => { setPage(1); }, 600);
  };

  /* ── Handlers ── */
  const handleSort = useCallback((field: string) => {
    setSortBy((prev) => {
      if (prev === field) { setSortOrder((o) => (o === "asc" ? "desc" : "asc")); return field; }
      setSortOrder("asc");
      return field;
    });
    setPage(1);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setProducts((prev) => prev.filter((p) => p._id !== id));
    setTotal((prev) => prev - 1);
  }, []);

  const handleUploadComplete = useCallback(() => {
    setPage(1);
    fetchProducts();
    toast("Products imported successfully!", "success");
  }, [fetchProducts, toast]);

  const clearFilters = () => {
    setBrand(""); setBrandCategory(""); setVehicleType(""); setCountry("");
    setYear(""); setRunflat(""); setTyreMarking(""); setSize("");
    setLoadIndex(""); setSourceName(""); setPriceMin(""); setPriceMax("");
    setCostMin(""); setCostMax(""); setSearch(""); setSearchInput("");
    setPage(1);
  };

  const activeFilterCount = [brand, brandCategory, vehicleType, country, year, runflat, tyreMarking, size, loadIndex, sourceName, priceMin, priceMax, costMin, costMax]
    .filter(Boolean).length;

  /* ══════════════════════════
     Render
  ══════════════════════════ */
  if (loading && products.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0a0f1c]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-gray-400 font-medium">Loading products...</p>
        </div>
      </div>
    );
  }

  //   return (
  //     <div className="h-screen flex flex-col bg-[#0a0f1c] text-white overflow-hidden">
  //       <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 flex flex-col h-full">
  //         {/* Header (Fixed) */}
  //         <header className="flex-none flex items-center justify-between py-4 md:py-5 border-b border-gray-800 mb-5 flex-wrap gap-4">
  //           <div className="flex flex-col gap-1">
  //             <div className="flex items-center gap-3">
  //               <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
  //                 K
  //               </div>
  //               <span className="text-2xl font-semibold tracking-tight text-white">Klever</span>
  //             </div>
  //             <p className="text-sm font-medium text-gray-400 uppercase tracking-widest pl-[52px]">Supplier Product Management</p>
  //           </div>
  //         </header>

  //         {error && (
  //           <div className="flex-none flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
  //             <span className="text-red-400 text-sm font-medium">{error}</span>
  //             <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm font-medium transition-colors" onClick={fetchProducts}>Retry</button>
  //           </div>
  //         )}

  //         {/* Upload CSV (Fixed) */}
  //         <section className="flex-none mb-6">
  //           <UploadCSV onUploadComplete={handleUploadComplete} />
  //         </section>

  //         {/* Search & Filters (Fixed) */}
  //         <section className="flex-none mb-4">
  //           <div className="flex flex-wrap items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
  //             <div className="relative flex-1 min-w-[280px] max-w-xl group">
  //               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
  //                 <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  //                   <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  //                 </svg>
  //               </span>
  //               <input
  //                 type="text"
  //                 className="w-full bg-[#0d1323] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
  //                 placeholder="Search by product name, SKU, klever_sku, or brand..."
  //                 value={searchInput}
  //                 onChange={(e) => handleSearchChange(e.target.value)}
  //               />
  //               {searchInput && (
  //                 <button
  //                   className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
  //                   onClick={() => handleSearchChange("")}
  //                 >
  //                   <span className="text-xs">✕</span>
  //                 </button>
  //               )}
  //             </div>

  //             <span className="text-sm font-medium text-gray-400 whitespace-nowrap px-2 flex items-center">
  //               <strong className="text-gray-200 font-semibold mr-1">{total.toLocaleString()}</strong> products
  //               {loading && <div className="ml-2 w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />}
  //             </span>

  //             <button
  //               className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${showFilters
  //                 ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
  //                 : "bg-[#0d1323] border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white"
  //                 }`}
  //               onClick={() => setShowFilters((p) => !p)}
  //             >
  //               <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
  //                 <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
  //               </svg>
  //               Filters
  //               {activeFilterCount > 0 && <span className="flex items-center justify-center bg-white text-indigo-600 w-5 h-5 rounded-md text-xs font-bold leading-none">{activeFilterCount}</span>}
  //             </button>

  //             {(activeFilterCount > 0 || search) && (
  //               <button className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-medium transition-colors" onClick={clearFilters}>
  //                 Clear All
  //               </button>
  //             )}
  //           </div>

  //           {showFilters && (
  //             <div className="mt-3 p-5 bg-[#0d1323] border border-gray-800 rounded-xl shadow-xl transition-all duration-300">
  //               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
  //                 <FilterSelect label="Brand" value={brand} onChange={(v) => { setBrand(v); setPage(1); }} options={filterOptions.brands} />
  //                 <FilterSelect label="Category" value={brandCategory} onChange={(v) => { setBrandCategory(v); setPage(1); }} options={filterOptions.brandCategories} />
  //                 <FilterSelect label="Vehicle" value={vehicleType} onChange={(v) => { setVehicleType(v); setPage(1); }} options={filterOptions.vehicleTypes} />
  //                 <FilterSelect label="Country" value={country} onChange={(v) => { setCountry(v); setPage(1); }} options={filterOptions.countries} />
  //               </div>

  //               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
  //                 <FilterSelect label="Year" value={year} onChange={(v) => { setYear(v); setPage(1); }} options={filterOptions.years.map(String)} />
  //                 <FilterSelect label="Runflat" value={runflat} onChange={(v) => { setRunflat(v); setPage(1); }} options={filterOptions.runflatOptions} />
  //                 <FilterSelect label="Source" value={sourceName} onChange={(v) => { setSourceName(v); setPage(1); }} options={filterOptions.sourceNames} />
  //                 <FilterSelect label="Tyre Marking" value={tyreMarking} onChange={(v) => { setTyreMarking(v); setPage(1); }} options={filterOptions.tyreMarkings} />
  //               </div>

  //               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
  //                 <FilterSelect label="Size" value={size} onChange={(v) => { setSize(v); setPage(1); }} options={filterOptions.sizes} />
  //                 <FilterSelect label="Load Index" value={loadIndex} onChange={(v) => { setLoadIndex(v); setPage(1); }} options={filterOptions.loadIndexes} />

  //                 <div className="flex flex-col gap-1.5">
  //                   <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
  //                     Price Range
  //                   </label>
  //                   <div className="flex items-center gap-2">
  //                     <input type="number" placeholder="Min" className="flex-1 min-w-[80px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" value={priceMin} onChange={(e) => applyRangeFilter(setPriceMin, e.target.value)} />
  //                     <span className="text-gray-600 font-medium">–</span>
  //                     <input type="number" placeholder="Max" className="flex-1 min-w-[80px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" value={priceMax} onChange={(e) => applyRangeFilter(setPriceMax, e.target.value)} />
  //                   </div>
  //                 </div>

  //                 <div className="flex flex-col gap-1.5">
  //                   <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
  //                     Cost Range
  //                   </label>
  //                   <div className="flex items-center gap-2">
  //                     <input type="number" placeholder="Min" className="flex-1 min-w-[80px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" value={costMin} onChange={(e) => applyRangeFilter(setCostMin, e.target.value)} />
  //                     <span className="text-gray-600 font-medium">–</span>
  //                     <input type="number" placeholder="Max" className="flex-1 min-w-[80px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" value={costMax} onChange={(e) => applyRangeFilter(setCostMax, e.target.value)} />
  //                   </div>
  //                 </div>
  //               </div>
  //             </div>
  //           )}
  //         </section>

  //         {/* Product Table (Scrollable) */}
  //         <section className="flex-1 min-h-0 mb-4 flex flex-col">
  //           <ProductTable
  //             products={products}
  //             page={page}
  //             sortBy={sortBy}
  //             sortOrder={sortOrder}
  //             onSort={handleSort}
  //             onDelete={handleDelete}
  //           />
  //         </section>

  //         {/* Pagination (Fixed) */}
  //         <section className="flex-none pb-4">
  //           <Pagination
  //             page={page}
  //             totalPages={totalPages}
  //             total={total}
  //             perPage={200}
  //             onPageChange={setPage}
  //           />
  //         </section>
  //       </div>
  //     </div>
  //   );
  // }

  // /* ── Reusable Filter Select ── */
  // function FilterSelect({ label, value, onChange, options }: {
  //   label: string;
  //   value: string;
  //   onChange: (value: string) => void;
  //   options: string[];
  // }) {
  //   return (
  //     <div className="flex flex-col gap-1.5">
  //       <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
  //         {label}
  //         {value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
  //       </label>
  //       <select
  //         value={value}
  //         onChange={(e) => onChange(e.target.value)}
  //         className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] pr-8"
  //       >
  //         <option value="">All</option>
  //         {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
  //       </select>
  //     </div>
  //   );


  return (
    <div className="h-screen flex flex-col bg-[#0a0f1c] text-white overflow-hidden">
      <div className="max-w-[1600px] w-full mx-auto px-4 md:px-8 flex flex-col h-full">
        {/* Header (Fixed) */}
        <header className="flex-none flex items-center justify-between py-4 md:py-5 border-b border-gray-800 mb-5 flex-wrap gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-500/20">
                K
              </div>
              <span className="text-2xl font-semibold tracking-tight text-white">Klever</span>
            </div>
            <p className="text-sm font-medium text-gray-400 uppercase tracking-widest pl-[52px]">Supplier Product Management</p>
          </div>
        </header>

        {error && (
          <div className="flex-none flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <span className="text-red-400 text-sm font-medium">{error}</span>
            <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm font-medium transition-colors" onClick={fetchProducts}>Retry</button>
          </div>
        )}

        {/* Upload CSV (Fixed) */}
        <section className="flex-none mb-6">
          <UploadCSV onUploadComplete={handleUploadComplete} />
        </section>

        {/* Search & Filters (Fixed) */}
        <section className="flex-none mb-4">
          <div className="flex flex-wrap items-center gap-4 bg-gray-900/50 p-4 rounded-xl border border-gray-800 backdrop-blur-sm">
            <div className="relative flex-1 min-w-[280px] max-w-xl group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                className="w-full bg-[#0d1323] border border-gray-700 rounded-lg pl-10 pr-10 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                placeholder="Search by product name, SKU, klever_sku, or brand..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
              {searchInput && (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                  onClick={() => handleSearchChange("")}
                >
                  <span className="text-xs">✕</span>
                </button>
              )}
            </div>

            <span className="text-sm font-medium text-gray-400 whitespace-nowrap px-2 flex items-center">
              <strong className="text-gray-200 font-semibold mr-1">{total.toLocaleString()}</strong> products
              {loading && <div className="ml-2 w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />}
            </span>


          </div>

          {/* {showFilters && ( */}
          <div className="mt-3 p-4 bg-[#0d1323] border border-gray-800 rounded-xl shadow-xl">

            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">

              <FilterSelect label="Brand" value={brand} onChange={(v) => { setBrand(v); setPage(1); }} options={filterOptions.brands} />

              <FilterSelect label="Category" value={brandCategory} onChange={(v) => { setBrandCategory(v); setPage(1); }} options={filterOptions.brandCategories} />

              <FilterSelect label="Vehicle" value={vehicleType} onChange={(v) => { setVehicleType(v); setPage(1); }} options={filterOptions.vehicleTypes} />

              <FilterSelect label="Country" value={country} onChange={(v) => { setCountry(v); setPage(1); }} options={filterOptions.countries} />

              <FilterSelect label="Year" value={year} onChange={(v) => { setYear(v); setPage(1); }} options={filterOptions.years.map(String)} />

              <FilterSelect label="Runflat" value={runflat} onChange={(v) => { setRunflat(v); setPage(1); }} options={filterOptions.runflatOptions} />

              <FilterSelect label="Source" value={sourceName} onChange={(v) => { setSourceName(v); setPage(1); }} options={filterOptions.sourceNames} />

              <FilterSelect label="Tyre Marking" value={tyreMarking} onChange={(v) => { setTyreMarking(v); setPage(1); }} options={filterOptions.tyreMarkings} />

              <FilterSelect label="Size" value={size} onChange={(v) => { setSize(v); setPage(1); }} options={filterOptions.sizes} />

              <FilterSelect label="Load Index" value={loadIndex} onChange={(v) => { setLoadIndex(v); setPage(1); }} options={filterOptions.loadIndexes} />

              {/* Price */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 uppercase">Price</label>

                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => applyRangeFilter(setPriceMin, e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                  />

                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => applyRangeFilter(setPriceMax, e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>

              {/* Cost */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-500 uppercase">Cost</label>

                <div className="flex gap-1">
                  <input
                    type="number"
                    placeholder="Min"
                    value={costMin}
                    onChange={(e) => applyRangeFilter(setCostMin, e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                  />

                  <input
                    type="number"
                    placeholder="Max"
                    value={costMax}
                    onChange={(e) => applyRangeFilter(setCostMax, e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-xs"
                  />
                </div>
              </div>

            </div>

          </div>
          {/* )}   */}
        </section>

        {/* Product Table (Scrollable) */}
        <section className="flex-1 min-h-0 mb-4 flex flex-col">
          <ProductTable
            products={products}
            page={page}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onDelete={handleDelete}
          />
        </section>

        {/* Pagination (Fixed) */}
        <section className="flex-none pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            perPage={200}
            onPageChange={setPage}
          />
        </section>
      </div>
    </div>
  );
}

/* ── Reusable Filter Select ── */
function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
        {label}
        {value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] pr-8"
      >
        <option value="">All</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );





}