"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { fmtNumber } from "@/lib/format";

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
  topN?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tooltip_ = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as RankingEntry;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1 max-w-[200px] break-words">{d.nombre}</p>
      <p className="text-slate-500">
        <span className="font-semibold text-slate-800 tabular-nums">{fmtNumber(d.cantidad)}</span>
        {" "}registros
      </p>
    </div>
  );
};

export function RankingChart({ data, color = "#6366f1", height = 280, label, topN = 10 }: RankingChartProps) {
  const top = data.slice(0, topN);
  const max = top[0]?.cantidad || 1;

  if (!top.length) {
    return (
      <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height }}>
        Sin datos
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-3 font-medium">{label}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, max * 1.1]}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            tickFormatter={fmtNumber}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={148}
            tick={{ fontSize: 11, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => v.length > 20 ? v.slice(0, 19) + "…" : v}
          />
          <Tooltip content={<Tooltip_ />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={14} background={{ fill: "#f8fafc", radius: 4 }}>
            {top.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
