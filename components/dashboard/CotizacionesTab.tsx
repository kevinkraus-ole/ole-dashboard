"use client";

import { useMemo } from "react";
import { CotizacionRow, FilterState } from "@/lib/types";
import { KpiCard } from "./KpiCard";
import { EvolutivoChart } from "./charts/EvolutivoChart";
import { RankingChart } from "./charts/RankingChart";
import { StatusDonut } from "./charts/StatusDonut";
import { DataTable } from "./DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FiltersBar } from "./FiltersBar";
import { getEntityColor, STATUS_COLORS, buildColorMap } from "@/lib/colors";
import { FileText, Building2, Users, User } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface CotizacionesTabProps {
  data: CotizacionRow[];
  filters: FilterState;
  onFilterChange: (f: FilterState) => void;
  lastUpdated?: string;
  isLoading: boolean;
  onRefresh: () => void;
}

function applyFilters(rows: CotizacionRow[], f: FilterState) {
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

export function CotizacionesTab({
  data,
  filters,
  onFilterChange,
  lastUpdated,
  isLoading,
  onRefresh,
}: CotizacionesTabProps) {
  const filtered = useMemo(() => applyFilters(data, filters), [data, filters]);

  // Cascading filter options
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
  const totalCotizaciones = useMemo(
    () => filtered.reduce((s, r) => s + r.Cantidad_Cotizaciones, 0),
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

  // Evolutivo by Agencia
  const evolutivoData = useMemo(() => {
    const mesMap = new Map<string, Record<string, number>>();
    for (const r of filtered) {
      if (!r.Mes) continue;
      if (!mesMap.has(r.Mes)) mesMap.set(r.Mes, {});
      const m = mesMap.get(r.Mes)!;
      m[r.Agencia_Master] = (m[r.Agencia_Master] ?? 0) + r.Cantidad_Cotizaciones;
    }
    return [...mesMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, counts]) => ({ mes, ...counts }));
  }, [filtered]);

  const agenciasInData = useMemo(
    () => [...new Set(filtered.map((r) => r.Agencia_Master))],
    [filtered]
  );

  const agencyColorMap = useMemo(
    () => buildColorMap([...new Set(data.map((r) => r.Agencia_Master))]),
    [data]
  );

  // Status donut
  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Estado, (map.get(r.Estado) ?? 0) + r.Cantidad_Cotizaciones);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] ?? "#94a3b8",
      }));
  }, [filtered]);

  // Ranking agentes
  const rankingAgentes = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Agente, (map.get(r.Agente) ?? 0) + r.Cantidad_Cotizaciones);
    }
    return [...map.entries()]
      .sort(([, a], [, b]) => b - a)
      .map(([nombre, cantidad]) => ({
        nombre,
        cantidad,
        color: "#6366f1",
      }));
  }, [filtered]);

  // Ranking promotores
  const rankingPromotores = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of filtered) {
      map.set(r.Promotor, (map.get(r.Promotor) ?? 0) + r.Cantidad_Cotizaciones);
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
  const tableRows = useMemo(() => {
    const map = new Map<string, CotizacionRow & { key: string }>();
    for (const r of filtered) {
      const key = `${r.Mes}|${r.Agencia_Master}|${r.Promotor}|${r.Agente}|${r.Estado}`;
      if (map.has(key)) {
        map.get(key)!.Cantidad_Cotizaciones += r.Cantidad_Cotizaciones;
      } else {
        map.set(key, { ...r, key });
      }
    }
    return [...map.values()].sort((a, b) => b.Mes.localeCompare(a.Mes));
  }, [filtered]);

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

      <div className="p-8 space-y-8 max-w-screen-2xl mx-auto">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <KpiCard
            title="Cotizaciones totales"
            value={totalCotizaciones}
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
            title="Promotores"
            value={totalPromotores}
            icon={Users}
            color="slate"
          />
          <KpiCard
            title="Agentes activos"
            value={totalAgentes}
            icon={User}
            color="slate"
          />
        </div>

        {/* Evolutivo principal */}
        <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Evolutivo de Cotizaciones por Agencia Master
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EvolutivoChart
              data={evolutivoData}
              entities={agenciasInData}
              height={340}
              colorMap={agencyColorMap}
            />
          </CardContent>
        </Card>

        {/* Status + Ranking promotores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Distribución por Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusDonut data={statusData} height={280} />
            </CardContent>
          </Card>

          <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-slate-800">
                Top Promotores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RankingChart
                data={rankingPromotores}
                label="Por cantidad de cotizaciones"
                height={280}
              />
            </CardContent>
          </Card>
        </div>

        {/* Ranking agentes */}
        <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-slate-800">
              Top Agentes por Cotizaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RankingChart
              data={rankingAgentes}
              label="Top 10 agentes"
              color="#6366f1"
              height={260}
            />
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)] rounded-2xl">
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
                { key: "Estado", label: "Estado" },
                {
                  key: "Cantidad_Cotizaciones",
                  label: "Cotizaciones",
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
