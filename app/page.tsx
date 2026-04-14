"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CotizacionesTab } from "@/components/dashboard/CotizacionesTab";
import { InvitacionesTab } from "@/components/dashboard/InvitacionesTab";
import { PolizasTab } from "@/components/dashboard/PolizasTab";
import { FunnelesTab } from "@/components/dashboard/FunnelesTab";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CotizacionRow,
  InvitacionRow,
  PolizaRow,
  FilterState,
  ApiResponse,
} from "@/lib/types";
import type { AgenteFunnelRow, CotizacionFunnelRow } from "@/app/api/funneles/route";
import { FileText, Mail, ShieldCheck, AlertTriangle, GitMerge } from "lucide-react";

const EMPTY_FILTERS: FilterState = { agenciaMaster: "", promotor: "", agente: "" };

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-screen-2xl mx-auto w-full">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-white" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl bg-white" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-72 rounded-xl bg-white" />
        <Skeleton className="h-72 rounded-xl bg-white" />
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="mx-6 mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 max-w-screen-2xl">
      <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold text-red-800">Error al cargar datos</p>
        <p className="text-xs text-red-600 mt-1 font-mono break-all">{message}</p>
      </div>
    </div>
  );
}

async function fetchData<T>(endpoint: string): Promise<ApiResponse<T>> {
  const res = await fetch(endpoint, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export default function Home() {
  const [activeTab, setActiveTab] = useState("cotizaciones");

  const [cotData, setCotData] = useState<CotizacionRow[]>([]);
  const [cotUpdated, setCotUpdated] = useState<string>();
  const [cotLoading, setCotLoading] = useState(false);
  const [cotError, setCotError] = useState<string>();
  const [cotFilters, setCotFilters] = useState<FilterState>(EMPTY_FILTERS);

  const [invData, setInvData] = useState<InvitacionRow[]>([]);
  const [invUpdated, setInvUpdated] = useState<string>();
  const [invLoading, setInvLoading] = useState(false);
  const [invError, setInvError] = useState<string>();
  const [invFilters, setInvFilters] = useState<FilterState>(EMPTY_FILTERS);

  const [polData, setPolData] = useState<PolizaRow[]>([]);
  const [polUpdated, setPolUpdated] = useState<string>();
  const [polLoading, setPolLoading] = useState(false);
  const [polError, setPolError] = useState<string>();
  const [polFilters, setPolFilters] = useState<FilterState>(EMPTY_FILTERS);

  const [funAgentes, setFunAgentes] = useState<AgenteFunnelRow[]>([]);
  const [funCot, setFunCot] = useState<CotizacionFunnelRow[]>([]);
  const [funUpdated, setFunUpdated] = useState<string>();
  const [funLoading, setFunLoading] = useState(false);
  const [funError, setFunError] = useState<string>();

  const loadCotizaciones = useCallback(async () => {
    setCotLoading(true);
    setCotError(undefined);
    try {
      const res = await fetchData<CotizacionRow>("/api/cotizaciones");
      setCotData(res.data);
      setCotUpdated(res.lastUpdated);
      if (res.error) setCotError(res.error);
    } catch (e) { setCotError(String(e)); }
    finally { setCotLoading(false); }
  }, []);

  const loadInvitaciones = useCallback(async () => {
    setInvLoading(true);
    setInvError(undefined);
    try {
      const res = await fetchData<InvitacionRow>("/api/invitaciones");
      setInvData(res.data);
      setInvUpdated(res.lastUpdated);
      if (res.error) setInvError(res.error);
    } catch (e) { setInvError(String(e)); }
    finally { setInvLoading(false); }
  }, []);

  const loadPolizas = useCallback(async () => {
    setPolLoading(true);
    setPolError(undefined);
    try {
      const res = await fetchData<PolizaRow>("/api/polizas");
      setPolData(res.data);
      setPolUpdated(res.lastUpdated);
      if (res.error) setPolError(res.error);
    } catch (e) { setPolError(String(e)); }
    finally { setPolLoading(false); }
  }, []);

  const loadFunneles = useCallback(async () => {
    setFunLoading(true);
    setFunError(undefined);
    try {
      const res = await fetch("/api/funneles", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setFunAgentes(json.agentes ?? []);
      setFunCot(json.cotizaciones ?? []);
      setFunUpdated(json.lastUpdated);
      if (json.error) setFunError(json.error);
    } catch (e) { setFunError(String(e)); }
    finally { setFunLoading(false); }
  }, []);

  useEffect(() => {
    loadCotizaciones();
    loadInvitaciones();
    loadPolizas();
    loadFunneles();
  }, [loadCotizaciones, loadInvitaciones, loadPolizas, loadFunneles]);

  const tabs = [
    { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
    { id: "invitaciones", label: "Invitaciones", icon: Mail },
    { id: "polizas", label: "Pólizas", icon: ShieldCheck },
    { id: "funneles", label: "Funneles", icon: GitMerge },
  ];

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col flex-1"
    >
      {/* ── Tab strip ── */}
      <div className="bg-white border-b border-slate-200 px-6 shrink-0">
        <TabsList className="h-11 bg-transparent p-0 gap-0">
          {tabs.map(({ id, label, icon: Icon }) => (
            <TabsTrigger
              key={id}
              value={id}
              className="
                relative h-11 px-4 rounded-none bg-transparent
                text-sm font-medium text-slate-500
                border-b-2 border-transparent
                data-[state=active]:border-indigo-500
                data-[state=active]:text-indigo-600
                data-[state=active]:bg-transparent
                hover:text-slate-700
                transition-colors gap-2
              "
            >
              <Icon size={14} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {/* ── Content ── */}
      <TabsContent value="cotizaciones" className="flex-1 mt-0 focus-visible:outline-none">
        {cotError && <ErrorBanner message={cotError} />}
        {cotLoading && !cotData.length
          ? <LoadingSkeleton />
          : <CotizacionesTab data={cotData} filters={cotFilters} onFilterChange={setCotFilters}
              lastUpdated={cotUpdated} isLoading={cotLoading} onRefresh={loadCotizaciones} />}
      </TabsContent>

      <TabsContent value="invitaciones" className="flex-1 mt-0 focus-visible:outline-none">
        {invError && <ErrorBanner message={invError} />}
        {invLoading && !invData.length
          ? <LoadingSkeleton />
          : <InvitacionesTab data={invData} filters={invFilters} onFilterChange={setInvFilters}
              lastUpdated={invUpdated} isLoading={invLoading} onRefresh={loadInvitaciones} />}
      </TabsContent>

      <TabsContent value="polizas" className="flex-1 mt-0 focus-visible:outline-none">
        {polError && <ErrorBanner message={polError} />}
        {polLoading && !polData.length
          ? <LoadingSkeleton />
          : <PolizasTab data={polData} filters={polFilters} onFilterChange={setPolFilters}
              lastUpdated={polUpdated} isLoading={polLoading} onRefresh={loadPolizas} />}
      </TabsContent>

      <TabsContent value="funneles" className="flex-1 mt-0 focus-visible:outline-none">
        {funError && <ErrorBanner message={funError} />}
        {funLoading && !funAgentes.length
          ? <LoadingSkeleton />
          : <FunnelesTab agentes={funAgentes} cotizaciones={funCot}
              lastUpdated={funUpdated} isLoading={funLoading} onRefresh={loadFunneles} />}
      </TabsContent>
    </Tabs>
  );
}
