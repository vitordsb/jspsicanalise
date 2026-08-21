"use client";

/**
 * Area do paciente.
 *
 * Mostra o andamento da anamnese, as proprias respostas, e os contratos com a
 * possibilidade de imprimir e devolver assinado.
 *
 * As anotacoes clinicas da Joane nao chegam aqui: a API nem as devolve.
 */

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HeartHandshake, LogOut, FileText, Upload, CheckCircle2,
  Clock, AlertTriangle, Printer, ChevronDown,
} from "lucide-react";
import { formatDateTime, formatCurrency, formatCPF } from "@/lib/formatters";
import { TelaCarregando, BotaoConteudo } from "@/components/ui/Carregando";
import { Agendamento } from "@/components/paciente/Agendamento";

interface Anamnese {
  id: string;
  titulo: string;
  status: string;
  statusLabel: string;
  enviadaEm: string;
  respostas: Record<string, unknown>;
  secoes: { id: string; title: string; questions: { id: string; label: string }[] }[];
}

interface Contrato {
  id: string;
  titulo: string;
  status: string;
  statusLabel: string;
  criadoEm: string;
  valorSessaoCentavos: number;
  periodicidade: string;
  assinadoEnviadoEm: string | null;
  motivoRecusa: string | null;
}

interface Dados {
  paciente: { fullName: string; cpf: string; email: string; phone: string };
  anamneses: Anamnese[];
  contratos: Contrato[];
}

const COR_STATUS: Record<string, string> = {
  pending: "bg-[#f8dad2] text-[#5d0c1d] border-[#f0ded8]",
  in_review: "bg-[#edf8fe] text-[#1e5b7a] border-[#cbe4f7]",
  approved: "bg-[#e7f4ec] text-[#245f3c] border-[#c7e6d2]",
  archived: "bg-[#f0edea] text-[#6f5f62] border-[#e5ded9]",
  rascunho: "bg-[#f0edea] text-[#6f5f62] border-[#e5ded9]",
  gerado: "bg-[#edf8fe] text-[#1e5b7a] border-[#cbe4f7]",
  aguardando_assinatura: "bg-[#fffbeb] text-[#92400e] border-[#fde68a]",
  assinado_recebido: "bg-[#f3edfb] text-[#5b3a8e] border-[#ddd0f0]",
  aprovado: "bg-[#e7f4ec] text-[#245f3c] border-[#c7e6d2]",
  recusado: "bg-[#fff0f3] text-[#aa2d47] border-[#f3cbc1]",
};

