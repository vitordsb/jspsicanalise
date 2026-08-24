/**
 * E-mails da plataforma.
 *
 * Duas plateias, com regras diferentes:
 *
 * - Para a Joane vai so o aviso de que chegou ficha nova, sem dado nenhum de
 *   paciente. E-mail nao e canal seguro: fica guardado em servidor de
 *   terceiro e pode ser lido na tela de um celular por quem estiver por
 *   perto. Quem quer saber de quem e a ficha entra no painel.
 *
 * - Para o paciente vai o que e dele: o horario da propria consulta e o
 *   proprio codigo de acesso. Continua fora daqui qualquer conteudo clinico.
 *
 * Sem SMTP configurado nada e enviado e o sistema segue normalmente. Todo
 * e-mail daqui e conveniencia, nunca parte obrigatoria de um fluxo: uma falha
 * de envio nao pode derrubar uma anamnese nem desmarcar uma consulta.
 */

import nodemailer from "nodemailer";
import { formatarDataHora } from "./agenda";
import { formatarToken } from "./paciente-auth";

/** URL publica da aplicacao, para os links apontarem para o lugar certo. */
function getAppUrl(): string {
  const explicita = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicita) return explicita.replace(/\/$/, "");
  // Na Vercel, VERCEL_URL vem sem protocolo.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export interface ResultadoEnvio {
  success: boolean;
  simulated?: boolean;
  messageId?: string;
  error?: unknown;
}

/** Escapa texto que vai para dentro do HTML. Nome de paciente e entrada livre. */
function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** So o primeiro nome, para a saudacao nao ficar formal demais. */
function primeiroNome(nome: string): string {
  return (nome || "").trim().split(/\s+/)[0] || "";
}

interface Bloco {
  /** Caixa em destaque: rotulo em cima, valor grande embaixo. */
  rotulo: string;
  valor: string;
  /** Espacamento entre letras, para codigo numerico ficar legivel. */
  monoespacado?: boolean;
}

interface Modelo {
  titulo: string;
  saudacao?: string;
  paragrafos: string[];
  blocos?: Bloco[];
  botao?: { texto: string; url: string };
  /** Linha discreta no rodape do cartao. */
  aviso?: string;
}

function montarHtml(m: Modelo): string {
  const blocos = (m.blocos ?? [])
    .map(
      (b) => `
        <div style="background-color: #fbf3ef; border: 1px solid #f0ded8; border-radius: 12px; padding: 16px 18px; margin: 14px 0;">
          <p style="margin: 0 0 4px 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9c8b8e;">${esc(b.rotulo)}</p>
          <p style="margin: 0; font-size: ${b.monoespacado ? "26px" : "17px"}; font-weight: 700; color: #5d0c1d;${
            b.monoespacado
              ? " font-family: 'Courier New', Courier, monospace; letter-spacing: 0.18em;"
              : ""
          }">${esc(b.valor)}</p>
        </div>`
    )
    .join("");

  const botao = m.botao
    ? `<div style="text-align: center; margin: 26px 0 8px 0;">
         <a href="${m.botao.url}" style="display: inline-block; background-color: #5d0c1d; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: 700; font-size: 14px;">${esc(m.botao.texto)}</a>
       </div>
       <p style="font-size: 12px; color: #9c8b8e; text-align: center; margin-top: 14px;">
         Ou acesse: <a href="${m.botao.url}" style="color: #5d0c1d;">${m.botao.url}</a>
       </p>`
    : "";

  return `
    <div style="font-family: Georgia, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #fff6f4; border: 1px solid #f0ded8; border-radius: 16px; overflow: hidden; color: #241a1c;">
      <div style="background: linear-gradient(135deg, #5d0c1d, #8b1c31); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">${esc(m.titulo)}</h1>
      </div>
      <div style="padding: 28px;">
        ${m.saudacao ? `<p style="font-size: 16px; margin-top: 0; color: #5d0c1d;">${esc(m.saudacao)}</p>` : ""}
        ${m.paragrafos
          .map(
            (p) =>
              `<p style="font-size: 15px; line-height: 1.6; color: #4a3f41; margin: 0 0 12px 0;">${esc(p)}</p>`
          )
          .join("")}
        ${blocos}
        ${botao}
      </div>
      ${
        m.aviso
          ? `<div style="background-color: #fbf3ef; padding: 14px 20px; text-align: center; font-size: 11px; color: #9c8b8e; border-top: 1px solid #f0ded8;">${esc(m.aviso)}</div>`
          : ""
      }
    </div>`;
}

