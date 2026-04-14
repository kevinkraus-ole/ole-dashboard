import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import { CotizacionRow } from "@/lib/types";

const SQL = `
SELECT
  DATE_TRUNC(DATE(o.quotation_date), MONTH)   AS Mes,
  COALESCE(o.agency_name, 'Sin agencia')       AS Agencia_Master,
  COALESCE(o.promoter_name, 'Sin promotor')    AS Promotor,
  COALESCE(o.advisor_name, 'Sin agente')       AS Agente,
  CASE o.quotation_status
    WHEN 'registered' THEN 'Registrada'
    WHEN 'converted'  THEN 'Convertida'
    WHEN 'rejected'   THEN 'Rechazada'
    ELSE COALESCE(o.quotation_status, 'Sin estado')
  END AS Estado,
  COUNT(o.quotation_number)                    AS Cantidad_Cotizaciones
FROM \`olelifetech.gold_zone.fact_onshore_mx_quotation_policies\` o
WHERE o.quotation_date IS NOT NULL
GROUP BY Mes, Agencia_Master, Promotor, Agente, Estado
ORDER BY Mes DESC
`;

export async function GET() {
  try {
    const data = await runQuery<CotizacionRow>(SQL);
    return NextResponse.json({
      data,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/cotizaciones]", err);
    return NextResponse.json(
      { data: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
