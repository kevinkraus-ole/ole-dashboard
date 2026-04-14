"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { fmtNumber } from "@/lib/format";

interface StatusSlice { name: string; value: number; color: string; }
interface StatusDonutProps { data: StatusSlice[]; height?: number; }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tooltip_ = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as StatusSlice & { __total__: number };
  const pct = d.__total__ ? ((d.value / d.__total__) * 100).toFixed(1) : "0";
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <div className="flex items-center gap-1.5 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ background: d.color }} />
        <span className="font-semibold text-slate-700">{d.name}</span>
      </div>
      <p className="text-slate-500">
        <span className="font-semibold text-slate-800 tabular-nums">{fmtNumber(d.value)}</span>
        {" "}— {pct}%
      </p>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CenterLabel = ({ viewBox, total }: any) => {
  const { cx, cy } = viewBox ?? {};
  return (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-6" fontSize="22" fontWeight="700" fill="#0f172a">
        {fmtNumber(total)}
      </tspan>
      <tspan x={cx} dy="20" fontSize="11" fill="#94a3b8">
        total
      </tspan>
    </text>
  );
};

export function StatusDonut({ data, height = 260 }: StatusDonutProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height }}>
        Sin datos
      </div>
    );
  }
  const total = data.reduce((s, d) => s + d.value, 0);
  const enriched = data.map((d) => ({ ...d, __total__: total }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={enriched}
          cx="50%"
          cy="44%"
          innerRadius={58}
          outerRadius={85}
          dataKey="value"
          paddingAngle={2}
          labelLine={false}
        >
          {enriched.map((entry, i) => <Cell key={i} fill={entry.color} />)}
          <CenterLabel total={total} />
        </Pie>
        <Tooltip content={<Tooltip_ />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 10, color: "#64748b" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
