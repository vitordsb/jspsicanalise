import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        patient: true,
        submission: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Contrato não encontrado" }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Erro ao buscar contrato:", error);
    return NextResponse.json({ error: "Erro ao buscar contrato" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.contract.update({
      where: { id },
      data: {
        title: body.title,
        therapistName: body.therapistName,
        therapistDoc: body.therapistDoc,
        therapistAddress: body.therapistAddress,
        sessionPrice: body.sessionPrice !== undefined ? Number(body.sessionPrice) : undefined,
        frequency: body.frequency,
        durationMinutes: body.durationMinutes !== undefined ? Number(body.durationMinutes) : undefined,
        paymentMethod: body.paymentMethod,
        cancellationPolicy: body.cancellationPolicy,
        customClauses: body.customClauses,
        status: body.status,
      },
      include: {
        patient: true,
        submission: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar contrato:", error);
    return NextResponse.json({ error: "Erro ao atualizar contrato" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.contract.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir contrato:", error);
    return NextResponse.json({ error: "Erro ao excluir contrato" }, { status: 500 });
  }
}
