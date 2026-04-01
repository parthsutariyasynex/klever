import dayjs from "dayjs";

/**
 * Display-only helper: formats any date string → "DD-MMM" (e.g. "12-May").
 * Called in table cell rendering only. Never used to format dates for DB storage.
 *
 * Handles: ISO 8601, YYYY-MM-DD, DD-MMM-YYYY, DD-MMM.
 */
export function formatDDMMM(dateString: string | undefined | null): string {
    if (!dateString || dateString === "—") return "—";

    // Already "DD-MMM" → return as-is
    if (/^\d{2}-[A-Z][a-z]{2}$/.test(dateString)) return dateString;

    // "DD-MMM-YYYY" → trim year for table display
    const ddMmmYyyy = dateString.match(/^(\d{1,2}-[A-Z][a-z]{2})-\d{4}$/);
    if (ddMmmYyyy) return ddMmmYyyy[1].padStart(6, "0"); // "DD-MMM"

    // ISO, YYYY-MM-DD, or any format dayjs can parse
    const d = dayjs(dateString);
    if (d.isValid()) return d.format("DD-MMM");

    return "—";
}
