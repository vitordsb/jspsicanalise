import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const admin = await prisma.user.findFirst();
    if (!admin) {
      return NextResponse.json({ error: "Perfil não configurado" }, { status: 404 });
    }

    const { password, ...safeUser } = admin;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    let admin = await prisma.user.findFirst();

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: body.name || "Dra. Joane Silva",
          email: body.email || "joane@psicanalise.com.br",
          password: "admin",
          role: "admin",
          title: body.title || "Psicanalista Clínica",
          crp: body.crp || "",
          phone: body.phone || "",
          notificationEmail: body.notificationEmail || "joane@psicanalise.com.br",
          clinicName: body.clinicName || "JS Psicanálise",
          address: body.address || "",
        },
      });
    } else {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: {
          name: body.name,
          email: body.email,
          title: body.title,
          crp: body.crp,
          phone: body.phone,
          notificationEmail: body.notificationEmail,
          clinicName: body.clinicName,
          address: body.address,
        },
      });
    }

    const { password, ...safeUser } = admin;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 });
  }
}
