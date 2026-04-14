"use client";

import { useMemo } from "react";
import { PolizaRow, FilterState } from "@/lib/types";
import { KpiCard } from "./KpiCard";
import { EvolutivoChart } from "./charts/EvolutivoChart";
import { RankingChart } from "./charts/RankingChart";
import { StatusDonut } from "./charts/StatusDonut";
import { DataTable } from "./DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiltersBar } from "./FiltersBar";
import { STATUS_COLORS, getEntityColor } from "@/lib/colors";
import { ShieldCheck, Building2, Users, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface PolizasTabProps {
  data: PolizaRow[];
  filters: FilterState;
  onFilterChange: (f: FilterState) => void;
  lastUpdated?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

function applyFilters(rows: PolizaRow[], f: FilterState) {
  return rows.filter((r) => {
    if (f.agenciaMaster && r.Agencia_Master !== f.agenciaMaster) return false;
    if (f.promotor && r.Promotor !== f.promotor) return false;
    if (f.agente && r.Agente !== f.agente) return false;
    return true;
  });
}

function formatMes(val: string) {
  try {
    return format(parseISO(val), "MMM yyyy", { locale: es });
  } catch {
    return val;
  }
}

function formatPeso(val: number) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(0)}K`;
  return `$${val.toLocaleString("es-MX")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ComboTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-2">{formatMes(label)}</p>
      {payload.map((p: { name: string; value: number; color: string }) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-medium tabular-nums">
            {p.name === "Prima Total"
              ? formatPeso(p.value)
              : p.value?.toLocaleString("es-MX")}
          </span>
        </div>
      ))}
    </div>
  );
};

