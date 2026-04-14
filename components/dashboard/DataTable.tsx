"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column {
  key: string;
  label: string;
  align?: "left" | "right";
  format?: (val: unknown) => string;
}

interface DataTableProps {
  columns: Column[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: Record<string, any>[];
  maxRows?: number;
  className?: string;
}

export function DataTable({ columns, rows, maxRows = 50, className }: DataTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...rows].sort((a, b) => {
    if (!sortKey) return 0;
    const va = a[sortKey] ?? "";
    const vb = b[sortKey] ?? "";
    const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
    return sortDir === "asc" ? cmp : -cmp;
  });

  const displayed = sorted.slice(0, maxRows);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  return (
    <div className={cn("overflow-x-auto rounded-lg border border-slate-100", className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => toggleSort(col.key)}
                className={cn(
                  "px-4 py-2.5 font-medium text-slate-500 cursor-pointer select-none whitespace-nowrap",
                  col.align === "right" ? "text-right" : "text-left"
                )}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {sortKey === col.key ? (
                    sortDir === "asc" ? (
                      <ChevronUp size={13} />
                    ) : (
                      <ChevronDown size={13} />
                    )
                  ) : (
                    <ChevronDown size={13} className="opacity-20" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayed.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-10 text-slate-400"
              >
                Sin datos
              </td>
            </tr>
          ) : (
            displayed.map((row, i) => (
              <tr
                key={i}
                className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      "px-4 py-2.5 text-slate-700",
                      col.align === "right" ? "text-right tabular-nums" : ""
                    )}
                  >
                    {col.format ? col.format(row[col.key]) : String(row[col.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <div className="text-center py-2 text-xs text-slate-400 bg-slate-50">
          Mostrando {maxRows} de {rows.length} registros
        </div>
      )}
    </div>
  );
}
