"use client";

import { useState, useEffect, useCallback, useRef, memo } from "react";
import Papa from "papaparse";
import { useToast } from "./ToastProvider";

/* ── Types ── */
interface ICompetitorProduct {
    _id: string;
    source: string;
    item_code: string;
    category: string;
    brand: string;
    tyre_pattern: string;
    size: string;
    runflat: boolean;
    year: number;
    country: string;
    price: number;
    set_price: number;
    date: string;
    url: string;
}

interface ApiResponse {
    products: ICompetitorProduct[];
    total: number;
    page: number;
    totalPages: number;
}

/* ── Column Config ── */
const COLUMNS = [
    { key: "source", label: "Source", sortable: true, width: "w-[7%]" },
    { key: "item_code", label: "Item Code", sortable: true, width: "w-[10%]" },
    { key: "category", label: "Category", sortable: true, width: "w-[7%]" },
    { key: "brand", label: "Brand", sortable: true, width: "w-[8%]" },
    { key: "tyre_pattern", label: "Tyre Pattern", sortable: true, width: "w-[13%]" },
    { key: "size", label: "Size", sortable: true, width: "w-[9%]" },
    { key: "runflat", label: "RunFlat", sortable: false, width: "w-[6%]" },
    { key: "year", label: "Year", sortable: true, align: "right", width: "w-[5%]" },
    { key: "country", label: "Country", sortable: true, width: "w-[7%]" },
    { key: "price", label: "Price", sortable: true, align: "right", width: "w-[7%]" },
    { key: "set_price", label: "Set Price", sortable: true, align: "right", width: "w-[7%]" },
    { key: "date", label: "Date", sortable: true, width: "w-[8%]" },
    { key: "url", label: "URL", sortable: false, align: "center", width: "w-[4%]" },
];

