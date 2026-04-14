"use client";

import { useState, useCallback, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CotizacionesTab } from "@/components/dashboard/CotizacionesTab";
import { InvitacionesTab } from "@/components/dashboard/InvitacionesTab";
import { PolizasTab } from "@/components/dashboard/PolizasTab";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CotizacionRow,
  InvitacionRow,
  PolizaRow,
  FilterState,
  ApiResponse,
} from "@/lib/types";
import { FileText, Mail, ShieldCheck, AlertTriangle } from "lucide-react";

const EMPTY_FILTERS: FilterState = { agenciaMaster: "", promotor: "", agente: "" };

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 rounded-xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton key="a" className="h-72 rounded-xl" />
        <Skeleton key="b" className="h-72 rounded-xl" />
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
      <AlertTriangle size={18} className="text-red-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-red-800">Error al cargar datos</p>
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

  const loadCotizaciones = useCallback(async () => {
    setCotLoading(true);
    setCotError(undefined);
    try {
      const res = await fetchData<CotizacionRow>("/api/cotizaciones");
      setCotData(res.data);
      setCotUpdated(res.lastUpdated);
      if (res.error) setCotError(res.error);
    } catch (e) {
      setCotError(String(e));
    } finally {
      setCotLoading(false);
    }
  }, []);

  const loadInvitaciones = useCallback(async () => {
    setInvLoading(true);
    setInvError(undefined);
    try {
      const res = await fetchData<InvitacionRow>("/api/invitaciones");
      setInvData(res.data);
      setInvUpdated(res.lastUpdated);
      if (res.error) setInvError(res.error);
    } catch (e) {
      setInvError(String(e));
    } finally {
      setInvLoading(false);
    }
  }, []);

  const loadPolizas = useCallback(async () => {
    setPolLoading(true);
    setPolError(undefined);
    try {
      const res = await fetchData<PolizaRow>("/api/polizas");
      setPolData(res.data);
      setPolUpdated(res.lastUpdated);
      if (res.error) setPolError(res.error);
    } catch (e) {
      setPolError(String(e));
    } finally {
      setPolLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCotizaciones();
    loadInvitaciones();
    loadPolizas();
  }, [loadCotizaciones, loadInvitaciones, loadPolizas]);

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex flex-col min-h-[calc(100vh-3.5rem)]"
    >
      <div className="bg-white border-b border-slate-200 px-6">
        <TabsList className="h-12 bg-transparent gap-0 p-0">
          <TabsTrigger
            value="cotizaciones"
            className="h-12 px-5 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent font-medium text-slate-500 gap-2"
          >
            <FileText size={15} />
            Cotizaciones
          </TabsTrigger>
          <TabsTrigger
            value="invitaciones"
            className="h-12 px-5 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent font-medium text-slate-500 gap-2"
          >
            <Mail size={15} />
            Invitaciones
          </TabsTrigger>
          <TabsTrigger
            value="polizas"
            className="h-12 px-5 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 data-[state=active]:bg-transparent font-medium text-slate-500 gap-2"
          >
            <ShieldCheck size={15} />
            Pólizas
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="cotizaciones" className="flex-1 mt-0">
        {cotError && <ErrorBanner message={cotError} />}
        {cotLoading && !cotData.length ? (
          <LoadingSkeleton />
        ) : (
          <CotizacionesTab
            data={cotData}
            filters={cotFilters}
            onFilterChange={setCotFilters}
            lastUpdated={cotUpdated}
            isLoading={cotLoading}
            onRefresh={loadCotizaciones}
          />
        )}
      </TabsContent>

      <TabsContent value="invitaciones" className="flex-1 mt-0">
        {invError && <ErrorBanner message={invError} />}
        {invLoading && !invData.length ? (
          <LoadingSkeleton />
        ) : (
          <InvitacionesTab
            data={invData}
            filters={invFilters}
            onFilterChange={setInvFilters}
            lastUpdated={invUpdated}
            isLoading={invLoading}
            onRefresh={loadInvitaciones}
          />
        )}
      </TabsContent>

      <TabsContent value="polizas" className="flex-1 mt-0">
        {polError && <ErrorBanner message={polError} />}
        {polLoading && !polData.length ? (
          <LoadingSkeleton />
        ) : (
          <PolizasTab
            data={polData}
            filters={polFilters}
            onFilterChange={setPolFilters}
            lastUpdated={polUpdated}
            isLoading={polLoading}
            onRefresh={loadPolizas}
          />
        )}
      </TabsContent>
    </Tabs>
  );
}
