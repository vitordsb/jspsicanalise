"use client";

/**
 * Edicao de um contrato ja existente.
 *
 * Serve tanto para contrato gerado a partir de anamnese quanto para contrato
 * avulso, criado direto para alguem que nao preencheu o formulario do site.
 *
 * Nenhum campo e obrigatorio: o que ficar em branco simplesmente nao aparece
 * no documento impresso, em vez de virar linha pontilhada.
 */

import React, { useState } from "react";
import { Save, X } from "lucide-react";
import { BotaoConteudo } from "@/components/ui/Carregando";

interface Props {
  contract: Record<string, unknown>;
  onCancel: () => void;
  onSaved: () => void;
}

/** Converte centavos para o texto exibido no campo (ex: 20000 -> "200,00"). */
function centavosParaTexto(c: unknown): string {
  const n = typeof c === "number" ? c : 0;
  if (!n) return "";
  return (n / 100).toFixed(2).replace(".", ",");
}

/** Converte o texto digitado de volta para centavos (ex: "200,00" -> 20000). */
function textoParaCentavos(t: string): number | undefined {
  const limpo = t.replace(/\./g, "").replace(",", ".").trim();
  if (!limpo) return undefined;
  const n = Number(limpo);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n * 100);
}

const s = (v: unknown) => (typeof v === "string" ? v : "");
const n = (v: unknown, padrao: number) => (typeof v === "number" ? v : padrao);

