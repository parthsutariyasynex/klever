"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LabelList,
    ReferenceLine,
} from "recharts";

/* ─────────────────────────────────────────────────────────────
   Types
───────────────────────────────────────────────────────────── */
interface PriceChartModalProps {
    isOpen: boolean;
    onClose: () => void;
    productKey: string;
    source: "supplier" | "competitor";
    priceField: string;
    priceLabel: string;
    productName: string;
}

interface RawPoint { date: string; value: number; }
interface ChartPoint {
    label: string;
    fullDate: string;
    value: number;
}

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const toChartData = (raw: RawPoint[]): ChartPoint[] =>
    raw
        .filter(r => r.value != null && dayjs(r.date).isValid())
        .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
        .map(r => ({
            label: dayjs(r.date).format("DD-MMM-YYYY"),
            fullDate: dayjs(r.date).format("DD-MMM-YYYY"),
            value: Number(r.value),
        }));

const calcDomain = (vals: number[]): [number, number] => {
    if (!vals.length) return [0, 100];
    const lo = Math.min(...vals), hi = Math.max(...vals);
    if (lo === hi) {
        const b = Math.max(lo * 0.08, 10);
        return [Math.max(0, lo - b), hi + b];
    }
    const pad = (hi - lo) * 0.15;
    return [Math.max(0, Math.floor(lo - pad)), Math.ceil(hi + pad)];
};

/* ─────────────────────────────────────────────────────────────
   Custom Tooltip
───────────────────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const pt: ChartPoint = payload[0].payload;
    const color: string = payload[0].stroke;
    return (
        <div style={{
            background: "#1e293b",
            borderRadius: 12,
            border: `1px solid rgba(255,255,255,0.1)`,
            padding: "12px 16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
            minWidth: 160,
        }}>
            <p style={{
                margin: "0 0 8px", fontSize: 10, fontWeight: 700,
                color: "#64748b", textTransform: "uppercase", letterSpacing: "0.1em"
            }}>
                {pt.fullDate}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{
                    display: "inline-block", width: 10, height: 10,
                    borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}66`
                }} />
                <span style={{
                    fontSize: 18, fontWeight: 700, color: "#f8fafc",
                    fontFamily: "monospace"
                }}>
                    {Number(pt.value).toLocaleString(undefined,
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────────
   Custom Legend
───────────────────────────────────────────────────────────── */
const CustomLegend = ({ payload, color }: any) => (
    <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        {payload?.map((entry: any, i: number) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
                    {entry.value}
                </span>
            </div>
        ))}
    </div>
);

