"use client";

/**
 * Contrato visto pelo paciente, no mesmo layout de impressao usado no painel.
 * Reaproveita o componente do documento para que o que a pessoa le seja
 * exatamente o que sai no papel.
 */

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ESTILOS_IMPRESSAO } from "@/app/admin/contratos/[id]/imprimir/estilos";
import { TelaCarregando } from "@/components/ui/Carregando";
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

  useEffect(() => {
    let ativo = true;
    (async () => {
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
        const dados = await res.json();
        if (ativo) setContrato(dados);
      } catch {
        if (ativo) setErro("Falha de conexão ao carregar o contrato.");
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => { ativo = false; };
  }, [id, router]);

  if (carregando) return <TelaCarregando mensagem="Abrindo seu contrato..." />;
  if (erro || !contrato) {
    return <p style={{ padding: 32, fontFamily: "system-ui" }}>{erro || "Contrato não encontrado."}</p>;
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ESTILOS_IMPRESSAO }} />

      <div className="barra-acoes nao-imprimir">
        <button
          onClick={() => router.push("/area-do-paciente")}
          style={{
            padding: "9px 16px", borderRadius: 999, border: "1px solid #d8cfcb",
            background: "#fff", cursor: "pointer", fontSize: 13, color: "#5d0c1d",
          }}
        >
          Voltar
        </button>
        <span style={{ fontSize: 12, color: "#6f5f62", flex: 1, textAlign: "center" }}>
          Imprima, assine e envie de volta pela sua área.
        </span>
        <button
          onClick={() => window.print()}
          style={{
            padding: "9px 20px", borderRadius: 999, border: "none",
            background: "#5d0c1d", color: "#fff", cursor: "pointer",
            fontSize: 13, fontWeight: 600,
          }}
        >
          Imprimir / Salvar PDF
        </button>
      </div>

      <DocumentoContrato contrato={contrato} />
    </>
  );
}
