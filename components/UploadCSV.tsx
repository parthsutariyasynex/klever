// // "use client";

// // import { useRef, useState } from "react";
// // import Papa from "papaparse";
// // import { useToast } from "./ToastProvider";

// // const REQUIRED_SCHEMA = [
// //     "klever_sku", "product_source", "source_name", "sku", "product_url",
// //     "product_name", "tyre_marking", "cost", "price", "set_price",
// //     "fitting_price", "offers", "brand", "brand_category", "plain_size",
// //     "size", "load_index", "runflat", "vehicle_type", "country", "year",
// //     "product_image_url", "source_date",
// // ];

// // interface UploadCSVProps {
// //     onUploadComplete: () => void;
// // }

// // export default function UploadCSV({ onUploadComplete }: UploadCSVProps) {
// //     const [uploading, setUploading] = useState(false);
// //     const [status, setStatus] = useState<string | null>(null);
// //     const fileInputRef = useRef<HTMLInputElement>(null);
// //     const { toast } = useToast();

// //     const handleFile = async (file: File) => {
// //         if (!file.name.endsWith(".csv")) {
// //             toast("Please upload a CSV file.", "error");
// //             return;
// //         }

// //         setUploading(true);
// //         setStatus("Parsing CSV...");

// //         Papa.parse(file, {
// //             header: true,
// //             skipEmptyLines: true,
// //             complete: async (results) => {
// //                 const rows = results.data as Record<string, string>[];

// //                 if (!rows || rows.length === 0) {
// //                     toast("No data found in CSV.", "error");
// //                     setUploading(false);
// //                     setStatus(null);
// //                     return;
// //                 }

// //                 setStatus(`Saving ${rows.length.toLocaleString()} records...`);

// //                 try {
// //                     const chunkSize = 500;
// //                     let successCount = 0;

// //                     for (let i = 0; i < rows.length; i += chunkSize) {
// //                         const chunk = rows.slice(i, i + chunkSize);
// //                         setStatus(`Saving records ${i + 1} to ${Math.min(i + chunkSize, rows.length)} of ${rows.length}...`);

// //                         const res = await fetch("/api/products/import", {
// //                             method: "POST",
// //                             headers: { "Content-Type": "application/json" },
// //                             body: JSON.stringify({ data: chunk }),
// //                         });

// //                         if (!res.ok) {
// //                             const data = await res.json().catch(() => ({}));
// //                             throw new Error(data.error || "Import failed");
// //                         }
// //                         successCount += chunk.length;
// //                     }

// //                     toast(`Successfully imported ${successCount.toLocaleString()} records`, "success");
// //                     setStatus(null);
// //                     onUploadComplete();
// //                 } catch (err: any) {
// //                     toast(err.message || "Network error. Please try again.", "error");
// //                     setStatus(null);
// //                 } finally {
// //                     setUploading(false);
// //                 }
// //             },
// //             error: () => {
// //                 toast("Failed to parse CSV file.", "error");
// //                 setUploading(false);
// //                 setStatus(null);
// //             },
// //         });
// //     };

// //     //     return (
// //     //         <div className="flex items-center gap-3">
// //     //             {uploading && (
// //     //                 <div className="flex items-center gap-2">
// //     //                     <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
// //     //                     <p className="text-gray-400 text-xs whitespace-nowrap">{status}</p>
// //     //                 </div>
// //     //             )}

// //     //             <button
// //     //                 onClick={() => !uploading && fileInputRef.current?.click()}
// //     //                 className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 shadow-sm font-medium"
// //     //             >
// //     //                 <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
// //     //                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
// //     //                 </svg>
// //     //                 Import
// //     //             </button>

// //     //             <input
// //     //                 ref={fileInputRef}
// //     //                 type="file"
// //     //                 accept=".csv"
// //     //                 className="hidden"
// //     //                 onChange={(e) => {
// //     //                     const file = e.target.files?.[0];
// //     //                     if (file) handleFile(file);
// //     //                     e.target.value = "";
// //     //                 }}
// //     //             />
// //     //         </div>
// //     //     );
// //     // }




// //     return (
// //         <div className="flex items-center gap-3">
// //             {uploading && (
// //                 <div className="flex items-center gap-2">
// //                     <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
// //                     <p className="text-gray-400 text-xs whitespace-nowrap">{status}</p>
// //                 </div>
// //             )}

