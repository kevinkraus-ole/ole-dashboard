"use client";

import { useMemo } from "react";
import { InvitacionRow, FilterState } from "@/lib/types";
import { KpiCard } from "./KpiCard";
import { EvolutivoChart } from "./charts/EvolutivoChart";
import { RankingChart } from "./charts/RankingChart";
import { StatusDonut } from "./charts/StatusDonut";
import { ConversionFunnel } from "./charts/ConversionFunnel";
import { DataTable } from "./DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiltersBar } from "./FiltersBar";
import { GRUPO_COLORS, STATUS_COLORS, getEntityColor } from "@/lib/colors";
import { Mail, Building2, Users, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface InvitacionesTabProps {
  data: InvitacionRow[];
  filters: FilterState;
  onFilterChange: (f: FilterState) => void;
  lastUpdated?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

function applyFilters(rows: InvitacionRow[], f: FilterState) {
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

const FUNNEL_ORDER = ["Completada", "En curso", "Requiere acción", "Perdida", "Otro"];

export function InvitacionesTab({
  data,
  filters,
  onFilterChange,
  lastUpdated,
  isLoading,
  onRefresh,
}: InvitacionesTabProps) {
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
  const totalInv = useMemo(
    () => filtered.reduce((s, r) => s + r.Cantidad, 0),
    [filtered]
  );
  const totalAgencias = useMemo(
    () => new Set(filtered.map((r) => r.Agencia_Master)).size,
    [filtered]
  );
  const totalPromotores = useMemo(
    () => new Set(filtered.map((r) => r.Promotor)).size,
    [filtered]
  );
  const totalAgentes = useMemo(
    () => new Set(filtered.map((r) => r.Agente)).size,
    [filtered]
  );
  const completadas = useMemo(
    () =>
      filtered
        .filter((r) => r.Estado_Grupo === "Completada")
        .reduce((s, r) => s + r.Cantidad, 0),
    [filtered]
  );
  const tasaAprobacion =
    totalInv > 0 ? ((completadas / totalInv) * 100).toFixed(1) : "0";

  // Evolutivo by Estado_Grupo por mes
  const evolutivoData = useMemo(() => {
    const mesMap = new Map<string, Record<string, number>>();
    for (const r of filtered) {
      if (!r.Mes) continue;
      if (!mesMap.has(r.Mes)) mesMap.set(r.Mes, {});
      const m = mesMap.get(r.Mes)!;
      m[r.Estado_Label] = (m[r.Estado_Label] ?? 0) + r.Cantidad;
    }
    return [...mesMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, counts]) => ({ mes, ...counts }));
  }, [filtered]);

  const estadosInData = useMemo(
    () => [...new Set(filtered.map((r) => r.Estado_Label))],
    [filtered]
  );

  // Funnel por grupo
  const funnelData = useMemo(() => {
    const grupoMap = new Map<string, number>();
    for (const r of filtered) {
      grupoMap.set(r.Estado_Grupo, (grupoMap.get(r.Estado_Grupo) ?? 0) + r.Cantidad);
    }
    return FUNNEL_ORDER.filter((g) => grupoMap.has(g)).map((g) => ({
      label: g,
      value: grupoMap.get(g)!,
      color: GRUPO_COLORS[g] ?? "#94a3b8",
    }));
  }, [filtered]);

  // Donut by estado label
  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Estado_Label, (map.get(r.Estado_Label) ?? 0) + r.Cantidad);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] ?? "#94a3b8",
      }));
  }, [filtered]);

  // Ranking promotores
  const rankingPromotores = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Promotor, (map.get(r.Promotor) ?? 0) + r.Cantidad);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        color: getEntityColor(nombre),
      }));
  }, [filtered]);

  // Table rows
  const tableRows = useMemo(
    () =>
      [...filtered].sort((a, b) =>
        b.Mes && a.Mes ? b.Mes.localeCompare(a.Mes) : 0
      ),
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
            title="Invitaciones totales"
            value={totalInv}
            icon={Mail}
            color="indigo"
          />
          <KpiCard
            title="Tasa de aprobación"
            value={`${tasaAprobacion}%`}
            subtitle={`${completadas} completadas`}
            icon={User}
            color="emerald"
          />
          <KpiCard
            title="Agencias Master"
            value={totalAgencias}
            icon={Building2}
            color="slate"
          />
          <KpiCard
            title="Promotores"
            value={totalPromotores}
            icon={Users}
            color="slate"
          />
        </div>

        {/* Evolutivo */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Evolutivo de Invitaciones por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EvolutivoChart
              data={evolutivoData}
              entities={estadosInData}
              height={340}
            />
          </CardContent>
        </Card>

        {/* Funnel + Donut */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Embudo de Conversión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ConversionFunnel stages={funnelData} />
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Distribución por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDonut data={statusData} height={280} />
            </CardContent>
          </Card>
        </div>

        {/* Ranking */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Top Promotores por Invitaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankingChart
              data={rankingPromotores}
              label="Top 10 por cantidad de invitaciones"
              height={260}
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
                { key: "Estado_Label", label: "Estado" },
                { key: "Estado_Grupo", label: "Grupo" },
                {
                  key: "Cantidad",
                  label: "Cantidad",
                  align: "right",
                  format: (v) => Number(v).toLocaleString("es-MX"),
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
