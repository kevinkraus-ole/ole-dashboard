"use client";

import { Globe, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type Region = "mx" | "br" | "intl";

interface SidebarProps {
  activeRegion: Region;
  onRegionChange: (r: Region) => void;
}

interface NavItem {
  id: Region;
  label: string;
  sublabel: string;
  flag: string;
  icon?: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: "mx",
    label: "Onshore México",
    sublabel: "Asesores · Cotizaciones · Pólizas",
    flag: "🇲🇽",
  },
  {
    id: "br",
    label: "Onshore Brasil",
    sublabel: "Cotizaciones · Pólizas",
    flag: "🇧🇷",
  },
  {
    id: "intl",
    label: "Internacional",
    sublabel: "Offshore · 7 niveles",
    flag: "🌎",
  },
];

const SECTION_LABELS: Partial<Record<Region, string>> = {
  mx: "Onshore",
  br: "Onshore",
  intl: "Offshore",
};

export function Sidebar({ activeRegion, onRegionChange }: SidebarProps) {
  return (
    <aside className="w-52 shrink-0 bg-white border-r border-slate-100 flex flex-col py-4 gap-1">
      <p className="px-4 pb-2 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
        Mercados
      </p>

      {NAV_ITEMS.map((item) => {
        const isActive = activeRegion === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onRegionChange(item.id)}
            className={cn(
              "w-full flex items-start gap-3 px-3 py-2.5 rounded-xl mx-1 text-left transition-all duration-150",
              "hover:bg-slate-50",
              isActive
                ? "bg-indigo-50 hover:bg-indigo-50"
                : "bg-transparent"
            )}
            style={{ width: "calc(100% - 8px)" }}
          >
            <span className="text-xl leading-none mt-0.5">{item.flag}</span>
            <div className="flex flex-col min-w-0">
              <span
                className={cn(
                  "text-[13px] font-semibold leading-tight truncate",
                  isActive ? "text-indigo-700" : "text-slate-700"
                )}
              >
                {item.label}
              </span>
              <span className="text-[10px] text-slate-400 leading-tight mt-0.5 truncate">
                {item.sublabel}
              </span>
            </div>
            {isActive && (
              <div className="ml-auto shrink-0 w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5" />
            )}
          </button>
        );
      })}

      <div className="flex-1" />

      <div className="px-4 pt-3 border-t border-slate-100">
        <p className="text-[9px] font-medium text-slate-300 uppercase tracking-widest">
          olelifetech · gold_zone
        </p>
      </div>
    </aside>
  );
}
