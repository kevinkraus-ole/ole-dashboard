"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { KpiCard } from "./KpiCard";
import { RankingChart } from "./charts/RankingChart";
import { StatusDonut } from "./charts/StatusDonut";
import { RefreshCw, SlidersHorizontal, ShieldCheck, DollarSign, Activity, AlertCircle } from "lucide-react";
import { fmtNumber } from "@/lib/format";
import { buildColorMap, getEntityColor } from "@/lib/colors";
import type { IntlPolizaRow } from "@/lib/types";
import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer, Legend, Line,
} from "recharts";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

const ALL = "__ALL__";

const STATUS_COLORS_INTL: Record<string, string> = {
  "ACTIVE":                    "#16a34a",
  "GRACE PERIOD":              "#f59e0b",
  "LAPSED":                    "#f97316",
  "NOT PAYMENT RECEIVED":      "#ef4444",
  "CANCELLED":                 "#dc2626",
  "REJECTED":                  "#94a3b8",
  "NOT TAKEN":                 "#64748b",
  "PENDING EVALUATION":        "#6366f1",
  "APPLICATION WITHDRAWN":     "#a1a1aa",
  "POSTPONED":                 "#8b5cf6",
  "CLAIM":                     "#0ea5e9",
};

function formatMes(val: string) {
  try { return format(parseISO(val), "MMM yy", { locale: es }); }
  catch { return val; }
}

