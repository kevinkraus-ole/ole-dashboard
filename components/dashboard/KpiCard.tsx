"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  color?: "default" | "green" | "blue" | "amber" | "red";
  className?: string;
}

const colorMap = {
  default: "text-slate-700",
  green: "text-green-600",
  blue: "text-blue-600",
  amber: "text-amber-600",
  red: "text-red-600",
};

const iconBgMap = {
  default: "bg-slate-100 text-slate-600",
  green: "bg-green-50 text-green-600",
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  red: "bg-red-50 text-red-600",
};

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "default",
  className,
}: KpiCardProps) {
  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
              {title}
            </p>
            <p className={cn("text-3xl font-bold mt-1", colorMap[color])}>
              {typeof value === "number" ? value.toLocaleString("es-MX") : value}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 mt-2">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.value >= 0 ? "text-green-600" : "text-red-500"
                  )}
                >
                  {trend.value >= 0 ? "+" : ""}
                  {trend.value.toFixed(1)}%
                </span>
                <span className="text-xs text-slate-400">{trend.label}</span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={cn("p-2.5 rounded-lg ml-3 shrink-0", iconBgMap[color])}>
              <Icon size={18} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
