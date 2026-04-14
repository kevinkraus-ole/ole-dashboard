import { BigQuery } from "@google-cloud/bigquery";
import { GoogleAuth } from "google-auth-library";

let client: BigQuery | null = null;

function getClient(): BigQuery {
  if (client) return client;

  const credJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!credJson) {
    throw new Error("Missing GOOGLE_SERVICE_ACCOUNT_JSON env variable");
  }

  const credentials = JSON.parse(credJson);

  // GoogleAuth handles both service_account and authorized_user types
  const auth = new GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/bigquery"],
    projectId: process.env.BIGQUERY_PROJECT_ID ?? "olelifetech",
  });

  client = new BigQuery({
    projectId: process.env.BIGQUERY_PROJECT_ID ?? "olelifetech",
    authClient: auth,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  return client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeValue(val: any): unknown {
  if (val === null || val === undefined) return null;
  if (typeof val === "bigint") return Number(val);
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
  const [rows] = await bq.query({ query: sql, location: "us-central1" });
  return rows.map(serializeRow) as T[];
}
