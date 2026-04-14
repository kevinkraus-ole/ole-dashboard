// Fixed agency color palette — consistent across all tabs
const PALETTE = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#22c55e", // green
  "#ef4444", // red
  "#8b5cf6", // violet
  "#14b8a6", // teal
  "#f97316", // orange
  "#64748b", // slate
  "#a855f7", // purple
  "#10b981", // emerald
];

const colorCache = new Map<string, string>();

export function getEntityColor(name: string): string {
  if (!colorCache.has(name)) {
    // Deterministic: hash the name so the same agency always gets the same color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    colorCache.set(name, PALETTE[hash % PALETTE.length]);
  }
  return colorCache.get(name)!;
}

export const STATUS_COLORS: Record<string, string> = {
  Aprobada: "#22c55e",
  Vendida: "#16a34a",
  Completada: "#22c55e",
  "En progreso": "#3b82f6",
  "En validación": "#8b5cf6",
  Iniciada: "#60a5fa",
  Pendiente: "#94a3b8",
  "Req. corrección": "#f59e0b",
  "Requiere acción": "#f59e0b",
  "Rechazada por agente": "#ef4444",
  "Rechazada por Olé": "#dc2626",
  Vencida: "#6b7280",
  Perdida: "#ef4444",
  "En curso": "#3b82f6",
};

export const GRUPO_COLORS: Record<string, string> = {
  Completada: "#22c55e",
  "En curso": "#3b82f6",
  "Requiere acción": "#f59e0b",
  Perdida: "#ef4444",
  Otro: "#6b7280",
};
