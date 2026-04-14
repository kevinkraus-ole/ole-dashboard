"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface StatusSlice {
  name: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: StatusSlice[];
  height?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as StatusSlice;
  const total = payload[0].payload.__total__ as number;
  const pct = total ? ((d.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-slate-700">{d.name}</p>
      <p className="text-slate-500 mt-0.5">
        {d.value.toLocaleString("es-MX")} ({pct}%)
      </p>
    </div>
  );
};

export function StatusDonut({ data, height = 260 }: StatusDonutProps) {
  if (!data.length) {
    return (
      <div
        className="flex items-center justify-center text-slate-400 text-sm"
        style={{ height }}
      >
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
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          dataKey="value"
          paddingAngle={2}
        >
          {enriched.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
