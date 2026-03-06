"use client";

import { memo, useState } from "react";
import { IProduct } from "@/types/product";
import { useToast } from "./ToastProvider";

interface ProductTableProps {
    products: IProduct[];
    loading: boolean;
    page: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    onSort: (field: string) => void;
    onDelete: (id: string) => void;
}

const COLUMNS = [
    { key: "source_name", label: "Source", sortable: true, width: "w-[8%]" },
    { key: "sku", label: "Item Code", sortable: false, width: "w-[9%]" },
    { key: "brand_category", label: "Category", sortable: false, width: "w-[8%]" },
    { key: "brand", label: "Brand", sortable: false, width: "w-[8%]" },
    { key: "product_name", label: "Tyre Pattern", sortable: false, width: "w-[12%]" },
    { key: "size", label: "Size", sortable: false, width: "w-[9%]" },
    { key: "runflat", label: "RunFlat", sortable: false, width: "w-[6%]" },
    { key: "year", label: "Year", sortable: true, align: "right", width: "w-[5%]" },
    { key: "country", label: "Country", sortable: false, width: "w-[7%]" },
    { key: "qty", label: "Qty", sortable: false, align: "right", width: "w-[4%]" },
    { key: "cost", label: "Cost", sortable: true, align: "right", width: "w-[7%]" },
    { key: "fitting_price", label: "Fitting Price", sortable: false, align: "right", width: "w-[8%]" },
    { key: "source_date", label: "Date", sortable: true, width: "w-[9%]" },
];

function formatCurrency(val: number) {
    return val != null ? `${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}

function ProductTable({ products, loading, page, sortBy, sortOrder, onSort, onDelete }: ProductTableProps) {
    const perPage = 200;
    const { toast } = useToast();
    const [deletingId, setDeletingId] = useState<string | null>(null);

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

                <table className="w-full text-left border-collapse text-[14px] font-sans break-words pb-4">

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
                                className={`hover:bg-gray-800/40 transition-colors ${deletingId === p._id ? "opacity-50 pointer-events-none" : ""
                                    }`}
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

                                <td className="px-3 py-2.5 text-gray-300 font-medium align-middle text-[13px]">{p.size || "—"}</td>

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

                                <td className="px-3 py-2.5 text-gray-300 text-right align-middle text-[13px]">{p.year || "—"}</td>

                                <td className="px-3 py-2.5 text-gray-400 align-middle text-[13px]">{p.country || "—"}</td>

                                <td className="px-3 py-2.5 text-gray-300 font-mono text-right align-middle text-[13px]">
                                    {(p as any).qty ?? 0}
                                </td>

                                <td className="px-3 py-2.5 text-emerald-400 font-mono font-medium text-right align-middle text-[13px]">{formatCurrency(p.cost)}</td>

                                <td className="px-3 py-2.5 text-gray-300 font-mono text-right align-middle text-[13px]">{formatCurrency(p.fitting_price)}</td>

                                <td className="px-3 py-2.5 text-gray-500 font-mono align-middle text-[12px]">
                                    {p.source_date
                                        ? new Date(p.source_date).toISOString().split("T")[0]
                                        : "—"}
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
        </div>
    );


}

export default memo(ProductTable);
