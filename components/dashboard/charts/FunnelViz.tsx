"use client";

import { cn } from "@/lib/utils";
import { fmtNumber } from "@/lib/format";

export interface FunnelStage {
  label: string;
  sublabel?: string;
  value: number;
  color: string;
  step: number;
}

interface FunnelVizProps {
  title: string;
  stages: FunnelStage[];
  accentColor?: string;
}

export function FunnelViz({ title, stages }: FunnelVizProps) {
  const top = stages[0]?.value || 1;

  return (
    <div className="space-y-1">
      <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>

      {/* Column headers */}
      <div className="grid grid-cols-[auto_1fr_64px_64px] gap-x-4 items-center mb-1">
        <div className="w-6" />
        <div />
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">vs total</p>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">vs ant.</p>
      </div>

      {stages.map((stage, i) => {
        const pctOfTop  = top > 0 ? (stage.value / top) * 100 : 0;
        const pctOfPrev = i > 0 && stages[i - 1].value > 0
          ? (stage.value / stages[i - 1].value) * 100
          : null;

        return (
          <div key={stage.label} className="grid grid-cols-[auto_1fr_64px_64px] gap-x-4 items-center">
            {/* Step badge */}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: stage.color }}
            >
              {stage.step}
            </div>

            {/* Bar + label */}
            <div className="flex flex-col gap-1">
              <div className="relative h-8 bg-slate-100 rounded-md overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-md flex items-center pl-3 transition-all duration-500"
                  style={{ width: `${Math.max(pctOfTop, 2)}%`, background: stage.color, opacity: 0.85 }}
                >
                  <span className="text-white text-xs font-bold tabular-nums drop-shadow-sm">
                    {fmtNumber(stage.value)}
                  </span>
                </div>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-medium text-slate-600">{stage.label}</span>
                {stage.sublabel && (
                  <span className="text-[10px] text-slate-400 italic">{stage.sublabel}</span>
                )}
              </div>
            </div>

            {/* % vs total */}
            <p className={cn(
              "text-xs font-semibold tabular-nums text-right",
              pctOfTop > 50 ? "text-emerald-600" : pctOfTop > 20 ? "text-amber-600" : "text-red-500"
            )}>
              {pctOfTop.toFixed(1)}%
            </p>

            {/* % vs anterior */}
            <p className={cn(
              "text-xs tabular-nums text-right",
              pctOfPrev === null ? "text-slate-300" :
              pctOfPrev > 60 ? "text-emerald-600" : pctOfPrev > 30 ? "text-amber-600" : "text-red-500"
            )}>
              {pctOfPrev !== null ? `${pctOfPrev.toFixed(1)}%` : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
