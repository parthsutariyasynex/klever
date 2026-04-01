"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import UploadCSV from "@/components/UploadCSV";
import ProductTable from "@/components/ProductTable";
import Pagination from "@/components/Pagination";
import { IProduct, ImportApiResponse, FilterOptions } from "@/types/product";
import { useToast } from "@/components/ToastProvider";

const EMPTY_FILTERS: FilterOptions = {
  brands: [], brandCategories: [], vehicleTypes: [], countries: [],
  years: [], runflatOptions: [], tyreMarkings: [], sizes: [],
  plainSizes: [], loadIndexes: [], sourceNames: [],
};

interface ClientDashboardProps {
  initialProducts: IProduct[];
  initialTotal: number;
  initialTotalPages: number;
  initialFilterOptions: FilterOptions;
}

export default function ClientDashboard({
  initialProducts,
  initialTotal,
  initialTotalPages,
  initialFilterOptions,
}: ClientDashboardProps) {
  const { toast } = useToast();

  const [products, setProducts] = useState<IProduct[]>(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [totalPages, setTotalPages] = useState(initialTotalPages);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>(initialFilterOptions || EMPTY_FILTERS);

  const isInitialMount = useRef(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [brandCategory, setBrandCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [sizeInput, setSizeInput] = useState("");
  const [year, setYear] = useState("");
  const [yearInput, setYearInput] = useState("");
  const [qty, setQty] = useState("");
  const [qtyInput, setQtyInput] = useState("");
  const [latest, setLatest] = useState(true);

  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [chartOpen, setChartOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
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
      params.set("latest", latest ? "1" : "0");

      const res = await fetch(`/api/products?${params}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data: ImportApiResponse = await res.json();
      setProducts(data.supplierProducts);
      setTotalPages(data.supplierTotalPages);
      setTotal(data.supplierTotal);
      setFilterOptions(data.filterOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [page, search, sortBy, sortOrder, sourceName, brandCategory, brand, size, year, qty, latest]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => { setSearch(value); setPage(1); }, 400);
  };

  const sizeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleSizeChange = (value: string) => {
    setSizeInput(value);
    if (sizeDebounceRef.current) clearTimeout(sizeDebounceRef.current);
    sizeDebounceRef.current = setTimeout(() => { setSize(value); setPage(1); }, 400);
  };

  const yearDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleYearChange = (value: string) => {
    setYearInput(value);
    if (yearDebounceRef.current) clearTimeout(yearDebounceRef.current);
    yearDebounceRef.current = setTimeout(() => { setYear(value); setPage(1); }, 400);
  };

  const qtyDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const handleQtyChange = (value: string) => {
    setQtyInput(value);
    if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current);
    qtyDebounceRef.current = setTimeout(() => { setQty(value); setPage(1); }, 400);
  };

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
    setSize(""); setSizeInput("");
    setYear(""); setYearInput("");
    setQty(""); setQtyInput("");
    setLatest(true);
    setSearch(""); setSearchInput("");
    setPage(1);
  };

  return (
    <div className="h-screen flex flex-col bg-[#0a0f1c] text-white overflow-hidden">
      <div className="w-full mx-auto px-4 md:px-6 flex flex-col h-full">
        {/* Header */}
        <header className="flex-none flex items-center justify-between py-3 border-b border-gray-800 gap-4">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg">
              K
            </div>
            <span className="text-lg md:text-2xl font-semibold tracking-tight">Klever</span>
          </div>
          <div className="flex-none scale-90 md:scale-100 origin-right">
            <UploadCSV onUploadComplete={handleUploadComplete} />
          </div>
        </header>

        {error && (
          <div className="flex-none flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-3 my-2">
            <span className="text-red-400 text-sm font-medium">{error}</span>
            <button className="text-red-400 hover:underline text-sm font-medium" onClick={fetchProducts}>Retry</button>
          </div>
        )}

        {/* Filters Section */}
        {!chartOpen && (
          <section className="flex-none mt-3 mb-3 bg-gray-900/40 p-3 md:p-4 rounded-xl border border-gray-800 backdrop-blur-md z-50 overflow-y-auto max-h-[35vh] md:max-h-none scrollbar-hide">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-9 gap-3 md:gap-4 items-end">

              {/* Core Filters */}
              <div className="w-full">
                <FilterSelect label="Supplier" value={sourceName} onChange={(v: string) => { setSourceName(v); setPage(1); }} options={filterOptions.sourceNames || []} />
              </div>
              <div className="w-full">
                <FilterSelect label="Category" value={brandCategory} onChange={(v: string) => { setBrandCategory(v); setPage(1); }} options={filterOptions.brandCategories || []} />
              </div>
              <div className="w-full">
                <InlineSearchInput label="Brand" value={brand} onChange={(v: string) => { setBrand(v); setPage(1); }} options={filterOptions.brands || []} />
              </div>

              {/* Search Field (Wider on larger screens) */}
              <div className="sm:col-span-2 lg:col-span-1 xl:col-span-2">
                <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-1.5 ml-0.5">Search</label>
                <div className="relative group h-[32px]">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors pointer-events-none">
                    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    className="w-full h-full bg-[#0d1323] border border-gray-700/50 rounded-md pl-8 pr-2 py-1 text-xs text-gray-200 placeholder-gray-600 focus:border-indigo-500 outline-none transition-all focus:bg-gray-900 shadow-inner"
                    placeholder="Search query..."
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                </div>
              </div>

              {/* Numeric / Text Attributes */}
              <div className="w-full">
                <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-1.5 ml-0.5">Size</label>
                <input type="text" placeholder="Size..." className="w-full h-[32px] bg-[#0d1323] border border-gray-700/50 rounded-md px-2 text-xs text-gray-200 outline-none focus:border-indigo-500 focus:bg-gray-900 transition-all shadow-inner" value={sizeInput} onChange={(e) => handleSizeChange(e.target.value)} />
              </div>
              <div className="w-full">
                <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-1.5 ml-0.5">Year</label>
                <input type="text" placeholder="Year..." className="w-full h-[32px] bg-[#0d1323] border border-gray-700/50 rounded-md px-2 text-xs text-gray-200 outline-none focus:border-indigo-500 focus:bg-gray-900 transition-all shadow-inner" value={yearInput} onChange={(e) => handleYearChange(e.target.value)} />
              </div>
              <div className="w-full">
                <label className="text-[10px] font-bold tracking-widest text-gray-500 uppercase block mb-1.5 ml-0.5">Qty</label>
                <input type="number" placeholder="Qty..." className="w-full h-[32px] bg-[#0d1323] border border-gray-700/50 rounded-md px-2 text-xs text-gray-200 outline-none focus:border-indigo-500 focus:bg-gray-900 transition-all shadow-inner font-mono" value={qtyInput} onChange={(e) => handleQtyChange(e.target.value)} />
              </div>

              {/* Controls & State */}
              <div className="flex items-center justify-between gap-3 sm:col-span-2 lg:col-span-1 xl:col-span-1">
                <div className="flex items-center gap-2 group cursor-pointer select-none" onClick={() => { setLatest(!latest); setPage(1); }}>
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer appearance-none w-5 h-5 rounded bg-[#0d1323] border-2 border-gray-700 checked:bg-indigo-600 checked:border-indigo-500 transition-all cursor-pointer" checked={latest} readOnly />
                    <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-400">Latest</span>
                </div>

                <div className="flex gap-1.5">
                  <button onClick={() => { setPage(1); fetchProducts(); }} className="h-8 w-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded-md text-white transition-all shadow-md shadow-indigo-500/10 active:scale-95"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg></button>
                  <button onClick={clearFilters} className="h-8 w-10 flex items-center justify-center bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-md text-gray-400 hover:text-white transition-all active:scale-95"><svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                </div>
              </div>

            </div>
          </section>
        )}

        {/* Supplier Products Header */}
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Supplier Products
          </h2>
        </div>

        {/* Table Area */}
        <section className="flex-1 min-h-0 mb-4 relative z-0 overflow-hidden rounded-xl border border-gray-800 bg-[#0d1323]">
          <ProductTable products={products} loading={loading} page={page} sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort} onDelete={handleDelete} onToggleChart={setChartOpen} />
        </section>

        {/* Pagination */}
        <footer className="flex-none pb-4">
          <Pagination page={page} totalPages={totalPages} total={total} perPage={200} onPageChange={setPage} />
        </footer>
      </div>
    </div>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | number)[];
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) => String(o).toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="flex flex-col gap-1 relative w-full" ref={dropdownRef}>
      <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase flex items-center justify-between">{label}{value && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}</label>
      <div className="w-full h-[32px] bg-gray-900 border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200 cursor-pointer flex items-center justify-between" onClick={() => setIsOpen(!isOpen)}>
        <span className="truncate">{value || "All"}</span>
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none" className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}><path d="M5 7.5L10 12.5L15 7.5" stroke="#6B7280" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      {isOpen && (
        <div className="absolute top-full left-0 z-[100] w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-2xl flex flex-col overflow-hidden max-h-60">
          <input type="text" className="w-full bg-gray-800 border-b border-gray-700 p-2 text-xs text-white outline-none" placeholder="Filter..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          <div className="overflow-y-auto">
            <div className="p-2 text-xs text-gray-400 hover:bg-gray-800 cursor-pointer" onClick={() => { onChange(""); setIsOpen(false); }}>All</div>
            {filtered.map((o) => <div key={o} className="p-2 text-xs text-gray-200 hover:bg-gray-800 cursor-pointer" onClick={() => { onChange(String(o)); setIsOpen(false); }}>{o}</div>)}
          </div>
        </div>
      )}
    </div>
  );
}

interface InlineSearchInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: (string | number)[];
}

function InlineSearchInput({ label, value, onChange, options }: InlineSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [term, setTerm] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setTerm(value); }, [value]);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = options.filter((o) => String(o).toLowerCase().includes(term.toLowerCase()));

  return (
    <div className="flex flex-col gap-1 relative w-full" ref={ref}>
      <label className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">{label}</label>
      <div className="relative h-[32px]">
        <input type="text" className="w-full h-full bg-gray-900 border border-gray-700 rounded-md px-2 text-xs text-gray-200 focus:border-indigo-500 outline-none" placeholder={label} value={term} onFocus={() => setIsOpen(true)} onChange={(e) => { setTerm(e.target.value); onChange(e.target.value); }} />
        {term && <button onClick={() => { setTerm(""); onChange(""); setIsOpen(false); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">✕</button>}
      </div>
      {isOpen && filtered.length > 0 && (
        <div className="absolute top-full left-0 z-[100] w-full mt-1 bg-gray-900 border border-gray-700 rounded-md shadow-2xl max-h-60 overflow-y-auto">
          {filtered.map((o) => <div key={o} className="p-2 text-xs text-gray-200 hover:bg-gray-800 cursor-pointer" onClick={() => { setTerm(String(o)); onChange(String(o)); setIsOpen(false); }}>{o}</div>)}
        </div>
      )}
    </div>
  );
}
