import { BigQuery } from "@google-cloud/bigquery";
import { OAuth2Client } from "google-auth-library";

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

export async function runQuery<T>(sql: string, accessToken: string): Promise<T[]> {
  const oauthClient = new OAuth2Client();
  oauthClient.setCredentials({ access_token: accessToken });

  const bq = new BigQuery({
    projectId: process.env.BIGQUERY_PROJECT_ID ?? "olelifetech",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authClient: oauthClient as any,
  });

  const [rows] = await bq.query({ query: sql, location: "us-central1" });
  return rows.map(serializeRow) as T[];
}
