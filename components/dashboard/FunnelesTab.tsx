"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FunnelViz } from "./charts/FunnelViz";
import { KpiCard } from "./KpiCard";
import { RefreshCw, SlidersHorizontal, Users, FileText, ShieldCheck, TrendingUp } from "lucide-react";
import { fmtNumber, fmtPct } from "@/lib/format";
import type { AgenteFunnelRow, CotizacionFunnelRow } from "@/app/api/funneles/route";

interface FunnelesTabProps {
  agentes: AgenteFunnelRow[];
  cotizaciones: CotizacionFunnelRow[];
  lastUpdated?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

const ALL = "__ALL__";

// ─── Color ramp for funnel stages ────────────────────────────────────────────
const AGENTE_COLORS = ["#6366f1", "#3b82f6", "#06b6d4", "#14b8a6"];
const COT_COLORS    = ["#6366f1", "#8b5cf6", "#06b6d4", "#f59e0b", "#16a34a"];

function sumRows<T extends object>(
  rows: T[],
  numericKeys: (keyof T)[]
): Record<keyof T, number> {
  const result = {} as Record<keyof T, number>;
  for (const k of numericKeys) result[k] = 0;
  for (const r of rows) {
    for (const k of numericKeys) result[k] += Number(r[k] ?? 0);
  }
  return result;
}

export function FunnelesTab({
  agentes, cotizaciones, lastUpdated, isLoading, onRefresh,
}: FunnelesTabProps) {
  const [agenciaFilter, setAgenciaFilter] = useState("");

  // Unique agencies (union of both datasets)
  const agencias = useMemo(() => {
    const all = new Set([
      ...agentes.map((r) => r.Agencia_Master),
      ...cotizaciones.map((r) => r.Agencia_Master),
    ]);
    return [...all].filter((a) => a !== "Sin agencia").sort();
  }, [agentes, cotizaciones]);

  // Filtered rows
  const filteredAgentes = useMemo(
    () => agenciaFilter ? agentes.filter((r) => r.Agencia_Master === agenciaFilter) : agentes,
    [agentes, agenciaFilter]
  );
  const filteredCot = useMemo(
    () => agenciaFilter ? cotizaciones.filter((r) => r.Agencia_Master === agenciaFilter) : cotizaciones,
    [cotizaciones, agenciaFilter]
  );

  // Aggregated totals
  const aTotals = useMemo(
    () => sumRows(filteredAgentes, ["total_invitados", "aprobados", "agentes_con_cotizaciones", "agentes_con_ventas"]),
    [filteredAgentes]
  );
  const cTotals = useMemo(
    () => sumRows(filteredCot, ["cotizaciones_totales", "cotizaciones_con_estado", "convertidas_poliza", "polizas_vigentes"]),
    [filteredCot]
  );

  // Funnel stages
  const agenteStages = [
    { step: 1, label: "Total invitados",         sublabel: "invitaciones enviadas",         value: aTotals.total_invitados,         color: AGENTE_COLORS[0] },
    { step: 2, label: "Agentes aprobados",        sublabel: "solicitud aprobada por Olé",    value: aTotals.aprobados,               color: AGENTE_COLORS[1] },
    { step: 3, label: "Agentes con cotizaciones", sublabel: "al menos 1 cotización emitida", value: aTotals.agentes_con_cotizaciones, color: AGENTE_COLORS[2] },
    { step: 4, label: "Agentes con ventas",       sublabel: "al menos 1 póliza emitida",     value: aTotals.agentes_con_ventas,      color: AGENTE_COLORS[3] },
  ];

  const cotStages = [
    { step: 1, label: "Cotizaciones totales",    sublabel: "todas las cotizaciones",          value: cTotals.cotizaciones_totales,    color: COT_COLORS[0] },
    { step: 2, label: "Cotizaciones con estado", sublabel: "con estatus registrado",           value: cTotals.cotizaciones_con_estado, color: COT_COLORS[1] },
    { step: 3, label: "Convertidas a póliza",    sublabel: "cotización asociada a póliza",    value: cTotals.convertidas_poliza,      color: COT_COLORS[2] },
    { step: 4, label: "Pólizas vigentes",        sublabel: "estatus vigente/activa",          value: cTotals.polizas_vigentes,        color: COT_COLORS[3] },
  ];

  // KPI metrics
  const tasaAprobacion   = aTotals.total_invitados > 0 ? aTotals.aprobados / aTotals.total_invitados : 0;
  const tasaActivacion   = aTotals.aprobados > 0 ? aTotals.agentes_con_cotizaciones / aTotals.aprobados : 0;
  const tasaConversion   = cTotals.cotizaciones_totales > 0 ? cTotals.convertidas_poliza / cTotals.cotizaciones_totales : 0;
  const tasaVigencia     = cTotals.convertidas_poliza > 0 ? cTotals.polizas_vigentes / cTotals.convertidas_poliza : 0;

  return (
    <div>
      {/* ── Filters ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-end gap-4">
        <div className="flex items-center gap-1.5 text-slate-400 self-end pb-1.5">
          <SlidersHorizontal size={13} />
          <span className="text-xs font-medium">Filtros</span>
          {agenciaFilter && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold">1</span>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Agencia Master</span>
          <Select value={agenciaFilter} onValueChange={(v) => setAgenciaFilter(v === ALL ? "" : (v ?? ""))}>

            <SelectTrigger className="h-8 w-52 text-sm bg-white border-slate-200 text-slate-700">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-slate-500 italic">Todas</SelectItem>
              {agencias.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1" />

        <div className="flex items-end gap-3 self-end">
          {lastUpdated && (
            <span className="text-[11px] text-slate-400 pb-1.5">
              Act.{" "}
              {new Date(lastUpdated).toLocaleString("es-MX", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-sm border-slate-200 text-slate-600" onClick={onRefresh} disabled={isLoading}>
            <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
            Actualizar
          </Button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="p-6 space-y-6 max-w-screen-2xl mx-auto">

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Tasa de aprobación"
            value={fmtPct(tasaAprobacion)}
            subtitle={`${fmtNumber(aTotals.aprobados)} de ${fmtNumber(aTotals.total_invitados)} invitados`}
            icon={Users}
            color="indigo"
          />
          <KpiCard
            title="Tasa de activación"
            value={fmtPct(tasaActivacion)}
            subtitle={`Aprobados que cotizaron`}
            icon={TrendingUp}
            color="emerald"
          />
          <KpiCard
            title="Conversión cot. → póliza"
            value={fmtPct(tasaConversion)}
            subtitle={`${fmtNumber(cTotals.convertidas_poliza)} de ${fmtNumber(cTotals.cotizaciones_totales)} cotizaciones`}
            icon={FileText}
            color="amber"
          />
          <KpiCard
            title="Pólizas vigentes"
            value={fmtNumber(cTotals.polizas_vigentes)}
            subtitle={fmtPct(tasaVigencia) + " de pólizas emitidas"}
            icon={ShieldCheck}
            color="emerald"
          />
        </div>

        {/* Two funnels side by side */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Funnel 1: Agentes */}
          <Card className="border border-slate-200 shadow-none rounded-xl">
            <CardHeader className="pb-2 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800">
                    Funnel de Agentes
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    De invitación a primera venta
                  </p>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Invitados</p>
                    <p className="text-lg font-bold text-slate-800 tabular-nums">{fmtNumber(aTotals.total_invitados)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Con ventas</p>
                    <p className="text-lg font-bold text-indigo-600 tabular-nums">{fmtNumber(aTotals.agentes_con_ventas)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <FunnelViz title="" stages={agenteStages} />
            </CardContent>
          </Card>

          {/* Funnel 2: Cotizaciones */}
          <Card className="border border-slate-200 shadow-none rounded-xl">
            <CardHeader className="pb-2 border-b border-slate-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-800">
                    Funnel de Cotizaciones
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    De cotización a póliza vigente
                  </p>
                </div>
                <div className="flex gap-4 text-right">
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Cotizaciones</p>
                    <p className="text-lg font-bold text-slate-800 tabular-nums">{fmtNumber(cTotals.cotizaciones_totales)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Vigentes</p>
                    <p className="text-lg font-bold text-emerald-600 tabular-nums">{fmtNumber(cTotals.polizas_vigentes)}</p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-5">
              <FunnelViz title="" stages={cotStages} />
            </CardContent>
          </Card>
        </div>

        {/* Breakdown by agency table */}
        {!agenciaFilter && agentes.length > 1 && (
          <Card className="border border-slate-200 shadow-none rounded-xl">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Detalle por Agencia Master
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {["Agencia", "Invitados", "Aprobados", "% Apr.", "Con Cot.", "% Act.", "Con Ventas", "% Conv.", "Cot. Total", "→ Pólizas", "Vigentes"].map((h) => (
                        <th key={h} className="px-4 py-3 text-[11px] font-semibold text-slate-400 uppercase tracking-widest text-right first:text-left whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {agentes.map((a, i) => {
                      const c = cotizaciones.find((r) => r.Agencia_Master === a.Agencia_Master);
                      const pApr = a.total_invitados > 0 ? (a.aprobados / a.total_invitados * 100).toFixed(0) : "—";
                      const pAct = a.aprobados > 0 ? (a.agentes_con_cotizaciones / a.aprobados * 100).toFixed(0) : "—";
                      const pConv = a.agentes_con_cotizaciones > 0 ? (a.agentes_con_ventas / a.agentes_con_cotizaciones * 100).toFixed(0) : "—";
                      return (
                        <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                          <td className="px-4 py-2.5 font-medium text-slate-700 whitespace-nowrap">{a.Agencia_Master}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmtNumber(a.total_invitados)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmtNumber(a.aprobados)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-700">{pApr !== "—" ? `${pApr}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmtNumber(a.agentes_con_cotizaciones)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium text-slate-700">{pAct !== "—" ? `${pAct}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{fmtNumber(a.agentes_con_ventas)}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium text-indigo-600">{pConv !== "—" ? `${pConv}%` : "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{c ? fmtNumber(c.cotizaciones_totales) : "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-slate-600">{c ? fmtNumber(c.convertidas_poliza) : "—"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums font-medium text-emerald-600">{c ? fmtNumber(c.polizas_vigentes) : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
