import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import type { IntlFunnelRow } from "@/lib/types";

// Distribution of SALES_FUNNEL_STAGE codes — used to build the offshore funnel chart.
// Stage codes are numeric; we show them as-is and let the frontend label them.
const SQL_FUNNEL = `
SELECT
  CAST(p.SALES_FUNNEL_STAGE AS INT64)  AS Codigo,
  COUNT(DISTINCT p.QUOTE_NRO)          AS Cantidad
FROM \`olelifetech.gold_zone.fact_quotation_policies\` p
WHERE p.OFFER_DATE >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
  AND p.QUOTE_NRO IS NOT NULL
  AND p.SALES_FUNNEL_STAGE IS NOT NULL
GROUP BY 1
ORDER BY Cantidad DESC
`;

// Top master agencies with their totals
const SQL_AGENCIAS = `
SELECT
  COALESCE(NULLIF(TRIM(p.MASTER_AGENCY),''), 'Sin agencia')  AS nombre,
  COUNT(DISTINCT p.QUOTE_NRO)                                AS cotizaciones,
  COUNT(DISTINCT p.LEVEL_7)                                  AS asesores
FROM \`olelifetech.gold_zone.fact_quotation_policies\` p
WHERE p.OFFER_DATE >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
  AND p.QUOTE_NRO IS NOT NULL
GROUP BY 1
ORDER BY cotizaciones DESC
LIMIT 30
`;

// Commission level distribution via dim_advisor_full
const SQL_COMISIONES = `
SELECT
  COALESCE(NULLIF(TRIM(d.COMMISSIONS_LEVEL),''), 'Sin nivel')  AS nivel_comision,
  COUNT(DISTINCT d.ADVISOR_ID)                                  AS asesores
FROM \`olelifetech.gold_zone.dim_advisor_full\` d
WHERE d.ADVISOR_ID IS NOT NULL
GROUP BY 1
ORDER BY asesores DESC
`;

export interface IntlAgenciaRow {
  nombre: string;
  cotizaciones: number;
  asesores: number;
}

export interface IntlComisionRow {
  nivel_comision: string;
  asesores: number;
}

export async function GET() {
  try {
    const [funnel, agencias, comisiones] = await Promise.all([
      runQuery<IntlFunnelRow>(SQL_FUNNEL),
      runQuery<IntlAgenciaRow>(SQL_AGENCIAS),
      runQuery<IntlComisionRow>(SQL_COMISIONES),
    ]);
    return NextResponse.json({
      funnel,
      agencias,
      comisiones,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/intl/funneles]", err);
    return NextResponse.json(
      { funnel: [], agencias: [], comisiones: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
