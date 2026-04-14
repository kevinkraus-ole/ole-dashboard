export interface InvitacionRow {
  Mes: string; // "YYYY-MM-DD" first of month
  Agencia_Master: string;
  Promotor: string;
  Agente: string;
  Estado_Label: string;
  Estado_Grupo: string;
  Posicion: string;
  Nivel: string;
  Agencia_Superior: string;
  Cantidad: number;
}

export interface CotizacionRow {
  Mes: string;
  Agencia_Master: string;
  Promotor: string;
  Agente: string;
  Estado: string;
  Cantidad_Cotizaciones: number;
}

export interface PolizaRow {
  Mes: string;
  Agencia_Master: string;
  Promotor: string;
  Agente: string;
  Estado: string;
  Producto: string;
  Cantidad_Polizas: number;
  Prima_Total: number;
  Suma_Asegurada_Total: number;
}

export interface ApiResponse<T> {
  data: T[];
  lastUpdated: string;
  error?: string;
}

export interface FilterState {
  agenciaMaster: string;
  promotor: string;
  agente: string;
}

// ─── Internacional (offshore) ──────────────────────────────────────────────

export interface IntlCotizacionRow {
  Mes: string;
  Agencia_Master: string;
  Nivel2: string;
  Nivel3: string;
  Etapa: string; // SALES_FUNNEL_STAGE as string
  Cantidad_Cotizaciones: number;
}

export interface IntlFunnelRow {
  Codigo: number;
  Cantidad: number;
}

export interface IntlPolizaRow {
  Mes: string;
  Agencia_Master: string;
  Estado: string;
  Estado_Pago: string;
  Cantidad_Polizas: number;
  Prima_Total: number;
  Suma_Asegurada_Total: number;
}

export interface IntlVencimientoRow {
  Numero: string;
  Asegurado: string;
  Asesor: string;
  Agencia_Master: string;
  Nivel2: string;
  Nivel3: string;
  Estado_Pago: string;
  Prima_Anual: number;
  Suma_Asegurada: number;
  Fecha_Inicio: string;
  Fecha_Vencimiento: string;
  Anos_Poliza: number;
  Dias_Para_Vencer: number;
}

export interface IntlConversionFunnel {
  cotizaciones_totales: number;
  avanzaron_proceso: number;
  en_vigor: number;
  polizas_activas: number;
  activas_pagadas: number;
}
