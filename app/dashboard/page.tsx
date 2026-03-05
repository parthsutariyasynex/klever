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
              <span className="text-2xl font-semibold tracking-tight text-white">Klever || Supplier Product Management</span>
            </div>

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
        <section className="flex-none mb-4 bg-gray-900/50 p-5 rounded-xl border border-gray-800 backdrop-blur-sm shadow-sm transition-all relative z-50">

          <div className="flex flex-row items-end flex-nowrap w-full overflow-visible pb-1 gap-2">

            <div className="min-w-[60px] flex-[1.5]"><FilterSelect label="Supplier" value={sourceName} onChange={(v) => { setSourceName(v); setPage(1); }} options={filterOptions.sourceNames} /></div>
            <div className="min-w-[60px] flex-[1.5]">
              <FilterSelect label="Category" value={brandCategory} onChange={(v) => { setBrandCategory(v); setPage(1); }} options={filterOptions.brandCategories} />

            </div>
            <div className="min-w-[60px] flex-[1.5]">
              <InlineSearchInput label="Brand" value={brand} onChange={(v) => { setBrand(v); setPage(1); }} options={filterOptions.brands} />
            </div>

            {/* Open Search */}
            <div className="flex flex-col gap-1 min-w-[80px] flex-[2]">
              <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
                Search
              </label>
              <div className="relative group h-[32px] w-full">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <input
                  type="text"
                  className="w-full h-full bg-[#0d1323] border border-gray-700 rounded-md pl-8 pr-2 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                  placeholder="Query..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>

            <div className="min-w-[60px] flex-1"><InlineSearchInput label="Size" value={size} onChange={(v) => { setSize(v); setPage(1); }} options={filterOptions.sizes} /></div>
            <div className="min-w-[50px] flex-1"><InlineSearchInput label="Year" value={year} onChange={(v) => { setYear(v); setPage(1); }} options={filterOptions.years.map(String)} /></div>

            {/* Qty Input */}
            <div className="flex flex-col gap-1 min-w-[40px] flex-[0.8]">
              <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
                Qty
                {qty && <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
              </label>
              <input
                type="number"
                placeholder="Qty..."
                className="w-full h-[32px] bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                value={qty}
                onChange={(e) => handleQtyChange(e.target.value)}
              />
            </div>

            {/* Latest? Checkbox */}
            <div className="flex flex-col items-center gap-1 min-w-[44px] flex-none cursor-pointer" onClick={() => { setLatest(!latest); setPage(1); }}>
              <div className="relative flex items-center justify-center w-[16px] h-[16px] mt-[4px]">
                <input
                  type="checkbox"
                  className="peer appearance-none w-full h-full rounded bg-gray-900 checked:bg-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer transition-all border-2 border-gray-700 shadow-inner"
                  checked={latest}
                  readOnly
                />

                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase mt-0.5">
                Latest?
              </span>
            </div>

            {/* Actions: Search & Clear (Moved to the end) */}
            <div className="flex items-center gap-1.5 h-[32px] flex-none ml-1 cursor-pointer">
              <button
                type="button"
                title="Search"
                className="w-[32px] h-[32px] flex-none flex items-center justify-center rounded-md bg-indigo-600 hover:bg-indigo-500 transition-all text-white shadow-md shadow-indigo-500/20"
                onClick={() => { setPage(1); fetchProducts(); }}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <button
                type="button"
                title="Clear Search & Filters"
                className="w-[32px] h-[32px] flex-none flex items-center justify-center rounded-full bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white transition-all text-gray-400 group"
                onClick={clearFilters}
              >
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="group-hover:-rotate-180 transition-transform duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </section>

        {/* Product Table (Scrollable) */}
        <section className="flex-1 min-h-0 mb-4 flex flex-col relative z-0">
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

/* ── Reusable Searchable Dropdown Filter ── */
function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filteredOptions = options.filter(opt =>
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1 relative w-full" ref={dropdownRef}>
      <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
        {label}
        {value && <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
      </label>

      {/* Trigger */}
      <div
        className="w-full h-[32px] bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer flex items-center justify-between"
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setSearchTerm(""); }}
      >
        <span className="truncate pr-2">{value || "All"}</span>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-none">
          <path d="M5 7.5L10 12.5L15 7.5" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-[9999] w-full min-w-[140px] bg-gray-900 border border-gray-700 rounded-md shadow-2xl flex flex-col overflow-hidden">

          {/* Top internal search */}
          <div className="flex items-center px-2 py-1.5 border-b border-gray-800 bg-gray-900/80 sticky top-0">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-gray-500 mr-1.5 flex-none">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className="w-full bg-transparent border-none text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-0 p-0"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="overflow-y-auto max-h-40 p-1 flex-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
            <div
              className={`px-3 py-1.5 text-xs rounded-sm cursor-pointer transition-colors ${value === "" ? "bg-indigo-500/20 text-indigo-300" : "text-gray-300 hover:bg-gray-800"}`}
              onClick={() => { onChange(""); setIsOpen(false); setSearchTerm(""); }}
            >
              All
            </div>
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[10px] text-gray-500 text-center italic">No matching results</div>
            ) : (
              filteredOptions.map((opt) => (
                <div
                  key={opt}
                  className={`px-3 py-1.5 text-xs rounded-sm cursor-pointer transition-colors ${value === String(opt) ? "bg-indigo-500/20 text-indigo-300" : "text-gray-300 hover:bg-gray-800"}`}
                  onClick={() => { onChange(String(opt)); setIsOpen(false); setSearchTerm(""); }}
                >
                  {opt}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Inline Search Input (Autocomplete Combobox) ── */
function InlineSearchInput({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync value from parent (e.g., when clear filters is clicked)
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(val);
    }, 400);
  };

  const handleOptionClick = (opt: string) => {
    setSearchTerm(opt);
    setIsOpen(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onChange(opt);
  };

  const filteredOptions = options.filter(opt =>
    String(opt).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-1 relative w-full" ref={wrapperRef}>
      <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">
        {label}
        {value && <span className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />}
      </label>

      <div className="relative group h-[32px] w-full">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
          <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </span>
        <input
          type="text"
          className="w-full h-full bg-gray-900 border border-gray-700 rounded-md pl-[22px] pr-5 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          placeholder={label}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onClick={(e) => { setIsOpen(true); e.stopPropagation(); }}
        />
        {searchTerm && (
          <button
            onClick={() => { setSearchTerm(""); onChange(""); setIsOpen(false); }}
            className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors cursor-pointer"
          >
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>

      {/* Dynamic Options List */}
      {isOpen && filteredOptions.length > 0 && (
        <div className="absolute top-[calc(100%+4px)] left-0 z-[9999] w-full min-w-[140px] bg-gray-900 border border-gray-700 rounded-md shadow-2xl flex flex-col overflow-hidden max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent py-1">
          {filteredOptions.map((opt) => (
            <div
              key={opt}
              className={`px-3 py-1.5 text-xs rounded-sm cursor-pointer transition-colors ${value === String(opt) ? "bg-indigo-500/20 text-indigo-300" : "text-gray-300 hover:bg-gray-800"}`}
              onClick={(e) => { e.stopPropagation(); handleOptionClick(String(opt)); }}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 