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
}

export function FunnelViz({ title, stages }: FunnelVizProps) {
  const top = stages[0]?.value || 1;

  return (
    <div className="space-y-1">
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-5">{title}</h3>}

      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_72px_80px_80px] gap-x-3 items-center mb-2 px-1">
        <div />
        <div />
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Total</p>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">% del paso 1</p>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest text-right">Conversión</p>
      </div>

      {stages.map((stage, i) => {
        const pctOfTop  = top > 0 ? (stage.value / top) * 100 : 0;
        const pctOfPrev = i > 0 && stages[i - 1].value > 0
          ? (stage.value / stages[i - 1].value) * 100
          : null;

        return (
          <div key={stage.label} className="grid grid-cols-[28px_1fr_72px_80px_80px] gap-x-3 items-center py-1.5">
            {/* Step badge */}
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
              style={{ background: stage.color }}
            >
              {stage.step}
            </div>

            {/* Bar track + label below */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all duration-700"
                  style={{ width: `${Math.max(pctOfTop, 1.5)}%`, background: stage.color, opacity: 0.8 }}
                />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-[11px] font-semibold text-slate-700 truncate">{stage.label}</span>
                {stage.sublabel && (
                  <span className="text-[10px] text-slate-400 italic truncate">{stage.sublabel}</span>
                )}
              </div>
            </div>

            {/* Absolute count — always visible */}
            <p className="text-sm font-bold tabular-nums text-slate-800 text-right">
              {fmtNumber(stage.value)}
            </p>

            {/* % vs step 1 */}
            <p className={cn(
              "text-xs font-semibold tabular-nums text-right",
              i === 0 ? "text-slate-400" :
              pctOfTop > 50 ? "text-emerald-600" : pctOfTop > 20 ? "text-amber-600" : "text-rose-500"
            )}>
              {i === 0 ? "—" : `${pctOfTop.toFixed(1)}%`}
            </p>

            {/* Conversion from previous step */}
            <p className={cn(
              "text-xs font-medium tabular-nums text-right",
              pctOfPrev === null ? "text-slate-300" :
              pctOfPrev > 60 ? "text-emerald-600" : pctOfPrev > 30 ? "text-amber-600" : "text-rose-500"
            )}>
              {pctOfPrev !== null ? `${pctOfPrev.toFixed(1)}%` : "—"}
            </p>
          </div>
        );
      })}
    </div>
  );
}
