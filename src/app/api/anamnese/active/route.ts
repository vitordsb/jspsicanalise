import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let template = await prisma.anamnesisTemplate.findFirst({
      where: { isActive: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!template) {
      template = await prisma.anamnesisTemplate.findFirst({
        orderBy: { updatedAt: "desc" },
      });
    }

    if (!template) {
      return NextResponse.json(
        { error: "Nenhum modelo de anamnese ativo encontrado." },
        { status: 404 }
      );
    }

    let parsedSections = [];
    try {
      parsedSections = JSON.parse(template.sections);
    } catch {
      parsedSections = [];
    }

    return NextResponse.json({
      id: template.id,
      title: template.title,
      description: template.description,
      version: template.version,
      isActive: template.isActive,
      sections: parsedSections,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    });
  } catch (error) {
    console.error("Erro ao buscar anamnese ativa:", error);
    return NextResponse.json(
      { error: "Erro ao buscar modelo de anamnese ativo" },
      { status: 500 }
    );
  }
}
