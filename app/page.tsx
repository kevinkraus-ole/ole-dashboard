"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CotizacionesTab } from "@/components/dashboard/CotizacionesTab";
import { InvitacionesTab } from "@/components/dashboard/InvitacionesTab";
import { PolizasTab } from "@/components/dashboard/PolizasTab";
import { FunnelesTab } from "@/components/dashboard/FunnelesTab";
import { InternacionalTab } from "@/components/dashboard/InternacionalTab";
import { Sidebar, type Region } from "@/components/dashboard/Sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CotizacionRow,
  InvitacionRow,
  PolizaRow,
  FilterState,
  ApiResponse,
  IntlCotizacionRow,
  IntlFunnelRow,
} from "@/lib/types";
import type { AgenteFunnelRow, CotizacionFunnelRow } from "@/app/api/funneles/route";
import type { IntlAgenciaRow, IntlComisionRow } from "@/app/api/intl/funneles/route";
import { FileText, Mail, ShieldCheck, AlertTriangle, GitMerge } from "lucide-react";
import { cacheGet, cacheSet } from "@/lib/cache";

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

// ─── Tab strip shared component ───────────────────────────────────────────────
interface TabDef { id: string; label: string; icon: React.ElementType }

function TabStrip({ tabs, activeTab, onTabChange }: {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (t: string) => void;
}) {
  return (
    <div className="bg-[#f7f8fa] border-b border-slate-200 px-8 shrink-0">
      <TabsList className="h-auto bg-transparent p-0 gap-1 items-end pt-2.5">
        {tabs.map(({ id, label, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className="
              relative h-10 px-5 rounded-t-xl
              bg-slate-200/60 border border-slate-200 border-b-0
              text-sm font-medium text-slate-400
              -mb-px
              data-[state=active]:bg-white
              data-[state=active]:text-slate-800
              data-[state=active]:font-semibold
              data-[state=active]:border-slate-200
              data-[state=active]:shadow-[0_-2px_8px_rgba(0,0,0,0.05)]
              hover:text-slate-600 hover:bg-slate-100
              transition-all duration-150
              gap-2
            "
          >
            <Icon size={14} />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}

// ─── MX Content ───────────────────────────────────────────────────────────────
function MxContent() {
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

  const loadCotizaciones = useCallback(async (force = false) => {
    setCotLoading(true); setCotError(undefined);
    try {
      if (!force) {
        const c = cacheGet<ApiResponse<CotizacionRow>>("mx:cotizaciones");
        if (c) { setCotData(c.data); setCotUpdated(c.lastUpdated); if (c.error) setCotError(c.error); setCotLoading(false); return; }
      }
      const res = await fetchData<CotizacionRow>("/api/cotizaciones");
      cacheSet("mx:cotizaciones", res);
      setCotData(res.data); setCotUpdated(res.lastUpdated); if (res.error) setCotError(res.error);
    } catch (e) { setCotError(String(e)); }
    finally { setCotLoading(false); }
  }, []);

  const loadInvitaciones = useCallback(async (force = false) => {
    setInvLoading(true); setInvError(undefined);
    try {
      if (!force) {
        const c = cacheGet<ApiResponse<InvitacionRow>>("mx:invitaciones");
        if (c) { setInvData(c.data); setInvUpdated(c.lastUpdated); if (c.error) setInvError(c.error); setInvLoading(false); return; }
      }
      const res = await fetchData<InvitacionRow>("/api/invitaciones");
      cacheSet("mx:invitaciones", res);
      setInvData(res.data); setInvUpdated(res.lastUpdated); if (res.error) setInvError(res.error);
    } catch (e) { setInvError(String(e)); }
    finally { setInvLoading(false); }
  }, []);

  const loadPolizas = useCallback(async (force = false) => {
    setPolLoading(true); setPolError(undefined);
    try {
      if (!force) {
        const c = cacheGet<ApiResponse<PolizaRow>>("mx:polizas");
        if (c) { setPolData(c.data); setPolUpdated(c.lastUpdated); if (c.error) setPolError(c.error); setPolLoading(false); return; }
      }
      const res = await fetchData<PolizaRow>("/api/polizas");
      cacheSet("mx:polizas", res);
      setPolData(res.data); setPolUpdated(res.lastUpdated); if (res.error) setPolError(res.error);
    } catch (e) { setPolError(String(e)); }
    finally { setPolLoading(false); }
  }, []);

  const loadFunneles = useCallback(async (force = false) => {
    setFunLoading(true); setFunError(undefined);
    try {
      if (!force) {
        const c = cacheGet<{ agentes: AgenteFunnelRow[]; cotizaciones: CotizacionFunnelRow[]; lastUpdated: string; error?: string }>("mx:funneles");
        if (c) { setFunAgentes(c.agentes ?? []); setFunCot(c.cotizaciones ?? []); setFunUpdated(c.lastUpdated); if (c.error) setFunError(c.error); setFunLoading(false); return; }
      }
      const res = await fetch("/api/funneles", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      cacheSet("mx:funneles", json);
      setFunAgentes(json.agentes ?? []); setFunCot(json.cotizaciones ?? []); setFunUpdated(json.lastUpdated); if (json.error) setFunError(json.error);
    } catch (e) { setFunError(String(e)); }
    finally { setFunLoading(false); }
  }, []);

  useEffect(() => {
    loadCotizaciones(); loadInvitaciones(); loadPolizas(); loadFunneles();
  }, [loadCotizaciones, loadInvitaciones, loadPolizas, loadFunneles]);

  const tabs: TabDef[] = [
    { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
    { id: "invitaciones", label: "Invitaciones", icon: Mail },
    { id: "polizas", label: "Pólizas", icon: ShieldCheck },
    { id: "funneles", label: "Funneles", icon: GitMerge },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
      <TabStrip tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <TabsContent value="cotizaciones" className="flex-1 mt-0 focus-visible:outline-none bg-white">
        {cotError && <ErrorBanner message={cotError} />}
        {cotLoading && !cotData.length ? <LoadingSkeleton /> :
          <CotizacionesTab data={cotData} filters={cotFilters} onFilterChange={setCotFilters}
            lastUpdated={cotUpdated} isLoading={cotLoading} onRefresh={() => loadCotizaciones(true)} />}
      </TabsContent>
      <TabsContent value="invitaciones" className="flex-1 mt-0 focus-visible:outline-none bg-white">
        {invError && <ErrorBanner message={invError} />}
        {invLoading && !invData.length ? <LoadingSkeleton /> :
          <InvitacionesTab data={invData} filters={invFilters} onFilterChange={setInvFilters}
            lastUpdated={invUpdated} isLoading={invLoading} onRefresh={() => loadInvitaciones(true)} />}
      </TabsContent>
      <TabsContent value="polizas" className="flex-1 mt-0 focus-visible:outline-none bg-white">
        {polError && <ErrorBanner message={polError} />}
        {polLoading && !polData.length ? <LoadingSkeleton /> :
          <PolizasTab data={polData} filters={polFilters} onFilterChange={setPolFilters}
            lastUpdated={polUpdated} isLoading={polLoading} onRefresh={() => loadPolizas(true)} />}
      </TabsContent>
      <TabsContent value="funneles" className="flex-1 mt-0 focus-visible:outline-none bg-white">
        {funError && <ErrorBanner message={funError} />}
        {funLoading && !funAgentes.length ? <LoadingSkeleton /> :
          <FunnelesTab agentes={funAgentes} cotizaciones={funCot}
            lastUpdated={funUpdated} isLoading={funLoading} onRefresh={() => loadFunneles(true)} />}
      </TabsContent>
    </Tabs>
  );
}

// ─── Brasil Content ───────────────────────────────────────────────────────────
function BrContent() {
  const [activeTab, setActiveTab] = useState("cotizaciones");
  const [cotData, setCotData] = useState<CotizacionRow[]>([]);
  const [cotUpdated, setCotUpdated] = useState<string>();
  const [cotLoading, setCotLoading] = useState(false);
  const [cotError, setCotError] = useState<string>();
  const [cotFilters, setCotFilters] = useState<FilterState>(EMPTY_FILTERS);

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

  const loadCotizaciones = useCallback(async (force = false) => {
    setCotLoading(true); setCotError(undefined);
    try {
      if (!force) {
        const c = cacheGet<ApiResponse<CotizacionRow>>("br:cotizaciones");
        if (c) { setCotData(c.data); setCotUpdated(c.lastUpdated); if (c.error) setCotError(c.error); setCotLoading(false); return; }
      }
      const res = await fetchData<CotizacionRow>("/api/br/cotizaciones");
      cacheSet("br:cotizaciones", res);
      setCotData(res.data); setCotUpdated(res.lastUpdated); if (res.error) setCotError(res.error);
    } catch (e) { setCotError(String(e)); }
    finally { setCotLoading(false); }
  }, []);

  const loadPolizas = useCallback(async (force = false) => {
    setPolLoading(true); setPolError(undefined);
    try {
      if (!force) {
        const c = cacheGet<ApiResponse<PolizaRow>>("br:polizas");
        if (c) { setPolData(c.data); setPolUpdated(c.lastUpdated); if (c.error) setPolError(c.error); setPolLoading(false); return; }
      }
      const res = await fetchData<PolizaRow>("/api/br/polizas");
      cacheSet("br:polizas", res);
      setPolData(res.data); setPolUpdated(res.lastUpdated); if (res.error) setPolError(res.error);
    } catch (e) { setPolError(String(e)); }
    finally { setPolLoading(false); }
  }, []);

  const loadFunneles = useCallback(async (force = false) => {
    setFunLoading(true); setFunError(undefined);
    try {
      if (!force) {
        const c = cacheGet<{ agentes: AgenteFunnelRow[]; cotizaciones: CotizacionFunnelRow[]; lastUpdated: string; error?: string }>("br:funneles");
        if (c) { setFunAgentes(c.agentes ?? []); setFunCot(c.cotizaciones ?? []); setFunUpdated(c.lastUpdated); if (c.error) setFunError(c.error); setFunLoading(false); return; }
      }
      const res = await fetch("/api/br/funneles", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      cacheSet("br:funneles", json);
      setFunAgentes(json.agentes ?? []); setFunCot(json.cotizaciones ?? []); setFunUpdated(json.lastUpdated); if (json.error) setFunError(json.error);
    } catch (e) { setFunError(String(e)); }
    finally { setFunLoading(false); }
  }, []);

  useEffect(() => {
    loadCotizaciones(); loadPolizas(); loadFunneles();
  }, [loadCotizaciones, loadPolizas, loadFunneles]);

  const tabs: TabDef[] = [
    { id: "cotizaciones", label: "Cotizaciones", icon: FileText },
    { id: "polizas", label: "Pólizas", icon: ShieldCheck },
    { id: "funneles", label: "Funneles", icon: GitMerge },
  ];

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1">
      <TabStrip tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      <TabsContent value="cotizaciones" className="flex-1 mt-0 focus-visible:outline-none bg-white">
        {cotError && <ErrorBanner message={cotError} />}
        {cotLoading && !cotData.length ? <LoadingSkeleton /> :
          <CotizacionesTab data={cotData} filters={cotFilters} onFilterChange={setCotFilters}
            lastUpdated={cotUpdated} isLoading={cotLoading} onRefresh={() => loadCotizaciones(true)} />}
      </TabsContent>
      <TabsContent value="polizas" className="flex-1 mt-0 focus-visible:outline-none bg-white">
        {polError && <ErrorBanner message={polError} />}
        {polLoading && !polData.length ? <LoadingSkeleton /> :
          <PolizasTab data={polData} filters={polFilters} onFilterChange={setPolFilters}
            lastUpdated={polUpdated} isLoading={polLoading} onRefresh={() => loadPolizas(true)} />}
      </TabsContent>
      <TabsContent value="funneles" className="flex-1 mt-0 focus-visible:outline-none bg-white">
        {funError && <ErrorBanner message={funError} />}
        {funLoading && !funAgentes.length ? <LoadingSkeleton /> :
          <FunnelesTab agentes={funAgentes} cotizaciones={funCot}
            lastUpdated={funUpdated} isLoading={funLoading} onRefresh={() => loadFunneles(true)} />}
      </TabsContent>
    </Tabs>
  );
}

// ─── Internacional Content ────────────────────────────────────────────────────
function IntlContent() {
  const [cotData, setCotData] = useState<IntlCotizacionRow[]>([]);
  const [funnelData, setFunnelData] = useState<IntlFunnelRow[]>([]);
  const [agenciasData, setAgenciasData] = useState<IntlAgenciaRow[]>([]);
  const [comisionesData, setComisionesData] = useState<IntlComisionRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const load = useCallback(async (force = false) => {
    setIsLoading(true); setError(undefined);
    try {
      if (!force) {
        const c = cacheGet<{
          cotizaciones: IntlCotizacionRow[];
          funnel: IntlFunnelRow[];
          agencias: IntlAgenciaRow[];
          comisiones: IntlComisionRow[];
          lastUpdated: string;
          error?: string;
        }>("intl:all");
        if (c) {
          setCotData(c.cotizaciones ?? []); setFunnelData(c.funnel ?? []);
          setAgenciasData(c.agencias ?? []); setComisionesData(c.comisiones ?? []);
          setLastUpdated(c.lastUpdated); if (c.error) setError(c.error);
          setIsLoading(false); return;
        }
      }
      const [cotRes, funnelRes] = await Promise.all([
        fetchData<IntlCotizacionRow>("/api/intl/cotizaciones"),
        fetch("/api/intl/funneles", { cache: "no-store" }).then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); }),
      ]);
      const combined = {
        cotizaciones: cotRes.data,
        funnel: funnelRes.funnel ?? [],
        agencias: funnelRes.agencias ?? [],
        comisiones: funnelRes.comisiones ?? [],
        lastUpdated: new Date().toISOString(),
        error: cotRes.error ?? funnelRes.error,
      };
      cacheSet("intl:all", combined);
      setCotData(combined.cotizaciones); setFunnelData(combined.funnel);
      setAgenciasData(combined.agencias); setComisionesData(combined.comisiones);
      setLastUpdated(combined.lastUpdated); if (combined.error) setError(combined.error);
    } catch (e) { setError(String(e)); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex flex-col flex-1 bg-white">
      {error && <ErrorBanner message={error} />}
      {isLoading && !cotData.length ? <LoadingSkeleton /> :
        <InternacionalTab
          cotizaciones={cotData}
          funnel={funnelData}
          agencias={agenciasData}
          comisiones={comisionesData}
          lastUpdated={lastUpdated}
          isLoading={isLoading}
          onRefresh={() => load(true)}
        />}
    </div>
  );
}

// ─── Root Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const [activeRegion, setActiveRegion] = useState<Region>("mx");

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar activeRegion={activeRegion} onRegionChange={setActiveRegion} />
      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        {activeRegion === "mx"   && <MxContent />}
        {activeRegion === "br"   && <BrContent />}
        {activeRegion === "intl" && <IntlContent />}
      </div>
    </div>
  );
}
