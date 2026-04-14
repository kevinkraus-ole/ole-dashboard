/**
 * Centralized color system for the dashboard.
 * All chart colors, status colors, and entity colors are defined here.
 */

// ─── Chart palette ───────────────────────────────────────────────────────────
// Ordered by visual weight. Deterministic hash assignment means the same
// entity always gets the same color across sessions and tabs.
const CHART_PALETTE = [
  "#6366f1", // indigo
  "#06b6d4", // cyan
  "#f59e0b", // amber
  "#ec4899", // pink
  "#22c55e", // green
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
  "#64748b", // slate
  "#a855f7", // purple
  "#10b981", // emerald
  "#ef4444", // red
];

const colorCache = new Map<string, string>();

/** Returns a consistent color for any named entity (agency, promotor, agent). */
export function getEntityColor(name: string): string {
  if (!colorCache.has(name)) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    colorCache.set(name, CHART_PALETTE[hash % CHART_PALETTE.length]);
  }
  return colorCache.get(name)!;
}

// ─── Status colors ────────────────────────────────────────────────────────────
/** Maps Spanish status labels to hex colors. */
export const STATUS_COLORS: Record<string, string> = {
  // Positive / completed
  Aprobada: "#16a34a",
  Vendida: "#16a34a",
  Completada: "#16a34a",

  // In progress
  "En progreso": "#2563eb",
  "En validación": "#7c3aed",
  Iniciada: "#3b82f6",
  Pendiente: "#94a3b8",

  // Needs action
  "Req. corrección": "#d97706",
  "Requiere acción": "#d97706",
  "En curso": "#2563eb",

  // Lost / rejected
  "Rechazada por agente": "#dc2626",
  "Rechazada por Olé": "#b91c1c",
  Vencida: "#64748b",
  Perdida: "#dc2626",

  // Groups
  Otro: "#94a3b8",
};

/** Maps Estado_Grupo values to colors. */
export const GRUPO_COLORS: Record<string, string> = {
  Completada: "#16a34a",
  "En curso": "#2563eb",
  "Requiere acción": "#d97706",
  Perdida: "#dc2626",
  Otro: "#94a3b8",
};

// ─── Status badge styles ──────────────────────────────────────────────────────
interface BadgeStyle {
  bg: string;
  text: string;
  dot: string;
}

/** Returns Tailwind classes for a status badge pill. */
export function getStatusBadgeStyle(status: string): BadgeStyle {
  const map: Record<string, BadgeStyle> = {
    Aprobada: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    Vendida: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    Completada: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
    "En progreso": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    "En validación": { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500" },
    Iniciada: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
    Pendiente: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
    "En curso": { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
    "Req. corrección": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    "Requiere acción": { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
    "Rechazada por agente": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
    "Rechazada por Olé": { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-600" },
    Vencida: { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" },
    Perdida: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
  };
  return map[status] ?? { bg: "bg-slate-100", text: "text-slate-600", dot: "bg-slate-400" };
}