export default function AreaDoPacientePage() {
  const router = useRouter();
  const [dados, setDados] = useState<Dados | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [aberta, setAberta] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch("/api/paciente/me");
      if (res.status === 401) {
        router.push("/area-do-paciente/entrar");
        return;
      }
      if (!res.ok) {
        setErro("Não foi possível carregar seus dados.");
        return;
      }
      setDados(await res.json());
    } catch {
      setErro("Falha de conexão.");
    } finally {
      setCarregando(false);
    }
  }, [router]);

  useEffect(() => { carregar(); }, [carregar]);

  const sair = async () => {
    await fetch("/api/paciente/logout", { method: "POST" });
    router.push("/area-do-paciente/entrar");
  };

  if (carregando) return <TelaCarregando mensagem="Carregando suas informações..." />;
  if (erro || !dados) {
    return <p className="p-8 text-sm text-[#6f5f62]">{erro || "Nada encontrado."}</p>;
  }

  const primeiroNome = dados.paciente.fullName.split(" ")[0];

  // Prazo de 24 horas contado da anamnese mais recente. So aparece enquanto a
  // ficha esta pendente e nao ha consulta marcada.
  const pendente = dados.anamneses.find((a) => a.status === "pending");
  const restanteMs = pendente
    ? new Date(pendente.enviadaEm).getTime() + 24 * 3600_000 - Date.now()
    : 0;
  const prazoRestante =
    pendente && restanteMs > 0
      ? restanteMs > 3600_000
        ? `${Math.floor(restanteMs / 3600_000)} horas`
        : `${Math.max(1, Math.floor(restanteMs / 60_000))} minutos`
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6f4]">
      <header className="bg-white border-b border-[#f0ded8]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-[#5d0c1d] to-[#aa2d47] flex items-center justify-center text-white">
              <HeartHandshake className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-sm font-bold text-[#5d0c1d] truncate">
                Olá, {primeiroNome}
              </p>
              <p className="text-[11px] text-[#6f5f62] truncate">
                CPF {formatCPF(dados.paciente.cpf)}
              </p>
            </div>
          </div>
          <button
            onClick={sair}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold text-[#6f5f62] hover:bg-[#fbf3ef] transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-7 space-y-7">
        {/* AGENDAMENTO
            Vem primeiro porque e a acao pendente mais urgente: sem consulta
            marcada, a ficha e removida em 24 horas. */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#5d0c1d]">Sua consulta</h2>
          {prazoRestante && (
            <div className="bg-[#fffbeb] border border-[#fde68a] rounded-3xl p-4 text-xs text-[#78350f] flex items-start gap-2">
              <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              <p>
                <strong>Marque sua consulta em até {prazoRestante}.</strong> Sem
                agendamento, sua ficha é removida e você precisará preencher de novo.
              </p>
            </div>
          )}
          <Agendamento aoMudar={carregar} />
        </section>

        {/* ANAMNESES */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#5d0c1d]">Sua ficha</h2>

          {dados.anamneses.length === 0 ? (
            <p className="text-sm text-[#6f5f62] bg-white border border-[#f0ded8] rounded-3xl p-5">
              Você ainda não enviou uma ficha de anamnese.
            </p>
          ) : (
            dados.anamneses.map((a) => (
              <div key={a.id} className="bg-white border border-[#f0ded8] rounded-3xl overflow-hidden">
                <div className="p-5 space-y-2">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-serif font-bold text-sm text-[#241a1c]">{a.titulo}</p>
                      <p className="text-[11px] text-[#9c8b8e] mt-0.5">
                        Enviada em {formatDateTime(a.enviadaEm)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${COR_STATUS[a.status] ?? ""}`}>
                      {a.statusLabel}
                    </span>
                  </div>

                  <button
                    onClick={() => setAberta(aberta === a.id ? null : a.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5d0c1d] hover:underline"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${aberta === a.id ? "rotate-180" : ""}`} />
                    <span>{aberta === a.id ? "Ocultar minhas respostas" : "Ver minhas respostas"}</span>
                  </button>
                </div>

                {aberta === a.id && (
                  <div className="border-t border-[#f3e4e0] bg-[#fdfbf9] p-5 space-y-4">
                    {a.secoes.map((sec) => (
                      <div key={sec.id} className="space-y-2">
                        <p className="font-serif font-bold text-xs text-[#5d0c1d]">{sec.title}</p>
                        {sec.questions.map((q) => {
                          const r = a.respostas[q.id];
                          const texto = Array.isArray(r) ? r.join(", ") : r ? String(r) : "";
                          if (!texto) return null;
                          return (
                            <div key={q.id} className="text-xs">
                              <p className="text-[#9c8b8e]">{q.label}</p>
                              <p className="text-[#241a1c] mt-0.5">{texto}</p>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </section>

        {/* CONTRATOS */}
        <section className="space-y-3">
          <h2 className="font-serif text-lg font-bold text-[#5d0c1d]">Contrato</h2>

          {dados.contratos.length === 0 ? (
            <p className="text-sm text-[#6f5f62] bg-white border border-[#f0ded8] rounded-3xl p-5">
              Ainda não há contrato emitido. A Dra. Joane avisa quando estiver pronto.
            </p>
          ) : (
            dados.contratos.map((c) => (
              <CartaoContrato key={c.id} contrato={c} aoEnviar={carregar} />
            ))
          )}
        </section>
      </main>
    </div>
  );
}

/** Cartao de um contrato, com impressao e envio do assinado. */
function CartaoContrato({ contrato, aoEnviar }: { contrato: Contrato; aoEnviar: () => void }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState("");
  const [falhou, setFalhou] = useState(false);

  const podeEnviar =
    contrato.status === "aguardando_assinatura" ||
    contrato.status === "recusado" ||
    contrato.status === "gerado";

  const enviar = async () => {
    if (!arquivo) return;
    setEnviando(true);
    setMsg("");
    setFalhou(false);
    try {
      const fd = new FormData();
      fd.append("file", arquivo);
      const res = await fetch(`/api/paciente/contratos/${contrato.id}/upload-signed`, {
        method: "POST",
        body: fd,
      });
      const dados = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFalhou(true);
        setMsg(dados.error || "Não foi possível enviar o arquivo.");
        return;
      }
      setMsg(dados.message || "Contrato recebido.");
      setArquivo(null);
      aoEnviar();
    } catch {
      setFalhou(true);
      setMsg("Falha de conexão ao enviar.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="bg-white border border-[#f0ded8] rounded-3xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-serif font-bold text-sm text-[#241a1c]">{contrato.titulo}</p>
          <p className="text-[11px] text-[#9c8b8e] mt-0.5">
            {formatCurrency(contrato.valorSessaoCentavos / 100)} por sessão
            {contrato.periodicidade ? ` - ${contrato.periodicidade}` : ""}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-[11px] font-semibold border ${COR_STATUS[contrato.status] ?? ""}`}>
          {contrato.statusLabel}
        </span>
      </div>

      {contrato.motivoRecusa && (
        <div className="bg-[#fff0f3] border border-[#f3cbc1] text-[#aa2d47] p-3.5 rounded-2xl text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Precisamos que você reenvie</p>
            <p className="mt-0.5">{contrato.motivoRecusa}</p>
          </div>
        </div>
      )}

      {contrato.status === "assinado_recebido" && (
        <div className="bg-[#f3edfb] border border-[#ddd0f0] text-[#5b3a8e] p-3.5 rounded-2xl text-xs flex items-center gap-2">
          <Clock className="w-4 h-4 shrink-0" />
          <span>
            Recebemos seu contrato
            {contrato.assinadoEnviadoEm ? ` em ${formatDateTime(contrato.assinadoEnviadoEm)}` : ""}.
            A Dra. Joane vai conferir.
          </span>
        </div>
      )}

      {contrato.status === "aprovado" && (
        <div className="bg-[#e7f4ec] border border-[#c7e6d2] text-[#245f3c] p-3.5 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Contrato aprovado. Tudo certo.</span>
        </div>
      )}

      <a
        href={`/area-do-paciente/contrato/${contrato.id}`}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs font-semibold transition"
      >
        <Printer className="w-4 h-4" />
        <span>Ler e imprimir o contrato</span>
      </a>

      {podeEnviar && (
        <div className="border-t border-[#f3e4e0] pt-4 space-y-3">
          <div className="flex items-start gap-2 text-[11px] text-[#6f5f62] leading-relaxed">
            <FileText className="w-4 h-4 shrink-0 mt-0.5 text-[#ccb38d]" />
            <p>
              Depois de imprimir e assinar, escaneie ou fotografe o contrato, salve
              em PDF e envie aqui. O arquivo precisa ter no máximo 10 MB.
            </p>
          </div>

          {msg && (
            <div
              className={`p-3.5 rounded-2xl text-xs ${
                falhou
                  ? "bg-[#fff0f3] border border-[#f3cbc1] text-[#aa2d47]"
                  : "bg-[#e7f4ec] border border-[#c7e6d2] text-[#245f3c]"
              }`}
            >
              {msg}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#eae2d7] text-[#5d0c1d] text-xs font-semibold cursor-pointer hover:bg-[#fbf3ef] transition">
              <Upload className="w-4 h-4" />
              <span>{arquivo ? arquivo.name.slice(0, 28) : "Escolher arquivo PDF"}</span>
              <input
                type="file"
                accept="application/pdf"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setMsg("");
                  setFalhou(false);
                  if (f && f.type !== "application/pdf") {
                    setFalhou(true);
                    setMsg("O arquivo precisa estar em PDF.");
                    return;
                  }
                  setArquivo(f);
                }}
              />
            </label>

            {arquivo && (
              <button
                onClick={enviar}
                disabled={enviando}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] disabled:opacity-70 text-white text-xs font-semibold transition"
              >
                <BotaoConteudo carregando={enviando} rotuloCarregando="Enviando...">
                  <Upload className="w-4 h-4" />
                  <span>Enviar assinado</span>
                </BotaoConteudo>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
