import { NextResponse } from "next/server";
import { runQuery } from "@/lib/bigquery";
import { InvitacionRow } from "@/lib/types";

const SQL = `
SELECT
  DATE_TRUNC(DATE(r.F_Invitacion), MONTH)      AS Mes,
  COALESCE(r.Agencia_Master, 'Sin agencia')     AS Agencia_Master,
  COALESCE(r.Enviado_Por, 'Sin promotor')       AS Promotor,
  COALESCE(r.Postulante, 'Sin nombre')          AS Agente,
  CASE r.Estado
    WHEN 'STARTED'             THEN 'Iniciada'
    WHEN 'IN_PROGRESS'         THEN 'En progreso'
    WHEN 'IN_VALIDATION'       THEN 'En validación'
    WHEN 'PENDING'             THEN 'Pendiente'
    WHEN 'APPROVED'            THEN 'Aprobada'
    WHEN 'REQUIRED_CORRECTION' THEN 'Req. corrección'
    WHEN 'REJECTED_BY_USER'    THEN 'Rechazada por agente'
    WHEN 'REFUSED'             THEN 'Rechazada por Olé'
    WHEN 'EXPIRED'             THEN 'Vencida'
    ELSE COALESCE(r.Estado, 'Desconocido')
  END AS Estado_Label,
  CASE r.Estado
    WHEN 'APPROVED'            THEN 'Completada'
    WHEN 'IN_PROGRESS'         THEN 'En curso'
    WHEN 'IN_VALIDATION'       THEN 'En curso'
    WHEN 'STARTED'             THEN 'En curso'
    WHEN 'PENDING'             THEN 'En curso'
    WHEN 'REQUIRED_CORRECTION' THEN 'Requiere acción'
    WHEN 'REJECTED_BY_USER'    THEN 'Perdida'
    WHEN 'REFUSED'             THEN 'Perdida'
    WHEN 'EXPIRED'             THEN 'Perdida'
    ELSE 'Otro'
  END AS Estado_Grupo,
  MAX(COALESCE(r.Posicion, '')) AS Posicion,
  MAX(COALESCE(r.Nivel, '')) AS Nivel,
  MAX(COALESCE(r.Agencia_Superior, '')) AS Agencia_Superior,
  COUNT(*) AS Cantidad
FROM \`olelifetech.gold_zone.vw_agents_request\` r
WHERE r.F_Invitacion IS NOT NULL
GROUP BY Mes, Agencia_Master, Promotor, Agente, Estado_Label, Estado_Grupo
ORDER BY Mes DESC
`;

export async function GET() {
  try {
    const data = await runQuery<InvitacionRow>(SQL);
    return NextResponse.json({
      data,
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[api/invitaciones]", err);
    return NextResponse.json(
      { data: [], lastUpdated: new Date().toISOString(), error: String(err) },
      { status: 500 }
    );
  }
}
