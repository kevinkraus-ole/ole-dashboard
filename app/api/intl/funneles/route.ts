import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import type { IntlFunnelRow, IntlConversionFunnel } from "@/lib/types";

// ── 1. SALES_FUNNEL_STAGE distribution (last 12 months) ──────────────────────
const SQL_STAGE_DIST = `
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

// ── 2. Conversion funnel (last 12 months by OFFER_DATE) ───────────────────────
// Steps: total → no rejected/withdrawn → en vigor → activas → activas pagadas
const SQL_CONVERSION = `
SELECT
  COUNT(DISTINCT QUOTE_NRO)                                                                    AS cotizaciones_totales,
  COUNT(DISTINCT CASE
    WHEN STATUS_QUOTE NOT IN (
      'REJECTED','NOT TAKEN','APPLICATION WITHDRAWN','CANCELLED','POSTPONED'
    ) THEN QUOTE_NRO END)                                                                      AS avanzaron_proceso,
  COUNT(DISTINCT CASE
    WHEN STATUS_QUOTE IN ('ACTIVE','GRACE PERIOD') THEN QUOTE_NRO END)                        AS en_vigor,
  COUNT(DISTINCT CASE
    WHEN STATUS_QUOTE = 'ACTIVE' THEN QUOTE_NRO END)                                          AS polizas_activas,
  COUNT(DISTINCT CASE
    WHEN STATUS_QUOTE = 'ACTIVE' AND PAYMENT_STATUS = 'PAID' THEN QUOTE_NRO END)             AS activas_pagadas
FROM \`olelifetech.gold_zone.fact_quotation_policies\`
WHERE OFFER_DATE >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
  AND QUOTE_NRO IS NOT NULL
`;

// ── 3. Top master agencies (last 12 months) ───────────────────────────────────
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

// ── 4. Commission level distribution (dim_advisor_full) ──────────────────────
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
    const [stageDist, conversionRows, agencias, comisiones] = await Promise.all([
      runQuery<IntlFunnelRow>(SQL_STAGE_DIST),
      runQuery<IntlConversionFunnel>(SQL_CONVERSION),
      runQuery<IntlAgenciaRow>(SQL_AGENCIAS),
      runQuery<IntlComisionRow>(SQL_COMISIONES),
    ]);

    const conversion: IntlConversionFunnel = conversionRows[0] ?? {
      cotizaciones_totales: 0,
      avanzaron_proceso: 0,
      en_vigor: 0,
      polizas_activas: 0,
      activas_pagadas: 0,
    };

    return NextResponse.json({
      funnel: stageDist,   // SALES_FUNNEL_STAGE distribution (for the bar chart)
      conversion,          // 5-step conversion funnel (for FunnelViz)
      agencias,
      comisiones,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/intl/funneles]", err);
    return NextResponse.json(
      {
        funnel: [], conversion: null, agencias: [], comisiones: [],
        lastUpdated: new Date().toISOString(), error: String(err),
      },
      { status: 500 }
    );
  }
}
