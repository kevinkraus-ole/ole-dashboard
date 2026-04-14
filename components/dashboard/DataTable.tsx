"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { getStatusBadgeStyle } from "@/lib/colors";

export interface Column {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  format?: (val: unknown) => string;
  /** If true, renders value as a colored status badge */
  isStatus?: boolean;
  width?: string;
}

interface DataTableProps {
  columns: Column[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[];
  maxRows?: number;
  className?: string;
}

export function DataTable({ columns, rows, maxRows = 100, className }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb), "es-MX");
    return sortDir === "asc" ? cmp : -cmp;
  });

  const displayed = sorted.slice(0, maxRows);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("desc"); }
  };

  return (
    <div className={cn("overflow-x-auto rounded-2xl overflow-hidden", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  "px-4 py-3.5 text-[11px] font-semibold text-slate-400 uppercase tracking-widest",
                  "select-none cursor-pointer whitespace-nowrap",
                  "hover:text-slate-600 transition-colors",
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key
                    ? sortDir === "asc"
                      ? <ChevronUp size={11} className="text-indigo-500" />
                      : <ChevronDown size={11} className="text-indigo-500" />
                    : <ChevronsUpDown size={11} className="opacity-30" />
                  }
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {displayed.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-14 text-sm text-slate-400">
                Sin datos para mostrar
              </td>
            </tr>
          ) : (
            displayed.map((row, i) => (
              <tr key={i} className={cn(
                "hover:bg-slate-50/80 transition-colors",
                i % 2 === 0 ? "bg-white" : "bg-slate-50/40"
              )}>
                {columns.map((col) => {
                  const raw = row[col.key];
                  const display = col.format ? col.format(raw) : String(raw ?? "—");

                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "px-4 py-3.5 text-slate-700",
                        col.align === "right" ? "text-right tabular-nums" : col.align === "center" ? "text-center" : ""
                      )}
                    >
                      {col.isStatus ? (
                        <StatusBadge status={display} />
                      ) : (
                        <span className={cn(typeof raw === "number" && col.align === "right" && "font-medium")}>
                          {display}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {rows.length > maxRows && (
        <div className="text-center py-3 text-xs text-slate-400 border-t border-slate-100 bg-slate-50/60">
          Mostrando {maxRows.toLocaleString()} de {rows.length.toLocaleString()} registros
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = getStatusBadgeStyle(status);
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", s.dot)} />
      {status}
    </span>
  );
}
