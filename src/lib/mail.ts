/**
 * Aviso de anamnese nova para a Joane.
 *
 * O e-mail nao carrega nome, CPF, contato nem queixa de ninguem. E de
 * proposito: e-mail nao e canal seguro, fica guardado em servidor de terceiro
 * e pode ser lido em tela de celular por quem estiver por perto. O aviso so
 * diz que chegou ficha nova e leva ao painel, onde o dado sensivel vive
 * protegido por autenticacao.
 *
 * Sem SMTP configurado, o envio nao acontece e o sistema segue normalmente:
 * a anamnese ja foi salva, e o aviso e conveniencia, nao parte do fluxo.
 */

import nodemailer from "nodemailer";

interface AvisoDeAnamnese {
  /** Para onde enviar. Vem do perfil da Joane nas Configuracoes. */
  recipientEmail?: string;
}

/** URL publica da aplicacao, para o link do e-mail apontar para o lugar certo. */
function getAppUrl(): string {
  const explicita = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (explicita) return explicita.replace(/\/$/, "");
  // Na Vercel, VERCEL_URL vem sem protocolo.
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function sendAnamnesisNotificationEmail({
  recipientEmail = "enaoj22@gmail.com",
}: AvisoDeAnamnese = {}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // Sem SMTP_FROM, usa o proprio usuario autenticado. Remetente de dominio
  // inexistente derruba a entregabilidade.
  const from = process.env.SMTP_FROM || user || "";

  const linkPainel = `${getAppUrl()}/admin/clientes`;
  const subject = "Nova anamnese recebida";

  const html = `
    <div style="font-family: Georgia, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; background-color: #fff6f4; border: 1px solid #f0ded8; border-radius: 16px; overflow: hidden; color: #241a1c;">
      <div style="background: linear-gradient(135deg, #5d0c1d, #8b1c31); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Nova anamnese recebida</h1>
      </div>

      <div style="padding: 28px;">
        <p style="font-size: 16px; margin-top: 0; color: #5d0c1d;">Olá, Dra. Joane,</p>
        <p style="font-size: 15px; line-height: 1.6; color: #4a3f41;">
          Você recebeu uma nova anamnese. Entre na plataforma para visualizar.
        </p>

        <div style="text-align: center; margin: 28px 0 8px 0;">
          <a href="${linkPainel}"
             style="display: inline-block; background-color: #5d0c1d; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: 700; font-size: 14px;">
            Abrir o painel
          </a>
        </div>

        <p style="font-size: 12px; color: #9c8b8e; text-align: center; margin-top: 18px;">
          Ou acesse: <a href="${linkPainel}" style="color: #5d0c1d;">${linkPainel}</a>
        </p>
      </div>

      <div style="background-color: #fbf3ef; padding: 14px 20px; text-align: center; font-size: 11px; color: #9c8b8e; border-top: 1px solid #f0ded8;">
        Por segurança, os dados do paciente ficam apenas no painel.
      </div>
    </div>
  `;

  const texto = [
    "Olá, Dra. Joane,",
    "",
    "Você recebeu uma nova anamnese. Entre na plataforma para visualizar.",
    "",
    linkPainel,
    "",
    "Por segurança, os dados do paciente ficam apenas no painel.",
  ].join("\n");

  if (!host || !user || !pass) {
    // Sem credencial, apenas registra. Nada de dado pessoal no log.
    console.log(`[aviso] SMTP nao configurado. Anamnese nova nao notificada para ${recipientEmail}.`);
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
      to: recipientEmail,
      subject,
      text: texto,
      html,
    });

    console.log("Aviso de anamnese enviado:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Falha ao enviar aviso de anamnese:", error);
    return { success: false, error };
  }
}
