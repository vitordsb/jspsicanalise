/**
 * POST /api/admin/contracts/[id]/upload-signed
 *
 * Recebe o PDF fisicamente assinado pelo paciente.
 * Validacoes de seguranca:
 *   - Autenticacao obrigatoria
 *   - Contrato deve estar em status "aguardando_assinatura" ou "recusado"
 *   - Magic bytes: arquivo deve comecar com %PDF- (nao confia no Content-Type)
 *   - Tamanho maximo: 10 MB
 *   - Nome do arquivo no Storage: UUID.pdf (nunca o nome enviado pelo usuario)
 *   - SHA-256 do arquivo armazenado para prova de integridade
 *   - Rate limit: 5 uploads por IP por 10 minutos
 *
 * Transicao de status: -> assinado_recebido
 * Incrementa signedVersion a cada upload bem-sucedido.
 */

import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { createHash, randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-session";
import { uploadSignedPdf } from "@/lib/supabase-storage";
import { isValidTransition, type ContractStatus } from "@/lib/validate";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// Limite de tamanho: 10 MB em bytes
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Magic bytes do PDF (primeiros 5 bytes do arquivo)
const PDF_MAGIC = Buffer.from("%PDF-", "ascii");

// Vercel Functions aceitam ate 100 MB - sem override necessario
// mas documentamos a intencao aqui
export const maxDuration = 30; // segundos

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  // Rate limit: 5 tentativas por IP em 10 minutos
  const ip = getClientIp(req);
  if (!checkRateLimit(`upload-signed:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  const { id } = await params;

  // Busca contrato e valida status
  const contract = await prisma.contract.findUnique({
    where: { id },
    select: { status: true, signedVersion: true },
  });

  if (!contract) {
    return NextResponse.json(
      { error: "Contrato nao encontrado." },
      { status: 404 }
    );
  }

  const fromStatus = contract.status as ContractStatus;
  const toStatus: ContractStatus = "assinado_recebido";

  if (!isValidTransition(fromStatus, toStatus)) {
    return NextResponse.json(
      {
        error: `Upload nao permitido no status atual: "${fromStatus}". Contrato deve estar em "aguardando_assinatura" ou "recusado".`,
      },
      { status: 422 }
    );
  }

  // Leitura do form data (Next.js App Router suporta FormData nativo)
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Corpo da requisicao invalido. Envie multipart/form-data." },
      { status: 400 }
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Campo 'file' ausente ou invalido." },
      { status: 400 }
    );
  }

  // Verifica tamanho antes de ler tudo em memoria
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      {
        error: `Arquivo muito grande: ${(file.size / 1024 / 1024).toFixed(1)} MB. Limite: 10 MB.`,
      },
      { status: 413 }
    );
  }

  // Le o arquivo em memoria para validacao e hash
  const buffer = await file.arrayBuffer();

  // Valida magic bytes - independe da extensao ou Content-Type informado
  const magic = Buffer.from(buffer.slice(0, 5));
  if (!magic.equals(PDF_MAGIC)) {
    return NextResponse.json(
      { error: "Arquivo invalido: nao e um PDF valido (magic bytes incorretos)." },
      { status: 400 }
    );
  }

  // Calcula SHA-256 para prova de integridade
  const hash = createHash("sha256")
    .update(Buffer.from(buffer))
    .digest("hex");

  // Gera chave UUID para o arquivo no Storage (nunca usa nome do usuario)
  const newVersion  = contract.signedVersion + 1;
  const fileKey     = `contratos/${id}/${randomUUID()}.pdf`;

  // Faz upload para Supabase Storage
  try {
    await uploadSignedPdf(fileKey, buffer);
  } catch (err) {
    console.error("Erro no upload para Supabase Storage:", err);
    return NextResponse.json(
      { error: "Falha ao armazenar o arquivo. Tente novamente." },
      { status: 502 }
    );
  }

  // Atualiza contrato e registra evento em transacao
  try {
    // Congela os dados de pagamento no momento em que o contrato assinado
    // chega. Ate aqui o documento lia o PIX das Configuracoes; a partir de
    // agora o que vale e o que estava impresso no papel que a pessoa assinou.
    const contratoAtual = await prisma.contract.findUnique({ where: { id } });
    const pagamentoVazio =
      !contratoAtual?.paymentPixKey?.trim() && !contratoAtual?.paymentBankName?.trim();
    const perfil = pagamentoVazio ? await prisma.user.findFirst() : null;
    const snapshotPagamento = perfil
      ? {
          paymentPixKey:        perfil.pixKey ?? "",
          paymentPixKeyType:    perfil.pixKeyType ?? "",
          paymentPixHolderName: perfil.pixHolderName ?? "",
          paymentBankName:      perfil.bankName ?? "",
          paymentBankAgency:    perfil.bankAgency ?? "",
          paymentBankAccount:   perfil.bankAccount ?? "",
        }
      : {};

    const updated = await prisma.$transaction(async (tx) => {
      // Evento de transicao
      await tx.contractEvent.create({
        data: {
          id:         randomUUID(),
          contractId: id,
          fromStatus,
          toStatus,
          note:       `PDF assinado recebido. Versao ${newVersion}. Hash SHA-256: ${hash.slice(0, 16)}...`,
        },
      });

      return tx.contract.update({
        where: { id },
        data: {
          status:              toStatus,
          signedFileKey:       fileKey,
          signedFileHash:      hash,
          signedFileSizeBytes: file.size,
          signedFileUploadedAt: new Date(),
          signedVersion:       newVersion,
          // Limpa decisao anterior (recusa) ao receber novo arquivo
          decisionAt:    null,
          refusalReason: null,
          ...snapshotPagamento,
        },
        include: {
          events: { orderBy: { createdAt: "asc" } },
        },
      });
    });

    return NextResponse.json(
      {
        message: "PDF recebido com sucesso. Aguardando revisao da Dra. Joane.",
        contractId:   id,
        signedVersion: updated.signedVersion,
        fileHash:     hash,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Erro ao registrar upload no banco:", err);
    return NextResponse.json(
      { error: "Erro interno ao registrar o arquivo." },
      { status: 500 }
    );
  }
}
