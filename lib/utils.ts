/**
 * Formats a date string (ISO or YYYY-MM-DD) to "DD-MMM" (e.g., "24-Jan").
 * Uses UTC to ensure no timezone shift issues for date-only strings.
 * 
 * @param dateString - The raw date string from API/Database
 * @returns Formatted date string "DD-MMM" or "-" if invalid/missing
 */
export function formatDDMMM(dateString: string | undefined | null): string {
    if (!dateString) return "—";

    // If already in DD-MMM format (e.g. "24-Jan"), return as is
    if (/^\d{2}-[A-Z][a-z]{2}$/.test(dateString)) {
        return dateString;
    }

    const date = new Date(dateString);

    // If the date is invalid, return the original string or fallback
    if (isNaN(date.getTime())) return dateString;

    // DD (with leading zero)
    const day = date.getUTCDate().toString().padStart(2, '0');

    // MMM (e.g. "Jan", "Feb")
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getUTCMonth()];

    return `${day}-${month}`;
}