function montarTexto(m: Modelo): string {
  const linhas: string[] = [];
  if (m.saudacao) linhas.push(m.saudacao, "");
  linhas.push(...m.paragrafos, "");
  for (const b of m.blocos ?? []) linhas.push(`${b.rotulo}: ${b.valor}`, "");
  if (m.botao) linhas.push(m.botao.url, "");
  if (m.aviso) linhas.push(m.aviso);
  return linhas.join("\n").trim();
}

/**
 * Ponto unico de envio. Concentra credencial, erro e o caso "sem SMTP" para
 * que nenhuma mensagem nova precise repetir esse cuidado.
 */
async function enviar(
  para: string,
  assunto: string,
  modelo: Modelo
): Promise<ResultadoEnvio> {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // Sem SMTP_FROM, usa o proprio usuario autenticado. Remetente de dominio
  // inexistente derruba a entregabilidade.
  const from = process.env.SMTP_FROM || user || "";

  if (!para?.trim()) {
    // Paciente sem e-mail cadastrado nao e erro: o aviso simplesmente nao vai.
    return { success: true, simulated: true };
  }

  if (!host || !user || !pass) {
    // Sem credencial, apenas registra. Nada de dado pessoal no log.
    console.log(`[aviso] SMTP nao configurado. Mensagem "${assunto}" nao enviada.`);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      // 465 usa TLS direto; 587 negocia com STARTTLS.
      secure: port === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from,
      to: para,
      subject: assunto,
      text: montarTexto(modelo),
      html: montarHtml(modelo),
    });

    console.log(`E-mail enviado (${assunto}):`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`Falha ao enviar e-mail (${assunto}):`, error);
    return { success: false, error };
  }
}

// --- Para a Joane -----------------------------------------------------------

/** Aviso de anamnese nova. Sem nome, contato ou queixa de ninguem. */
export async function sendAnamnesisNotificationEmail({
  recipientEmail = "enaoj22@gmail.com",
}: { recipientEmail?: string } = {}): Promise<ResultadoEnvio> {
  const link = `${getAppUrl()}/admin/clientes`;
  return enviar(recipientEmail, "Nova anamnese recebida", {
    titulo: "Nova anamnese recebida",
    saudacao: "Olá, Dra. Joane,",
    paragrafos: ["Você recebeu uma nova anamnese. Entre na plataforma para visualizar."],
    botao: { texto: "Abrir o painel", url: link },
    aviso: "Por segurança, os dados do paciente ficam apenas no painel.",
  });
}

// --- Para o paciente --------------------------------------------------------

/**
 * Codigo de acesso a area do paciente.
 *
 * So existe dois momentos em que da para enviar isto: quando a anamnese e
 * enviada e quando a Joane reemite. Guardamos apenas o hash scrypt do codigo,
 * entao depois desses instantes nao existe como recuperar o valor, so
 * substituir por um novo.
 */
