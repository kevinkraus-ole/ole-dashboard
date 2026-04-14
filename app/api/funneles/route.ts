import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";

// ─── Funnel de Agentes ──────────────────────────────────────────────────────
// Invitados → Aprobados → Con cotizaciones → Con ventas (pólizas)
// Single totals row — join by agency_name is unreliable since agency_name in
// fact_onshore_mx_quotation_policies contains promoter names, not formal agency names.
const SQL_AGENTES = `
SELECT
  'Total'                                                           AS Agencia_Master,
  COUNT(*)                                                          AS total_invitados,
  COUNTIF(Estado = 'APPROVED')                                      AS aprobados,
  (SELECT COUNT(DISTINCT advisor_id)
   FROM \`olelifetech.gold_zone.fact_onshore_mx_quotation_policies\`
   WHERE quotation_number IS NOT NULL
     AND advisor_id IS NOT NULL AND advisor_id != '')               AS agentes_con_cotizaciones,
  (SELECT COUNT(DISTINCT advisor_id)
   FROM \`olelifetech.gold_zone.fact_onshore_mx_quotation_policies\`
   WHERE policy_number IS NOT NULL
     AND advisor_id IS NOT NULL AND advisor_id != '')               AS agentes_con_ventas
FROM \`olelifetech.gold_zone.vw_agents_request\`
`;

// ─── Funnel de Cotizaciones ─────────────────────────────────────────────────
// Cotizaciones totales → únicas → en progreso (solicitud) → convertidas → pólizas vigentes
const SQL_COTIZACIONES = `
SELECT
  COALESCE(NULLIF(TRIM(agency_name),''), 'Sin promotor')                    AS Agencia_Master,
  COUNT(DISTINCT quotation_number)                                          AS cotizaciones_totales,
  COUNT(DISTINCT CASE WHEN quotation_status IS NOT NULL THEN quotation_number END) AS cotizaciones_con_estado,
  COUNT(DISTINCT policy_number)                                             AS convertidas_poliza,
  COUNT(DISTINCT CASE
    WHEN LOWER(COALESCE(policy_status,'')) IN ('vigente','active','activa','issued','emitida')
    THEN policy_number END)                                                 AS polizas_vigentes
FROM \`olelifetech.gold_zone.fact_onshore_mx_quotation_policies\`
WHERE quotation_number IS NOT NULL
GROUP BY 1
ORDER BY cotizaciones_totales DESC
`;

export interface AgenteFunnelRow {
  Agencia_Master: string;
  total_invitados: number;
  aprobados: number;
  agentes_con_cotizaciones: number;
  agentes_con_ventas: number;
}

export interface CotizacionFunnelRow {
  Agencia_Master: string;
  cotizaciones_totales: number;
  cotizaciones_con_estado: number;
  convertidas_poliza: number;
  polizas_vigentes: number;
}

export async function GET() {
  try {
    const [agentes, cotizaciones] = await Promise.all([
      runQuery<AgenteFunnelRow>(SQL_AGENTES),
      runQuery<CotizacionFunnelRow>(SQL_COTIZACIONES),
    ]);
    return NextResponse.json({
      agentes,
      cotizaciones,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/funneles]", err);
    return NextResponse.json(
      { agentes: [], cotizaciones: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
