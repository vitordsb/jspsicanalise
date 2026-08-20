import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { ZodError, z } from "zod";

const updateTemplateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
  sections: z.unknown().optional(),
  isActive: z.boolean().optional(),
  incrementVersion: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const template = await prisma.anamnesisTemplate.findUnique({
      where: { id },
      include: { _count: { select: { submissions: true } } },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Modelo nao encontrado." },
        { status: 404 }
      );
    }

    let sections: unknown[] = [];
    try {
      sections = JSON.parse(template.sections);
    } catch {}

    return NextResponse.json({ ...template, sections });
  } catch (error) {
    console.error("Erro ao buscar modelo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar modelo." },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisicao invalido." },
      { status: 400 }
    );
  }

  let parsed;
  try {
    parsed = updateTemplateSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      return NextResponse.json(
        { error: e.issues[0]?.message || "Dados invalidos." },
        { status: 400 }
      );
    }
    throw e;
  }

  try {
    const { id } = await params;

    const current = await prisma.anamnesisTemplate.findUnique({ where: { id } });
    if (!current) {
      return NextResponse.json(
        { error: "Modelo nao encontrado." },
        { status: 404 }
      );
    }

    if (parsed.isActive) {
      await prisma.anamnesisTemplate.updateMany({
        where: { id: { not: id } },
        data: { isActive: false },
      });
    }

    const dataToUpdate: Record<string, unknown> = {};
    if (parsed.title !== undefined) dataToUpdate.title = parsed.title;
    if (parsed.description !== undefined)
      dataToUpdate.description = parsed.description;
    if (parsed.isActive !== undefined) dataToUpdate.isActive = Boolean(parsed.isActive);
    if (parsed.sections !== undefined) {
      dataToUpdate.sections =
        typeof parsed.sections === "string"
          ? parsed.sections
          : JSON.stringify(parsed.sections);
    }
    if (parsed.incrementVersion) {
      dataToUpdate.version = current.version + 1;
    }

    const updated = await prisma.anamnesisTemplate.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      ...updated,
      sections:
        typeof updated.sections === "string"
          ? JSON.parse(updated.sections)
          : updated.sections,
    });
  } catch (error) {
    console.error("Erro ao atualizar modelo:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar modelo." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;

    const count = await prisma.anamnesisSubmission.count({
      where: { templateId: id },
    });

    if (count > 0) {
      await prisma.anamnesisTemplate.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({
        message:
          "Modelo possui submissoes vinculadas no historico e foi desativado em vez de excluido permanentemente.",
        deactivated: true,
      });
    }

    await prisma.anamnesisTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error("Erro ao deletar modelo:", error);
    return NextResponse.json(
      { error: "Erro ao deletar modelo." },
      { status: 500 }
    );
  }
}