/* ─────────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────────── */
function PriceChartModal({
    isOpen, onClose, productKey, source, priceField, priceLabel, productName,
}: PriceChartModalProps) {

    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [visible, setVisible] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const fetchHistory = useCallback(async () => {
        if (!productKey) return;
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams({
                priceField,
                source,
                ...(source === "competitor" ? { item_code: productKey } : { sku: productKey }),
            });
            const url = `/api/products/price-history?${params}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load price history");
            const json = await res.json();
            const cd = toChartData(json.data ?? []);
            setChartData(cd);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Error");
        } finally {
            setLoading(false);
        }
    }, [productKey, priceField, source]);

    useEffect(() => {
        if (isOpen) {
            fetchHistory();
            document.body.style.overflow = "hidden";
            requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
        } else {
            setVisible(false);
            setChartData([]);
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [isOpen, fetchHistory]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        if (isOpen) document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    const lineColor = source === "supplier" ? "#0ea5e9" : "#8b5cf6";
    const lineColorAlt = source === "supplier" ? "#38bdf8" : "#a78bfa";
    const values = chartData.map(d => d.value);
    const domain = calcDomain(values);

    const overlay: React.CSSProperties = {
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backgroundColor: `rgba(2, 6, 23, ${visible ? 0.9 : 0})`,
        backdropFilter: visible ? "blur(12px)" : "blur(0px)",
        transition: "all 0.3s ease",
        overflowY: "auto",
    };

    const card: React.CSSProperties = {
        position: "relative",
        width: "100%",
        maxWidth: "820px",
        background: "#0f172a",
        borderRadius: "24px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        transform: visible ? "translateY(0) scale(1)" : "translateY(24px) scale(0.97)",
        opacity: visible ? 1 : 0,
        transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
    };

    return createPortal(
        <div onClick={onClose} style={overlay}>
            <div onClick={e => e.stopPropagation()} style={card}>
                <div style={{ height: 4, background: `linear-gradient(90deg, ${lineColor} 0%, ${lineColorAlt} 100%)` }} />

                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "24px 24px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div>
                        <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.15em" }}>{priceLabel} · Price History</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button onClick={onClose} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", borderRadius: "10px", width: 34, height: 34, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}>✕</button>
                    </div>
                </div>

                {chartData.length > 0 && (
                    <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.1)" }}>
                        {[
                            { label: "Points", val: chartData.length },
                            { label: "Lowest", val: Math.min(...values).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                            { label: "Highest", val: Math.max(...values).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                            { label: "Latest", val: chartData[chartData.length - 1].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
                        ].map((s, i) => (
                            <div key={i} style={{ flex: 1, padding: "16px 24px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                                <div style={{ fontSize: 9, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{s.label}</div>
                                <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9", fontFamily: "monospace" }}>{s.val}</div>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ padding: "32px 16px 24px" }}>
                    {loading && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 16 }}>
                            <style>{`@keyframes _pvd{to{transform:rotate(360deg)}}`}</style>
                            <div style={{ width: 38, height: 38, borderRadius: "50%", border: `3px solid rgba(255,255,255,0.05)`, borderTop: `3px solid ${lineColor}`, animation: "_pvd .75s linear infinite" }} />
                            <span style={{ color: "#475569", fontSize: 14 }}>Fetching data...</span>
                        </div>
                    )}
                    {!loading && error && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 12 }}>
                            <span style={{ fontSize: 24 }}>⚠</span>
                            <span style={{ color: "#f87171", fontSize: 14 }}>{error}</span>
                        </div>
                    )}
                    {!loading && !error && chartData.length === 0 && (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 320, gap: 12 }}>
                            <div style={{ width: 48, height: 48, background: "rgba(255,255,255,0.03)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📊</div>
                            <span style={{ color: "#64748b", fontSize: 14 }}>No price trends found</span>
                            <span style={{ color: "#475569", fontSize: 11, textAlign: "center", maxWidth: 240 }}>Points will appear here as prices evolve over time.</span>
                        </div>
                    )}
                    {!loading && !error && chartData.length > 0 && (
                        <ResponsiveContainer width="100%" height={320}>
                            <LineChart data={chartData} margin={{ top: 25, right: 30, left: 8, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="label" type="category" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 500 }} axisLine={{ stroke: "rgba(255,255,255,0.1)" }} tickLine={false} tickMargin={12} interval={0} angle={-45} textAnchor="end" />
                                <YAxis domain={domain} tick={{ fill: "#64748b", fontSize: 11, fontFamily: "monospace", fontWeight: 500 }} axisLine={false} tickLine={false} tickMargin={12} width={64} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: `rgba(255,255,255,0.1)`, strokeWidth: 1 }} />
                                <Legend verticalAlign="top" align="center" height={40} content={(props) => <CustomLegend {...props} color={lineColor} />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    name={priceLabel}
                                    stroke={lineColor}
                                    strokeWidth={4}
                                    dot={{ r: 6, fill: "#0f172a", stroke: lineColor, strokeWidth: 2 }}
                                    activeDot={{ r: 8, strokeWidth: 2, stroke: "#fff", fill: lineColor }}
                                    isAnimationActive={true}
                                    animationDuration={1000}
                                    animationEasing="ease-in-out"
                                >
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        offset={15}
                                        style={{ fill: "#94a3b8", fontSize: 11, fontWeight: 700, fontFamily: "monospace" }}
                                        formatter={(v: any) => v != null ? Number(v).toLocaleString() : ""}
                                    />
                                </Line>
                                {chartData.length === 1 && (
                                    <ReferenceLine
                                        y={chartData[0].value}
                                        stroke={lineColor}
                                        strokeDasharray="3 3"
                                        opacity={0.5}
                                    />
                                )}
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

export default PriceChartModal;
