import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import type { IntlPolizaRow } from "@/lib/types";

// Deduplicate by NUMBER (one row per policy = latest state),
// restrict to statuses that matter for the overview.
const SQL = `
WITH base AS (
  SELECT
    NUMBER,
    STATUS_QUOTE,
    PAYMENT_STATUS,
    ANNUAL_PREMIUM,
    INSURED_VALUE,
    MASTER_AGENCY,
    LEVEL_2,
    ISSUE_DATE,
    DATE_CHANGE,
    UPDATED
  FROM \`olelifetech.gold_zone.fact_quotation_policies\`
  WHERE NUMBER IS NOT NULL
    AND STATUS_QUOTE IN (
      'ACTIVE','GRACE PERIOD','LAPSED','NOT PAYMENT RECEIVED',
      'CANCELLED','REJECTED','NOT TAKEN','PENDING EVALUATION',
      'APPLICATION WITHDRAWN','POSTPONED','CLAIM'
    )
),
latest AS (
  SELECT *,
    ROW_NUMBER() OVER (PARTITION BY NUMBER ORDER BY DATE_CHANGE DESC, UPDATED DESC) AS rn
  FROM base
)
SELECT
  DATE_TRUNC(ISSUE_DATE, MONTH)                                        AS Mes,
  COALESCE(NULLIF(TRIM(MASTER_AGENCY), ''), 'Sin agencia')             AS Agencia_Master,
  COALESCE(STATUS_QUOTE, 'Sin estado')                                 AS Estado,
  COALESCE(PAYMENT_STATUS, '')                                         AS Estado_Pago,
  COUNT(*)                                                             AS Cantidad_Polizas,
  ROUND(COALESCE(SUM(ANNUAL_PREMIUM), 0), 2)                          AS Prima_Total,
  ROUND(COALESCE(SUM(INSURED_VALUE), 0), 2)                           AS Suma_Asegurada_Total
FROM latest
WHERE rn = 1
  AND ISSUE_DATE IS NOT NULL
GROUP BY 1, 2, 3, 4
ORDER BY 1 DESC
`;

export async function GET() {
  try {
    const data = await runQuery<IntlPolizaRow>(SQL);
    return NextResponse.json({ data, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error("[api/intl/polizas]", err);
    return NextResponse.json(
      { data: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
