"use client";

import { memo, useState } from "react";
import { IProduct } from "@/types/product";
import { useToast } from "./ToastProvider";

interface ProductTableProps {
    products: IProduct[];
    page: number;
    sortBy: string;
    sortOrder: "asc" | "desc";
    onSort: (field: string) => void;
    onDelete: (id: string) => void;
}

const COLUMNS = [
    { key: "sku", label: "SKU", sortable: false },
    { key: "product_name", label: "Product Name", sortable: false },
    { key: "brand", label: "Brand", sortable: false },
    { key: "brand_category", label: "Category", sortable: false },
    { key: "size", label: "Size", sortable: false },
    { key: "cost", label: "Cost", sortable: true },
    { key: "price", label: "Price", sortable: true },
    { key: "set_price", label: "Set Price", sortable: false },
    { key: "fitting_price", label: "Fitting", sortable: false },
    { key: "vehicle_type", label: "Vehicle", sortable: false },
    { key: "runflat", label: "Runflat", sortable: false },
    { key: "country", label: "Country", sortable: false },
    { key: "year", label: "Year", sortable: true },
    { key: "source_name", label: "Source", sortable: false },
    { key: "source_date", label: "Date", sortable: false },
];

function formatCurrency(val: number) {
    return val != null ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}

function ProductTable({ products, page, sortBy, sortOrder, onSort, onDelete }: ProductTableProps) {
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

    // return (
    //     <div className="flex-1 min-h-0 h-full bg-[#0d1323] border border-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
    //         <div className="overflow-y-auto flex-1 h-full custom-scrollbar">
    //             <table className="min-w-max w-full text-left border-collapse whitespace-nowrap text-sm">
    //                 <thead className="sticky top-0 z-10 bg-[#12192e] shadow-sm shadow-black/20">
    //                     <tr>
    //                         <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800">Record No</th>
    //                         {COLUMNS.map((col) => (
    //                             <th
    //                                 key={col.key}
    //                                 className={`px-6 py-4 font-bold uppercase tracking-wider border-b border-gray-800 ${col.sortable ? "cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors text-gray-300" : "text-gray-400"}`}
    //                                 onClick={col.sortable ? () => onSort(col.key) : undefined}
    //                             >
    //                                 <div className="flex items-center">
    //                                     {col.label} {col.sortable && <SortIcon field={col.key} />}
    //                                 </div>
    //                             </th>
    //                         ))}
    //                         <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 text-right">Actions</th>
    //                     </tr>
    //                 </thead>
    //                 <tbody className="divide-y divide-gray-800/60 divide-dashed">
    //                     {products.map((p, idx) => (
    //                         <tr key={p._id} className={`hover:bg-gray-800/40 transition-colors ${deletingId === p._id ? "opacity-50 pointer-events-none" : ""}`}>
    //                             <td className="px-6 py-4 text-gray-500 font-semibold selection:bg-indigo-500/30">{(page - 1) * perPage + idx + 1}</td>
    //                             <td className="px-6 py-4"><span className="px-2.5 py-1 bg-gray-900 border border-gray-700 rounded-md text-xs text-gray-300 font-mono tracking-wide selection:bg-indigo-500/30">{p.sku}</span></td>
    //                             <td className="px-6 py-4 text-gray-200 font-medium max-w-[400px] truncate selection:bg-indigo-500/30" title={p.product_name}>{p.product_name || "—"}</td>
    //                             <td className="px-6 py-4"><span className="text-indigo-400 font-semibold uppercase tracking-wider text-sm">{p.brand || "—"}</span></td>
    //                             <td className="px-6 py-4 text-gray-400">{p.brand_category || "—"}</td>
    //                             <td className="px-6 py-4 text-gray-300 font-medium">{p.size || "—"}</td>
    //                             <td className="px-6 py-4 text-emerald-400 font-mono font-medium">{formatCurrency(p.cost)}</td>
    //                             <td className="px-6 py-4 text-blue-400 font-mono font-medium">{formatCurrency(p.price)}</td>
    //                             <td className="px-6 py-4 text-gray-300 font-mono">{formatCurrency(p.set_price)}</td>
    //                             <td className="px-6 py-4 text-gray-300 font-mono">{formatCurrency(p.fitting_price)}</td>
    //                             <td className="px-6 py-4 text-gray-400">{p.vehicle_type || "—"}</td>
    //                             <td className="px-6 py-4">
    //                                 <span className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase ${p.runflat?.toLowerCase() === "yes" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-gray-800 text-gray-500 border border-gray-700"}`}>
    //                                     {p.runflat || "—"}
    //                                 </span>
    //                             </td>
    //                             <td className="px-6 py-4 text-gray-400">{p.country || "—"}</td>
    //                             <td className="px-6 py-4 text-gray-300">{p.year || "—"}</td>
    //                             <td className="px-6 py-4 text-gray-400">{p.source_name || "—"}</td>
    //                             <td className="px-6 py-4 text-gray-500 font-mono">{p.source_date ? new Date(p.source_date).toISOString().split('T')[0] : "—"}</td>
    //                             <td className="px-6 py-4 text-right">
    //                                 <button
    //                                     className="text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors p-2"
    //                                     onClick={() => handleDelete(p._id)}
    //                                     disabled={deletingId === p._id}
    //                                     title="Delete product"
    //                                 >
    //                                     <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    //                                         <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    //                                     </svg>
    //                                 </button>
    //                             </td>
    //                         </tr>
    //                     ))}
    //                 </tbody>
    //             </table>
    //         </div>

    //         {products.length === 0 && (
    //             <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500">
    //                 <svg className="w-16 h-16 mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
    //                     <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    //                 </svg>
    //                 <p className="text-lg font-medium text-gray-400">No products found</p>
    //                 <p className="mt-1 text-sm">Try adjusting your search or filters, or upload a CSV file.</p>
    //             </div>
    //         )}
    //     </div>
    // );


    return (
        <div className="flex-1 min-h-0 min-w-0 w-full h-full bg-[#0d1323] border border-gray-800 rounded-xl overflow-hidden shadow-xl flex flex-col">

            <div className="overflow-auto flex-1 h-full custom-scrollbar">

                <table className="min-w-full w-full text-left border-collapse whitespace-nowrap text-sm">

                    <thead className="sticky top-0 z-10 bg-[#12192e] shadow-sm shadow-black/20">
                        <tr>
                            <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800">
                                Record No
                            </th>

                            {COLUMNS.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-6 py-4 font-bold uppercase tracking-wider border-b border-gray-800 ${col.sortable
                                        ? "cursor-pointer hover:bg-gray-800/50 hover:text-white transition-colors text-gray-300"
                                        : "text-gray-400"
                                        }`}
                                    onClick={col.sortable ? () => onSort(col.key) : undefined}
                                >
                                    <div className="flex items-center">
                                        {col.label} {col.sortable && <SortIcon field={col.key} />}
                                    </div>
                                </th>
                            ))}

                            <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800 text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-800/60 divide-dashed">
                        {products.map((p, idx) => (
                            <tr
                                key={p._id}
                                className={`hover:bg-gray-800/40 transition-colors ${deletingId === p._id ? "opacity-50 pointer-events-none" : ""
                                    }`}
                            >
                                <td className="px-6 py-4 text-gray-500 font-semibold selection:bg-indigo-500/30">
                                    {(page - 1) * perPage + idx + 1}
                                </td>

                                <td className="px-6 py-4">
                                    <span className="px-2.5 py-1 bg-gray-900 border border-gray-700 rounded-md text-xs text-gray-300 font-mono tracking-wide selection:bg-indigo-500/30">
                                        {p.sku}
                                    </span>
                                </td>

                                <td
                                    className="px-6 py-4 text-gray-200 font-medium max-w-[400px] truncate selection:bg-indigo-500/30"
                                    title={p.product_name}
                                >
                                    {p.product_name || "—"}
                                </td>

                                <td className="px-6 py-4">
                                    <span className="text-indigo-400 font-semibold uppercase tracking-wider text-sm">
                                        {p.brand || "—"}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-gray-400">{p.brand_category || "—"}</td>
                                <td className="px-6 py-4 text-gray-300 font-medium">{p.size || "—"}</td>
                                <td className="px-6 py-4 text-emerald-400 font-mono font-medium">{formatCurrency(p.cost)}</td>
                                <td className="px-6 py-4 text-blue-400 font-mono font-medium">{formatCurrency(p.price)}</td>
                                <td className="px-6 py-4 text-gray-300 font-mono">{formatCurrency(p.set_price)}</td>
                                <td className="px-6 py-4 text-gray-300 font-mono">{formatCurrency(p.fitting_price)}</td>
                                <td className="px-6 py-4 text-gray-400">{p.vehicle_type || "—"}</td>

                                <td className="px-6 py-4">
                                    <span
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold tracking-wider uppercase ${p.runflat?.toLowerCase() === "yes"
                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                            : "bg-gray-800 text-gray-500 border border-gray-700"
                                            }`}
                                    >
                                        {p.runflat || "—"}
                                    </span>
                                </td>

                                <td className="px-6 py-4 text-gray-400">{p.country || "—"}</td>
                                <td className="px-6 py-4 text-gray-300">{p.year || "—"}</td>
                                <td className="px-6 py-4 text-gray-400">{p.source_name || "—"}</td>

                                <td className="px-6 py-4 text-gray-500 font-mono">
                                    {p.source_date
                                        ? new Date(p.source_date).toISOString().split("T")[0]
                                        : "—"}
                                </td>

                                <td className="px-6 py-4 text-right">
                                    <button
                                        className="text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors p-2"
                                        onClick={() => handleDelete(p._id)}
                                        disabled={deletingId === p._id}
                                        title="Delete product"
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
                                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

            {products.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-gray-500">
                    <p className="text-lg font-medium text-gray-400">No products found</p>
                    <p className="mt-1 text-sm">
                        Try adjusting your search or filters, or upload a CSV file.
                    </p>
                </div>
            )}
        </div>
    );


}

export default memo(ProductTable);
