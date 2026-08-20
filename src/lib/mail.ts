import nodemailer from "nodemailer";

interface SendAnamnesisNotificationParams {
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  // CPF removido do email - dado sensivel de saude nao deve trafegar por Gmail
  templateTitle: string;
  submissionId: string;
  chiefComplaint?: string;
  recipientEmail?: string;
}

/** Retorna a URL base da aplicacao, sem trailing slash. */
function getAppUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.NEXT_PUBLIC_APP_URL)
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Indica se a queixa principal deve aparecer no corpo do email.
 * Default: false (dado clinico nao fica em Gmail sem necessidade).
 * Para ativar: EMAIL_INCLUDE_COMPLAINT=true no .env.
 */
function shouldIncludeComplaint(): boolean {
  return process.env.EMAIL_INCLUDE_COMPLAINT === "true";
}

export async function sendAnamnesisNotificationEmail({
  patientName,
  patientEmail,
  patientPhone,
  templateTitle,
  submissionId,
  chiefComplaint,
  recipientEmail = "enaoj22@gmail.com",
}: SendAnamnesisNotificationParams) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  // SMTP_FROM configuravel: se nao setado, usa o proprio SMTP_USER como remetente.
  // Nunca usa dominio inventado - remetente de dominio inexistente derruba entregabilidade.
  const from = process.env.SMTP_FROM || user || "";

  const appUrl = getAppUrl();
  const adminLink = `${appUrl}/admin/clientes?id=${submissionId}`;
  const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

  const subject = `Nova Anamnese Recebida: ${patientName}`;

  const complaintBlock =
    shouldIncludeComplaint() && chiefComplaint
      ? `
        <div style="margin-top: 16px; padding-top: 14px; border-top: 1px dashed #f0ded8;">
          <span style="color: #5d0c1d; font-size: 13px; font-weight: 600;">Queixa Principal / Motivo:</span>
          <p style="margin: 6px 0 0 0; font-size: 14px; font-style: italic; color: #362c2d; background: #fbf3ef; padding: 12px; border-radius: 8px; border-left: 3px solid #5d0c1d;">
            "${chiefComplaint}"
          </p>
        </div>`
      : "";

  const htmlContent = `
    <div style="font-family: 'Lora', Georgia, 'Segoe UI', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fff6f4; border: 1px solid #f0ded8; border-radius: 16px; overflow: hidden; color: #241a1c;">
      <div style="background: linear-gradient(135deg, #5d0c1d, #8b1c31); padding: 28px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700;">Dra. Joane Souza Oliveira de Andrade</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Nova Ficha de Anamnese Preenchida</p>
      </div>

      <div style="padding: 28px;">
        <p style="font-size: 16px; margin-top: 0; color: #5d0c1d;">Ola <strong>Dra. Joane</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #6f5f62;">
          Um novo paciente preencheu a ficha de anamnese online. Os dados completos estao disponiveis no seu painel.
        </p>

        <div style="background-color: #ffffff; border: 1px solid #f0ded8; border-radius: 12px; padding: 20px; margin: 22px 0;">
          <h3 style="margin-top: 0; margin-bottom: 12px; font-size: 16px; color: #5d0c1d; border-bottom: 1px solid #f8dad2; padding-bottom: 8px;">
            Dados do Paciente
          </h3>
          <table style="width: 100%; font-size: 14px; line-height: 1.7;">
            <tr>
              <td style="color: #6f5f62; width: 120px;"><strong>Nome:</strong></td>
              <td style="color: #241a1c; font-weight: 600;">${patientName}</td>
            </tr>
            <tr>
              <td style="color: #6f5f62;"><strong>E-mail:</strong></td>
              <td style="color: #241a1c;"><a href="mailto:${patientEmail}" style="color: #5d0c1d;">${patientEmail}</a></td>
            </tr>
            <tr>
              <td style="color: #6f5f62;"><strong>Telefone/WhatsApp:</strong></td>
              <td style="color: #241a1c;">${patientPhone}</td>
            </tr>
            <tr>
              <td style="color: #6f5f62;"><strong>Modelo:</strong></td>
              <td style="color: #241a1c;">${templateTitle}</td>
            </tr>
            <tr>
              <td style="color: #6f5f62;"><strong>Recebido em:</strong></td>
              <td style="color: #241a1c;">${now}</td>
            </tr>
          </table>

          ${complaintBlock}
        </div>

        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${adminLink}"
             style="display: inline-block; background-color: #5d0c1d; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 30px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(93, 12, 29, 0.25);">
            Abrir Ficha no Painel
          </a>
        </div>
      </div>

      <div style="background-color: #fbf3ef; padding: 16px 20px; text-align: center; font-size: 12px; color: #9c8b8e; border-top: 1px solid #f0ded8;">
        Sistema de Anamnese e Gestao Clinica - Dra. Joane Souza Oliveira de Andrade
      </div>
    </div>
  `;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });

      const info = await transporter.sendMail({
        from,
        to: recipientEmail,
        subject,
        html: htmlContent,
      });

      console.log("Email de notificacao enviado:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("Erro ao enviar email via SMTP:", error);
      return { success: false, error };
    }
  } else {
    // Simulacao local: loga apenas ID e link, sem PII do paciente
    console.log("[SIMULACAO EMAIL] Nova anamnese recebida - ID:", submissionId);
    console.log("[SIMULACAO EMAIL] Destinatario:", recipientEmail);
    console.log("[SIMULACAO EMAIL] Link admin:", adminLink);
    return { success: true, simulated: true };
  }
}
