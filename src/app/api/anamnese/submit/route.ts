import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAnamnesisNotificationEmail, enviarCodigoDeAcesso } from "@/lib/mail";
import { avisarEmSegundoPlano } from "@/lib/avisos";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { submitAnamnesisSchema } from "@/lib/validate";
import { ZodError } from "zod";
import { gerarTokenAcesso, hashToken, cookieSessaoPaciente } from "@/lib/paciente-auth";

/** Nome tecnico do campo -> como o paciente o ve no formulario. */
const NOMES_DE_CAMPO: Record<string, string> = {
  fullName: "nome completo",
  email: "e-mail",
  phone: "telefone",
  cpf: "CPF",
  birthDate: "data de nascimento",
  lgpdConsent: "consentimento",
  templateId: "formulario",
};

export async function POST(req: NextRequest) {
  // Limite de payload: 512KB
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > 512_000) {
    return NextResponse.json(
      { error: "Dados enviados excedem o tamanho permitido." },
      { status: 413 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Não foi possível ler os dados enviados." },
      { status: 400 }
    );
  }

  let parsed;
  try {
    parsed = submitAnamnesisSchema.parse(body);
  } catch (e) {
    if (e instanceof ZodError) {
      const primeiro = e.issues[0];
      // Rede de seguranca: se escapar alguma mensagem interna do Zod (do tipo
      // "Invalid input: expected string, received undefined"), o paciente ve
      // um texto util em vez do jargao da biblioteca. Este formulario e
      // preenchido por quem esta buscando acolhimento, nao por um dev.
      const mensagemInterna =
        !primeiro?.message || /^invalid input|^expected |^required$/i.test(primeiro.message);
      const chave = primeiro?.path?.filter((p) => typeof p === "string").pop() as
        | string
        | undefined;
      const campo = chave ? NOMES_DE_CAMPO[chave] : undefined;
      const erro = mensagemInterna
        ? campo
          ? `Confira o campo ${campo} e tente novamente.`
          : "Confira os dados preenchidos e tente novamente."
        : primeiro.message;

      return NextResponse.json({ error: erro }, { status: 400 });
    }
    throw e;
  }

  // Rate limit conservador: 3 envios por hora por IP. Fica depois da
  // validacao de conteudo de proposito: corrigir um CPF ou e-mail digitado
  // errado e reenviar nao pode gastar a mesma cota de quem esta de fato
  // martelando a rota. So conta tentativa que passou pela validacao e vai
  // tocar banco/e-mail de verdade.
  const ip = getClientIp(req);
  if (!checkRateLimit(`submit-anamnese:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde um pouco antes de tentar novamente." },
      { status: 429 }
    );
  }

  const { personalInfo, answers, templateId, lgpdConsent, templateVersion, templateSections } = parsed;
  // CPF ja normalizado (so digitos) pelo schema
  const cleanCpf = personalInfo.cpf;

  try {
    // Verifica paciente existente com CPF normalizado
    const existingPatient = await prisma.patient.findFirst({
      where: { cpf: cleanCpf },
      include: {
        submissions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (existingPatient && existingPatient.submissions.length > 0) {
      return NextResponse.json(
        {
          error:
            "Sua anamnese já foi enviada anteriormente e está em análise pela Dra. Joane Souza Oliveira de Andrade.",
          alreadySubmitted: true,
          submissionId: existingPatient.submissions[0].id,
        },
        { status: 409 }
      );
    }

    const template = await prisma.anamnesisTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Modelo de anamnese não encontrado." },
        { status: 404 }
      );
    }

    // Cadastro que ja existia e ja tem contrato ou consulta e caso delicado:
    // quem souber o CPF dessa pessoa poderia preencher a ficha, receber um
    // codigo novo e entrar na area dela para ler contrato com endereco e RG.
    // Nesses casos a ficha e aceita, mas o codigo antigo continua valendo e
    // nao ha login automatico.
    let temHistorico = false;
    if (existingPatient) {
      const [contratos, consultas] = await Promise.all([
        prisma.contract.count({ where: { patientId: existingPatient.id } }),
        prisma.agendamento.count({ where: { patientId: existingPatient.id } }),
      ]);
      temHistorico = contratos > 0 || consultas > 0;
    }
    const podeEntrarDireto = !temHistorico;

    // Token de acesso a area do paciente. Numerico para poder ser ditado e
    // anotado. Guardamos so o hash; o valor em claro e devolvido uma unica vez
    // nesta resposta, para a tela mostrar e a pessoa anotar.
    const tokenAcesso = gerarTokenAcesso();

    // Cria ou atualiza o paciente com CPF sempre normalizado (so digitos)
    let patient = existingPatient;
    if (!patient) {
      patient = await prisma.patient.create({
        data: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          birthDate: personalInfo.birthDate || "",
          cpf: cleanCpf,
          gender: personalInfo.gender || "",
          occupation: personalInfo.occupation || "",
          maritalStatus: personalInfo.maritalStatus || "",
          accessTokenHash: hashToken(tokenAcesso),
          accessTokenAt: new Date(),
        },
        include: { submissions: true },
      });
    } else {
      patient = await prisma.patient.update({
        where: { id: patient.id },
        data: {
          fullName: personalInfo.fullName,
          email: personalInfo.email,
          phone: personalInfo.phone,
          birthDate: personalInfo.birthDate || patient.birthDate,
          gender: personalInfo.gender || patient.gender,
          occupation: personalInfo.occupation || patient.occupation,
          maritalStatus: personalInfo.maritalStatus || patient.maritalStatus,
          // So emite codigo novo quando nao ha o que proteger. Trocar o codigo
          // de quem ja tem contrato deixaria a propria pessoa de fora.
          ...(podeEntrarDireto && {
            accessTokenHash: hashToken(tokenAcesso),
            accessTokenAt: new Date(),
          }),
        },
        include: { submissions: true },
      });
    }

    // Snapshot do que a pessoa realmente viu na tela, nao o que esta no
    // banco agora. templateSections vem do front (carregado junto com o
    // GET /api/anamnese/active que abriu o formulario); se a Joane editar o
    // template nesse meio-tempo, o registro nao muda debaixo da resposta ja
    // dada. Sem esse campo (bundle antigo em cache), cai no comportamento
    // anterior de reconsultar o banco.
    const snapshotSections = templateSections
      ? JSON.stringify(templateSections)
      : template.sections;
    const snapshotVersion = templateVersion ?? template.version;

    const submission = await prisma.anamnesisSubmission.create({
      data: {
        patientId: patient.id,
        templateId: template.id,
        templateVersion: snapshotVersion,
        templateSnapshot: snapshotSections,
        answers: JSON.stringify(answers),
        status: "pending",
        lgpdConsent: lgpdConsent,
        lgpdConsentAt: lgpdConsent ? new Date() : null,
      },
    });

    const adminUser = await prisma.user.findFirst();
    const recipientEmail =
      adminUser?.notificationEmail || "enaoj22@gmail.com";

    // Aviso para a Joane: so diz que chegou ficha nova e leva ao painel,
    // sem dado nenhum de paciente.
    avisarEmSegundoPlano("anamnese nova", () =>
      sendAnamnesisNotificationEmail({ recipientEmail })
    );

    // Codigo de acesso para o paciente. Este e o unico instante em que ele
    // existe em claro: dali para frente so guardamos o hash scrypt. Se a
    // pessoa fechar a tela sem anotar, o e-mail e o que salva o acesso dela.
    avisarEmSegundoPlano("codigo de acesso", () =>
      enviarCodigoDeAcesso({
        para: personalInfo.email,
        nome: personalInfo.fullName,
        codigo: tokenAcesso,
      })
    );

    const resposta = NextResponse.json({
      success: true,
      message: "Anamnese enviada com sucesso.",
      submissionId: submission.id,
      patientId: patient.id,
      // Unico momento em que o token aparece em claro. Depois daqui so existe
      // o hash, e uma nova via precisa ser emitida pela Joane no painel.
      tokenAcesso: podeEntrarDireto ? tokenAcesso : "",
      // Diz a tela se ela pode mandar direto para a agenda ou se precisa
      // pedir para a pessoa entrar com o codigo que ja tem.
      autenticado: podeEntrarDireto,
    });

    // Login automatico. A ficha so vale se virar consulta em 24 horas, e
    // obrigar a pessoa a digitar CPF e oito digitos justo nesse momento
    // derrubava boa parte antes de chegar na agenda. Ela acabou de provar
    // quem e preenchendo o proprio cadastro, e o cadastro e novo: nao ha
    // dado anterior de ninguem para alcancar por aqui.
    if (podeEntrarDireto) {
      const cookie = cookieSessaoPaciente(patient.id);
      resposta.cookies.set(cookie.name, cookie.value, cookie.options);
    }

    return resposta;
  } catch (error) {
    console.error("Erro ao processar envio de anamnese:", error);
    return NextResponse.json(
      {
        error:
          "Ocorreu um erro ao salvar sua anamnese. Por favor, tente novamente.",
      },
      { status: 500 }
    );
  }
}