export function ContractEditForm({ contract, onCancel, onSaved }: Props) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [f, setF] = useState({
    // Contratante
    patientFullName: s(contract.patientFullName),
    patientCpf: s(contract.patientCpf),
    patientRg: s(contract.patientRg),
    patientNationality: s(contract.patientNationality),
    patientMaritalStatus: s(contract.patientMaritalStatus),
    patientOccupation: s(contract.patientOccupation),
    patientAddress: s(contract.patientAddress),
    // Objeto
    modalidade: s(contract.modalidade) || "online",
    frequency: s(contract.frequency),
    durationMinutes: n(contract.durationMinutes, 50),
    initialSessionsCount: n(contract.initialSessionsCount, 0),
    // Pagamento
    valorSessao: centavosParaTexto(contract.sessionPriceCents),
    paymentMethod: s(contract.paymentMethod),
    paymentDueDay: n(contract.paymentDueDay, 5),
    lateFeePercent: n(contract.lateFeePercent, 0),
    lateInterestPercent: n(contract.lateInterestPercent, 0),
    // Prazos e foro
    cancellationHours: n(contract.cancellationHours, 24),
    rescissionNoticeDays: n(contract.rescissionNoticeDays, 30),
    foroCidade: s(contract.foroCidade),
    hasWitnesses: contract.hasWitnesses === true,
    customClauses: s(contract.customClauses),
  });

  const set = (campo: keyof typeof f, valor: string | number | boolean) =>
    setF((atual) => ({ ...atual, [campo]: valor }));

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSalvando(true);
    setErro("");

    const { valorSessao, ...resto } = f;
    const corpo: Record<string, unknown> = { ...resto };

    const cents = textoParaCentavos(valorSessao);
    if (cents !== undefined) corpo.sessionPriceCents = cents;

    try {
      const res = await fetch(`/api/admin/contracts/${contract.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(corpo),
      });
      if (res.status === 401) {
        window.location.href = "/admin/login";
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setErro(j.error || "Não foi possível salvar as alterações.");
        return;
      }
      onSaved();
    } catch {
      setErro("Falha de conexão ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  const campo =
    "w-full h-10 px-3.5 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none";
  const rotulo = "block text-[11px] font-semibold text-[#241a1c] mb-1";

  return (
    <form onSubmit={salvar} className="space-y-5">
      {erro && (
        <div className="bg-[#fff0f3] border border-[#f3cbc1] text-[#aa2d47] p-3 rounded-2xl text-xs">
          {erro}
        </div>
      )}

      <section className="space-y-3">
        <h4 className="font-serif text-sm font-bold text-[#5d0c1d]">Contratante</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={rotulo} htmlFor="ed-nome">Nome completo</label>
            <input id="ed-nome" className={campo} value={f.patientFullName}
              onChange={(e) => set("patientFullName", e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-cpf">CPF</label>
            <input id="ed-cpf" className={campo} value={f.patientCpf}
              onChange={(e) => set("patientCpf", e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-rg">RG</label>
            <input id="ed-rg" className={campo} value={f.patientRg}
              onChange={(e) => set("patientRg", e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-nac">Nacionalidade</label>
            <input id="ed-nac" className={campo} value={f.patientNationality}
              onChange={(e) => set("patientNationality", e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-ec">Estado civil</label>
            <input id="ed-ec" className={campo} value={f.patientMaritalStatus}
              onChange={(e) => set("patientMaritalStatus", e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-prof">Profissão</label>
            <input id="ed-prof" className={campo} value={f.patientOccupation}
              onChange={(e) => set("patientOccupation", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={rotulo} htmlFor="ed-end">Endereço</label>
            <input id="ed-end" className={campo} value={f.patientAddress}
              onChange={(e) => set("patientAddress", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-[#f3e4e0] pt-4">
        <h4 className="font-serif text-sm font-bold text-[#5d0c1d]">Atendimento</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={rotulo} htmlFor="ed-mod">Modalidade</label>
            <select id="ed-mod" className={campo} value={f.modalidade}
              onChange={(e) => set("modalidade", e.target.value)}>
              <option value="presencial">Presencial</option>
              <option value="online">Online</option>
              <option value="hibrido">Híbrido</option>
            </select>
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-freq">Periodicidade</label>
            <input id="ed-freq" className={campo} value={f.frequency}
              onChange={(e) => set("frequency", e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-dur">Duração da sessão (minutos)</label>
            <input id="ed-dur" type="number" min={1} max={300} className={campo}
              value={f.durationMinutes}
              onChange={(e) => set("durationMinutes", Number(e.target.value))} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-aval">Sessões de avaliação inicial</label>
            <input id="ed-aval" type="number" min={0} max={20} className={campo}
              value={f.initialSessionsCount}
              onChange={(e) => set("initialSessionsCount", Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-[#f3e4e0] pt-4">
        <h4 className="font-serif text-sm font-bold text-[#5d0c1d]">Honorários</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={rotulo} htmlFor="ed-valor">Valor da sessão (R$)</label>
            <input id="ed-valor" inputMode="decimal" placeholder="200,00" className={campo}
              value={f.valorSessao}
              onChange={(e) => set("valorSessao", e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-venc">Dia do vencimento</label>
            <input id="ed-venc" type="number" min={1} max={28} className={campo}
              value={f.paymentDueDay}
              onChange={(e) => set("paymentDueDay", Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <label className={rotulo} htmlFor="ed-forma">Forma de pagamento</label>
            <input id="ed-forma" className={campo} value={f.paymentMethod}
              onChange={(e) => set("paymentMethod", e.target.value)} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-multa">Multa por atraso (%)</label>
            <input id="ed-multa" type="number" min={0} max={20} className={campo}
              value={f.lateFeePercent}
              onChange={(e) => set("lateFeePercent", Number(e.target.value))} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-juros">Juros ao mês (%)</label>
            <input id="ed-juros" type="number" min={0} max={10} className={campo}
              value={f.lateInterestPercent}
              onChange={(e) => set("lateInterestPercent", Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="space-y-3 border-t border-[#f3e4e0] pt-4">
        <h4 className="font-serif text-sm font-bold text-[#5d0c1d]">Prazos e disposições</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={rotulo} htmlFor="ed-canc">Aviso de cancelamento (horas)</label>
            <input id="ed-canc" type="number" min={0} max={168} className={campo}
              value={f.cancellationHours}
              onChange={(e) => set("cancellationHours", Number(e.target.value))} />
          </div>
          <div>
            <label className={rotulo} htmlFor="ed-resc">Aviso de rescisão (dias)</label>
            <input id="ed-resc" type="number" min={0} max={180} className={campo}
              value={f.rescissionNoticeDays}
              onChange={(e) => set("rescissionNoticeDays", Number(e.target.value))} />
          </div>
          <div className="sm:col-span-2">
            <label className={rotulo} htmlFor="ed-foro">Comarca do foro</label>
            <input id="ed-foro" className={campo} value={f.foroCidade}
              placeholder="Sem preenchimento, a cláusula de foro não entra no contrato"
              onChange={(e) => set("foroCidade", e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input id="ed-test" type="checkbox" checked={f.hasWitnesses}
              onChange={(e) => set("hasWitnesses", e.target.checked)}
              className="w-4 h-4 accent-[#5d0c1d]" />
            <label htmlFor="ed-test" className="text-xs text-[#241a1c]">
              Incluir linhas de assinatura para duas testemunhas
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className={rotulo} htmlFor="ed-clausulas">Cláusulas adicionais</label>
            <textarea id="ed-clausulas" rows={4}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-[#eae2d7] bg-[#f7efe5] text-xs text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              value={f.customClauses}
              onChange={(e) => set("customClauses", e.target.value)} />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-2 border-t border-[#f3e4e0] pt-4">
        <button type="button" onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#eae2d7] text-[#6f5f62] text-xs font-semibold hover:bg-[#fbf3ef] transition">
          <X className="w-4 h-4" />
          <span>Cancelar</span>
        </button>
        <button type="submit" disabled={salvando}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-semibold shadow-xs transition">
          <BotaoConteudo carregando={salvando} rotuloCarregando="Salvando...">
            <Save className="w-4 h-4" />
            <span>Salvar alterações</span>
          </BotaoConteudo>
        </button>
      </div>
    </form>
  );
}
