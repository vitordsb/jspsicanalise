/**
 * POST /api/paciente/contratos/[id]/upload-signed
 *
 * Envio do contrato assinado pelo proprio paciente.
 *
 * Mesmas defesas da rota do admin (magic bytes, teto de 10 MB, nome UUID no
 * Storage, hash SHA-256, rate limit), com uma diferenca essencial: o contrato
 * so e aceito se pertencer ao paciente da sessao. O id vem da URL, mas a
 * checagem de dono vem do cookie assinado, nunca do que o cliente diz ser.
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { exigirPaciente } from "@/lib/paciente-session";
import { uploadSignedPdf } from "@/lib/supabase-storage";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { isValidTransition, type ContractStatus } from "@/lib/validate";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PDF_MAGIC = Buffer.from("%PDF-");

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  const ip = getClientIp(req);
  if (!checkRateLimit(`paciente-upload:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitos envios seguidos. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  const { id } = await params;

  // Dono do contrato conferido pela sessao, nunca por dado do cliente.
  const contrato = await prisma.contract.findFirst({
    where: { id, patientId },
    select: { id: true, status: true, signedVersion: true },
  });

  if (!contrato) {
    // Mesma resposta para contrato inexistente e contrato de outra pessoa:
    // nao revelamos que aquele id existe.
    return NextResponse.json({ error: "Contrato não encontrado." }, { status: 404 });
  }

  // Mesma maquina de estados da rota do admin: so aceita upload vindo de
  // "aguardando_assinatura". Contrato "gerado" ou "recusado" precisa passar
  // pela emissao (que carimba issuedAt/issuedByName, usados no texto do
  // contrato) antes de poder receber assinatura — pular essa etapa deixava
  // o documento sem a data/nome de emissao correta.
  const fromStatus = contrato.status as ContractStatus;
  if (!isValidTransition(fromStatus, "assinado_recebido")) {
    return NextResponse.json(
      { error: "Este contrato não está aguardando envio de assinatura. Aguarde a Dra. Joane liberar o contrato." },
      { status: 409 }
    );
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json({ error: "Não foi possível ler o arquivo enviado." }, { status: 400 });
  }

  if (!file) {
    return NextResponse.json({ error: "Selecione o arquivo do contrato assinado." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "O arquivo é maior que 10 MB. Reduza a qualidade do escaneamento e tente novamente." },
      { status: 413 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Magic bytes: o tipo declarado pelo navegador nao e confiavel.
  if (!buffer.subarray(0, 5).equals(PDF_MAGIC)) {
    return NextResponse.json(
      { error: "O arquivo precisa ser um PDF. Se você fotografou o contrato, converta as fotos para PDF antes de enviar." },
      { status: 422 }
    );
  }

  const hash = createHash("sha256").update(buffer).digest("hex");
  const fileKey = `contratos/${contrato.id}/${randomUUID()}.pdf`;

  try {
    await uploadSignedPdf(fileKey, arrayBuffer);
  } catch (e) {
    console.error("Falha ao armazenar contrato assinado:", e);
    return NextResponse.json(
      { error: "Não foi possível guardar o arquivo agora. Tente novamente em alguns minutos." },
      { status: 502 }
    );
  }

  const novaVersao = (contrato.signedVersion ?? 0) + 1;

  await prisma.$transaction(async (tx) => {
    await tx.contractEvent.create({
      data: {
        id: randomUUID(),
        contractId: contrato.id,
        fromStatus: contrato.status,
        toStatus: "assinado_recebido",
        note: `Enviado pelo proprio paciente. Versao ${novaVersao}. Hash SHA-256: ${hash.slice(0, 16)}...`,
      },
    });

    await tx.contract.update({
      where: { id: contrato.id },
      data: {
        status: "assinado_recebido",
        signedFileKey: fileKey,
        signedFileHash: hash,
        signedFileSizeBytes: file.size,
        signedFileUploadedAt: new Date(),
        signedVersion: novaVersao,
        decisionAt: null,
        refusalReason: null,
      },
    });
  });

  return NextResponse.json({
    success: true,
    message: "Contrato recebido. A Dra. Joane vai conferir e confirmar.",
  });
}
