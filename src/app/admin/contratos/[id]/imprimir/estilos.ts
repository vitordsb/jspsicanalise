/**
 * CSS do documento imprimivel.
 *
 * Esta pagina renderiza o contrato sozinho no body, sem modal, sem overlay e
 * sem o layout do painel. Isso e proposital: paginacao de impressao quebra
 * quando existe ancestral com overflow, altura fixa, position fixed ou
 * transform, e o modal tinha os quatro. Aqui o fluxo e documento normal, do
 * topo ao fim, e o navegador pagina sozinho.
 */

export const ESTILOS_IMPRESSAO = `
:root { color-scheme: light; }

/* ============ Base (vale na tela e no papel) ============ */
.folha {
  font-family: "Lora", Georgia, "Times New Roman", serif;
  font-size: 11pt;
  line-height: 1.6;
  color: #111;
  text-align: justify;
  hyphens: auto;
  -webkit-hyphens: auto;
}

.folha p { margin: 0 0 0.55em 0; orphans: 3; widows: 3; }
.folha strong { font-weight: 700; }

/* Cabecalho com o logotipo */
.doc-cabecalho {
  text-align: center;
  margin: 0 0 7mm 0;
  padding-bottom: 4mm;
  border-bottom: 1.2pt solid #111;
  break-inside: avoid;
}
.doc-logo {
  display: block;
  margin: 0 auto 3mm auto;
  width: 44mm;
  height: auto;
}
.doc-titulo {
  font-size: 13.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
  margin: 0 0 1mm 0;
}
.doc-subtitulo {
  font-size: 9.5pt;
  text-align: center;
  color: #444;
  margin: 0;
}

/* Blocos de qualificacao das partes */
.bloco-parte {
  border-left: 1.5pt solid #111;
  padding: 1mm 0 1mm 3.5mm;
  margin: 2.5mm 0 3.5mm 0;
  break-inside: avoid;
  text-align: left;
}
.bloco-parte p { margin: 0 0 0.9mm 0; text-align: left; }

/* Linha pontilhada para preenchimento a mao (campo ainda nao informado) */
.a-preencher {
  display: inline-block;
  min-width: 55mm;
  border-bottom: 0.8pt dotted #555;
  height: 1em;
  vertical-align: baseline;
}

.separador { border: 0; border-top: 0.8pt solid #999; margin: 4mm 0; }

/* Clausulas.
   Sem break-inside avoid aqui de proposito: com ele, uma clausula que nao
   coubesse no espaco restante pulava inteira para a folha seguinte e deixava
   um terco da pagina em branco. Em contrato impresso a clausula pode quebrar
   entre paginas. O que nao pode e titulo orfao no pe da folha, e disso cuida
   o break-after do titulo somado a orphans e widows nos paragrafos. */
.clausula { margin: 0 0 4mm 0; }
.clausula-titulo {
  font-size: 10.5pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  text-align: left;
  margin: 0 0 1.2mm 0;
  break-after: avoid;
  page-break-after: avoid;
}

.encerramento { margin-top: 5mm; }
.local-data { text-align: center; margin: 6mm 0 0 0; }

/* Assinaturas: nunca podem ficar orfas numa pagina */
.assinaturas { margin-top: 14mm; break-inside: avoid; page-break-inside: avoid; }
.assinaturas-linha {
  display: flex;
  gap: 14mm;
  justify-content: center;
  margin-bottom: 12mm;
}
.assinatura { flex: 1 1 0; max-width: 78mm; text-align: center; }
.assinatura .risco { border-top: 0.9pt solid #333; margin-top: 16mm; padding-top: 1.5mm; }
.assinatura .nome { font-weight: 700; font-size: 10pt; margin: 0; text-align: center; }
.assinatura .doc { font-size: 8.5pt; color: #444; margin: 0.5mm 0 0 0; text-align: center; }

.rodape-doc {
  margin-top: 8mm;
  padding-top: 2.5mm;
  border-top: 0.6pt solid #bbb;
  text-align: center;
  font-size: 8pt;
  color: #666;
}
.rodape-doc p { text-align: center; margin: 0; }

/* Marca d'agua: position fixed repete em toda pagina impressa */
.marca-dagua {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 108mm;
  height: auto;
  opacity: 0.06;
  pointer-events: none;
  user-select: none;
  z-index: 0;
}

/* ============ Tela: simula a folha para conferencia ============ */
@media screen {
  body { background: #eceaea; margin: 0; padding: 24px 12px 60px; }
  .folha {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    padding: 22mm 20mm;
    background: #fff;
    box-shadow: 0 2px 18px rgba(0, 0, 0, 0.16);
    position: relative;
    overflow: hidden;
  }
  .marca-dagua { position: absolute; }
  .barra-acoes {
    max-width: 210mm;
    margin: 0 auto 14px auto;
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: space-between;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  }
}

/* ============ Impressao ============ */
@media print {
  @page {
    size: A4 portrait;
    margin: 22mm 20mm;
  }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
  }

  /* A folha some como caixa: quem pagina agora e a @page */
  .folha {
    width: auto !important;
    min-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    overflow: visible !important;
    position: static !important;
  }

  .barra-acoes, .nao-imprimir { display: none !important; }

  /* Sem isto o navegador nao imprime a marca d'agua */
  .marca-dagua {
    position: fixed !important;
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
  .doc-logo {
    print-color-adjust: exact !important;
    -webkit-print-color-adjust: exact !important;
  }
}
`;
