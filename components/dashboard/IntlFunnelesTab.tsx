"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { KpiCard } from "./KpiCard";
import { FunnelViz } from "./charts/FunnelViz";
import { RankingChart } from "./charts/RankingChart";
import { RefreshCw, Globe, FileText, ShieldCheck, TrendingUp, CheckCircle } from "lucide-react";
import { fmtNumber, fmtPct } from "@/lib/format";
import { getEntityColor } from "@/lib/colors";
import type { IntlFunnelRow, IntlConversionFunnel } from "@/lib/types";
import type { IntlAgenciaRow, IntlComisionRow } from "@/app/api/intl/funneles/route";

// Numeric SALES_FUNNEL_STAGE codes → readable labels
const STAGE_LABELS: Record<number, string> = {
  6000: "Cotización iniciada",
  93:   "En proceso",
  83:   "En revisión",
  56:   "Aprobada",
  97:   "Pendiente",
  100:  "Emitida",
  5029: "Especial",
  77:   "En análisis",
  10:   "Inicio",
};

const FUNNEL_COLORS = ["#6366f1", "#3b82f6", "#06b6d4", "#10b981", "#16a34a"];

const STAGE_PALETTE = [
  "#6366f1","#3b82f6","#06b6d4","#10b981",
  "#f59e0b","#f97316","#ef4444","#8b5cf6","#ec4899",
];