// //             <button
// //                 onClick={() => !uploading && fileInputRef.current?.click()}
// //                 className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 shadow-sm font-medium"
// //             >
// //                 <svg
// //                     width="16"
// //                     height="16"
// //                     fill="none"
// //                     viewBox="0 0 24 24"
// //                     stroke="currentColor"
// //                     strokeWidth={2}
// //                 >
// //                     <path
// //                         strokeLinecap="round"
// //                         strokeLinejoin="round"
// //                         d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
// //                     />
// //                 </svg>
// //                 Import
// //             </button>



// //             <input
// //                 ref={fileInputRef}
// //                 type="file"
// //                 accept=".csv"
// //                 className="hidden"
// //                 onChange={(e) => {
// //                     const file = e.target.files?.[0];
// //                     if (file) handleFile(file);
// //                     e.target.value = ""; // Reset input so same file can be re-uploaded
// //                 }}
// //             />
// //         </div>
// //     );
// // }


// "use client";

// import { useRef, useState } from "react";
// import Papa from "papaparse";
// import { useToast } from "./ToastProvider";
// import { useEffect } from "react";


// interface UploadCSVProps {
//     onUploadComplete: () => void;
// }

// export default function UploadCSV({ onUploadComplete }: UploadCSVProps) {

//     const [uploading, setUploading] = useState(false);
//     const [status, setStatus] = useState<string | null>(null);
//     const [showImportCard, setShowImportCard] = useState(false);
//     const [selectedFile, setSelectedFile] = useState<File | null>(null);

//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const { toast } = useToast();

//     useEffect(() => {
//         if (showImportCard) {
//             document.body.style.overflow = "hidden";
//         } else {
//             document.body.style.overflow = "auto";
//         }

//         return () => {
//             document.body.style.overflow = "auto";
//         };
//     }, [showImportCard]);

//     const handleFile = async (file: File) => {

//         if (!file.name.endsWith(".csv")) {
//             toast("Please upload a CSV file.", "error");
//             return;
//         }

//         setUploading(true);
//         setStatus("Parsing CSV...");

//         Papa.parse(file, {
//             header: true,
//             skipEmptyLines: true,

//             complete: async (results) => {

//                 const rows = results.data as Record<string, string>[];

//                 if (!rows || rows.length === 0) {
//                     toast("No data found in CSV.", "error");
//                     setUploading(false);
//                     setStatus(null);
//                     return;
//                 }

//                 setStatus(`Saving ${rows.length.toLocaleString()} records...`);

//                 try {

//                     const chunkSize = 500;
//                     let successCount = 0;

//                     for (let i = 0; i < rows.length; i += chunkSize) {

//                         const chunk = rows.slice(i, i + chunkSize);

//                         setStatus(
//                             `Saving records ${i + 1} to ${Math.min(
//                                 i + chunkSize,
//                                 rows.length
//                             )} of ${rows.length}...`
//                         );

//                         const res = await fetch("/api/products/import", {
//                             method: "POST",
//                             headers: { "Content-Type": "application/json" },
//                             body: JSON.stringify({ data: chunk }),
//                         });

//                         if (!res.ok) {
//                             const data = await res.json().catch(() => ({}));
//                             throw new Error(data.error || "Import failed");
//                         }

//                         successCount += chunk.length;
//                     }

//                     toast(
//                         `Successfully imported ${successCount.toLocaleString()} records`,
//                         "success"
//                     );

//                     setStatus(null);
//                     onUploadComplete();

//                 } catch (err: any) {

//                     toast(err.message || "Network error. Please try again.", "error");
//                     setStatus(null);

//                 } finally {

//                     setUploading(false);
//                 }
//             },

//             error: () => {
//                 toast("Failed to parse CSV file.", "error");
//                 setUploading(false);
//                 setStatus(null);
//             },
//         });
//     };

//     return (
//         <div className="flex flex-col gap-4">

//             {/* Import Button */}
//             <div className="flex items-center gap-3">

//                 {uploading && (
//                     <div className="flex items-center gap-2">
//                         <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
//                         <p className="text-gray-400 text-xs whitespace-nowrap">{status}</p>
//                     </div>
//                 )}

//                 <button
//                     onClick={() => !uploading && setShowImportCard(true)}
//                     className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 shadow-sm font-medium"
//                 >
//                     Import
//                 </button>

//             </div>

//             {/* Import Card */}
//             {showImportCard && (
//                 // <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
//                 <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">


//                     <div className="bg-white border border-gray-300 rounded-lg shadow-xl w-full max-w-lg">

