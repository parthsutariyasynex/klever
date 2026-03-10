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
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 mb-6">
        <h2 className="text-blue-700 font-bold text-lg">Upload CSV File</h2>
        <button
          className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded text-sm font-medium transition"
          onClick={() => window.location.href = "/sample_products.csv"}
        >
          <span>Download Sample</span>
        </button>
      </div>

      {/* Form Area */}
      <div className="mb-4">
        <label className="block text-gray-700 font-semibold text-sm mb-2">
          Select CSV File <span className="text-red-400">*</span>
        </label>

        <div className="flex items-center border border-gray-300 rounded overflow-hidden">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            id="fileInput"
            accept=".csv"
            onChange={handleFileChange}
          />
          <label
            htmlFor="fileInput"
            className="bg-gray-100 px-4 py-2 border-r border-gray-300 cursor-pointer hover:bg-gray-200 text-sm"
          >
            Choose File
          </label>
          <span className="px-4 text-gray-500 text-sm">
            {selectedFile ? selectedFile.name : "No file chosen"}
          </span>
        </div>
        <p className="text-gray-400 text-xs mt-2 italic">
          The CSV file should contain product data.
        </p>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleImport}
        disabled={loading || !selectedFile}
        className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Importing..." : "Import Products"}
      </button>
    </div>
  );
}