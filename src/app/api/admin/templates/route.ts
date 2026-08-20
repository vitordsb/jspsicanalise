import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { createTemplateSchema } from "@/lib/validate";
import { ZodError } from "zod";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const templates = await prisma.anamnesisTemplate.findMany({
      include: {
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    });

    const parsed = templates.map((t) => {
      let sections: unknown[] = [];
      try {
        sections = JSON.parse(t.sections);
      } catch {}
      return { ...t, sections };
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erro ao listar modelos de anamnese:", error);
    return NextResponse.json(
      { error: "Erro ao buscar modelos." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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
    parsed = createTemplateSchema.parse(body);
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
    let sectionsData = parsed.sections;
    let newTitle = parsed.title;
    let newDescription = parsed.description;

    if (parsed.duplicateFromId) {
      const source = await prisma.anamnesisTemplate.findUnique({
        where: { id: parsed.duplicateFromId },
      });
      if (source) {
        sectionsData = JSON.parse(source.sections);
        newTitle = parsed.title || `${source.title} (Copia v${source.version + 1})`;
        newDescription = parsed.description || source.description;
      }
    }

    if (parsed.isActive) {
      await prisma.anamnesisTemplate.updateMany({
        data: { isActive: false },
      });
    }

    const created = await prisma.anamnesisTemplate.create({
      data: {
        title: newTitle,
        description: newDescription || "",
        version: 1,
        isActive: Boolean(parsed.isActive),
        sections:
          typeof sectionsData === "string"
            ? sectionsData
            : JSON.stringify(sectionsData || []),
      },
    });

    return NextResponse.json({
      ...created,
      sections:
        typeof created.sections === "string"
          ? JSON.parse(created.sections)
          : created.sections,
    });
  } catch (error) {
    console.error("Erro ao criar modelo de anamnese:", error);
    return NextResponse.json(
      { error: "Erro ao criar modelo." },
      { status: 500 }
    );
  }
}