//                         {/* Header */}
//                         <div className="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-lg">

//                             {/* <h6 className="text-gray-800 font-semibold text-lg"> */}
//                             <h6 className="text-indigo-600 font-semibold text-lg">
//                                 Upload CSV File
//                             </h6>
//                             {/* className="bg-cyan-500 hover:bg-cyan-600 text-white text-sm px-4 py-1.5 rounded shadow-sm transition-colors" */}

//                             <a
//                                 href="https://www.klever.ae/sample-files/sample-supplier-products.csv"
//                                 download
//                                 className="bg-sky-500 hover:bg-sky-600 text-white text-sm px-4 py-1.5 rounded shadow-sm transition-colors"

//                             >
//                                 Download Sample
//                             </a>

//                         </div>

//                         {/* Body */}
//                         <div className="p-6">

//                             <label className="block text-sm font-medium text-gray-700 mb-2">
//                                 Select CSV File <span className="text-red-500">*</span>
//                             </label>

//                             <input
//                                 ref={fileInputRef}
//                                 type="file"
//                                 accept=".csv"
//                                 className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-700 bg-gray-50 cursor-pointer"
//                                 // onChange={(e) => {
//                                 //     const file = e.target.files?.[0];
//                                 //     if (file) {
//                                 //         setSelectedFile(file);
//                                 //     }
//                                 // }}
//                                 onChange={(e) => {
//                                     const file = e.target.files?.[0];
//                                     if (file) {
//                                         setSelectedFile(file);
//                                     }
//                                     e.target.value = "";
//                                 }}
//                             />
//                             {selectedFile && (
//                                 <p className="text-sm text-green-600 mt-2">
//                                     Selected file: {selectedFile.name}
//                                 </p>
//                             )}

//                             <p className="text-xs text-gray-500 mt-2">
//                                 The CSV file should contain product data.
//                             </p>

//                             <div className="mt-6 flex gap-3 justify-end">

//                                 <button
//                                     // onClick={() => setShowImportCard(false)}
//                                     onClick={() => {
//                                         setShowImportCard(false);
//                                         setSelectedFile(null);
//                                     }}
//                                     className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
//                                 >
//                                     Cancel
//                                 </button>

//                                 <button
//                                     onClick={() => {
//                                         if (!selectedFile) {
//                                             toast("Please select a CSV file first.", "error");
//                                             return;
//                                         }

//                                         // handleFile(selectedFile);
//                                         // setShowImportCard(false);
//                                         handleFile(selectedFile);
//                                         setShowImportCard(false);
//                                         setSelectedFile(null);
//                                     }}
//                                     className="px-5 py-2 text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 rounded shadow-sm transition-colors"
//                                 >
//                                     Import Products
//                                 </button>
//                                 {/* className="px-5 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded shadow-sm transition-colors" */}

//                             </div>

//                         </div>

//                     </div>

//                 </div>
//             )}

//         </div>
//     );
// }

// "use client";

// import { useRef, useState } from "react";
// import Papa from "papaparse";
// import { useToast } from "./ToastProvider";

// const REQUIRED_SCHEMA = [
//     "klever_sku", "product_source", "source_name", "sku", "product_url",
//     "product_name", "tyre_marking", "cost", "price", "set_price",
//     "fitting_price", "offers", "brand", "brand_category", "plain_size",
//     "size", "load_index", "runflat", "vehicle_type", "country", "year",
//     "product_image_url", "source_date",
// ];

// interface UploadCSVProps {
//     onUploadComplete: () => void;
// }

// export default function UploadCSV({ onUploadComplete }: UploadCSVProps) {
//     const [uploading, setUploading] = useState(false);
//     const [status, setStatus] = useState<string | null>(null);
//     const fileInputRef = useRef<HTMLInputElement>(null);
//     const { toast } = useToast();

//     const handleFile = async (file: File) => {
//         if (!file.name.endsWith(".csv")) {
//             toast("Please upload a CSV file.", "error");
//             return;
//         }

//         setUploading(true);
//         setStatus("Parsing CSV...");

//         Papa.parse(file, {
//             header: true,
//             skipEmptyLines: true,
//             complete: async (results) => {
//                 const rows = results.data as Record<string, string>[];

//                 if (!rows || rows.length === 0) {
//                     toast("No data found in CSV.", "error");
//                     setUploading(false);
//                     setStatus(null);
//                     return;
//                 }

//                 setStatus(`Saving ${rows.length.toLocaleString()} records...`);

