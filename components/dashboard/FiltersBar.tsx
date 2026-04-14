"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FilterState } from "@/lib/types";
import { RefreshCw, X } from "lucide-react";

interface FiltersBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  agencias: string[];
  promotores: string[];
  agentes: string[];
  lastUpdated?: string;
  isLoading?: boolean;
  onRefresh: () => void;
}

const ALL = "__ALL__";

export function FiltersBar({
  filters,
  onFilterChange,
  agencias,
  promotores,
  agentes,
  lastUpdated,
  isLoading,
  onRefresh,
}: FiltersBarProps) {
  const set = (key: keyof FilterState, val: string | null) => {
    const next: FilterState = { ...filters, [key]: !val || val === ALL ? "" : val };
    // cascade reset
    if (key === "agenciaMaster") next.promotor = "";
    if (key === "promotor") next.agente = "";
    onFilterChange(next);
  };

  const hasFilters = filters.agenciaMaster || filters.promotor || filters.agente;

  return (
    <div className="flex flex-wrap items-center gap-3 py-3 px-4 bg-white border-b border-slate-100">
      {/* Agencia Master */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
          Agencia Master
        </span>
        <Select
          value={filters.agenciaMaster || ALL}
          onValueChange={(v) => set("agenciaMaster", v)}
        >
          <SelectTrigger className="h-8 w-52 text-sm">
            <SelectValue placeholder="Todas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todas</SelectItem>
            {agencias.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Promotor */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
          Promotor
        </span>
        <Select
          value={filters.promotor || ALL}
          onValueChange={(v) => set("promotor", v)}
          disabled={!filters.agenciaMaster}
        >
          <SelectTrigger className="h-8 w-52 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {promotores.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Agente */}
      <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">
          Agente
        </span>
        <Select
          value={filters.agente || ALL}
          onValueChange={(v) => set("agente", v)}
          disabled={!filters.promotor}
        >
          <SelectTrigger className="h-8 w-48 text-sm">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Todos</SelectItem>
            {agentes.map((a) => (
              <SelectItem key={a} value={a}>
                {a}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 mt-4 text-slate-500"
          onClick={() => onFilterChange({ agenciaMaster: "", promotor: "", agente: "" })}
        >
          <X size={13} className="mr-1" />
          Limpiar
        </Button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Last updated + Refresh */}
      <div className="flex items-center gap-3 mt-3 sm:mt-0">
        {lastUpdated && (
          <span className="text-[11px] text-slate-400">
            Actualizado:{" "}
            {new Date(lastUpdated).toLocaleString("es-MX", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          Actualizar
        </Button>
      </div>
    </div>
  );
}