export async function enviarCodigoDeAcesso({
  para,
  nome,
  codigo,
  reemissao = false,
}: {
  para: string;
  nome: string;
  codigo: string;
  reemissao?: boolean;
}): Promise<ResultadoEnvio> {
  const link = `${getAppUrl()}/area-do-paciente/entrar`;
  const nomeCurto = primeiroNome(nome);

  return enviar(
    para,
    reemissao ? "Seu novo código de acesso" : "Seu acesso à área do paciente",
    {
      titulo: reemissao ? "Novo código de acesso" : "Sua área do paciente",
      saudacao: nomeCurto ? `Olá, ${nomeCurto},` : "Olá,",
      paragrafos: reemissao
        ? [
            "Foi gerado um novo código de acesso para você. O código anterior deixou de valer.",
            "Guarde este e-mail: com o seu CPF e o código abaixo você entra na sua área para ver seus dados, acompanhar o contrato e marcar a consulta.",
          ]
        : [
            "Recebemos a sua ficha, obrigado por preencher com cuidado.",
            "Guarde este e-mail: com o seu CPF e o código abaixo você entra na sua área para ver seus dados, acompanhar o contrato e marcar a consulta.",
          ],
      blocos: [
        { rotulo: "Seu código de acesso", valor: formatarToken(codigo), monoespacado: true },
      ],
      botao: { texto: "Entrar na minha área", url: link },
      aviso: "Este código é pessoal. Não compartilhe com ninguém.",
    }
  );
}

export type TipoAvisoConsulta = "marcada" | "remarcada" | "cancelada";

/**
 * Aviso de consulta, tanto quando o proprio paciente marca quanto quando a
 * Joane marca, remaneja ou cancela pelo painel.
 *
 * Nao carrega o codigo de acesso: nesse ponto so existe o hash dele. Quem
 * perdeu o codigo pede a reemissao para a Joane, e o novo chega por e-mail.
 */
export async function enviarAvisoDeConsulta({
  para,
  nome,
  tipo,
  inicioEm,
  duracaoMinutos,
  anteriorEm,
  motivo,
}: {
  para: string;
  nome: string;
  tipo: TipoAvisoConsulta;
  inicioEm: Date | string;
  duracaoMinutos?: number;
  anteriorEm?: Date | string | null;
  motivo?: string | null;
}): Promise<ResultadoEnvio> {
  const link = `${getAppUrl()}/area-do-paciente`;
  const nomeCurto = primeiroNome(nome);
  const quando = formatarDataHora(inicioEm);

  const titulo =
    tipo === "marcada"
      ? "Consulta marcada"
      : tipo === "remarcada"
        ? "Consulta remarcada"
        : "Consulta cancelada";

  const paragrafos: string[] = [];
  const blocos: Bloco[] = [];

  if (tipo === "marcada") {
    paragrafos.push("Sua consulta com a Dra. Joane Souza Oliveira de Andrade está confirmada para:");
    blocos.push({ rotulo: "Data e horário", valor: quando });
  } else if (tipo === "remarcada") {
    paragrafos.push("Sua consulta com a Dra. Joane Souza Oliveira de Andrade mudou de horário.");
    if (anteriorEm) {
      blocos.push({ rotulo: "Horário anterior", valor: formatarDataHora(anteriorEm) });
    }
    blocos.push({ rotulo: "Novo horário", valor: quando });
  } else {
    paragrafos.push(
      `A consulta que estava marcada para ${quando} foi cancelada.`,
      "Se quiser remarcar, entre na sua área ou fale com a Dra. Joane."
    );
  }

  if (tipo !== "cancelada" && duracaoMinutos && duracaoMinutos > 0) {
    blocos.push({ rotulo: "Duração", valor: `${duracaoMinutos} minutos` });
  }

  if (motivo?.trim()) {
    blocos.push({ rotulo: "Observação", valor: motivo.trim() });
  }

  if (tipo !== "cancelada") {
    paragrafos.push(
      "Para ver, remarcar ou cancelar, entre na sua área com o seu CPF e o código de acesso que você recebeu ao enviar a ficha."
    );
  }

  return enviar(para, `${titulo} - ${quando}`, {
    titulo,
    saudacao: nomeCurto ? `Olá, ${nomeCurto},` : "Olá,",
    paragrafos,
    blocos,
    botao: { texto: "Abrir minha área", url: link },
    aviso: "Perdeu o código de acesso? Fale com a Dra. Joane para receber um novo.",
  });
}
