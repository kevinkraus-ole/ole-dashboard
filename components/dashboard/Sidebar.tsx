"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type Region = "mx" | "br" | "intl";

interface SidebarProps {
  activeRegion: Region;
  onRegionChange: (r: Region) => void;
  collapsed: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: Region;
  label: string;
  sublabel: string;
  flag: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: "mx",   label: "Onshore México", sublabel: "Asesores · Cotizaciones · Pólizas", flag: "🇲🇽" },
  { id: "br",   label: "Onshore Brasil", sublabel: "Cotizaciones · Pólizas",            flag: "🇧🇷" },
  { id: "intl", label: "Internacional",  sublabel: "Offshore · 7 niveles",               flag: "🌎" },
];

export function Sidebar({ activeRegion, onRegionChange, collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "shrink-0 bg-white border-r border-slate-100 flex flex-col py-4 transition-all duration-200 relative",
        collapsed ? "w-14" : "w-52"
      )}
    >
      {/* Section label */}
      {!collapsed && (
        <p className="px-4 pb-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Mercados
        </p>
      )}

      {/* Nav items */}
      <div className="flex flex-col gap-1 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeRegion === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onRegionChange(item.id)}
              title={collapsed ? item.label : undefined}
              className={cn(
                "w-full flex items-center gap-3 px-2 py-2.5 rounded-xl text-left transition-all duration-150",
                "hover:bg-slate-50",
                isActive ? "bg-indigo-50 hover:bg-indigo-50" : "bg-transparent",
                collapsed && "justify-center px-0"
              )}
            >
              <span className="text-xl leading-none shrink-0">{item.flag}</span>
              {!collapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className={cn(
                    "text-[13px] font-semibold leading-tight truncate",
                    isActive ? "text-indigo-700" : "text-slate-700"
                  )}>
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                    {item.sublabel}
                  </span>
                </div>
              )}
              {!collapsed && isActive && (
                <div className="shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 pt-3 border-t border-slate-100">
          <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest">
            olelifetech · gold_zone
          </p>
        </div>
      )}

      {/* Collapse toggle button */}
      <button
        onClick={onToggle}
        className={cn(
          "absolute -right-3 top-6 z-20",
          "w-6 h-6 rounded-full bg-white border border-slate-200 shadow-sm",
          "flex items-center justify-center text-slate-400",
          "hover:text-slate-600 hover:border-slate-300 transition-colors"
        )}
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