function formatUSD(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toLocaleString("en-US")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ComboTooltip = ({ active, payload, label }: any) => {
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
          <span className="font-semibold tabular-nums">
            {p.name === "Prima Anual" ? formatUSD(p.value) : fmtNumber(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

interface IntlPolizasTabProps {
  data: IntlPolizaRow[];
  lastUpdated?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

export function IntlPolizasTab({ data, lastUpdated, isLoading, onRefresh }: IntlPolizasTabProps) {
  const [agenciaFilter, setAgenciaFilter] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("");

  const agencias = useMemo(
    () => [...new Set(data.map((r) => r.Agencia_Master))].sort(),
    [data]
  );
  const estados = useMemo(
    () => [...new Set(data.map((r) => r.Estado))].sort(),
    [data]
  );

  const filtered = useMemo(
    () => data.filter((r) => {
      if (agenciaFilter && r.Agencia_Master !== agenciaFilter) return false;
      if (estadoFilter && r.Estado !== estadoFilter) return false;
      return true;
    }),
    [data, agenciaFilter, estadoFilter]
  );

  // KPIs
  const totalActivas = useMemo(
    () => filtered.filter((r) => r.Estado === "ACTIVE").reduce((s, r) => s + r.Cantidad_Polizas, 0),
    [filtered]
  );
  const totalEnGracia = useMemo(
    () => filtered.filter((r) => r.Estado === "GRACE PERIOD").reduce((s, r) => s + r.Cantidad_Polizas, 0),
    [filtered]
  );
  const totalPrima = useMemo(
    () => filtered.filter((r) => r.Estado === "ACTIVE").reduce((s, r) => s + r.Prima_Total, 0),
    [filtered]
  );
  const totalLapsed = useMemo(
    () => filtered.filter((r) => r.Estado === "LAPSED").reduce((s, r) => s + r.Cantidad_Polizas, 0),
    [filtered]
  );

  // Status donut
  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Estado, (map.get(r.Estado) ?? 0) + r.Cantidad_Polizas);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ name, value, color: STATUS_COLORS_INTL[name] ?? "#94a3b8" }));
  }, [filtered]);

  // Monthly combo: ACTIVE policies + prima
  const agencyColorMap = useMemo(() => buildColorMap(agencias), [agencias]);

  const top5 = useMemo(
    () => data
      .filter((r) => r.Estado === "ACTIVE")
      .reduce((acc, r) => {
        const ex = acc.find((x) => x.k === r.Agencia_Master);
        if (ex) ex.v += r.Cantidad_Polizas; else acc.push({ k: r.Agencia_Master, v: r.Cantidad_Polizas });
        return acc;
      }, [] as { k: string; v: number }[])
      .sort((a, b) => b.v - a.v)
      .slice(0, 5)
      .map((x) => x.k),
    [data]
  );

  const comboData = useMemo(() => {
    const map = new Map<string, Record<string, number>>();
    for (const r of filtered.filter((r) => r.Estado === "ACTIVE" && r.Mes)) {
      if (!map.has(r.Mes)) map.set(r.Mes, { __prima__: 0 });
      const m = map.get(r.Mes)!;
      const key = top5.includes(r.Agencia_Master) ? r.Agencia_Master : "Otras";
      m[key] = (m[key] ?? 0) + r.Cantidad_Polizas;
      m["__prima__"] = (m["__prima__"] ?? 0) + r.Prima_Total;
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([mes, v]) => ({ mes, ...v }));
  }, [filtered, top5]);

  const comboKeys = useMemo(() => {
    const s = new Set<string>();
    comboData.forEach((d) => Object.keys(d).filter((k) => k !== "mes" && k !== "__prima__").forEach((k) => s.add(k)));
    return [...s];
  }, [comboData]);

  // Ranking agencias (ACTIVE only)
  const rankingAgencias = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered.filter((r) => r.Estado === "ACTIVE")) {
      map.set(r.Agencia_Master, (map.get(r.Agencia_Master) ?? 0) + r.Cantidad_Polizas);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([nombre, cantidad]) => ({ nombre, cantidad, color: agencyColorMap[nombre] ?? getEntityColor(nombre) }));
  }, [filtered, agencyColorMap]);

  const activeCount = [agenciaFilter, estadoFilter].filter(Boolean).length;

  return (
    <div>
      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex flex-wrap items-end gap-4 sticky top-[52px] z-10">
        <div className="flex items-center gap-1.5 text-slate-400 self-end pb-1.5">
          <SlidersHorizontal size={13} />
          <span className="text-xs font-medium">Filtros</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold">{activeCount}</span>
          )}
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
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Estado</span>
          <Select value={estadoFilter} onValueChange={(v) => setEstadoFilter(v === ALL ? "" : (v ?? ""))}>
            <SelectTrigger className="h-8 w-52 text-sm bg-white border-slate-200 text-slate-700">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL} className="text-slate-500 italic">Todos</SelectItem>
              {estados.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
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
          <KpiCard title="Pólizas activas" value={fmtNumber(totalActivas)} icon={ShieldCheck} color="emerald" />
          <KpiCard title="En período de gracia" value={fmtNumber(totalEnGracia)} icon={Activity} color="amber" />
          <KpiCard title="Lapsadas" value={fmtNumber(totalLapsed)} icon={AlertCircle} color="rose" />
          <KpiCard title="Prima anual (activas)" value={formatUSD(totalPrima)} icon={DollarSign} color="indigo" />
        </div>

        {/* Evolutivo combo */}
        <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Pólizas Activas por Mes y Agencia · Prima Anual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={comboData} margin={{ top: 4, right: 56, left: 0, bottom: 0 }} barCategoryGap="40%" barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="mes" tickFormatter={formatMes} tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={36} tickFormatter={fmtNumber} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={56} tickFormatter={formatUSD} />
                <RechartTooltip content={<ComboTooltip />} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                {comboKeys.map((key, i) => (
                  <Bar key={key} yAxisId="left" dataKey={key} stackId="stack"
                    fill={agencyColorMap[key] ?? getEntityColor(key)}
                    radius={comboKeys[comboKeys.length - 1] === key ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
                <Line yAxisId="right" dataKey="__prima__" name="Prima Anual" type="monotone"
                  stroke="#f59e0b" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status donut + ranking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Distribución por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDonut data={statusData} height={280} />
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">Ranking por Agencia (Activas)</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingChart data={rankingAgencias} label="Por pólizas activas" height={280} topN={12} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
