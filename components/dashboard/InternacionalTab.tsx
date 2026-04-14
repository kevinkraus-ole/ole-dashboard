"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KpiCard } from "./KpiCard";
import { RankingChart } from "./charts/RankingChart";
import { RefreshCw, SlidersHorizontal, Globe, FileText, Users, Building2 } from "lucide-react";
import { fmtNumber } from "@/lib/format";
import { buildColorMap, getEntityColor } from "@/lib/colors";
import type { IntlCotizacionRow, IntlFunnelRow } from "@/lib/types";
import type { IntlAgenciaRow, IntlComisionRow } from "@/app/api/intl/funneles/route";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, LabelList, Cell,
  ComposedChart, Line, Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const ALL = "__ALL__";

// Map SALES_FUNNEL_STAGE numeric codes to readable labels.
// Codes are shown as-is with a short description when known.
function stageLabel(code: number | string): string {
  const c = Number(code);
  const LABELS: Record<number, string> = {
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
  return LABELS[c] ?? `Etapa ${c}`;
}

// Palette for funnel stages
const STAGE_COLORS = [
  "#6366f1", "#3b82f6", "#06b6d4", "#10b981",
  "#f59e0b", "#f97316", "#ef4444", "#8b5cf6", "#ec4899",
];

interface InternacionalTabProps {
  cotizaciones: IntlCotizacionRow[];
  funnel: IntlFunnelRow[];
  agencias: IntlAgenciaRow[];
  comisiones: IntlComisionRow[];
  lastUpdated?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

function formatMes(val: string) {
  try { return format(parseISO(val), "MMM yyyy", { locale: es }); }
  catch { return val; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TooltipBox = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-2">{formatMes(label)}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums">{fmtNumber(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

export function InternacionalTab({
  cotizaciones, funnel, agencias, comisiones, lastUpdated, isLoading, onRefresh,
}: InternacionalTabProps) {
  const [agenciaFilter, setAgenciaFilter] = useState("");

  // Unique master agencies
  const agenciasList = useMemo(() => {
    const s = new Set(cotizaciones.map((r) => r.Agencia_Master).filter(Boolean));
    return [...s].sort();
  }, [cotizaciones]);

  // Filtered cotizaciones
  const filtered = useMemo(
    () => agenciaFilter ? cotizaciones.filter((r) => r.Agencia_Master === agenciaFilter) : cotizaciones,
    [cotizaciones, agenciaFilter]
  );

  // KPIs
  const totalCot = useMemo(
    () => filtered.reduce((s, r) => s + r.Cantidad_Cotizaciones, 0),
    [filtered]
  );
  const totalAgencias = useMemo(
    () => new Set(filtered.map((r) => r.Agencia_Master)).size,
    [filtered]
  );
  const totalNivel2 = useMemo(
    () => new Set(filtered.map((r) => r.Nivel2)).size,
    [filtered]
  );

  // Evolutivo: by month, stacked by top-5 master agencies
  const agencyColorMap = useMemo(
    () => buildColorMap(agenciasList),
    [agenciasList]
  );

  const top5Agencies = useMemo(
    () => agencias.slice(0, 5).map((a) => a.nombre),
    [agencias]
  );

  const evolutivoData = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const r of filtered) {
      if (!r.Mes) continue;
      if (!map.has(r.Mes)) map.set(r.Mes, {});
      const m = map.get(r.Mes)!;
      const key = top5Agencies.includes(r.Agencia_Master) ? r.Agencia_Master : "Otros";
      m[key] = (m[key] ?? 0) + r.Cantidad_Cotizaciones;
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({ mes, ...v }));
  }, [filtered, top5Agencies]);

  const evolutivoKeys = useMemo(() => {
    const keys = new Set<string>();
    evolutivoData.forEach((d) => Object.keys(d).filter((k) => k !== "mes").forEach((k) => keys.add(k)));
    return [...keys];
  }, [evolutivoData]);

  // Funnel stage chart (filtered)
  const filteredFunnel = useMemo(() => {
    if (!agenciaFilter) return funnel;
    // Re-aggregate from filtered cotizaciones
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Etapa, (map.get(r.Etapa) ?? 0) + r.Cantidad_Cotizaciones);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([etapa, cant]) => ({ Codigo: Number(etapa), Cantidad: cant }));
  }, [funnel, agenciaFilter, filtered]);

  // Ranking nivel2
  const rankingNivel2 = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      if (r.Nivel2) map.set(r.Nivel2, (map.get(r.Nivel2) ?? 0) + r.Cantidad_Cotizaciones);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([nombre, cantidad]) => ({ nombre, cantidad, color: getEntityColor(nombre) }));
  }, [filtered]);

  // Ranking top agencies (from API, or filtered)
  const rankingAgencias = useMemo(() => {
    if (!agenciaFilter) {
      return agencias.map((a) => ({
        nombre: a.nombre,
        cantidad: a.cotizaciones,
        color: agencyColorMap[a.nombre] ?? getEntityColor(a.nombre),
      }));
    }
    return filtered
      .reduce((acc, r) => {
        const ex = acc.find((x) => x.nombre === r.Agencia_Master);
        if (ex) ex.cantidad += r.Cantidad_Cotizaciones;
        else acc.push({ nombre: r.Agencia_Master, cantidad: r.Cantidad_Cotizaciones, color: agencyColorMap[r.Agencia_Master] ?? getEntityColor(r.Agencia_Master) });
        return acc;
      }, [] as { nombre: string; cantidad: number; color: string }[])
      .sort((a, b) => b.cantidad - a.cantidad);
  }, [agencias, agenciaFilter, filtered, agencyColorMap]);

  // Comisiones
  const rankingComisiones = useMemo(
    () => comisiones.map((c, i) => ({
      nombre: c.nivel_comision,
      cantidad: c.asesores,
      color: STAGE_COLORS[i % STAGE_COLORS.length],
    })),
    [comisiones]
  );

  return (
    <div>
      {/* ── Filters ── */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-end gap-4 sticky top-[52px] z-10">
        <div className="flex items-center gap-1.5 text-slate-400 self-end pb-1.5">
          <SlidersHorizontal size={13} />
          <span className="text-xs font-medium">Filtros</span>
          {agenciaFilter && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold">1</span>
          )}
        </div>

        <div className="flex items-center gap-2 mr-4 border-r border-slate-200 pr-4">
          <Globe size={13} className="text-indigo-500" />
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">Internacional · Últimos 12 meses</span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Agencia Master</span>
          <Select value={agenciaFilter} onValueChange={(v) => setAgenciaFilter(v === ALL ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-56 text-sm bg-white border-slate-200 text-slate-700">
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-slate-500 italic">Todas</SelectItem>
              {agenciasList.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
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
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KpiCard
            title="Cotizaciones (12 meses)"
            value={fmtNumber(totalCot)}
            icon={FileText}
            color="indigo"
          />
          <KpiCard
            title="Agencias Master"
            value={totalAgencias}
            icon={Building2}
            color="slate"
          />
          <KpiCard
            title="Grupos Nivel 2"
            value={totalNivel2}
            icon={Users}
            color="slate"
          />
        </div>

        {/* Evolutivo */}
        <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Evolutivo de Cotizaciones por Agencia Master
            </CardTitle>
            <p className="text-xs text-slate-400">Últimos 12 meses — top 5 agencias + Otros</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={evolutivoData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }} barCategoryGap="40%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tickFormatter={formatMes} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} tickFormatter={fmtNumber} />
                <RechartTooltip content={<TooltipBox />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                {evolutivoKeys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="stack"
                    fill={agencyColorMap[key] ?? STAGE_COLORS[i % STAGE_COLORS.length]}
                    radius={evolutivoKeys[evolutivoKeys.length - 1] === key ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funnel stages + Agencias ranking */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Funnel stages */}
          <Card className="border border-slate-200 shadow-none rounded-xl">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Distribución por Etapa del Funnel
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">SALES_FUNNEL_STAGE — códigos numéricos del sistema offshore</p>
            </CardHeader>
            <CardContent className="pt-5">
              {filteredFunnel.length === 0 ? (
                <div className="flex items-center justify-center text-slate-300 text-sm h-48">Sin datos</div>
              ) : (
                <div className="space-y-2">
                  {filteredFunnel.map((row, i) => {
                    const label = stageLabel(row.Codigo);
                    const maxVal = filteredFunnel[0].Cantidad;
                    const pct = maxVal > 0 ? (row.Cantidad / maxVal) * 100 : 0;
                    const color = STAGE_COLORS[i % STAGE_COLORS.length];
                    return (
                      <div key={row.Codigo} className="flex items-center gap-3 py-1">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[9px] font-bold shrink-0"
                          style={{ background: color }}
                        >
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-slate-700">{label}</span>
                            <span className="text-[9px] text-slate-400 font-mono">#{row.Codigo}</span>
                          </div>
                          <div className="relative h-5 bg-slate-100 rounded-md overflow-hidden">
                            <div
                              className="absolute inset-y-0 left-0 rounded-md transition-all duration-700"
                              style={{ width: `${Math.max(pct, 1)}%`, background: color, opacity: 0.75 }}
                            />
                          </div>
                        </div>
                        <p className="text-sm font-bold tabular-nums text-slate-800 w-16 text-right shrink-0">
                          {fmtNumber(row.Cantidad)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Agencias */}
          <Card className="border border-slate-200 shadow-none rounded-xl">
            <CardHeader className="pb-2 border-b border-slate-100">
              <CardTitle className="text-sm font-semibold text-slate-800">
                Top Agencias Master
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              <RankingChart
                data={rankingAgencias}
                label="Por cotizaciones — últimos 12 meses"
                height={280}
                topN={15}
              />
            </CardContent>
          </Card>
        </div>

        {/* Nivel 2 + Comisiones */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Top Nivel 2
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingChart
                data={rankingNivel2}
                label="Por cotizaciones"
                height={260}
                topN={10}
              />
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Distribución por Nivel de Comisiones
              </CardTitle>
              <p className="text-xs text-slate-400">Asesores en dim_advisor_full</p>
            </CardHeader>
            <CardContent>
              <RankingChart
                data={rankingComisiones}
                label="Por cantidad de asesores"
                height={260}
                topN={10}
              />
            </CardContent>
          </Card>
        </div>

        {/* Jerarquía nota */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-4">
          <p className="text-xs font-semibold text-slate-600 mb-1">Sobre la jerarquía offshore</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            La estructura tiene 7 niveles: <span className="font-mono font-medium">MASTER_AGENCY → LEVEL_2 → LEVEL_3 → LEVEL_4 → LEVEL_5 → LEVEL_6 → LEVEL_7</span>.
            Los filtros adicionales por nivel están disponibles a solicitud.
            Los códigos SALES_FUNNEL_STAGE son numéricos y propietarios del sistema; las etiquetas mostradas son aproximadas.
          </p>
        </div>
      </div>
    </div>
  );
}