//                 try {
//                     const chunkSize = 500;
//                     let successCount = 0;

//                     for (let i = 0; i < rows.length; i += chunkSize) {
//                         const chunk = rows.slice(i, i + chunkSize);
//                         setStatus(`Saving records ${i + 1} to ${Math.min(i + chunkSize, rows.length)} of ${rows.length}...`);

//                         const res = await fetch("/api/products/import", {
//                             method: "POST",
//                             headers: { "Content-Type": "application/json" },
//                             body: JSON.stringify({ data: chunk }),
//                         });

//                         if (!res.ok) {
//                             const data = await res.json().catch(() => ({}));
//                             throw new Error(data.error || "Import failed");
//                         }
//                         successCount += chunk.length;
//                     }

//                     toast(`Successfully imported ${successCount.toLocaleString()} records`, "success");
//                     setStatus(null);
//                     onUploadComplete();
//                 } catch (err: any) {
//                     toast(err.message || "Network error. Please try again.", "error");
//                     setStatus(null);
//                 } finally {
//                     setUploading(false);
//                 }
//             },
//             error: () => {
//                 toast("Failed to parse CSV file.", "error");
//                 setUploading(false);
//                 setStatus(null);
//             },
//         });
//     };

//     //     return (
//     //         <div className="flex items-center gap-3">
//     //             {uploading && (
//     //                 <div className="flex items-center gap-2">
//     //                     <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
//     //                     <p className="text-gray-400 text-xs whitespace-nowrap">{status}</p>
//     //                 </div>
//     //             )}

//     //             <button
//     //                 onClick={() => !uploading && fileInputRef.current?.click()}
//     //                 className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition flex items-center gap-2 shadow-sm font-medium"
//     //             >
//     //                 <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
//     //                     <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
//     //                 </svg>
//     //                 Import
//     //             </button>

//     //             <input
//     //                 ref={fileInputRef}
//     //                 type="file"
//     //                 accept=".csv"
//     //                 className="hidden"
//     //                 onChange={(e) => {
//     //                     const file = e.target.files?.[0];
//     //                     if (file) handleFile(file);
//     //                     e.target.value = "";
//     //                 }}
//     //             />
//     //         </div>
//     //     );
//     // }




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
//                 <svg
//                     width="16"
//                     height="16"
//                     fill="none"
//                     viewBox="0 0 24 24"
//                     stroke="currentColor"
//                     strokeWidth={2}
//                 >
//                     <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
//                     />
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
//                     e.target.value = ""; // Reset input so same file can be re-uploaded
//                 }}
//             />
//         </div>
//     );
// }


"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { useToast } from "./ToastProvider";
import { useEffect } from "react";


interface UploadCSVProps {
    onUploadComplete: () => void;
}

