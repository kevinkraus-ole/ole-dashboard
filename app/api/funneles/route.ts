import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";

// ─── Funnel de Agentes ──────────────────────────────────────────────────────
// Invitados → Aprobados → Con cotizaciones → Con ventas (pólizas)
const SQL_AGENTES = `
WITH invitados AS (
  SELECT
    COALESCE(Agencia_Master, 'Sin agencia') AS Agencia_Master,
    COUNT(*)                                AS total_invitados,
    COUNTIF(Estado = 'APPROVED')            AS aprobados
  FROM \`olelifetech.gold_zone.vw_agents_request\`
  GROUP BY 1
),
cotizadores AS (
  SELECT
    COALESCE(agency_name, 'Sin agencia') AS Agencia_Master,
    COUNT(DISTINCT advisor_id)           AS agentes_con_cotizaciones
  FROM \`olelifetech.gold_zone.fact_onshore_mx_quotation_policies\`
  WHERE quotation_number IS NOT NULL
  GROUP BY 1
),
vendedores AS (
  SELECT
    COALESCE(agency_name, 'Sin agencia') AS Agencia_Master,
    COUNT(DISTINCT advisor_id)           AS agentes_con_ventas
  FROM \`olelifetech.gold_zone.fact_onshore_mx_quotation_policies\`
  WHERE policy_number IS NOT NULL
  GROUP BY 1
)
SELECT
  i.Agencia_Master,
  i.total_invitados,
  i.aprobados,
  COALESCE(c.agentes_con_cotizaciones, 0) AS agentes_con_cotizaciones,
  COALESCE(v.agentes_con_ventas, 0)       AS agentes_con_ventas
FROM invitados i
LEFT JOIN cotizadores c ON LOWER(TRIM(c.Agencia_Master)) = LOWER(TRIM(i.Agencia_Master))
LEFT JOIN vendedores  v ON LOWER(TRIM(v.Agencia_Master)) = LOWER(TRIM(i.Agencia_Master))
ORDER BY i.total_invitados DESC
`;

// ─── Funnel de Cotizaciones ─────────────────────────────────────────────────
// Cotizaciones totales → únicas → en progreso (solicitud) → convertidas → pólizas vigentes
const SQL_COTIZACIONES = `
SELECT
  COALESCE(agency_name, 'Sin agencia')                                     AS Agencia_Master,
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
