"use client";

import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterState } from "@/lib/types";
import { RefreshCw, X, SlidersHorizontal } from "lucide-react";

interface FiltersBarProps {
  filters: FilterState;
  onFilterChange: (f: FilterState) => void;
  agencias: string[];
  promotores: string[];
  agentes: string[];
  lastUpdated?: string;
  isLoading?: boolean;
  onRefresh: () => void;
}

const ALL = "__ALL__";

function FilterSelect({
  label, value, options, disabled, onChange,
}: {
  label: string;
  value: string;
  options: string[];
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
        {label}
      </span>
      <Select value={value} onValueChange={(v) => onChange(v === ALL ? "" : (v ?? ""))} disabled={disabled}>
        <SelectTrigger className="h-8 w-52 text-sm bg-white border-slate-200 text-slate-700 focus:ring-indigo-500">
          <SelectValue placeholder="Todas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL} className="text-slate-500 italic">Todas</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function FiltersBar({
  filters, onFilterChange, agencias, promotores, agentes,
  lastUpdated, isLoading, onRefresh,
}: FiltersBarProps) {
  const set = (key: keyof FilterState, val: string | null) => {
    const next: FilterState = { ...filters, [key]: !val || val === ALL ? "" : val };
    if (key === "agenciaMaster") { next.promotor = ""; next.agente = ""; }
    if (key === "promotor") next.agente = "";
    onFilterChange(next);
  };

  const hasFilters = Boolean(filters.agenciaMaster || filters.promotor || filters.agente);
  const activeCount = [filters.agenciaMaster, filters.promotor, filters.agente].filter(Boolean).length;

  return (
    <div className="bg-white border-b border-slate-100 px-8 py-3.5 flex flex-wrap items-end gap-4">
      {/* Filter icon + label */}
      <div className="flex items-center gap-1.5 text-slate-400 self-end pb-1.5">
        <SlidersHorizontal size={13} />
        <span className="text-xs font-medium">Filtros</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold">
            {activeCount}
          </span>
        )}
      </div>

      <FilterSelect
        label="Agencia Master"
        value={filters.agenciaMaster}
        options={agencias}
        onChange={(v) => set("agenciaMaster", v)}
      />
      <FilterSelect
        label="Promotor"
        value={filters.promotor}
        options={promotores}
        disabled={!filters.agenciaMaster}
        onChange={(v) => set("promotor", v)}
      />
      <FilterSelect
        label="Agente"
        value={filters.agente}
        options={agentes}
        disabled={!filters.promotor}
        onChange={(v) => set("agente", v)}
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 self-end text-slate-400 hover:text-slate-600 px-2"
          onClick={() => onFilterChange({ agenciaMaster: "", promotor: "", agente: "" })}
        >
          <X size={13} className="mr-1" />
          Limpiar
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Timestamp + refresh */}
      <div className="flex items-end gap-3 self-end">
        {lastUpdated && (
          <span className="text-[11px] text-slate-400 pb-1.5">
            Act.{" "}
            {new Date(lastUpdated).toLocaleString("es-MX", {
              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
            })}
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 text-sm bg-white border-slate-200 text-slate-700 hover:bg-slate-50 font-medium"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={12} className={isLoading ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>
    </div>
  );
}
