"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KpiCard } from "./KpiCard";
import { RefreshCw, SlidersHorizontal, ShieldCheck, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IntlVencimientoRow } from "@/lib/types";
import type { VencimientoSummary } from "@/app/api/intl/vencimientos/route";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const ALL = "__ALL__";

function formatUSD(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString("en-US")}`;
}

function formatDate(d: string) {
  try { return format(parseISO(d), "dd MMM yyyy", { locale: es }); }
  catch { return d ?? "—"; }
}

function diasColor(dias: number) {
  if (dias <= 7) return "text-red-600 font-bold";
  if (dias <= 30) return "text-rose-500 font-semibold";
  if (dias <= 60) return "text-amber-600 font-semibold";
  return "text-slate-600";
}

function diasBadge(dias: number) {
  if (dias <= 7) return "bg-red-100 text-red-700";
  if (dias <= 30) return "bg-rose-50 text-rose-600";
  if (dias <= 60) return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

interface IntlVencimientosTabProps {
  rows: IntlVencimientoRow[];
  summary: VencimientoSummary | null;
  lastUpdated?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

type SortKey = "Dias_Para_Vencer" | "Prima_Anual" | "Suma_Asegurada";

export function IntlVencimientosTab({ rows, summary, lastUpdated, isLoading, onRefresh }: IntlVencimientosTabProps) {
  const [agenciaFilter, setAgenciaFilter] = useState("");
  const [pagoFilter, setPagoFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("Dias_Para_Vencer");

  const agencias = useMemo(
    () => [...new Set(rows.map((r) => r.Agencia_Master).filter(Boolean))].sort(),
    [rows]
  );

  const filtered = useMemo(
    () => rows
      .filter((r) => {
        if (agenciaFilter && r.Agencia_Master !== agenciaFilter) return false;
        if (pagoFilter && r.Estado_Pago !== pagoFilter) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortKey === "Dias_Para_Vencer") return a.Dias_Para_Vencer - b.Dias_Para_Vencer;
        return b[sortKey] - a[sortKey];
      }),
    [rows, agenciaFilter, pagoFilter, sortKey]
  );

  // Computed KPIs from filtered data
  const filtPrima = useMemo(() => filtered.reduce((s, r) => s + r.Prima_Anual, 0), [filtered]);
  const filtSuma = useMemo(() => filtered.reduce((s, r) => s + r.Suma_Asegurada, 0), [filtered]);
  const filtPagadas = useMemo(() => filtered.filter((r) => r.Estado_Pago === "PAID").length, [filtered]);
  const filtUnpaid = useMemo(() => filtered.filter((r) => r.Estado_Pago === "UNPAID").length, [filtered]);

  const activeFilterCount = [agenciaFilter, pagoFilter].filter(Boolean).length;

  return (
    <div>
      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-end gap-4 sticky top-[52px] z-10">
        <div className="flex items-center gap-1.5 text-slate-400 self-end pb-1.5">
          <SlidersHorizontal size={13} />
          <span className="text-xs font-medium">Filtros</span>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold">{activeFilterCount}</span>
          )}
        </div>

        <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
          <AlertTriangle size={13} className="text-amber-500" />
          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-md">Vencen en los próximos 90 días</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Agencia Master</span>
          <Select value={agenciaFilter} onValueChange={(v) => setAgenciaFilter(v === ALL ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-56 text-sm bg-white border-slate-200 text-slate-700">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-slate-500 italic">Todas</SelectItem>
              {agencias.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Estado de Pago</span>
          <Select value={pagoFilter} onValueChange={(v) => setPagoFilter(v === ALL ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-36 text-sm bg-white border-slate-200 text-slate-700">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-slate-500 italic">Todos</SelectItem>
              <SelectItem value="PAID">PAID</SelectItem>
              <SelectItem value="UNPAID">UNPAID</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Ordenar por</span>
          <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
            <SelectTrigger className="h-8 w-40 text-sm bg-white border-slate-200 text-slate-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Dias_Para_Vencer">Días para vencer</SelectItem>
              <SelectItem value="Prima_Anual">Prima anual</SelectItem>
              <SelectItem value="Suma_Asegurada">Suma asegurada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />
        <div className="flex items-end gap-3 self-end">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 pb-1.5">
              Act. {new Date(lastUpdated).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-sm border-slate-200 text-slate-600" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Actualizar
          </Button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Pólizas a vencer"
            value={fmtNumber(filtered.length)}
            subtitle={`de ${fmtNumber(summary?.total ?? rows.length)} totales`}
            icon={Clock}
            color="amber"
          />
          <KpiCard
            title="Al corriente (PAID)"
            value={fmtNumber(filtPagadas)}
            subtitle={filtered.length > 0 ? `${((filtPagadas / filtered.length) * 100).toFixed(0)}% del total filtrado` : "—"}
            icon={ShieldCheck}
            color="emerald"
          />
          <KpiCard
            title="Con mora (UNPAID)"
            value={fmtNumber(filtUnpaid)}
            subtitle={filtered.length > 0 ? `${((filtUnpaid / filtered.length) * 100).toFixed(0)}% del total filtrado` : "—"}
            icon={AlertTriangle}
            color="rose"
          />
          <KpiCard
            title="Prima anual en riesgo"
            value={formatUSD(filtPrima)}
            subtitle={`${formatUSD(filtSuma)} en suma asegurada`}
            icon={DollarSign}
            color="indigo"
          />
        </div>

        {/* Table */}
        <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-slate-800">
                Detalle de Pólizas — Vencimiento próximo
              </CardTitle>
              <span className="text-xs text-slate-400 font-medium">{fmtNumber(filtered.length)} pólizas</span>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60">
                    {[
                      "Póliza", "Asegurado", "Asesor", "Agencia Master", "Nivel 2",
                      "Vence", "Días", "Antigüedad", "Prima Anual", "Suma Asegurada", "Pago",
                    ].map((h) => (
                      <th key={h} className="px-4 py-3 text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-left whitespace-nowrap first:rounded-tl-2xl last:rounded-tr-2xl">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((row, i) => (
                    <tr key={`${row.Numero}-${i}`} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                      <td className="px-4 py-2.5 font-mono text-xs text-indigo-600 whitespace-nowrap">{row.Numero}</td>
                      <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap max-w-[200px] truncate" title={row.Asegurado}>{row.Asegurado}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap max-w-[180px] truncate" title={row.Asesor}>{row.Asesor}</td>
                      <td className="px-4 py-2.5 text-slate-600 whitespace-nowrap max-w-[180px] truncate" title={row.Agencia_Master}>{row.Agencia_Master}</td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap max-w-[160px] truncate" title={row.Nivel2}>{row.Nivel2 || "—"}</td>
                      <td className="px-4 py-2.5 text-slate-700 whitespace-nowrap font-medium">{formatDate(row.Fecha_Vencimiento)}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold", diasBadge(row.Dias_Para_Vencer))}>
                          {row.Dias_Para_Vencer}d
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">
                        {row.Anos_Poliza ? `${row.Anos_Poliza} año${row.Anos_Poliza !== 1 ? "s" : ""}` : "—"}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-semibold text-slate-800 whitespace-nowrap">
                        {formatUSD(row.Prima_Anual)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-slate-600 whitespace-nowrap">
                        {formatUSD(row.Suma_Asegurada)}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold",
                          row.Estado_Pago === "PAID"
                            ? "bg-emerald-50 text-emerald-700"
                            : row.Estado_Pago === "UNPAID"
                              ? "bg-red-50 text-red-600"
                              : "bg-slate-100 text-slate-500"
                        )}>
                          {row.Estado_Pago}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-4 py-12 text-center text-slate-400 text-sm">
                        No hay pólizas con vencimiento en los próximos 90 días para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