export default function UploadCSV({ onUploadComplete }: UploadCSVProps) {

    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);
    const [showImportCard, setShowImportCard] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<{
        type: "success" | "error" | "warning" | null;
        message: string;
    }>({ type: null, message: "" });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (showImportCard) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }

        return () => {
            document.body.style.overflow = "auto";
        };
    }, [showImportCard]);

    const handleFile = async (file: File) => {

        // if (!file.name.endsWith(".csv")) {
        //     toast("Please upload a CSV file.", "error");
        //     return;
        // }
        if (!file.name.endsWith(".csv")) {
            setUploadStatus({
                type: "error",
                message: "Invalid file. Please upload a CSV file.",
            });
            return;
        }

        setUploading(true);
        setStatus("Parsing CSV...");
        toast("Import started...", "info");

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,

            complete: async (results) => {

                const rows = results.data as Record<string, string>[];

                // if (!rows || rows.length === 0) {
                //     toast("No data found in CSV.", "error");
                //     setUploading(false);
                //     setStatus(null);
                //     return;
                // }
                if (!rows || rows.length === 0) {
                    setUploadStatus({
                        type: "warning",
                        message: "CSV file is empty.",
                    });
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

                        setStatus(
                            `Saving records ${i + 1} to ${Math.min(
                                i + chunkSize,
                                rows.length
                            )} of ${rows.length}...`
                        );

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

                    toast(
                        `${successCount.toLocaleString()} records imported successfully`,
                        "success"
                    );

                    const skippedCount = rows.length - successCount;

                    if (skippedCount > 0) {
                        toast(`${skippedCount} records skipped`, "error");
                    }

                    setUploadStatus({
                        type: "success",
                        message: "File uploaded successfully.",
                    });

                    setStatus(null);
                    onUploadComplete();

                }
                catch (err: any) {
                    setUploadStatus({
                        type: "error",
                        message: err.message || "Network error. Please try again.",
                    });
                    toast(err.message || "Network error. Please try again.", "error");
                    setStatus(null);

                } finally {

                    setUploading(false);
                }
            },

            error: () => {
                setUploadStatus({
                    type: "error",
                    message: "Failed to parse CSV file.",
                });
                toast("Failed to parse CSV file.", "error");
                setUploading(false);
                setStatus(null);
            },
        });
    };

    return (
        <div className="flex flex-col gap-4">

            {/* Import Button */}
            <div className="flex items-center gap-3">

                {uploading && (
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-gray-400 text-xs whitespace-nowrap">{status}</p>
                    </div>
                )}

                <button
                    onClick={() => !uploading && setShowImportCard(true)}
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

            </div>

            {/* Import Card */}
            {showImportCard && (
                <div className="fixed inset-0 flex items-center justify-center bg-[#0a0f1c]/80 backdrop-blur-md z-[999] p-4">

                    <div className="bg-[#0d1323] border border-gray-800 rounded-xl shadow-2xl shadow-black/50 w-full max-w-lg overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-800 bg-gray-900/50">

                            <h6 className="text-white font-semibold text-lg flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                                Upload CSV File
                            </h6>

                            <a
                                href="https://www.klever.ae/sample-files/sample-supplier-products.csv"
                                download
                                className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 text-sm px-4 py-1.5 rounded shadow-sm transition-colors"
                            >
                                Download Sample
                            </a>

                        </div>

                        {/* Body */}
                        <div className="p-6">

                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Select CSV File <span className="text-red-400">*</span>
                            </label>

                            {/* <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv"
                                className="w-full border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-300 bg-gray-900/50 cursor-pointer focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setSelectedFile(file);
                                    }
                                    e.target.value = "";
                                }}
                            /> */}
                            <div className="flex items-center gap-3 border border-gray-700 rounded-md px-3 py-2 bg-gray-900/50">

                                <label className="cursor-pointer bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-md text-sm font-medium hover:bg-indigo-500/20">
                                    Choose File
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setSelectedFile(file);
                                        }}
                                    />
                                </label>

                                <span className="text-sm text-gray-400 truncate">
                                    {selectedFile ? selectedFile.name : "No file chosen"}
                                </span>

                            </div>
                            {selectedFile && (
                                <p className="text-sm text-emerald-400 mt-2 font-medium flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Selected file: <span className="text-gray-200">{selectedFile.name}</span>
                                </p>
                            )}

                            <p className="text-xs text-gray-500 mt-2">
                                The CSV file should contain product data.
                            </p>

                            {/* STATUS MESSAGE */}
                            {/* {uploadStatus.type && (
                                <div
                                    className={`mt-4 p-3 rounded-md text-sm flex items-start gap-2 border ${uploadStatus.type === "success"
                                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        : uploadStatus.type === "error"
                                            ? "bg-red-500/10 border-red-500/20 text-red-400"
                                            : "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
                                        }`}
                                >
                                    {uploadStatus.type === "success" && (
                                        <svg className="w-5 h-5 flex-none mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    {uploadStatus.type === "error" && (
                                        <svg className="w-5 h-5 flex-none mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    )}
                                    {uploadStatus.type === "warning" && (
                                        <svg className="w-5 h-5 flex-none mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    )}
                                    <div className="font-medium">{uploadStatus.message}</div>
                                </div>
                            )} */}

                            <div className="mt-6 flex gap-3 justify-end pt-4 border-t border-gray-800">

                                <button
                                    onClick={() => {
                                        setShowImportCard(false);
                                        // setSelectedFile(null);
                                    }}
                                    className="px-5 py-2 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white rounded-md transition-all"
                                >
                                    Cancel
                                </button>

                                <button
                                    onClick={() => {
                                        if (!selectedFile) {
                                            toast("Please select a CSV file first.", "error");
                                            return;
                                        }

                                        handleFile(selectedFile);
                                        setShowImportCard(false);
                                        setSelectedFile(null);
                                    }}
                                    className="px-5 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md shadow-lg shadow-indigo-600/20 transition-all"
                                >

                                    Import
                                </button>

                            </div>

                        </div>

                    </div>

                </div>
            )}

        </div>
    );
}