import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import type { IntlVencimientoRow } from "@/lib/types";

// Active policies whose NEXT_RENEWAL falls in the next 90 days.
// One row per policy (deduped by NUMBER). Sorted by renewal date ascending.
const SQL = `
WITH deduped AS (
  SELECT
    NUMBER,
    COALESCE(NULLIF(TRIM(PROSPECT),''), 'Sin nombre')                AS Asegurado,
    COALESCE(NULLIF(TRIM(USER_FULL_NAME),''), 'Sin asesor')          AS Asesor,
    COALESCE(NULLIF(TRIM(MASTER_AGENCY),''), 'Sin agencia')          AS Agencia_Master,
    COALESCE(NULLIF(TRIM(LEVEL_2),''), '')                           AS Nivel2,
    COALESCE(NULLIF(TRIM(LEVEL_3),''), '')                           AS Nivel3,
    COALESCE(PAYMENT_STATUS, 'Sin dato')                             AS Estado_Pago,
    COALESCE(ANNUAL_PREMIUM, 0)                                      AS Prima_Anual,
    COALESCE(INSURED_VALUE, 0)                                       AS Suma_Asegurada,
    EFFECTIVE                                                        AS Fecha_Inicio,
    NEXT_RENEWAL                                                     AS Fecha_Vencimiento,
    COALESCE(POLICY_PERIOD_YEAR, 0)                                  AS Anos_Poliza,
    DATE_DIFF(NEXT_RENEWAL, CURRENT_DATE(), DAY)                     AS Dias_Para_Vencer,
    ROW_NUMBER() OVER (
      PARTITION BY NUMBER
      ORDER BY DATE_CHANGE DESC, UPDATED DESC
    ) AS rn
  FROM \`olelifetech.gold_zone.fact_quotation_policies\`
  WHERE STATUS_QUOTE = 'ACTIVE'
    AND NUMBER IS NOT NULL
    AND NEXT_RENEWAL BETWEEN CURRENT_DATE() AND DATE_ADD(CURRENT_DATE(), INTERVAL 90 DAY)
)
SELECT
  NUMBER                AS Numero,
  Asegurado,
  Asesor,
  Agencia_Master,
  Nivel2,
  Nivel3,
  Estado_Pago,
  ROUND(Prima_Anual, 2) AS Prima_Anual,
  ROUND(Suma_Asegurada, 2) AS Suma_Asegurada,
  CAST(Fecha_Inicio AS STRING)      AS Fecha_Inicio,
  CAST(Fecha_Vencimiento AS STRING) AS Fecha_Vencimiento,
  Anos_Poliza,
  Dias_Para_Vencer
FROM deduped
WHERE rn = 1
ORDER BY Fecha_Vencimiento ASC
`;

export interface VencimientoSummary {
  total: number;
  pagadas: number;
  no_pagadas: number;
  prima_en_riesgo: number;
  suma_asegurada_en_riesgo: number;
}

export async function GET() {
  try {
    const rows = await runQuery<IntlVencimientoRow>(SQL);
    // Compute summary on the server so the client doesn't have to re-aggregate
    const summary: VencimientoSummary = {
      total: rows.length,
      pagadas: rows.filter((r) => r.Estado_Pago === "PAID").length,
      no_pagadas: rows.filter((r) => r.Estado_Pago === "UNPAID").length,
      prima_en_riesgo: rows.reduce((s, r) => s + r.Prima_Anual, 0),
      suma_asegurada_en_riesgo: rows.reduce((s, r) => s + r.Suma_Asegurada, 0),
    };
    return NextResponse.json({ rows, summary, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error("[api/intl/vencimientos]", err);
    return NextResponse.json(
      { rows: [], summary: null, lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
