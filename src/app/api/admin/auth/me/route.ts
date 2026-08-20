import { NextResponse } from "next/server";
import { isAuthenticated, requireAuth } from "@/lib/auth-session";
import { getAdminCredentials } from "@/lib/auth";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  const { email } = getAdminCredentials();
  return NextResponse.json({
    authenticated: true,
    email,
  });
}
