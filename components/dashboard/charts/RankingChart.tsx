"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface RankingEntry {
  nombre: string;
  cantidad: number;
  color?: string;
}

interface RankingChartProps {
  data: RankingEntry[];
  color?: string;
  height?: number;
  label?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as RankingEntry;
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-slate-700">{d.nombre}</p>
      <p className="text-slate-500 mt-0.5">
        {d.cantidad.toLocaleString("es-MX")} registros
      </p>
    </div>
  );
};

export function RankingChart({
  data,
  color = "#6366f1",
  height = 280,
  label = "Top 10",
}: RankingChartProps) {
  const top = data.slice(0, 10);

  if (!top.length) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm"
        style={{ height }}
      >
        Sin datos
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs text-slate-400 mb-3">{label}</p>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={top}
          layout="vertical"
          margin={{ top: 0, right: 32, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={140}
            tick={{ fontSize: 11, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={16}>
            {top.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
