"use client";

import { useEffect, useState, useCallback } from "react";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from "recharts";
import dayjs from "dayjs";

interface PriceChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    productKey: string;
    source: "supplier" | "competitor";
    priceField: string;
    priceLabel: string;
    productName: string;
}

interface DataPoint {
    date: string;
    value: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    let parseLabel = String(label || "");
    if (/^\d{2}-[A-Za-z]{3}$/.test(parseLabel)) {
        parseLabel = `${parseLabel}-${new Date().getFullYear()}`;
    }
    const displayDate = dayjs(parseLabel).isValid() ? dayjs(parseLabel).format("DD-MMM-YYYY") : label;

    return (
        <div style={{
            backgroundColor: "#fff",
            border: "1px solid #ccc",
            padding: "8px 12px",
            fontSize: "12px",
            color: "#333",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
        }}>
            <p style={{ margin: "0 0 4px 0", fontWeight: "bold" }}>{displayDate}</p>
            {payload.map((entry: any) => (
                <div key={entry.name} style={{ color: entry.color, fontWeight: "normal" }}>
                    {entry.name}: {Number(entry.value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            ))}
        </div>
    );
};

export default function PriceChartModal({
    isOpen,
    onClose,
    productKey,
    source,
    priceField,
    priceLabel,
    productName,
}: PriceChartModalProps) {
    const [data, setData] = useState<DataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistory = useCallback(async () => {
        if (!productKey) return;
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                priceField,
                source,
                ...(source === "competitor" ? { item_code: productKey } : { sku: productKey }),
            });
            const res = await fetch(`/api/products/price-history?${params}`);
            if (!res.ok) throw new Error("Failed to load price history");
            const json = await res.json();
            setData(json.data ?? []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error loading data");
        } finally {
            setLoading(false);
        }
    }, [productKey, priceField, source]);

    useEffect(() => {
        if (isOpen) fetchHistory();
        else setData([]);
    }, [isOpen, fetchHistory]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Determine styles based on source
    const isSupplier = source === "supplier";
    const lineColor = isSupplier ? "#4BC0C0" : "#36A2EB"; // Teal vs Chart.js Blue
    const xAngle = isSupplier ? 0 : -45;
    const xDx = isSupplier ? 0 : -5;
    const xDy = isSupplier ? 10 : 5;
    const xTextAnchor = isSupplier ? "middle" : "end";

    // Format tick dates to DD-MMM-YYYY format
    const formatXTick = (val: string) => {
        if (!val) return "";
        let parseVal = String(val);
        if (/^\d{2}-[A-Za-z]{3}$/.test(parseVal)) {
            parseVal = `${parseVal}-${new Date().getFullYear()}`;
        }
        return dayjs(parseVal).isValid() ? dayjs(parseVal).format("DD-MMM-YYYY") : String(val);
    };

    return (
        <div
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px"
            }}
            onClick={onClose}
        >
            {/* Backdrop: translucent dark overlay */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                }}
            />

            {/* Modal Body */}
            <div
                style={{
                    position: "relative",
                    zIndex: 10,
                    width: "100%",
                    maxWidth: "800px",
                    backgroundColor: "#ffffff",
                    borderRadius: "4px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    display: "flex",
                    flexDirection: "column",
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    borderBottom: "1px solid #e5e7eb"
                }}>
                    <h2 style={{
                        margin: 0,
                        fontSize: "18px",
                        fontWeight: "500",
                        color: "#4b5563", // Gray matching image header
                        fontFamily: "sans-serif"
                    }}>
                        Price vs Date
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            color: "#9ca3af",
                            fontSize: "20px",
                            lineHeight: 1,
                            cursor: "pointer",
                            padding: 0
                        }}
                        title="Close"
                    >
                        ✖
                    </button>
                </div>

                {/* Chart Area */}
                <div style={{ padding: "30px 20px" }}>
                    {loading ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}></div>
                    ) : error ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#ef4444" }}>{error}</div>
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px 0", color: "#6b7280" }}></div>
                    ) : (
                        <div style={{ width: "100%", height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={data}
                                    margin={{ top: 20, right: 30, left: 10, bottom: isSupplier ? 25 : 85 }}
                                >
                                    <CartesianGrid stroke="#e5e7eb" vertical={true} horizontal={true} />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={formatXTick}
                                        tick={{ fill: "#6b7280", fontSize: 12.5 }}
                                        tickMargin={5}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={{ stroke: '#e5e7eb' }}
                                        interval={isSupplier ? "preserveEnd" : 0}
                                        angle={xAngle}
                                        dx={xDx}
                                        dy={xDy}
                                        textAnchor={xTextAnchor}
                                        label={{ value: 'Date', position: 'insideBottom', offset: isSupplier ? -15 : -70, fill: "#6b7280", fontSize: 13 }}
                                    />
                                    <XAxis
                                        xAxisId="top"
                                        orientation="top"
                                        tick={false}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: "#6b7280", fontSize: 12.5 }}
                                        tickMargin={8}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={{ stroke: '#e5e7eb' }}
                                        dx={-2}
                                        domain={['auto', 'auto']}
                                        label={{ value: 'Price', angle: -90, position: 'insideLeft', offset: 12, fill: '#6b7280', fontSize: 13 }}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={false}
                                        axisLine={{ stroke: '#e5e7eb' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="top"
                                        height={40}
                                        content={(props) => {
                                            const { payload } = props;
                                            return (
                                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                                                    {payload?.map((entry, index) => (
                                                        <div key={`item-${index}`} style={{ display: 'flex', alignItems: 'center' }}>
                                                            <div style={{
                                                                width: '32px',
                                                                height: '14px',
                                                                border: `2.5px solid ${lineColor}`,
                                                                backgroundColor: 'transparent',
                                                                marginRight: '8px',
                                                                display: 'inline-block'
                                                            }} />
                                                            <span style={{ color: '#4b5563', fontSize: '14px' }}>{entry.value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        }}
                                    />
                                    <Line
                                        type={isSupplier ? "linear" : "monotone"}
                                        dataKey="value"
                                        name={priceLabel}
                                        stroke={lineColor}
                                        strokeWidth={2}
                                        dot={{ r: 4, stroke: lineColor, strokeWidth: 2, fill: '#fff' }}
                                        activeDot={{ r: 6, fill: lineColor, stroke: '#fff', strokeWidth: 2 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
