import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const [
      totalPatients,
      totalSubmissions,
      pending,
      inReview,
      approved,
      totalContracts,
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.anamnesisSubmission.count(),
      prisma.anamnesisSubmission.count({ where: { status: "pending" } }),
      prisma.anamnesisSubmission.count({ where: { status: "in_review" } }),
      prisma.anamnesisSubmission.count({ where: { status: "approved" } }),
      prisma.contract.count(),
    ]);

    return NextResponse.json({
      totalPatients,
      totalSubmissions,
      pending,
      inReview,
      approved,
      totalContracts,
    });
  } catch (error) {
    console.error("Erro ao buscar estatisticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatisticas." },
      { status: 500 }
    );
  }
}