export function PolizasTab({
  data,
  filters,
  onFilterChange,
  lastUpdated,
  isLoading,
  onRefresh,
}: PolizasTabProps) {
  const filtered = useMemo(() => applyFilters(data, filters), [data, filters]);

  const agencias = useMemo(
    () => [...new Set(data.map((r) => r.Agencia_Master))].sort(),
    [data]
  );
  const promotores = useMemo(() => {
    const base = filters.agenciaMaster
      ? data.filter((r) => r.Agencia_Master === filters.agenciaMaster)
      : data;
    return [...new Set(base.map((r) => r.Promotor))].sort();
  }, [data, filters.agenciaMaster]);
  const agentes = useMemo(() => {
    const base = filters.promotor
      ? data.filter((r) => r.Promotor === filters.promotor)
      : data;
    return [...new Set(base.map((r) => r.Agente))].sort();
  }, [data, filters.promotor]);

  // KPIs
  const totalPolizas = useMemo(
    () => filtered.reduce((s, r) => s + r.Cantidad_Polizas, 0),
    [filtered]
  );
  const totalPrima = useMemo(
    () => filtered.reduce((s, r) => s + r.Prima_Total, 0),
    [filtered]
  );
  const totalSumaAseg = useMemo(
    () => filtered.reduce((s, r) => s + r.Suma_Asegurada_Total, 0),
    [filtered]
  );
  const totalAgencias = useMemo(
    () => new Set(filtered.map((r) => r.Agencia_Master)).size,
    [filtered]
  );

  // Combo chart: barras por agencia + línea prima total
  const comboData = useMemo(() => {
    const mesMap = new Map<string, Record<string, number>>();
    for (const r of filtered) {
      if (!r.Mes) continue;
      if (!mesMap.has(r.Mes)) mesMap.set(r.Mes, { __prima__: 0 });
      const m = mesMap.get(r.Mes)!;
      m[r.Agencia_Master] = (m[r.Agencia_Master] ?? 0) + r.Cantidad_Polizas;
      m["__prima__"] = (m["__prima__"] ?? 0) + r.Prima_Total;
    }
    return [...mesMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, v]) => ({ mes, ...v }));
  }, [filtered]);

  const agenciasInData = useMemo(
    () => [...new Set(filtered.map((r) => r.Agencia_Master))],
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
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] ?? "#94a3b8",
      }));
  }, [filtered]);

  // Ranking agencias
  const rankingAgencias = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Agencia_Master, (map.get(r.Agencia_Master) ?? 0) + r.Cantidad_Polizas);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        color: getEntityColor(nombre),
      }));
  }, [filtered]);

  // Ranking promotores
  const rankingPromotores = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Promotor, (map.get(r.Promotor) ?? 0) + r.Cantidad_Polizas);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([nombre, cantidad]) => ({ nombre, cantidad, color: getEntityColor(nombre) }));
  }, [filtered]);

  // Table rows
  const tableRows = useMemo(
    () => [...filtered].sort((a, b) => b.Mes.localeCompare(a.Mes)),
    [filtered]
  );

  return (
    <div>
      <FiltersBar
        filters={filters}
        onFilterChange={onFilterChange}
        agencias={agencias}
        promotores={promotores}
        agentes={agentes}
        lastUpdated={lastUpdated}
        isLoading={isLoading}
        onRefresh={onRefresh}
      />

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            title="Pólizas emitidas"
            value={totalPolizas}
            icon={ShieldCheck}
            color="green"
          />
          <KpiCard
            title="Prima Total Anual"
            value={formatPeso(totalPrima)}
            icon={DollarSign}
            color="blue"
          />
          <KpiCard
            title="Suma Asegurada"
            value={formatPeso(totalSumaAseg)}
            icon={DollarSign}
            color="amber"
          />
          <KpiCard
            title="Agencias Master"
            value={totalAgencias}
            icon={Building2}
            color="default"
          />
        </div>

        {/* Combo chart: cantidad + prima */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Evolutivo de Pólizas por Agencia Master + Prima Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={340}>
              <ComposedChart
                data={comboData}
                margin={{ top: 4, right: 50, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#f1f5f9"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tickFormatter={formatMes}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) => formatPeso(v)}
                />
                <Tooltip content={<ComboTooltip />} />
                <Legend
                  iconType="square"
                  iconSize={10}
                  wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
                />
                {agenciasInData.map((a) => (
                  <Bar
                    key={a}
                    yAxisId="left"
                    dataKey={a}
                    stackId="stack"
                    fill={getEntityColor(a)}
                    radius={
                      agenciasInData[agenciasInData.length - 1] === a
                        ? [3, 3, 0, 0]
                        : [0, 0, 0, 0]
                    }
                  />
                ))}
                <Line
                  yAxisId="right"
                  dataKey="__prima__"
                  name="Prima Total"
                  type="monotone"
                  stroke="#f59e0b"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status donut + Ranking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Distribución por Estatus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDonut data={statusData} height={280} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Ranking por Agencia
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingChart
                data={rankingAgencias}
                label="Por cantidad de pólizas"
                height={280}
              />
            </CardContent>
          </Card>
        </div>

        {/* Promotores ranking */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Top Promotores por Pólizas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankingChart
              data={rankingPromotores}
              label="Top 10 promotores"
              height={240}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Detalle
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <DataTable
              columns={[
                {
                  key: "Mes",
                  label: "Mes",
                  format: (v) => formatMes(String(v)),
                },
                { key: "Agencia_Master", label: "Agencia Master" },
                { key: "Promotor", label: "Promotor" },
                { key: "Agente", label: "Agente" },
                { key: "Producto", label: "Producto" },
                { key: "Estado", label: "Estado" },
                {
                  key: "Cantidad_Polizas",
                  label: "Pólizas",
                  align: "right",
                  format: (v) => Number(v).toLocaleString("es-MX"),
                },
                {
                  key: "Prima_Total",
                  label: "Prima Anual",
                  align: "right",
                  format: (v) => formatPeso(Number(v)),
                },
                {
                  key: "Suma_Asegurada_Total",
                  label: "Suma Asegurada",
                  align: "right",
                  format: (v) => formatPeso(Number(v)),
                },
              ]}
              rows={tableRows}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
