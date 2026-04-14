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

const accents: Record<string, { bar: string; icon: string; iconText: string }> = {
  indigo: { bar: "bg-indigo-500",  icon: "bg-indigo-50 text-indigo-600",  iconText: "text-indigo-600"  },
  emerald:{ bar: "bg-emerald-500", icon: "bg-emerald-50 text-emerald-600",iconText: "text-emerald-600" },
  amber:  { bar: "bg-amber-400",   icon: "bg-amber-50 text-amber-600",    iconText: "text-amber-600"   },
  rose:   { bar: "bg-rose-500",    icon: "bg-rose-50 text-rose-600",      iconText: "text-rose-600"    },
  slate:  { bar: "bg-slate-400",   icon: "bg-slate-100 text-slate-500",   iconText: "text-slate-500"   },
};

export function KpiCard({ title, value, subtitle, icon: Icon, color = "slate", className }: KpiCardProps) {
  const a = accents[color];

  return (
    <div className={cn(
      "relative bg-white rounded-xl border border-slate-200 overflow-hidden flex",
      className
    )}>
      {/* Left accent bar */}
      <div className={cn("w-1 shrink-0", a.bar)} />

      <div className="flex-1 px-5 py-4 flex items-start justify-between gap-3 min-w-0">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest leading-tight">
            {title}
          </p>
          <p className="text-[28px] font-bold text-slate-800 leading-tight mt-1 tabular-nums">
            {typeof value === "number" ? value.toLocaleString("es-MX") : value}
          </p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div className={cn("p-2 rounded-lg shrink-0 mt-0.5", a.icon)}>
            <Icon size={16} />
          </div>
        )}
      </div>
    </div>
  );
}
