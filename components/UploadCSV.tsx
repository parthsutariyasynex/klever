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

                setStatus(`Saving ${rows.length.toLocaleString()} records...`);

                try {
                    const chunkSize = 500;
                    let successCount = 0;

                    for (let i = 0; i < rows.length; i += chunkSize) {
                        const chunk = rows.slice(i, i + chunkSize);
                        setStatus(`Saving records ${i + 1} to ${Math.min(i + chunkSize, rows.length)} of ${rows.length}...`);

                        const res = await fetch("/api/products/import", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ data: chunk }),
                        });

                        if (!res.ok) {
                            const data = await res.json().catch(() => ({}));
                            throw new Error(data.error || "Import failed");
                        }
                        successCount += chunk.length;
                    }

                    toast(`Successfully imported ${successCount.toLocaleString()} records`, "success");
                    setStatus(null);
                    onUploadComplete();
                } catch (err: any) {
                    toast(err.message || "Network error. Please try again.", "error");
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

    //     return (
    //         <div className="flex items-center gap-3">
    //             {uploading && (
    //                 <div className="flex items-center gap-2">
    //                     <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    //                     <p className="text-gray-400 text-xs whitespace-nowrap">{status}</p>
    //                 </div>
    //             )}

    //             <button
    //                 onClick={() => !uploading && fileInputRef.current?.click()}
    //                 className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 shadow-sm font-medium"
    //             >
    //                 <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    //                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
    //                 </svg>
    //                 Import
    //             </button>

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
    //         </div>
    //     );
    // }




    return (
        <div className="flex items-center gap-3">
            {uploading && (
                <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    <p className="text-gray-400 text-xs whitespace-nowrap">{status}</p>
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
                    e.target.value = ""; // Reset input so same file can be re-uploaded
                }}
            />
        </div>
    );
}