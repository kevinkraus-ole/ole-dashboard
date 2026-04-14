import { NextResponse } from "next/server";

export async function GET() {
  const report: Record<string, unknown> = {};

  // 1. Check env vars exist
  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "";
  const projectId = process.env.BIGQUERY_PROJECT_ID ?? "(not set)";
  report.projectId = projectId;
  report.credJsonLength = credJson.length;
  report.credJsonFirst30 = credJson.slice(0, 30);

  // 2. Try parsing the JSON
  let credentials: Record<string, unknown> | null = null;
  try {
    credentials = JSON.parse(credJson);
    report.credParsed = true;
    report.credType = credentials?.type;
    report.credProjectId = credentials?.project_id;
    report.credClientEmail = credentials?.client_email;
  } catch (e) {
    report.credParsed = false;
    report.credParseError = String(e);
    return NextResponse.json(report, { status: 200 });
  }

  // 3. Try a simple BigQuery query
  try {
    const { BigQuery } = await import("@google-cloud/bigquery");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bq = new BigQuery({ projectId, credentials: credentials as any });
    const [rows] = await bq.query({
      query: "SELECT 1 AS ok",
      location: "US",
    });
    report.bigqueryOk = true;
    report.bigqueryTestRow = rows[0];
  } catch (e) {
    report.bigqueryOk = false;
    report.bigqueryError = String(e);
  }

  return NextResponse.json(report, { status: 200 });
}
