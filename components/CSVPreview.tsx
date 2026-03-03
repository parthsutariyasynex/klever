"use client";

import { useMemo } from "react";

const REQUIRED_SCHEMA = [
    "klever_sku", "product_source", "source_name", "sku", "product_url",
    "product_name", "tyre_marking", "cost", "price", "set_price",
    "fitting_price", "offers", "brand", "brand_category", "plain_size",
    "size", "load_index", "runflat", "vehicle_type", "country", "year",
    "product_image_url", "source_date",
];

interface CSVPreviewProps {
    data: Record<string, string>[];
    onConfirmImport: () => void;
    onCancel: () => void;
    importing: boolean;
}

export default function CSVPreview({ data, onConfirmImport, onCancel, importing }: CSVPreviewProps) {
    const csvColumns = useMemo(() => (data.length > 0 ? Object.keys(data[0]) : []), [data]);

    // Schema validation
    const missingColumns = useMemo(() => {
        return REQUIRED_SCHEMA.filter((col) => !csvColumns.includes(col));
    }, [csvColumns]);

    const hasSchemaError = missingColumns.length > 0;

    return (
        <div className="bg-[#0d1323] border border-gray-800 rounded-xl p-6 flex flex-col gap-5 shadow-xl animate-[slideDown_0.3s_ease-out]">
            {/* Schema validation error */}
            {hasSchemaError && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500 text-sm leading-relaxed">
                    <strong className="block mb-1">⚠ Schema Mismatch</strong>
                    <p className="mb-1">Missing columns: <code className="bg-red-500/10 px-1.5 py-0.5 rounded text-[13px]">{missingColumns.join(", ")}</code></p>
                    <p>Required: all 23 columns from the schema.</p>
                </div>
            )}

            {/* Data Preview — show ALL columns */}
            <div className="flex flex-col gap-3">
                <h3 className="text-[15px] font-semibold text-gray-200 flex items-center gap-2">
                    Data Preview <span className="text-gray-500 font-normal">
                        ({data.length.toLocaleString()} rows × {csvColumns.length} columns)
                    </span>
                </h3>
                <div className="bg-[#12192e] border border-gray-800 rounded-xl overflow-hidden shadow-inner flex flex-col" style={{ maxHeight: "500px" }}>
                    <div className="overflow-auto custom-scrollbar flex-1">
                        <table className="min-w-max w-full text-left border-collapse whitespace-nowrap text-sm">
                            <thead className="sticky top-0 z-10 bg-[#161d33] shadow-sm shadow-black/20">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-400 border-b border-gray-800 uppercase tracking-wider">NO.</th>
                                    {csvColumns.map((col) => (
                                        <th key={col} className="px-6 py-4 font-bold text-gray-400 border-b border-gray-800 uppercase tracking-wider">{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/60 divide-dashed">
                                {data.slice(0, 200).map((row, idx) => (
                                    <tr key={idx} className="hover:bg-gray-800/40 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 font-semibold selection:bg-indigo-500/30">{idx + 1}</td>
                                        {csvColumns.map((col) => (
                                            <td key={col} className={`px-6 py-4 font-medium selection:bg-indigo-500/30 ${!row[col] ? "bg-red-500/5 text-gray-400" : "text-gray-300"}`}>
                                                {row[col] || <span className="text-red-400/70 font-bold text-xs px-2 py-0.5 bg-red-500/10 rounded">—</span>}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Import / Cancel */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                    className="px-5 py-2.5 bg-transparent border border-gray-700 text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-800 hover:text-white transition-colors"
                    onClick={onCancel}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
