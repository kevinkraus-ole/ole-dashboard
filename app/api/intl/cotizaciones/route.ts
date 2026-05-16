import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getValidGoogleAccessToken } from "@/lib/google-token";
import { runQuery } from "@/lib/bigquery";
import type { IntlCotizacionRow } from "@/lib/types";

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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  try {
    const accessToken = await getValidGoogleAccessToken(user.id);
    const data = await runQuery<IntlCotizacionRow>(SQL, accessToken);
    return NextResponse.json({ data, lastUpdated: new Date().toISOString() });
  } catch (err) {
    console.error("[api/intl/cotizaciones]", err);
    return NextResponse.json(
      { data: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
