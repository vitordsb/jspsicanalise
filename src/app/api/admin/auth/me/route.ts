import { NextResponse } from "next/server";
import { isAuthenticated, getAdminCredentials } from "@/lib/auth";

export async function GET() {
  const logged = await isAuthenticated();
  if (!logged) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const { email } = getAdminCredentials();
  return NextResponse.json({
    authenticated: true,
    email,
  });
}
