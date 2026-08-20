/**
 * Dados da area do paciente.
 *
 * REGRA CENTRAL: tudo aqui e filtrado pelo patientId que vem da sessao
 * assinada, nunca por id recebido do cliente. E assim que se evita uma pessoa
 * abrir a ficha de outra.
 *
 * As anotacoes clinicas da Joane NUNCA sao devolvidas. Sao o registro privado
 * dela sobre o caso, com hipoteses diagnosticas, e nao material de leitura do
 * paciente. O select abaixo lista campo a campo justamente para que ninguem
 * exponha isso por descuido ao adicionar um include.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigirPaciente } from "@/lib/paciente-session";

const ROTULO_STATUS: Record<string, string> = {
  pending: "Recebida, aguardando leitura",
  in_review: "Em análise pela Dra. Joane",
  approved: "Análise concluída",
  archived: "Arquivada",
};

const ROTULO_CONTRATO: Record<string, string> = {
  rascunho: "Em preparação",
  gerado: "Pronto para assinatura",
  aguardando_assinatura: "Aguardando sua assinatura",
  assinado_recebido: "Assinado, em conferência",
  aprovado: "Aprovado",
  recusado: "Precisa ser reenviado",
};

export async function GET() {
  const { patientId, erro } = await exigirPaciente();
  if (erro) return erro;

  try {
    const paciente = await prisma.patient.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        cpf: true,
        birthDate: true,
      },
    });

    if (!paciente) {
      return NextResponse.json({ error: "Cadastro não encontrado." }, { status: 404 });
    }

    const submissoes = await prisma.anamnesisSubmission.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      // Sem clinicalNotes de proposito. Ver comentario no topo do arquivo.
      select: {
        id: true,
        status: true,
        createdAt: true,
        answers: true,
        templateSnapshot: true,
        template: { select: { title: true } },
      },
    });

    const contratos = await prisma.contract.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        sessionPriceCents: true,
        frequency: true,
        signedFileUploadedAt: true,
        refusalReason: true,
      },
    });

    return NextResponse.json({
      paciente,
      anamneses: submissoes.map((s) => {
        let respostas: Record<string, unknown> = {};
        let secoes: unknown[] = [];
        try { respostas = JSON.parse(s.answers); } catch {}
        try { secoes = JSON.parse(s.templateSnapshot); } catch {}
        return {
          id: s.id,
          titulo: s.template?.title ?? "Anamnese",
          status: s.status,
          statusLabel: ROTULO_STATUS[s.status] ?? s.status,
          enviadaEm: s.createdAt,
          respostas,
          secoes,
        };
      }),
      contratos: contratos.map((c) => ({
        id: c.id,
        titulo: c.title,
        status: c.status,
        statusLabel: ROTULO_CONTRATO[c.status] ?? c.status,
        criadoEm: c.createdAt,
        valorSessaoCentavos: c.sessionPriceCents,
        periodicidade: c.frequency,
        assinadoEnviadoEm: c.signedFileUploadedAt,
        // O motivo da recusa e util para a pessoa saber o que corrigir.
        motivoRecusa: c.status === "recusado" ? c.refusalReason : null,
      })),
    });
  } catch (e) {
    console.error("Erro na area do paciente:", e);
    return NextResponse.json({ error: "Erro ao carregar seus dados." }, { status: 500 });
  }
}
