"use client";

/**
 * Assinatura eletronica do contrato pelo paciente.
 *
 * O atrito aqui e proposital. A pessoa ja esta logada e o sistema ja sabe o
 * nome e o CPF dela, entao seria facil preencher tudo e deixar um botao
 * "Assinar". Nao serve: assinatura precisa ser ato deliberado, e digitar o
 * proprio nome e reconferir o codigo e o que separa "cliquei sem ver" de
 * "quis assinar". E o mesmo motivo de o botao so liberar depois que o texto
 * foi rolado ate o fim.
 *
 * Nenhuma dessas checagens e a defesa de verdade: o servidor reconfere nome,
 * CPF e codigo. Aqui elas existem para a experiencia ser honesta.
 */

import React, { useState } from "react";
import { PenLine, ShieldCheck, AlertTriangle, Check, Copy } from "lucide-react";
import { Spinner } from "@/components/ui/Carregando";
import { useToast } from "@/components/ui/Toast";
import { formatarDataHora } from "@/lib/agenda";

function mascararCpf(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function AssinarContrato({
  contratoId,
  liberado,
  aoAssinar,
}: {
  contratoId: string;
  /** Falso enquanto o texto nao foi rolado ate o fim. */
  liberado: boolean;
  aoAssinar: () => void;
}) {
  const toast = useToast();
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [codigo, setCodigo] = useState("");
  const [aceite, setAceite] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [recibo, setRecibo] = useState<{ assinadoEm: string; codigo: string } | null>(null);

  const podeEnviar =
    liberado && aceite && nome.trim().length > 4 &&
    cpf.replace(/\D/g, "").length === 11 && codigo.replace(/\D/g, "").length === 8;

  const assinar = async () => {
    setSalvando(true);
    setErro("");
    try {
      const res = await fetch(`/api/paciente/contratos/${contratoId}/assinar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, cpf, codigo, aceite }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErro(d.error || "Não foi possível assinar.");
        toast.erro(d.error || "Não foi possível assinar o contrato.");
        return;
      }
      setRecibo({ assinadoEm: d.assinadoEm, codigo: d.codigoVerificacao });
      toast.sucesso("Contrato assinado. Você recebeu um comprovante por e-mail.");
    } catch {
      setErro("Falha de conexão. Verifique sua internet e tente de novo.");
    } finally {
      setSalvando(false);
    }
  };

  if (recibo) {
    return (
      <div className="nao-imprimir" style={caixa}>
        <div style={{ textAlign: "center" }}>
          <div style={circuloOk}><Check size={26} strokeWidth={3} color="#fff" /></div>
          <h2 style={{ ...titulo, marginTop: 14 }}>Contrato assinado</h2>
          <p style={{ ...texto, marginTop: 6 }}>
            Assinado em {formatarDataHora(recibo.assinadoEm)}.
          </p>
        </div>

        <div style={blocoCodigo}>
          <p style={rotuloPequeno}>Código de verificação</p>
          <p style={valorCodigo}>{recibo.codigo}</p>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(recibo.codigo);
              toast.sucesso("Código copiado.");
            }}
            style={botaoLink}
          >
            <Copy size={13} /> Copiar
          </button>
        </div>

        <p style={{ ...texto, textAlign: "center" }}>
          Guarde este código. Ele identifica o conteúdo exato do que você assinou:
          qualquer alteração no documento produziria um código diferente.
        </p>

        <button onClick={aoAssinar} style={botaoPrimario}>
          Ver o contrato assinado
        </button>
      </div>
    );
  }

  return (
    <div className="nao-imprimir" style={caixa} id="assinar">
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <PenLine size={20} color="#5d0c1d" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <h2 style={titulo}>Assinar este contrato</h2>
          <p style={{ ...texto, marginTop: 4 }}>
            Preencha os campos abaixo para assinar eletronicamente. Vale como
            assinatura entre você e a Dra. Joane.
          </p>
        </div>
      </div>

      {!liberado && (
        <div style={avisoAmarelo}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Role o contrato até o fim para liberar a assinatura.</span>
        </div>
      )}

      <label style={rotulo}>
        Seu nome completo
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Como está no seu documento"
          autoComplete="name"
          disabled={!liberado || salvando}
          style={campo}
        />
      </label>

      <label style={rotulo}>
        Seu CPF
        <input
          value={cpf}
          onChange={(e) => setCpf(mascararCpf(e.target.value))}
          placeholder="000.000.000-00"
          inputMode="numeric"
          disabled={!liberado || salvando}
          style={campo}
        />
      </label>

      <label style={rotulo}>
        Seu código de acesso
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 8))}
          placeholder="8 números"
          inputMode="numeric"
          disabled={!liberado || salvando}
          style={{ ...campo, letterSpacing: "0.2em", fontFamily: "monospace" }}
        />
      </label>

      <label style={linhaAceite}>
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          disabled={!liberado || salvando}
          style={{ marginTop: 3, flexShrink: 0, width: 16, height: 16, accentColor: "#5d0c1d" }}
        />
        <span style={{ ...texto, fontSize: 12.5 }}>
          Declaro que li o contrato acima na íntegra, que concordo com todas as suas
          cláusulas e que sou a pessoa identificada como CONTRATANTE. Reconheço esta
          assinatura eletrônica como válida, nos termos da Lei 14.063/2020.
        </span>
      </label>

      {erro && (
        <div style={avisoVermelho}>
          <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{erro}</span>
        </div>
      )}

      <button onClick={assinar} disabled={!podeEnviar || salvando} style={{
        ...botaoPrimario,
        opacity: !podeEnviar || salvando ? 0.5 : 1,
        cursor: !podeEnviar || salvando ? "not-allowed" : "pointer",
      }}>
        {salvando ? <Spinner tamanho="sm" /> : <PenLine size={16} />}
        {salvando ? "Assinando..." : "Assinar contrato"}
      </button>

      <p style={rodapeSeguranca}>
        <ShieldCheck size={13} style={{ flexShrink: 0 }} />
        <span>
          Registramos a data, a hora e o texto exato do que você assinou. Seu código
          de acesso não fica guardado em lugar nenhum.
        </span>
      </p>
    </div>
  );
}

// Estilos inline porque esta tela carrega a folha de estilo do documento
// impresso, que nao tem as classes do Tailwind da aplicacao.
const caixa: React.CSSProperties = {
  maxWidth: 560, margin: "22px auto 60px auto", background: "#fff",
  border: "1px solid #f0ded8", borderRadius: 20, padding: 24,
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  display: "flex", flexDirection: "column", gap: 14,
  boxShadow: "0 2px 18px rgba(0,0,0,0.06)",
};
const titulo: React.CSSProperties = {
  margin: 0, fontSize: 17, fontWeight: 700, color: "#5d0c1d",
  fontFamily: "Georgia, serif",
};
const texto: React.CSSProperties = {
  margin: 0, fontSize: 13, lineHeight: 1.55, color: "#4a3f41",
};
const rotulo: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 5,
  fontSize: 12, fontWeight: 600, color: "#5d0c1d",
};
const campo: React.CSSProperties = {
  padding: "11px 13px", borderRadius: 12, border: "1px solid #e6d8d3",
  fontSize: 14, fontWeight: 400, color: "#241a1c", outline: "none",
  fontFamily: "inherit", background: "#fff",
};
const linhaAceite: React.CSSProperties = {
  display: "flex", gap: 9, alignItems: "flex-start", cursor: "pointer",
  background: "#fbf3ef", padding: 13, borderRadius: 14,
  border: "1px solid #f0ded8",
};
const botaoPrimario: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
  padding: "13px 22px", borderRadius: 999, border: "none",
  background: "#5d0c1d", color: "#fff", fontSize: 14, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
};
const botaoLink: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, background: "none",
  border: "none", color: "#5d0c1d", fontSize: 12, fontWeight: 600,
  cursor: "pointer", padding: 0, marginTop: 8, fontFamily: "inherit",
};
const avisoAmarelo: React.CSSProperties = {
  display: "flex", gap: 7, alignItems: "flex-start", background: "#fffbeb",
  border: "1px solid #fde68a", color: "#78350f", padding: 11,
  borderRadius: 12, fontSize: 12.5, lineHeight: 1.5,
};
const avisoVermelho: React.CSSProperties = {
  display: "flex", gap: 7, alignItems: "flex-start", background: "#fff0f3",
  border: "1px solid #f3cbc1", color: "#aa2d47", padding: 11,
  borderRadius: 12, fontSize: 12.5, lineHeight: 1.5,
};
const circuloOk: React.CSSProperties = {
  width: 52, height: 52, borderRadius: "50%", background: "#245f3c",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
};
const blocoCodigo: React.CSSProperties = {
  background: "#fbf3ef", border: "1px solid #f0ded8", borderRadius: 14,
  padding: 16, textAlign: "center",
};
const rotuloPequeno: React.CSSProperties = {
  margin: 0, fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.08em",
  color: "#9c8b8e", fontWeight: 700,
};
const valorCodigo: React.CSSProperties = {
  margin: "6px 0 0 0", fontSize: 22, fontWeight: 700, color: "#5d0c1d",
  fontFamily: "'Courier New', monospace", letterSpacing: "0.12em",
};
const rodapeSeguranca: React.CSSProperties = {
  display: "flex", gap: 6, alignItems: "flex-start", margin: 0,
  fontSize: 11, lineHeight: 1.5, color: "#9c8b8e",
};
