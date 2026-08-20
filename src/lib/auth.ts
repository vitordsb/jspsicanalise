import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "js_admin_session";

export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL || "joane@psicanalise.com.br",
    password: process.env.ADMIN_PASSWORD || "admin",
    secret: process.env.ADMIN_SESSION_SECRET || "joane_psicanalise_secret_key_2026",
  };
}

export function generateToken(): string {
  const { secret, email } = getAdminCredentials();
  const timestamp = Date.now();
  const raw = `${email}:${timestamp}:${secret}`;
  // Simple deterministic base64 signature for session
  return Buffer.from(raw).toString("base64");
}

export function isValidToken(token: string): boolean {
  if (!token) return false;
  try {
    const { secret, email } = getAdminCredentials();
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const [tokenEmail, , tokenSecret] = decoded.split(":");
    return tokenEmail === email && tokenSecret === secret;
  } catch {
    return false;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(ADMIN_COOKIE_NAME);
  if (!sessionCookie || !sessionCookie.value) return false;
  return isValidToken(sessionCookie.value);
}
