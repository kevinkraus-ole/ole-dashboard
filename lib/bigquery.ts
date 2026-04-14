import { BigQuery } from "@google-cloud/bigquery";

let client: BigQuery | null = null;

function getClient(): BigQuery {
  if (client) return client;

  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env variable");
  }

  client = new BigQuery({
    projectId: process.env.BIGQUERY_PROJECT_ID ?? "olelifetech",
    credentials: JSON.parse(credJson),
  });

  return client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeValue(val: any): unknown {
  if (val === null || val === undefined) return null;
  if (typeof val === "bigint") return Number(val);
  // BigQuery date/datetime/timestamp objects expose a .value string
  if (typeof val === "object" && "value" in val) return val.value;
  return val;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeRow(row: Record<string, any>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(row).map(([k, v]) => [k, serializeValue(v)])
  );
}

export async function runQuery<T>(sql: string): Promise<T[]> {
  const bq = getClient();
  const [rows] = await bq.query({ query: sql, location: "US" });
  return rows.map(serializeRow) as T[];
}
