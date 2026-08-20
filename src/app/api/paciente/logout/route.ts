import { NextResponse } from "next/server";
import { PACIENTE_COOKIE_NAME } from "@/lib/paciente-auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(PACIENTE_COOKIE_NAME);
  return res;
}
