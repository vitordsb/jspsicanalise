"use client";

/**
 * Contrato visto pelo paciente, no mesmo layout de impressao usado no painel.
 * O que a pessoa le na tela e exatamente o que sai no papel, e e exatamente o
 * texto que sera congelado na assinatura.
 *
 * A assinatura so libera quando o documento foi rolado ate o fim. Nao e
 * burocracia: e a diferenca entre a pessoa ter tido a chance de ler e ter
 * clicado num botao que apareceu antes do texto.
 */

import { useEffect, useState, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ShieldCheck } from "lucide-react";
import { ESTILOS_IMPRESSAO } from "@/app/admin/contratos/[id]/imprimir/estilos";
import { TelaCarregando } from "@/components/ui/Carregando";
import { AssinarContrato } from "@/components/paciente/AssinarContrato";
import { formatarDataHora } from "@/lib/agenda";
import {
  DocumentoContrato,
  type ContratoImpressao,
} from "@/components/contrato/DocumentoContrato";

export default function ContratoDoPacientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [contrato, setContrato] = useState<ContratoImpressao | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [leuAteOFim, setLeuAteOFim] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/paciente/contratos/${id}`);
      if (res.status === 401) {
        router.push("/area-do-paciente/entrar");
        return;
      }
      if (!res.ok) {
        setErro("Não foi possível carregar o contrato.");
        return;
      }
      setContrato(await res.json());
    } catch {
      setErro("Falha de conexão ao carregar o contrato.");
    } finally {
      setCarregando(false);
    }
  }, [id, router]);

  useEffect(() => { carregar(); }, [carregar]);

  const podeAssinar = contrato?.status === "aguardando_assinatura" && !contrato?.signedAt;

  // Acompanha a rolagem para liberar a assinatura. A margem de 120px evita
  // que um documento curto, que cabe inteiro na tela, fique travado para
  // sempre por nunca ter rolagem.
  useEffect(() => {
    if (!podeAssinar) return;
    const medir = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      if (total <= 120) { setLeuAteOFim(true); setProgresso(1); return; }
      const lido = Math.min(1, Math.max(0, window.scrollY / total));
      setProgresso(lido);
      if (lido > 0.9) setLeuAteOFim(true);
    };
    medir();
    window.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", medir);
    return () => {
      window.removeEventListener("scroll", medir);
      window.removeEventListener("resize", medir);
    };
  }, [podeAssinar, contrato]);

  if (carregando) return <TelaCarregando mensagem="Abrindo seu contrato..." />;
  if (erro || !contrato) {
    return <p style={{ padding: 32, fontFamily: "system-ui" }}>{erro || "Contrato não encontrado."}</p>;
  }

  const assinado = Boolean(contrato.signedAt);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ESTILOS_IMPRESSAO }} />

      <div className="barra-acoes nao-imprimir">
        <button onClick={() => router.push("/area-do-paciente")} style={botaoVoltar}>
          Voltar
        </button>

        <span style={{ fontSize: 12, color: "#6f5f62", flex: 1, textAlign: "center" }}>
          {assinado ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#245f3c", fontWeight: 600 }}>
              <ShieldCheck size={14} />
              Assinado em {formatarDataHora(contrato.signedAt!)}
              {contrato.verificationCode ? ` · ${contrato.verificationCode}` : ""}
            </span>
          ) : podeAssinar ? (
            "Leia o contrato até o fim para assinar."
          ) : (
            "Imprima, assine e envie de volta pela sua área."
          )}
        </span>

        <button onClick={() => window.print()} style={botaoImprimir}>
          {assinado ? "Baixar PDF assinado" : "Imprimir / Salvar PDF"}
        </button>
      </div>

      <DocumentoContrato contrato={contrato} />

      {podeAssinar && (
        <>
          <AssinarContrato
            contratoId={id}
            liberado={leuAteOFim}
            aoAssinar={() => { setCarregando(true); carregar(); window.scrollTo(0, 0); }}
          />

          {/* Barra fixa enquanto a pessoa le: mostra o quanto falta e leva
              direto ao formulario quando libera. Sem ela, num contrato longo
              no celular, a assinatura fica escondida la embaixo. */}
          {!leuAteOFim && (
            <div className="nao-imprimir" style={barraProgresso}>
              <div style={{ flex: 1 }}>
                <div style={trilho}>
                  <div style={{ ...preenchimento, width: `${Math.round(progresso * 100)}%` }} />
                </div>
                <p style={legendaProgresso}>
                  Você leu {Math.round(progresso * 100)}% do contrato
                </p>
              </div>
              <button
                onClick={() => document.getElementById("assinar")?.scrollIntoView({ behavior: "smooth" })}
                style={botaoIrAoFim}
              >
                <ArrowDown size={14} />
                Ir ao fim
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

const botaoVoltar: React.CSSProperties = {
  padding: "9px 16px", borderRadius: 999, border: "1px solid #d8cfcb",
  background: "#fff", cursor: "pointer", fontSize: 13, color: "#5d0c1d",
};
const botaoImprimir: React.CSSProperties = {
  padding: "9px 20px", borderRadius: 999, border: "none",
  background: "#5d0c1d", color: "#fff", cursor: "pointer",
  fontSize: 13, fontWeight: 600,
};
const barraProgresso: React.CSSProperties = {
  position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
  background: "rgba(255,255,255,0.97)", borderTop: "1px solid #f0ded8",
  padding: "10px 16px", display: "flex", alignItems: "center", gap: 14,
  fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
  backdropFilter: "blur(6px)",
};
const trilho: React.CSSProperties = {
  height: 5, background: "#f0ded8", borderRadius: 999, overflow: "hidden",
};
const preenchimento: React.CSSProperties = {
  height: "100%", background: "#5d0c1d", borderRadius: 999,
  transition: "width 120ms linear",
};
const legendaProgresso: React.CSSProperties = {
  margin: "5px 0 0 0", fontSize: 11, color: "#6f5f62",
};
const botaoIrAoFim: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
  padding: "9px 16px", borderRadius: 999, border: "1px solid #5d0c1d",
  background: "#fff", color: "#5d0c1d", fontSize: 12.5, fontWeight: 700,
  cursor: "pointer", fontFamily: "inherit",
};
