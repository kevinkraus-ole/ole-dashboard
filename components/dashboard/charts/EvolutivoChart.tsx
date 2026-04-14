"use client";

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
import { getEntityColor } from "@/lib/colors";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface EvolutivoChartProps {
  // Each entry: { mes: "2025-11-01", [entityName]: count, ... }
  data: Record<string, string | number>[];
  entities: string[]; // names to stack
  valueKey?: string; // only used for total line label
  height?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  const total = payload
    .filter((p: { dataKey: string }) => p.dataKey !== "__total__")
    .reduce((sum: number, p: { value: number }) => sum + (p.value ?? 0), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-slate-700 mb-2">
        {formatMes(label)}
      </p>
      {payload
        .filter((p: { dataKey: string }) => p.dataKey !== "__total__")
        .map((p: { dataKey: string; value: number; color: string }) => (
          <div key={p.dataKey} className="flex justify-between gap-4">
            <span className="flex items-center gap-1.5 text-slate-600 truncate max-w-[150px]">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ background: p.color }}
              />
              {p.dataKey}
            </span>
            <span className="font-medium tabular-nums">{p.value?.toLocaleString("es-MX")}</span>
          </div>
        ))}
      <div className="border-t border-slate-100 mt-2 pt-2 flex justify-between font-semibold">
        <span className="text-slate-700">Total</span>
        <span className="tabular-nums">{total.toLocaleString("es-MX")}</span>
      </div>
    </div>
  );
};

function formatMes(val: string) {
  try {
    return format(parseISO(val), "MMM yyyy", { locale: es });
  } catch {
    return val;
  }
}

export function EvolutivoChart({
  data,
  entities,
  height = 320,
}: EvolutivoChartProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm"
        style={{ height }}
      >
        Sin datos para mostrar
      </div>
    );
  }

  // compute totals per row for the line
  const enriched = data.map((row) => ({
    ...row,
    __total__: entities.reduce((s, e) => s + ((row[e] as number) ?? 0), 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={enriched} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="mes"
          tickFormatter={formatMes}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          formatter={(v) => (v === "__total__" ? "Total" : v)}
        />
        {entities.map((e) => (
          <Bar
            key={e}
            dataKey={e}
            stackId="stack"
            fill={getEntityColor(e)}
            radius={entities[entities.length - 1] === e ? [3, 3, 0, 0] : [0, 0, 0, 0]}
          />
        ))}
        <Line
          dataKey="__total__"
          name="Total"
          type="monotone"
          stroke="#1e293b"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
