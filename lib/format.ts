/**
 * Shared number / currency formatting utilities.
 * All formatters use es-MX locale and produce compact, readable output.
 */

/** Compact number: 1234 → "1.2K", 1200000 → "1.2M" */
export function fmtNumber(n: number): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000)
    return `${(n / 1_000_000).toLocaleString("es-MX", { maximumFractionDigits: 1 })}M`;
  if (Math.abs(n) >= 1_000)
    return `${(n / 1_000).toLocaleString("es-MX", { maximumFractionDigits: 1 })}K`;
  return n.toLocaleString("es-MX");
}

/** Full integer: 1234 → "1,234" */
export function fmtInt(n: number): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return Math.round(n).toLocaleString("es-MX");
}

/** Compact currency: 1500000 → "$1.5M", 230000 → "$230K" */
export function fmtPeso(n: number): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  if (Math.abs(n) >= 1_000_000)
    return `$${(n / 1_000_000).toLocaleString("es-MX", { maximumFractionDigits: 2 })}M`;
  if (Math.abs(n) >= 1_000)
    return `$${(n / 1_000).toLocaleString("es-MX", { maximumFractionDigits: 0 })}K`;
  return `$${n.toLocaleString("es-MX")}`;
}

/** Full currency: 1234567 → "$1,234,567" */
export function fmtPesoFull(n: number): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return n.toLocaleString("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
}

/** Percentage: 0.1234 → "12.3%" */
export function fmtPct(n: number, decimals = 1): string {
  if (n === undefined || n === null || isNaN(n)) return "—";
  return `${(n * 100).toFixed(decimals)}%`;
}
