import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
      let sections = [];
      try {
        sections = JSON.parse(t.sections);
      } catch {}
      return {
        ...t,
        sections,
      };
    });

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Erro ao listar modelos de anamnese:", error);
    return NextResponse.json({ error: "Erro ao buscar modelos" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, sections, isActive, duplicateFromId } = body;

    let sectionsData = sections;
    let newTitle = title;
    let newDescription = description;

    if (duplicateFromId) {
      const source = await prisma.anamnesisTemplate.findUnique({
        where: { id: duplicateFromId },
      });
      if (source) {
        sectionsData = typeof source.sections === "string" ? JSON.parse(source.sections) : source.sections;
        newTitle = title || `${source.title} (Cópia v${source.version + 1})`;
        newDescription = description || source.description;
      }
    }

    if (!newTitle) {
      return NextResponse.json({ error: "Título do modelo é obrigatório" }, { status: 400 });
    }

    // Se estiver marcando como ativa, desmarca as outras
    if (isActive) {
      await prisma.anamnesisTemplate.updateMany({
        data: { isActive: false },
      });
    }

    const created = await prisma.anamnesisTemplate.create({
      data: {
        title: newTitle,
        description: newDescription || "",
        version: 1,
        isActive: Boolean(isActive),
        sections: typeof sectionsData === "string" ? sectionsData : JSON.stringify(sectionsData || []),
      },
    });

    return NextResponse.json({
      ...created,
      sections: typeof created.sections === "string" ? JSON.parse(created.sections) : created.sections,
    });
  } catch (error) {
    console.error("Erro ao criar modelo de anamnese:", error);
    return NextResponse.json({ error: "Erro ao criar modelo" }, { status: 500 });
  }
}
