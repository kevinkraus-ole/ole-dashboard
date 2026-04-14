"use client";

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface ConversionFunnelProps {
  stages: FunnelStage[];
}

export function ConversionFunnel({ stages }: ConversionFunnelProps) {
  const max = stages[0]?.value || 1;

  return (
    <div className="space-y-2.5">
      {stages.map((stage, i) => {
        const pct = Math.round((stage.value / max) * 100);
        const conv =
          i > 0
            ? ((stage.value / stages[i - 1].value) * 100).toFixed(1)
            : null;

        return (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: stage.color }}
                />
                <span className="text-sm text-slate-700">{stage.label}</span>
                {conv && (
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                    {conv}% del anterior
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold tabular-nums text-slate-800">
                {stage.value.toLocaleString("es-MX")}
              </span>
            </div>
            <div className="h-6 bg-slate-100 rounded-md overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${pct}%`,
                  background: stage.color,
                  opacity: 0.85,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
