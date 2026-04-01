"use client";

import { memo, useState, useEffect } from "react";
import { IProduct } from "@/types/product";
import { useToast } from "./ToastProvider";
import { formatDDMMM } from "@/lib/utils";
import PriceChartModal from "./PriceChartModal";

interface ProductTableProps {
    products: IProduct[];
    loading: boolean;
    page: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    onSort: (field: string) => void;
    onDelete: (id: string) => void;
    onToggleChart?: (isOpen: boolean) => void;
}

const COLUMNS = [
    { key: "source_name", label: "Source", sortable: true, width: "w-[8%]" },
    { key: "sku", label: "Item Code", sortable: true, width: "w-[9%]" },
    { key: "brand_category", label: "Category", sortable: true, width: "w-[8%]" },
    { key: "brand", label: "Brand", sortable: true, width: "w-[8%]" },
    { key: "product_name", label: "Tyre Pattern", sortable: true, width: "w-[12%]" },
    { key: "size", label: "Size", sortable: true, width: "w-[9%]" },
    { key: "runflat", label: "RunFlat", sortable: true, width: "w-[6%]" },
    { key: "year", label: "Year", sortable: true, align: "right", width: "w-[5%]" },
    { key: "country", label: "Country", sortable: true, width: "w-[7%]" },
    { key: "qty", label: "Qty", sortable: true, align: "right", width: "w-[4%]" },
    { key: "cost", label: "Cost", sortable: true, align: "right", width: "w-[7%]" },
    { key: "fitting_price", label: "Fitting Price", sortable: true, align: "right", width: "w-[8%]" },
    { key: "source_date", label: "Date", sortable: true, width: "w-[9%]" },
];

