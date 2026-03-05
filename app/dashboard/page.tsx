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

  // Dropdown & Input filters
  const [sourceName, setSourceName] = useState("");
  const [brandCategory, setBrandCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [year, setYear] = useState("");
  const [qty, setQty] = useState("");
  const [latest, setLatest] = useState(false);

  // Sort
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter options from API
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(EMPTY_FILTERS);

  /* ══════════════════════════
     Fetch Products (server-side pagination)
  ══════════════════════════ */
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ page: String(page), limit: "200", sortBy, sortOrder });

      if (search) params.set("search", search);
      if (sourceName) params.set("source_name", sourceName);
      if (brandCategory) params.set("brand_category", brandCategory);
      if (brand) params.set("brand", brand);
      if (size) params.set("size", size);
      if (year) params.set("year", year);
      if (qty) params.set("qty", qty);
      if (latest) params.set("latest", "true");

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
  }, [page, search, sortBy, sortOrder, sourceName, brandCategory, brand, size, year, qty, latest]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  /* ── Debounced Search & Input ── */
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(value); setPage(1); }, 400);
  };

  const qtyDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleQtyChange = (value: string) => {
    setQty(value);
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => { setPage(1); }, 400);
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
    setSourceName(""); setBrandCategory(""); setBrand("");
    setSize(""); setYear(""); setQty(""); setLatest(false);
    setSearch(""); setSearchInput("");
    setPage(1);
  };

  const activeFilterCount = [sourceName, brandCategory, brand, size, year, qty, latest ? "true" : ""]
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
          <div className="flex-none">
            <UploadCSV onUploadComplete={handleUploadComplete} />
          </div>
        </header>

        {error && (
          <div className="flex-none flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
            <span className="text-red-400 text-sm font-medium">{error}</span>
            <button className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm font-medium transition-colors" onClick={fetchProducts}>Retry</button>
          </div>
        )}

        {/* Filters Grid Section (Directly Visible) */}
        <section className="flex-none mb-4 bg-gray-900/50 p-5 rounded-xl border border-gray-800 backdrop-blur-sm shadow-sm transition-all">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium text-gray-400 whitespace-nowrap flex items-center">
              <strong className="text-gray-200 font-semibold mr-1">{total.toLocaleString()}</strong> products
              {loading && <div className="ml-2 w-3.5 h-3.5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />}
            </span>
          </div>

          <div className="flex flex-row items-end flex-nowrap w-full overflow-x-auto overflow-y-hidden pb-3 gap-3 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">

            <div className="min-w-[130px] flex-none"><FilterSelect label="Supplier" value={sourceName} onChange={(v) => { setSourceName(v); setPage(1); }} options={filterOptions.sourceNames} /></div>
            <div className="min-w-[130px] flex-none"><FilterSelect label="Brand Category" value={brandCategory} onChange={(v) => { setBrandCategory(v); setPage(1); }} options={filterOptions.brandCategories} /></div>
            <div className="min-w-[130px] flex-none"><FilterSelect label="Brand" value={brand} onChange={(v) => { setBrand(v); setPage(1); }} options={filterOptions.brands} /></div>

            {/* Open Search */}
            <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
              <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
                Open Search
              </label>
              <div className="relative group h-[38px] w-full">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="w-full h-full bg-[#0d1323] border border-gray-700 rounded-md pl-10 pr-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  placeholder="Search products..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="min-w-[120px] flex-none"><FilterSelect label="Size" value={size} onChange={(v) => { setSize(v); setPage(1); }} options={filterOptions.sizes} /></div>
            <div className="min-w-[100px] flex-none"><FilterSelect label="Year" value={year} onChange={(v) => { setYear(v); setPage(1); }} options={filterOptions.years.map(String)} /></div>

            {/* Qty Input */}
            <div className="flex flex-col gap-1.5 min-w-[80px] flex-none">
              <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
                Qty
                {qty && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
              </label>
              <input
                type="number"
                placeholder="Qty..."
                className="w-full h-[38px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                value={qty}
                onChange={(e) => handleQtyChange(e.target.value)}
              />
            </div>

            {/* Latest? Checkbox */}
            <div className="flex flex-col items-center gap-1.5 min-w-[50px] flex-none cursor-pointer" onClick={() => { setLatest(!latest); setPage(1); }}>
              <div className="relative flex items-center justify-center w-[18px] h-[18px] mt-[6px]">
                <input
                  type="checkbox"
                  className="peer appearance-none w-full h-full rounded bg-gray-900 checked:bg-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all border-none shadow-inner"
                  checked={latest}
                  readOnly
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase">
                Latest?
              </span>
            </div>

            {/* Actions: Search & Clear (Moved to the end) */}
            <div className="flex items-center gap-2 h-[38px] flex-none ml-2">
              <button
                type="button"
                title="Search"
                className="w-[38px] h-[38px] flex-none flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-500 transition-all text-white shadow-md shadow-indigo-500/20 cursor-pointer"
                onClick={() => { setPage(1); fetchProducts(); }}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                type="button"
                title="Clear Search & Filters"
                className="w-[38px] h-[38px] flex-none flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-all text-gray-400 group cursor-pointer"
                onClick={clearFilters}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="group-hover:-rotate-180 transition-transform duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
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
      <label className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
        {label}
        {value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full min-h-[38px] bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%207.5L10%2012.5L15%207.5%22%20stroke%3D%22%236B7280%22%20stroke-width%3D%221.6%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_8px_center] pr-8"
      >
        <option value="">All</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
} 