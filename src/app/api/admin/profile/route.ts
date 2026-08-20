import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { updateProfileSchema } from "@/lib/validate";
import { ZodError } from "zod";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const admin = await prisma.user.findFirst();
    if (!admin) {
      return NextResponse.json(
        { error: "Perfil nao configurado." },
        { status: 404 }
      );
    }

    // Remove campo senha antes de retornar
    const { password, ...safeUser } = admin;
    void password;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Erro ao buscar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
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
    parsed = updateProfileSchema.parse(body);
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
    let admin = await prisma.user.findFirst();

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: parsed.name || "Dra. Joane Souza Oliveira de Andrade",
          email: parsed.email || "joane@psicanalise.com.br",
          // Senha placeholder - nao e usada no login (auth via env var)
          password: "nao_utilizado",
          role: "admin",
          title: parsed.title || "Psicanalista Clinica",
          crp: parsed.crp || "",
          cpfCnpj: parsed.cpfCnpj || "",
          phone: parsed.phone || "",
          notificationEmail:
            parsed.notificationEmail || "enaoj22@gmail.com",
          clinicName: parsed.clinicName || "",
          address: parsed.address || "",
          // Campos de pagamento PIX nascem vazios
          pixKey:        parsed.pixKey        || "",
          pixKeyType:    parsed.pixKeyType    || "",
          pixHolderName: parsed.pixHolderName || "",
          bankName:      parsed.bankName      || "",
          bankAgency:    parsed.bankAgency    || "",
          bankAccount:   parsed.bankAccount   || "",
        },
      });
    } else {
      admin = await prisma.user.update({
        where: { id: admin.id },
        data: {
          ...(parsed.name !== undefined && { name: parsed.name }),
          ...(parsed.email !== undefined && { email: parsed.email }),
          ...(parsed.title !== undefined && { title: parsed.title }),
          ...(parsed.crp !== undefined && { crp: parsed.crp }),
          ...(parsed.cpfCnpj !== undefined && { cpfCnpj: parsed.cpfCnpj }),
          ...(parsed.phone !== undefined && { phone: parsed.phone }),
          ...(parsed.notificationEmail !== undefined && {
            notificationEmail: parsed.notificationEmail,
          }),
          ...(parsed.foroCidade !== undefined && { foroCidade: parsed.foroCidade }),
          ...(parsed.clinicName !== undefined && {
            clinicName: parsed.clinicName,
          }),
          ...(parsed.address !== undefined && { address: parsed.address }),
          // Campos de pagamento PIX
          ...(parsed.pixKey !== undefined && { pixKey: parsed.pixKey }),
          ...(parsed.pixKeyType !== undefined && { pixKeyType: parsed.pixKeyType }),
          ...(parsed.pixHolderName !== undefined && { pixHolderName: parsed.pixHolderName }),
          ...(parsed.bankName !== undefined && { bankName: parsed.bankName }),
          ...(parsed.bankAgency !== undefined && { bankAgency: parsed.bankAgency }),
          ...(parsed.bankAccount !== undefined && { bankAccount: parsed.bankAccount }),
        },
      });
    }

    const { password, ...safeUser } = admin;
    void password;
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil." },
      { status: 500 }
    );
  }
}