function formatCurrency(val: number) {
    return val != null
        ? `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : "—";
}

/* ── Shared filter props from parent ── */
interface CompetitorProductsTableProps {
    parentSearch?: string;
    parentSourceName?: string;
    parentBrandCategory?: string;
    parentBrand?: string;
    parentSize?: string;
    parentYear?: string;
}

function CompetitorProductsTable({
    parentSearch = "",
    parentSourceName = "",
    parentBrandCategory = "",
    parentBrand = "",
    parentSize = "",
    parentYear = "",
}: CompetitorProductsTableProps) {
    const { toast } = useToast();

    // Data
    const [products, setProducts] = useState<ICompetitorProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Local search (additional refinement)
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    // Entries per page
    const [limit, setLimit] = useState(10);

    // Sort
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Import
    const [uploading, setUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ── Reset page when parent filters change ── */
    useEffect(() => {
        setPage(1);
    }, [parentSearch, parentSourceName, parentBrandCategory, parentBrand, parentSize, parentYear]);

    /* ══════════════════════════
       Fetch Competitor Products
    ══════════════════════════ */
    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
                sort: sortBy,
                order: sortOrder,
            });

            // Combine parent search + local search
            const combinedSearch = [parentSearch, search].filter(Boolean).join(" ");
            if (combinedSearch) params.set("search", combinedSearch);

            // Pass parent filters (mapped to API param names)
            if (parentSourceName) params.set("source_name", parentSourceName);
            if (parentBrandCategory) params.set("brand_category", parentBrandCategory);
            if (parentBrand) params.set("brand", parentBrand);
            if (parentSize) params.set("size", parentSize);
            if (parentYear) params.set("year", parentYear);

            const res = await fetch(`/api/competitor-products?${params}`);
            if (!res.ok) throw new Error("Failed to fetch competitor products");

            const data: ApiResponse = await res.json();
            setProducts(data.products);
            setTotalPages(data.totalPages);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setLoading(false);
        }
    }, [page, limit, search, sortBy, sortOrder, parentSearch, parentSourceName, parentBrandCategory, parentBrand, parentSize, parentYear]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    /* ── Debounced Search ── */
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const handleSearchChange = (value: string) => {
        setSearchInput(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(value);
            setPage(1);
        }, 400);
    };

    /* ── Sort handler ── */
    const handleSort = useCallback((field: string) => {
        setSortBy((prev) => {
            if (prev === field) {
                setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
                return field;
            }
            setSortOrder("asc");
            return field;
        });
        setPage(1);
    }, []);

    /* ── CSV Import ── */
    const handleFile = async (file: File) => {
        if (!file.name.endsWith(".csv")) {
            toast("Please upload a CSV file.", "error");
            return;
        }

        setUploading(true);
        setUploadStatus("Parsing CSV...");

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as Record<string, string>[];
                if (!rows || rows.length === 0) {
                    toast("No data found in CSV.", "error");
                    setUploading(false);
                    setUploadStatus(null);
                    return;
                }

                setUploadStatus(`Saving ${rows.length.toLocaleString()} records...`);
                try {
                    const res = await fetch("/api/competitor-products/import", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ data: rows }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                        toast(data.message || "Import successful", "success");
                        setUploadStatus(null);
                        setPage(1);
                        fetchProducts();
                    } else {
                        toast(data.error || "Import failed", "error");
                        setUploadStatus(null);
                    }
                } catch {
                    toast("Network error. Please try again.", "error");
                    setUploadStatus(null);
                } finally {
                    setUploading(false);
                }
            },
            error: () => {
                toast("Failed to parse CSV file.", "error");
                setUploading(false);
                setUploadStatus(null);
            },
        });
    };

    /* ── Sort Icon ── */
    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <span className="ml-1 text-gray-600">↕</span>;
        return (
            <span className="ml-1 text-indigo-400">{sortOrder === "asc" ? "↑" : "↓"}</span>
        );
    };

    /* ── Pagination helpers ── */
    const start = total > 0 ? (page - 1) * limit + 1 : 0;
    const end = Math.min(page * limit, total);

    return (
        <div className="mt-8">
            {/* ── Section Header ── */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white tracking-tight">
                    Competitor Products
                </h2>

                <div className="flex items-center gap-3">
                    {uploading && (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="text-gray-400 text-xs whitespace-nowrap">{uploadStatus}</p>
                        </div>
                    )}
                    <button
                        onClick={() => !uploading && fileInputRef.current?.click()}
                        className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 shadow-sm font-medium"
                    >
                        <svg
                            width="16"
                            height="16"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                            />
                        </svg>
                        Import
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFile(file);
                            e.target.value = "";
                        }}
                    />
                </div>
            </div>

            {/* ── Controls Bar: Search + Entries ── */}
            <div className="flex items-center justify-between mb-3 gap-4 flex-wrap">
                {/* Entries per page */}
                <div className="flex items-center gap-2 text-[13px] text-gray-400">
                    <span>Show</span>
                    <select
                        value={limit}
                        onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                        className="bg-[#0d1323] border border-gray-700 rounded-md px-2 py-1 text-xs text-gray-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                        {[10, 25, 50, 100].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    <span>entries</span>
                </div>

                {/* Search */}
                <div className="relative group">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="w-56 h-[32px] bg-[#0d1323] border border-gray-700 rounded-md pl-8 pr-3 py-1 text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
                        placeholder="Search competitor products..."
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-3">
                    <span className="text-red-400 text-sm font-medium">{error}</span>
                    <button
                        className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-md text-sm font-medium transition-colors"
                        onClick={fetchProducts}
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* ── Table ── */}
            <div className="w-full bg-[#0d1323] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
                <div className="overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse text-[14px] font-sans break-words">
                        <thead className="sticky top-0 z-10 bg-[#12192e] shadow-sm shadow-black/20">
                            <tr>
                                {COLUMNS.map((col) => (
                                    <th
                                        key={col.key}
                                        className={`px-3 py-3.5 text-[11px] sm:text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-gray-800 ${col.sortable
                                            ? "cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors"
                                            : ""
                                            } ${(col as any).align === "right" ? "text-right" : (col as any).align === "center" ? "text-center" : "text-left"} ${col.width}`}
                                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                    >
                                        <div className={`flex items-center ${(col as any).align === "right" ? "justify-end" : (col as any).align === "center" ? "justify-center" : "justify-start"}`}>
                                            {col.label} {col.sortable && <SortIcon field={col.key} />}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-800/60 divide-dashed min-w-full">
                            {products.map((p) => (
                                <tr key={p._id} className="hover:bg-gray-800/40 transition-colors">
                                    {/* Source */}
                                    <td className="px-3 py-2.5 text-gray-400 align-middle text-[13px]">
                                        {p.source || "—"}
                                    </td>

                                    {/* Item Code */}
                                    <td className="px-3 py-2.5 align-middle">
                                        <span className="px-2 py-1 bg-gray-900 border border-gray-700 rounded-md text-[11px] text-gray-300 font-mono tracking-wide selection:bg-indigo-500/30 inline-block break-all">
                                            {p.item_code || "—"}
                                        </span>
                                    </td>

                                    {/* Category */}
                                    <td className="px-3 py-2.5 text-gray-400 align-middle text-[13px]">
                                        {p.category || "—"}
                                    </td>

                                    {/* Brand */}
                                    <td className="px-3 py-2.5 align-middle">
                                        <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[13px]">
                                            {p.brand || "—"}
                                        </span>
                                    </td>

                                    {/* Tyre Pattern */}
                                    <td className="px-3 py-2.5 text-gray-200 font-medium selection:bg-indigo-500/30 align-middle text-[13px]">
                                        {p.tyre_pattern || "—"}
                                    </td>

                                    {/* Size */}
                                    <td className="px-3 py-2.5 text-gray-300 font-medium align-middle text-[13px]">
                                        {p.size || "—"}
                                    </td>

                                    {/* RunFlat */}
                                    <td className="px-3 py-2.5 align-middle">
                                        <span
                                            className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider uppercase inline-block ${p.runflat
                                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                : "bg-gray-800 text-gray-500 border border-gray-700"
                                                }`}
                                        >
                                            {p.runflat ? "Yes" : "No"}
                                        </span>
                                    </td>

                                    {/* Year */}
                                    <td className="px-3 py-2.5 text-gray-300 text-right align-middle text-[13px]">
                                        {p.year ?? "—"}
                                    </td>

                                    {/* Country */}
                                    <td className="px-3 py-2.5 text-gray-400 align-middle text-[13px]">
                                        {p.country ?? "—"}
                                    </td>

                                    {/* Price */}
                                    <td className="px-3 py-2.5 text-emerald-400 font-mono font-medium text-right align-middle text-[13px]">
                                        {formatCurrency(p.price)}
                                    </td>

                                    {/* Set Price */}
                                    <td className="px-3 py-2.5 text-gray-300 font-mono text-right align-middle text-[13px]">
                                        {formatCurrency(p.set_price)}
                                    </td>

                                    {/* Date */}
                                    <td className="px-3 py-2.5 text-gray-500 font-mono align-middle text-[12px]">
                                        {p.date || "—"}
                                    </td>

                                    {/* URL */}
                                    <td className="px-3 py-2.5 align-middle text-center">
                                        {p.url ? (
                                            <a
                                                href={p.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center text-indigo-400 hover:text-indigo-300 transition-colors"
                                                title="Open product page"
                                            >
                                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                            </a>
                                        ) : (
                                            <span className="text-gray-600">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* ── Empty / Loading State ── */}
                {products.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        {loading ? (
                            <>
                                <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                <p className="mt-3 text-sm font-medium text-gray-400">Loading competitor products...</p>
                            </>
                        ) : (
                            <>
                                <p className="text-lg font-medium text-gray-400">No competitor products found</p>
                                <p className="mt-1 text-sm">
                                    Try adjusting your search or import a CSV file.
                                </p>
                            </>
                        )}
                    </div>
                )}
            </div>

            {/* ── Pagination Footer ── */}
            {total > 0 && (
                <div className="flex items-center justify-between gap-4 flex-wrap mt-3 pb-2">
                    <div className="text-[13px] text-gray-400">
                        Showing{" "}
                        <strong className="text-gray-200 font-semibold">{start.toLocaleString()}</strong>
                        {" "}to{" "}
                        <strong className="text-gray-200 font-semibold">{end.toLocaleString()}</strong>
                        {" "}of{" "}
                        <strong className="text-gray-200 font-semibold">{total.toLocaleString()}</strong>
                        {" "}entries
                    </div>

                    <div className="flex items-center gap-1.5">
                        <button
                            className="px-3 py-2 bg-[#0d1323] border border-gray-700 rounded-md text-gray-300 text-[13px] font-medium transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-300"
                            disabled={page <= 1}
                            onClick={() => setPage(1)}
                            title="First page"
                        >
                            «
                        </button>
                        <button
                            className="px-3.5 py-2 bg-[#0d1323] border border-gray-700 rounded-md text-gray-300 text-[13px] font-medium transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-300"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                            title="Previous page"
                        >
                            ‹ Prev
                        </button>

                        <span className="px-4 py-2 text-[13px] text-gray-400 whitespace-nowrap">
                            Page <strong className="text-gray-200 font-semibold">{page}</strong> of{" "}
                            <strong className="text-gray-200 font-semibold">{totalPages}</strong>
                        </span>

                        <button
                            className="px-3.5 py-2 bg-[#0d1323] border border-gray-700 rounded-md text-gray-300 text-[13px] font-medium transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-300"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                            title="Next page"
                        >
                            Next ›
                        </button>
                        <button
                            className="px-3 py-2 bg-[#0d1323] border border-gray-700 rounded-md text-gray-300 text-[13px] font-medium transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-300"
                            disabled={page >= totalPages}
                            onClick={() => setPage(totalPages)}
                            title="Last page"
                        >
                            »
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default memo(CompetitorProductsTable);
