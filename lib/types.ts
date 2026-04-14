export interface InvitacionRow {
  Mes: string; // "YYYY-MM-DD" first of month
  Agencia_Master: string;
  Promotor: string;
  Agente: string;
  Estado_Label: string;
  Estado_Grupo: string;
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
