import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import { PolizaRow } from "@/lib/types";

const SQL = `
SELECT
  DATE_TRUNC(DATE(o.emission_date), MONTH)     AS Mes,
  COALESCE(o.agency_name, 'Sin agencia')        AS Agencia_Master,
  COALESCE(o.promoter_name, 'Sin promotor')     AS Promotor,
  COALESCE(o.advisor_name, 'Sin agente')        AS Agente,
  COALESCE(o.policy_status, 'Sin estado')       AS Estado,
  COALESCE(o.product_name, 'Sin producto')      AS Producto,
  COUNT(o.policy_number)                        AS Cantidad_Polizas,
  COALESCE(SUM(o.annual_premium), 0)            AS Prima_Total,
  COALESCE(SUM(o.insured_amount), 0)            AS Suma_Asegurada_Total
FROM \`olelifetech.gold_zone.fact_onshore_mx_quotation_policies\` o
WHERE o.policy_number IS NOT NULL
  AND o.emission_date IS NOT NULL
GROUP BY Mes, Agencia_Master, Promotor, Agente, Estado, Producto
ORDER BY Mes DESC
`;

export async function GET() {
  try {
    const data = await runQuery<PolizaRow>(SQL);
    return NextResponse.json({
      data,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/polizas]", err);
    return NextResponse.json(
      { data: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
