"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
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
    <div className="bg-white border border-slate-100 rounded-2xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1 max-w-[200px] break-words">{d.nombre}</p>
      <p className="text-slate-500">
        <span className="font-bold text-slate-800 tabular-nums">{fmtNumber(d.cantidad)}</span>
        {" "}registros
      </p>
    </div>
  );
};

export function RankingChart({ data, color = "#6366f1", height = 280, label, topN = 10 }: RankingChartProps) {
  const top = data.slice(0, topN);

  if (!top.length) {
    return (
      <div className="flex items-center justify-center text-slate-300 text-sm" style={{ height }}>
        Sin datos
      </div>
    );
  }

  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-4 font-medium">{label}</p>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 64, left: 0, bottom: 0 }} barCategoryGap="35%">
          <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" horizontal={false} />
          <XAxis
            type="number"
            domain={[0, "dataMax"]}
            tick={{ fontSize: 11, fill: "#94a3b8", fontFamily: "inherit" }}
            axisLine={{ stroke: "#e2e8f0" }}
            tickLine={false}
            tickFormatter={fmtNumber}
          />
          <YAxis
            type="category"
            dataKey="nombre"
            width={152}
            tick={{ fontSize: 11, fill: "#475569", fontFamily: "inherit" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: string) => v.length > 22 ? v.slice(0, 21) + "…" : v}
          />
          <Tooltip content={<Tooltip_ />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="cantidad" radius={[0, 6, 6, 0]} barSize={16} background={{ fill: "#f8fafc", radius: 6 }}>
            {top.map((entry, i) => (
              <Cell key={i} fill={entry.color ?? color} />
            ))}
            <LabelList
              dataKey="cantidad"
              position="right"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => fmtNumber(Number(v))}
              style={{ fontSize: 11, fill: "#64748b", fontWeight: 600, fontFamily: "inherit" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
