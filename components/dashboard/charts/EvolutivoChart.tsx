"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getEntityColor } from "@/lib/colors";
import { fmtNumber } from "@/lib/format";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

interface EvolutivoChartProps {
  data: Record<string, string | number>[];
  entities: string[];
  height?: number;
}

function fmtMes(val: string) {
  try { return format(parseISO(val), "MMM yy", { locale: es }); }
  catch { return val; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tooltip_ = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const bars = payload.filter((p: { dataKey: string }) => p.dataKey !== "__total__");
  const total = bars.reduce((s: number, p: { value: number }) => s + (p.value ?? 0), 0);
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3.5 text-xs min-w-[180px]">
      <p className="font-semibold text-slate-700 mb-2 capitalize">{fmtMes(label)}</p>
      <div className="space-y-1.5">
        {bars.map((p: { dataKey: string; value: number; color: string }) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-1.5 text-slate-500 truncate max-w-[130px]">
              <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color }} />
              <span className="truncate">{p.dataKey}</span>
            </span>
            <span className="font-semibold text-slate-800 tabular-nums">{fmtNumber(p.value)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 mt-2.5 pt-2 flex justify-between font-semibold">
        <span className="text-slate-600">Total</span>
        <span className="text-slate-800 tabular-nums">{fmtNumber(total)}</span>
      </div>
    </div>
  );
};

export function EvolutivoChart({ data, entities, height = 320 }: EvolutivoChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height }}>
        Sin datos para mostrar
      </div>
    );
  }

  const enriched = data.map((row) => ({
    ...row,
    __total__: entities.reduce((s, e) => s + ((row[e] as number) ?? 0), 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={enriched} margin={{ top: 8, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="mes"
          tickFormatter={fmtMes}
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={{ stroke: "#e2e8f0" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={fmtNumber}
        />
        <Tooltip content={<Tooltip_ />} cursor={{ fill: "#f8fafc" }} />
        <Legend
          iconType="square"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 16, color: "#64748b" }}
          formatter={(v) => (v === "__total__" ? "Total" : v)}
        />
        {entities.map((e, i) => (
          <Bar
            key={e}
            dataKey={e}
            stackId="s"
            fill={getEntityColor(e)}
            radius={i === entities.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
            maxBarSize={52}
          />
        ))}
        <Line
          dataKey="__total__"
          name="Total"
          type="monotone"
          stroke="#0f172a"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: "#0f172a" }}
          legendType="line"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
