import { createClient as createServiceClient } from "@supabase/supabase-js";

const getAdmin = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const admin = getAdmin();
  const { data: row, error } = await admin
    .from("user_google_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !row) throw new Error("No Google tokens for user — please sign in again");

  // Refresh if expires within 5 minutes
  if (new Date(row.expires_at).getTime() - 5 * 60 * 1000 < Date.now()) {
    if (!row.refresh_token) throw new Error("Token expired and no refresh token — please sign in again");
    const refreshed = await refreshGoogleToken(row.refresh_token);
    await admin
      .from("user_google_tokens")
      .update({
        access_token: refreshed.access_token,
        expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    return refreshed.access_token;
  }

  return row.access_token;
}

async function refreshGoogleToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number }>;
}