interface IntlFunnelesTabProps {
  funnel: IntlFunnelRow[];           // SALES_FUNNEL_STAGE distribution
  conversion: IntlConversionFunnel | null;  // 5-step conversion funnel
  agencias: IntlAgenciaRow[];
  comisiones: IntlComisionRow[];
  lastUpdated?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export function IntlFunnelesTab({
  funnel, conversion, agencias, comisiones, lastUpdated, isLoading, onRefresh,
}: IntlFunnelesTabProps) {

  // 5-step conversion funnel stages
  const conversionStages = useMemo(() => {
    if (!conversion) return [];
    return [
      {
        step: 1,
        label: "Cotizaciones totales",
        sublabel: "últimos 12 meses",
        value: conversion.cotizaciones_totales,
        color: FUNNEL_COLORS[0],
      },
      {
        step: 2,
        label: "Avanzaron en proceso",
        sublabel: "no rechazadas / retiradas",
        value: conversion.avanzaron_proceso,
        color: FUNNEL_COLORS[1],
      },
      {
        step: 3,
        label: "En vigor (activas o gracia)",
        sublabel: "ACTIVE + GRACE PERIOD",
        value: conversion.en_vigor,
        color: FUNNEL_COLORS[2],
      },
      {
        step: 4,
        label: "Pólizas activas",
        sublabel: "STATUS_QUOTE = ACTIVE",
        value: conversion.polizas_activas,
        color: FUNNEL_COLORS[3],
      },
      {
        step: 5,
        label: "Activas y al corriente",
        sublabel: "ACTIVE + PAID",
        value: conversion.activas_pagadas,
        color: FUNNEL_COLORS[4],
      },
    ];
  }, [conversion]);

  // KPIs from conversion
  const tasaVigencia = conversion && conversion.cotizaciones_totales > 0
    ? conversion.en_vigor / conversion.cotizaciones_totales : 0;
  const tasaAlCorriente = conversion && conversion.polizas_activas > 0
    ? conversion.activas_pagadas / conversion.polizas_activas : 0;

  // Ranking agencias
  const rankingAgencias = useMemo(
    () => agencias.map((a) => ({ nombre: a.nombre, cantidad: a.cotizaciones, color: getEntityColor(a.nombre) })),
    [agencias]
  );

  // Comisiones ranking
  const rankingComisiones = useMemo(
    () => comisiones.map((c, i) => ({ nombre: c.nivel_comision, cantidad: c.asesores, color: STAGE_PALETTE[i % STAGE_PALETTE.length] })),
    [comisiones]
  );

  return (
    <div>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-end gap-4 sticky top-[52px] z-10">
        <div className="flex items-center gap-2">
          <Globe size={13} className="text-indigo-500" />
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Internacional · Últimos 12 meses</span>
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
            title="Cotizaciones (12m)"
            value={fmtNumber(conversion?.cotizaciones_totales ?? 0)}
            icon={FileText}
            color="indigo"
          />
          <KpiCard
            title="En vigor"
            value={fmtNumber(conversion?.en_vigor ?? 0)}
            subtitle={`Tasa: ${fmtPct(tasaVigencia)}`}
            icon={ShieldCheck}
            color="emerald"
          />
          <KpiCard
            title="Activas al corriente"
            value={fmtNumber(conversion?.activas_pagadas ?? 0)}
            subtitle={`${fmtPct(tasaAlCorriente)} de activas`}
            icon={CheckCircle}
            color="emerald"
          />
          <KpiCard
            title="Tasa de retención"
            value={fmtPct(tasaVigencia)}
            subtitle="Cotización → en vigor"
            icon={TrendingUp}
            color="indigo"
          />
        </div>

        {/* Conversion funnel */}
        <Card className="border border-slate-200 shadow-none rounded-xl">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Funnel de Conversión — Offshore
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">De cotización a póliza activa y pagada · últimos 12 meses</p>
          </CardHeader>
          <CardContent className="pt-5">
            {conversionStages.length > 0
              ? <FunnelViz title="" stages={conversionStages} />
              : <div className="text-center text-slate-300 text-sm py-12">Sin datos</div>}
          </CardContent>
        </Card>

        {/* SALES_FUNNEL_STAGE distribution */}
        <Card className="border border-slate-200 shadow-none rounded-xl">
          <CardHeader className="pb-2 border-b border-slate-100">
            <CardTitle className="text-sm font-semibold text-slate-800">
              Distribución por SALES_FUNNEL_STAGE
            </CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Códigos numéricos del sistema offshore — últimos 12 meses</p>
          </CardHeader>
          <CardContent className="pt-5">
            {funnel.length === 0 ? (
              <div className="text-center text-slate-300 text-sm py-12">Sin datos</div>
            ) : (
              <div className="space-y-2">
                {funnel.map((row, i) => {
                  const label = STAGE_LABELS[row.Codigo] ?? `Etapa ${row.Codigo}`;
                  const maxVal = funnel[0].Cantidad;
                  const pct = maxVal > 0 ? (row.Cantidad / maxVal) * 100 : 0;
                  const color = STAGE_PALETTE[i % STAGE_PALETTE.length];
                  return (
                    <div key={row.Codigo} className="flex items-center gap-3 py-1">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                        style={{ background: color }}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-slate-700">{label}</span>
                          <span className="text-[9px] text-slate-400 font-mono">#{row.Codigo}</span>
                        </div>
                        <div className="relative h-5 bg-slate-100 rounded-md overflow-hidden">
                          <div className="absolute inset-y-0 left-0 rounded-md transition-all duration-700"
                            style={{ width: `${Math.max(pct, 1)}%`, background: color, opacity: 0.75 }} />
                        </div>
                      </div>
                      <p className="text-sm font-bold tabular-nums text-slate-800 w-16 text-right shrink-0">
                        {fmtNumber(row.Cantidad)}
                      </p>
                      <p className="text-xs text-slate-400 w-12 text-right shrink-0">
                        {pct.toFixed(1)}%
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking agencias + comisiones */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Top Agencias Master</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingChart data={rankingAgencias} label="Por cotizaciones · 12 meses" height={260} topN={15} />
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Niveles de Comisión</CardTitle>
              <p className="text-xs text-slate-400">Asesores por nivel — dim_advisor_full</p>
            </CardHeader>
            <CardContent>
              <RankingChart data={rankingComisiones} label="Por cantidad de asesores" height={260} topN={10} />
            </CardContent>
          </Card>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-slate-600 mb-1">Nota sobre los datos offshore</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            El funnel de conversión usa <span className="font-mono">OFFER_DATE</span> para filtrar los últimos 12 meses.
            Los códigos <span className="font-mono">SALES_FUNNEL_STAGE</span> son numéricos y propietarios del sistema; las etiquetas son aproximadas.
            La jerarquía completa tiene 7 niveles: <span className="font-mono">MASTER_AGENCY → LEVEL_2 → … → LEVEL_7</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
