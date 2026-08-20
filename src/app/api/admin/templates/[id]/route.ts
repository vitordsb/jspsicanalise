import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await prisma.anamnesisTemplate.findUnique({
      where: { id },
      include: {
        _count: { select: { submissions: true } },
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
    }

    let sections = [];
    try {
      sections = JSON.parse(template.sections);
    } catch {}

    return NextResponse.json({
      ...template,
      sections,
    });
  } catch (error) {
    console.error("Erro ao buscar modelo:", error);
    return NextResponse.json({ error: "Erro ao buscar modelo" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, sections, isActive, incrementVersion } = body;

    const current = await prisma.anamnesisTemplate.findUnique({
      where: { id },
    });

    if (!current) {
      return NextResponse.json({ error: "Modelo não encontrado" }, { status: 404 });
    }

    // Se estiver ativando este modelo, desativa os outros
    if (isActive) {
      await prisma.anamnesisTemplate.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }

    const dataToUpdate: any = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (isActive !== undefined) dataToUpdate.isActive = Boolean(isActive);
    if (sections !== undefined) {
      dataToUpdate.sections = typeof sections === "string" ? sections : JSON.stringify(sections);
    }
    if (incrementVersion) {
      dataToUpdate.version = current.version + 1;
    }

    const updated = await prisma.anamnesisTemplate.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      ...updated,
      sections: typeof updated.sections === "string" ? JSON.parse(updated.sections) : updated.sections,
    });
  } catch (error) {
    console.error("Erro ao atualizar modelo:", error);
    return NextResponse.json({ error: "Erro ao atualizar modelo" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verifica se há submissões vinculadas
    const count = await prisma.anamnesisSubmission.count({
      where: { templateId: id },
    });

    if (count > 0) {
      // Se houver submissões, não deleta bruscamente; apenas desativa se estiver ativo
      await prisma.anamnesisTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message: "O modelo possui submissões atreladas no histórico e foi desativado em vez de excluído permanentemente.",
        deactivated: true,
      });
    }

    await prisma.anamnesisTemplate.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Erro ao deletar modelo:", error);
    return NextResponse.json({ error: "Erro ao deletar modelo" }, { status: 500 });
  }
}
