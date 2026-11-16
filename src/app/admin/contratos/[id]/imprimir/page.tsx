"use client";

/**
 * Página dedicada de impressão do contrato (painel da Joane).
 *
 * Renderiza o documento sozinho, sem modal e sem o layout do painel, para que
 * o navegador pagine corretamente. Protegida pelo proxy.ts, que ja cobre /admin.
 */

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ESTILOS_IMPRESSAO } from "./estilos";
import { TelaCarregando } from "@/components/ui/Carregando";
import {
  DocumentoContrato,
  pendenciasDoContrato,
  type ContratoImpressao,
} from "@/components/contrato/DocumentoContrato";

export default function ImprimirContratoPage({
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
        const res = await fetch(`/api/admin/contracts/${id}`);
        if (res.status === 401) {
          router.push("/admin/login");
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

  if (carregando) {
    return <TelaCarregando mensagem="Preparando o contrato para impressão..." />;
  }
  if (erro || !contrato) {
    return <p style={{ padding: 32, fontFamily: "system-ui" }}>{erro || "Contrato não encontrado."}</p>;
  }

  const pendencias = pendenciasDoContrato(contrato);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ESTILOS_IMPRESSAO }} />

      <div className="barra-acoes nao-imprimir">
        <button
          onClick={() => router.back()}
          style={{
            padding: "9px 16px", borderRadius: 999, border: "1px solid var(--color-outline)",
            background: "#fff", cursor: "pointer", fontSize: 13, color: "var(--color-primary)",
          }}
        >
          Voltar
        </button>
        {pendencias.length > 0 && (
          <span style={{ fontSize: 12, color: "var(--color-tertiary-dark)", flex: 1, textAlign: "center" }}>
            Não preenchido no painel, então fica de fora do documento: {pendencias.join(", ")}.
          </span>
        )}
        <button
          onClick={() => window.print()}
          style={{
            padding: "9px 20px", borderRadius: 999, border: "none",
            background: "var(--color-primary)", color: "#fff", cursor: "pointer",
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
