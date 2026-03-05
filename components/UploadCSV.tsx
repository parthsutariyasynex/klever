"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { useToast } from "./ToastProvider";

const REQUIRED_SCHEMA = [
    "klever_sku", "product_source", "source_name", "sku", "product_url",
    "product_name", "tyre_marking", "cost", "price", "set_price",
    "fitting_price", "offers", "brand", "brand_category", "plain_size",
    "size", "load_index", "runflat", "vehicle_type", "country", "year",
    "product_image_url", "source_date",
];

interface UploadCSVProps {
    onUploadComplete: () => void;
}

export default function UploadCSV({ onUploadComplete }: UploadCSVProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFile = async (file: File) => {
        if (!file.name.endsWith(".csv")) {
            toast("Please upload a CSV file.", "error");
            return;
        }

        setUploading(true);
        setStatus("Parsing CSV...");

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                const rows = results.data as Record<string, string>[];

                if (!rows || rows.length === 0) {
                    toast("No data found in CSV.", "error");
                    setUploading(false);
                    setStatus(null);
                    return;
                }

                // Validate schema
                const csvColumns = Object.keys(rows[0]);
                const missing = REQUIRED_SCHEMA.filter((col) => !csvColumns.includes(col));
                if (missing.length > 0) {
                    toast(`Schema error: missing columns — ${missing.join(", ")}`, "error");
                    setUploading(false);
                    setStatus(null);
                    return;
                }

                // Save to database
                setStatus(`Saving ${rows.length.toLocaleString()} records to database...`);

                try {
                    const res = await fetch("/api/upload-csv", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ data: rows }),
                    });

                    const data = await res.json();

                    if (res.ok) {
                        toast(data.message, "success");
                        setStatus(`✓ ${data.message}`);
                        onUploadComplete();
                    } else {
                        toast(data.error || "Import failed", "error");
                        setStatus(null);
                    }
                } catch {
                    toast("Network error. Please try again.", "error");
                    setStatus(null);
                } finally {
                    setUploading(false);
                }
            },
            error: () => {
                toast("Failed to parse CSV file.", "error");
                setUploading(false);
                setStatus(null);
            },
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    };

    // return (
    //     <div className="flex flex-col gap-3">
    //         <div
    //             className={`relative border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${dragActive
    //                 ? "border-indigo-500 bg-indigo-500/10"
    //                 : "border-gray-700 bg-[#0d1323] hover:border-indigo-400 hover:bg-gray-800/50"
    //                 }`}
    //             onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
    //             onDragLeave={() => setDragActive(false)}
    //             onDrop={handleDrop}
    //             onClick={() => !uploading && fileInputRef.current?.click()}
    //         >
    //             <input
    //                 ref={fileInputRef}
    //                 type="file"
    //                 accept=".csv"
    //                 className="hidden"
    //                 onChange={(e) => {
    //                     const file = e.target.files?.[0];
    //                     if (file) handleFile(file);
    //                     e.target.value = "";
    //                 }}
    //             />

    //             <div className="text-gray-500 mb-2 flex justify-center">
    //                 <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    //                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    //                 </svg>
    //             </div>

    //             {uploading ? (
    //                 <div className="flex flex-col items-center gap-2">
    //                     <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    //                     <p className="text-gray-300 font-medium">{status}</p>
    //                 </div>
    //             ) : (
    //                 <div className="flex flex-col items-center gap-1.5">
    //                     <p className="text-[15px] font-medium text-gray-300">
    //                         Drop your CSV file here or <span className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">browse</span>
    //                     </p>
    //                     <p className="text-[13px] text-gray-500">
    //                         Required: klever_sku, sku, product_name, brand, cost, price, and 17 more columns
    //                     </p>
    //                     {status && <p className="mt-2 text-sm font-medium text-indigo-400">{status}</p>}
    //                 </div>
    //             )}
    //         </div>
    //     </div>
    // );

    return (
        <div className="flex items-center gap-3">

            <button
                onClick={() => !uploading && fileInputRef.current?.click()}
                // className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2"
                className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 ml-auto"
            >
                Upload CSV
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

            {uploading && (
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-gray-300 text-sm">{status}</p>
                </div>
            )}

            {!uploading && status && (
                <p className="text-sm text-indigo-400">{status}</p>
            )}

        </div>
    );
}
