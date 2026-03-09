"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { useToast } from "@/components/ToastProvider";

type CsvRow = Record<string, string>;

export default function ImportPage() {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast("Please select a CSV file first.", "error");
      return;
    }

    setLoading(true);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as CsvRow[];

        if (!rows || rows.length === 0) {
          toast("No data found in CSV.", "error");
          setLoading(false);
          return;
        }

        try {
          const response = await fetch("/api/products/import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: rows }),
          });

          const data = await response.json();

          if (!response.ok) {
            toast(data.error || "Import failed", "error");
          } else {
            toast(data.message || "Import successful", "success");
            setSelectedFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        } catch (error) {
          console.error(error);
          toast("Something went wrong during import.", "error");
        } finally {
          setLoading(false);
        }
      },
      error: (error) => {
        console.error(error);
        toast("Failed to parse CSV file.", "error");
        setLoading(false);
      }
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Import Product</h1>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          {/* <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-sm font-bold text-blue-600 uppercase tracking-wider">Upload CSV File</h2>
            <button
              className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-medium rounded transition"
              onClick={() => {
                // Logic to download sample CSV
                window.location.href = "/sample_products.csv";
              }}
            >
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12l4.5 4.5m0 0l4.5-4.5M12 3v13.5" />
              </svg>
              Download Sample
            </button>
          </div> */}

          {/* Body */}
          {/* <div className="p-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select CSV File <span className="text-gray-400">*</span>
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded file:border-0
                    file:text-sm file:font-semibold
                    file:bg-gray-100 file:text-gray-700
                    hover:file:bg-gray-200
                    border border-gray-300 rounded-lg p-1"
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                The CSV file should contain product data.
              </p>
            </div> */}

          <button
            onClick={handleImport}
            disabled={loading || !selectedFile}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white text-sm font-medium rounded-lg transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v4a1 1 0 001 1h4" />
              </svg>
            )}
            {loading ? "Importing..." : "Import Products"}
          </button>
        </div>
      </div>
    </div>
    // </div >
  );
}
