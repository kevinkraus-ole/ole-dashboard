import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import type { AgenteFunnelRow, CotizacionFunnelRow } from "@/app/api/funneles/route";

// Brasil doesn't have vw_agents_request, so agentes returns a single empty placeholder row.
const SQL_AGENTES = `
SELECT
  'Total'                                                             AS Agencia_Master,
  0                                                                   AS total_invitados,
  0                                                                   AS aprobados,
  (SELECT COUNT(DISTINCT advisor_id)
   FROM \`olelifetech.gold_zone.fact_onshore_br_quotation_policies\`
   WHERE quotation_number IS NOT NULL
     AND advisor_id IS NOT NULL AND advisor_id != '')                 AS agentes_con_cotizaciones,
  (SELECT COUNT(DISTINCT advisor_id)
   FROM \`olelifetech.gold_zone.fact_onshore_br_quotation_policies\`
   WHERE policy_number IS NOT NULL
     AND advisor_id IS NOT NULL AND advisor_id != '')                 AS agentes_con_ventas
`;

const SQL_COTIZACIONES = `
SELECT
  COALESCE(NULLIF(TRIM(agency_name),''), 'Sin promotor')                    AS Agencia_Master,
  COUNT(DISTINCT quotation_number)                                          AS cotizaciones_totales,
  COUNT(DISTINCT CASE WHEN quotation_status IS NOT NULL THEN quotation_number END) AS cotizaciones_con_estado,
  COUNT(DISTINCT policy_number)                                             AS convertidas_poliza,
  COUNT(DISTINCT CASE
    WHEN LOWER(COALESCE(policy_status,'')) IN ('vigente','active','activa','issued','emitida')
    THEN policy_number END)                                                 AS polizas_vigentes
FROM \`olelifetech.gold_zone.fact_onshore_br_quotation_policies\`
WHERE quotation_number IS NOT NULL
GROUP BY 1
ORDER BY cotizaciones_totales DESC
`;

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
    console.error("[api/br/funneles]", err);
    return NextResponse.json(
      { agentes: [], cotizaciones: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