function formatCurrency(val: number) {
    return val != null ? `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}



function ProductTable({ products, loading, page, sortBy, sortOrder, onSort, onDelete, onToggleChart }: ProductTableProps) {
    // function ProductTable({ products, loading, page, sortBy, sortOrder, onSort }: ProductTableProps) {

    const perPage = 200;
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Price chart modal state
    const [chartModal, setChartModal] = useState<{
        open: boolean;
        productKey: string;
        priceField: string;
        priceLabel: string;
        productName: string;
    } | null>(null);

    const openChart = (e: React.MouseEvent, p: IProduct, field: "cost" | "fitting_price", label: string) => {
        e.stopPropagation();
        setChartModal({
            open: true,
            productKey: p.sku,
            priceField: field,
            priceLabel: label,
            productName: p.product_name || p.sku || "Product",
        });
        onToggleChart?.(true);
    };

    const closeChart = () => {
        setChartModal(null);
        onToggleChart?.(false);
    };

    const handleCopy = async (p: IProduct) => {
        if (window.getSelection()?.toString()) return;

        // Raw tab-separated format
        const values = [
            p.brand_category || "—",
            p.brand || "—",
            p.product_name || "—",
            [p.size, p.load_index].filter(Boolean).join(" ") || "—",
            p.year ?? "—",
            p.country || "—",
            p.qty ?? 0,
            p.cost != null ? p.cost.toFixed(2) : "—"
        ];

        const text = values.join(" - ");

        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(p._id);
            // toast("Copied successfully", "success");
            setTimeout(() => setCopiedId(null), 1000);
        } catch (err) {
            // toast("Failed to copy", "error");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this product?")) return;
        setDeletingId(id);
        try {
            const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast("Product deleted", "success");
                onDelete(id);
            } else {
                toast("Failed to delete", "error");
            }
        } catch {
            toast("Network error", "error");
        } finally {
            setDeletingId(null);
        }
    };

    const SortIcon = ({ field }: { field: string }) => {
        if (sortBy !== field) return <span className="ml-1 text-gray-600">↕</span>;
        return <span className="ml-1 text-indigo-400">{sortOrder === "asc" ? "↑" : "↓"}</span>;
    };

    return (
        <div className="flex-1 min-h-0 min-w-0 w-full h-full bg-[#0d1323] border border-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col">

            <div className="overflow-auto flex-1 h-full custom-scrollbar">

                <table className="min-w-[1200px] w-full text-left border-collapse text-[14px] font-sans break-words pb-4">

                    <thead className="sticky top-0 z-10 bg-[#12192e] shadow-sm shadow-black/20">
                        <tr>
                            {COLUMNS.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-3 py-3.5 text-[11px] sm:text-xs font-bold text-gray-300 uppercase tracking-wider border-b border-gray-800 ${col.sortable
                                        ? "cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors"
                                        : ""
                                        } ${(col as any).align === "right" ? "text-right" : "text-left"} ${col.width}`}
                                    onClick={col.sortable ? () => onSort(col.key) : undefined}
                                >
                                    <div className={`flex items-center ${(col as any).align === "right" ? "justify-end" : "justify-start"}`}>
                                        {col.label} {col.sortable && <SortIcon field={col.key} />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-800/60 divide-dashed min-w-full">
                        {products.map((p, idx) => (
                            <tr
                                key={p._id}
                                onClick={() => handleCopy(p)}
                                className={`group cursor-pointer transition-all duration-300 relative ${deletingId === p._id ? "opacity-50 pointer-events-none" : ""
                                    } ${copiedId === p._id ? "bg-indigo-500/10" : "hover:bg-gray-800/40"}`}
                            >
                                <td className="px-3 py-2.5 text-gray-400 align-middle text-[13px]">{p.source_name || "—"}</td>

                                <td className="px-3 py-2.5 align-middle">
                                    <span className="px-2 py-1 bg-gray-900 border border-gray-700 rounded-md text-[11px] text-gray-300 font-mono tracking-wide selection:bg-indigo-500/30 inline-block break-all">
                                        {p.sku || "—"}
                                    </span>
                                </td>

                                <td className="px-3 py-2.5 text-gray-400 align-middle text-[13px]">{p.brand_category || "—"}</td>

                                <td className="px-3 py-2.5 align-middle">
                                    <span className="text-indigo-400 font-semibold uppercase tracking-wider text-[13px]">
                                        {p.brand || "—"}
                                    </span>
                                </td>

                                <td className="px-3 py-2.5 text-gray-200 font-medium selection:bg-indigo-500/30 align-middle text-[13px]">
                                    {p.product_name || "—"}
                                </td>

                                <td className="px-3 py-2.5 text-gray-300 font-medium align-middle text-[13px]">{[p.size, p.load_index].filter(Boolean).join(" ") || "—"}</td>

                                <td className="px-3 py-2.5 align-middle">
                                    <span
                                        className={`px-2 py-1 rounded-md text-[10px] sm:text-[11px] font-bold tracking-wider uppercase inline-block ${p.runflat?.toLowerCase() === "yes"
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : "bg-gray-800 text-gray-500 border border-gray-700"
                                            }`}
                                    >
                                        {p.runflat || "—"}

                                    </span>
                                </td>

                                {/* <td className="px-3 py-2.5 text-gray-300 text-right align-middle text-[13px]">{p.year ?? "—"}</td>

                                <td className="px-3 py-2.5 text-gray-400 align-middle text-[13px]">{p.country ?? "—"}</td>

                                <td className="px-3 py-2.5 text-gray-300 font-mono text-right align-middle text-[13px]">
                                    {(p as any).qty ?? 0}
                                </td> */}
                                <td className="px-3 py-2.5 text-gray-300 text-right align-middle text-[13px]">
                                    {p.year ?? "—"}
                                </td>

                                <td className="px-3 py-2.5 text-gray-400 align-middle text-[13px]">
                                    {p.country ?? "—"}
                                </td>

                                <td className="px-3 py-2.5 text-gray-300 font-mono text-right align-middle text-[13px]">
                                    {p.qty ?? 0}
                                </td>

                                <td
                                    className="px-3 py-2.5 text-emerald-400 font-mono font-medium text-right align-middle text-[13px] cursor-pointer hover:text-emerald-300 hover:bg-emerald-500/5 transition-colors group/cell"
                                    onClick={(e) => openChart(e, p, "cost", "Cost")}
                                    title="View Cost history"
                                >
                                    <span className="flex items-center justify-end gap-1.5">
                                        {formatCurrency(p.cost)}
                                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="opacity-0 group-hover/cell:opacity-100 transition-opacity text-emerald-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </span>
                                </td>

                                <td
                                    className="px-3 py-2.5 text-gray-300 font-mono text-right align-middle text-[13px] cursor-pointer hover:text-indigo-300 hover:bg-indigo-500/5 transition-colors group/cell"
                                    onClick={(e) => openChart(e, p, "fitting_price", "Fitting Price")}
                                    title="View Fitting Price history"
                                >
                                    <span className="flex items-center justify-end gap-1.5">
                                        {formatCurrency(p.fitting_price)}
                                        <svg width="11" height="11" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="opacity-0 group-hover/cell:opacity-100 transition-opacity text-indigo-400">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </span>
                                </td>

                                <td className="px-3 py-2.5 text-gray-500 font-mono align-middle text-[12px] relative">
                                    <div className="flex items-center justify-between">
                                        <span>{formatDDMMM(p.source_date)}</span>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="text-indigo-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

            {products.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500">
                    {loading ? (
                        <>
                            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                            <p className="mt-3 text-sm font-medium text-gray-400">Loading products...</p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-medium text-gray-400">No products found</p>
                            <p className="mt-1 text-sm">
                                Try adjusting your search or filters, or upload a CSV file.
                            </p>
                        </>
                    )}
                </div>
            )}

            {/* Price Chart Modal */}
            {chartModal?.open && (
                <PriceChartModal
                    isOpen={chartModal.open}
                    onClose={closeChart}
                    productKey={chartModal.productKey}
                    source="supplier"
                    priceField={chartModal.priceField}
                    priceLabel={chartModal.priceLabel}
                    productName={chartModal.productName}
                />
            )}
        </div>
    );


}

export default memo(ProductTable);