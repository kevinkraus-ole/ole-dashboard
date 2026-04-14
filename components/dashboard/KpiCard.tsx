"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: "indigo" | "emerald" | "amber" | "rose" | "slate";
  className?: string;
}

const accents: Record<string, { icon: string }> = {
  indigo:  { icon: "bg-indigo-50 text-indigo-600"   },
  emerald: { icon: "bg-emerald-50 text-emerald-600" },
  amber:   { icon: "bg-amber-50 text-amber-600"     },
  rose:    { icon: "bg-rose-50 text-rose-600"       },
  slate:   { icon: "bg-slate-100 text-slate-500"    },
};

export function KpiCard({ title, value, subtitle, icon: Icon, color = "slate", className }: KpiCardProps) {
  const a = accents[color];

  return (
    <div className={cn(
      "bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-3",
      "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.03)]",
      className
    )}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest leading-tight">
          {title}
        </p>
        {Icon && (
          <div className={cn("p-2.5 rounded-xl shrink-0", a.icon)}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <div>
        <p className="text-[30px] font-bold text-slate-900 leading-none tabular-nums">
          {typeof value === "number" ? value.toLocaleString("es-MX") : value}
        </p>
        {subtitle && (
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
