"use client";

import { memo } from "react";

interface PaginationProps {
    page: number;
    totalPages: number;
    total: number;
    perPage: number;
    onPageChange: (page: number) => void;
}

function Pagination({ page, totalPages, total, perPage, onPageChange }: PaginationProps) {
    if (totalPages <= 0) return null;

    const start = (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);

    return (
        <div className="flex items-center justify-between gap-4 flex-wrap pb-2">
            <div className="text-[13px] text-gray-400">
                Showing <strong className="text-gray-200 font-semibold">{start.toLocaleString()}</strong>–<strong className="text-gray-200 font-semibold">{end.toLocaleString()}</strong> of <strong className="text-gray-200 font-semibold">{total.toLocaleString()}</strong> products
            </div>

            <div className="flex items-center gap-1.5">
                <button
                    className="px-3 py-2 bg-[#0d1323] border border-gray-700 rounded-md text-gray-300 text-[13px] font-medium transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-300"
                    disabled={page <= 1}
                    onClick={() => onPageChange(1)}
                    title="First page"
                >
                    «
                </button>
                <button
                    className="px-3.5 py-2 bg-[#0d1323] border border-gray-700 rounded-md text-gray-300 text-[13px] font-medium transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-300"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    title="Previous page"
                >
                    ‹ Prev
                </button>

                <span className="px-4 py-2 text-[13px] text-gray-400 whitespace-nowrap">
                    Page <strong className="text-gray-200 font-semibold">{page}</strong> of <strong className="text-gray-200 font-semibold">{totalPages}</strong>
                </span>

                <button
                    className="px-3.5 py-2 bg-[#0d1323] border border-gray-700 rounded-md text-gray-300 text-[13px] font-medium transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-300"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(page + 1)}
                    title="Next page"
                >
                    Next ›
                </button>
                <button
                    className="px-3 py-2 bg-[#0d1323] border border-gray-700 rounded-md text-gray-300 text-[13px] font-medium transition-colors hover:border-indigo-500 hover:text-indigo-400 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-700 disabled:hover:text-gray-300"
                    disabled={page >= totalPages}
                    onClick={() => onPageChange(totalPages)}
                    title="Last page"
                >
                    »
                </button>
            </div>
        </div>
    );
}

export default memo(Pagination);
