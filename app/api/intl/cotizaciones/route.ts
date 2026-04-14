import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import type { IntlCotizacionRow } from "@/lib/types";

// fact_quotation_policies: MASTER_AGENCY, LEVEL_2..LEVEL_7, QUOTE_NRO,
// SALES_FUNNEL_STAGE (numeric), OFFER_DATE — last 12 months only.
const SQL = `
SELECT
  DATE_TRUNC(DATE(p.OFFER_DATE), MONTH)                              AS Mes,
  COALESCE(NULLIF(TRIM(p.MASTER_AGENCY),''), 'Sin agencia')          AS Agencia_Master,
  COALESCE(NULLIF(TRIM(p.LEVEL_2),''), 'Sin nivel 2')               AS Nivel2,
  COALESCE(NULLIF(TRIM(p.LEVEL_3),''), '')                          AS Nivel3,
  CAST(p.SALES_FUNNEL_STAGE AS STRING)                              AS Etapa,
  COUNT(DISTINCT p.QUOTE_NRO)                                       AS Cantidad_Cotizaciones
FROM \`olelifetech.gold_zone.fact_quotation_policies\` p
WHERE p.OFFER_DATE >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
  AND p.QUOTE_NRO IS NOT NULL
GROUP BY Mes, Agencia_Master, Nivel2, Nivel3, Etapa
ORDER BY Mes DESC
`;

export async function GET() {
  try {
    const data = await runQuery<IntlCotizacionRow>(SQL);
    return NextResponse.json({ data, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error("[api/intl/cotizaciones]", err);
    return NextResponse.json(
      { data: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
