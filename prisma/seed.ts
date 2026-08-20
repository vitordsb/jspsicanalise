import { PrismaClient } from "@prisma/client";
import { hashPassword, normalizeCpf } from "../src/lib/auth-seed-helpers";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  await prisma.contract.deleteMany();
  await prisma.anamnesisSubmission.deleteMany();
  await prisma.anamnesisTemplate.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // Senha do admin via seed: usa ADMIN_PASSWORD env ou "admin" como placeholder.
  // IMPORTANTE: alterar a senha real via ADMIN_PASSWORD_HASH no .env antes de ir para producao.
  const adminPassword = process.env.ADMIN_PASSWORD || "admin";
  const hashedPassword = hashPassword(adminPassword);

  const admin = await prisma.user.create({
    data: {
      name: "Dra. Joane Souza Oliveira de Andrade",
      email: "joane@psicanalise.com.br",
      password: hashedPassword,
      role: "admin",
      title: "Psicanalista Clinica e Especialista em Saude Mental",
      // crp: PENDENTE - aguardando registro oficial da Dra. Joane
      crp: "",
      phone: "",
      notificationEmail: "enaoj22@gmail.com",
      clinicName: "",
      address: "Atendimento Clinico Online e Presencial",
    },
  });

  console.log("Administrador criado:", admin.email);

  const standardSections = [
    {
      id: "sec_queixa",
      title: "1. Queixa Principal e Motivo da Busca",
      description: "Conte um pouco sobre o que te trouxe ate a analise e seus sentimentos atuais.",
      questions: [
        {
          id: "q_motivo",
          label: "O que motivou voce a procurar psicanalise/terapia neste momento?",
          type: "textarea",
          placeholder: "Ex: Tenho me sentido muito sobrecarregado(a), com crises de ansiedade recorrentes...",
          required: true,
        },
        {
          id: "q_tempo_sintomas",
          label: "Ha quanto tempo voce percebe esses incomodos ou sentimentos?",
          type: "text",
          placeholder: "Ex: Ha cerca de 6 meses, apos mudanca de emprego",
          required: true,
        },
        {
          id: "q_experiencia_anterior",
          label: "Ja fez terapia ou acompanhamento psiquiatrico anteriormente?",
          type: "radio",
          options: ["Nunca fiz", "Sim, ja fiz psicoterapia", "Sim, ja passei por psiquiatra", "Sim, ambos"],
          required: true,
        },
        {
          id: "q_detalhe_anterior",
          label: "Se ja fez, como foi sua experiencia?",
          type: "textarea",
          placeholder: "Ex: Fiz por 1 ano, me ajudou bastante mas precisei interromper por tempo...",
          required: false,
        },
      ],
    },
    {
      id: "sec_sintomas",
      title: "2. Sintomas e Saude Emocional",
      description: "Identificacao dos sintomas fisicos, emocionais e psicologicos que voce vivencia.",
      questions: [
        {
          id: "q_sintomas_lista",
          label: "Quais dos sintomas abaixo voce tem vivenciado com frequencia nas ultimas semanas?",
          type: "checkbox",
          options: [
            "Ansiedade constante / Preocupacao excessiva",
            "Crises de panico / Taquicardia / Falta de ar",
            "Tristeza profunda / Vontade de chorar sem motivo aparente",
            "Insonia ou dificuldade para manter o sono",
            "Cansaco excessivo e falta de energia",
            "Pensamentos repetitivos ou obsessivos",
            "Dificuldade de concentracao e foco",
            "Irritabilidade ou oscilacoes de humor",
            "Sensacao de solidao ou incompreensao",
            "Dificuldade em impor limites / Dizer nao",
          ],
          required: true,
        },
        {
          id: "q_escala_impacto",
          label: "Em uma escala de 1 a 10, qual o impacto desses sintomas na sua rotina diaria?",
          type: "scale_1_10",
          helpText: "1 = impacto minimo, 10 = impacto severo/incapacitante",
          required: true,
        },
        {
          id: "q_medicamentos",
          label: "Faz uso continuo de alguma medicacao (antidepressivo, ansiolitico, etc.)?",
          type: "text",
          placeholder: "Ex: Nao uso / Sim, Escitalopram 10mg receitado pelo Dr. Carlos",
          required: false,
        },
      ],
    },
    {
      id: "sec_familia",
      title: "3. Historico Pessoal e Relacoes Familiares",
      description: "Compreensao da sua rede de apoio, historico afetivo e dinamica familiar.",
      questions: [
        {
          id: "q_estado_civil",
          label: "Estado civil / Situacao amorosa atual:",
          type: "radio",
          options: ["Solteiro(a)", "Casado(a) / Uniao Estavel", "Namorando", "Divorciado(a) / Separado(a)", "Viuvo(a)"],
          required: true,
        },
        {
          id: "q_filhos",
          label: "Tem filhos? Se sim, quantos e idades:",
          type: "text",
          placeholder: "Ex: Nao tenho / Sim, 2 filhos (5 e 8 anos)",
          required: false,
        },
        {
          id: "q_com_quem_mora",
          label: "Com quem voce reside atualmente?",
          type: "text",
          placeholder: "Ex: Moro sozinho(a) / Moro com meu conjuge e filho",
          required: true,
        },
        {
          id: "q_relacao_familia",
          label: "Como e o seu relacionamento com seus pais e familiares mais proximos?",
          type: "textarea",
          placeholder: "Conte brevemente sobre a relacao com pai, mae ou figuras de referencia...",
          required: false,
        },
        {
          id: "q_trabalho",
          label: "Profissao / Ocupacao atual e grau de satisfacao no trabalho:",
          type: "textarea",
          placeholder: "Ex: Sou designer, trabalho em home office...",
          required: false,
        },
      ],
    },
    {
      id: "sec_rotina",
      title: "4. Rotina, Sono e Estilo de Vida",
      description: "Habitos que influenciam sua energia, corpo e mente.",
      questions: [
        {
          id: "q_sono_qualidade",
          label: "Como voce avalia a qualidade do seu sono?",
          type: "radio",
          options: [
            "Durmo muito bem (7 a 8h restauradoras)",
            "Tenho dificuldade para pegar no sono",
            "Acordo varias vezes durante a noite",
            "Acordo cansado(a) mesmo apos dormir",
          ],
          required: true,
        },
        {
          id: "q_atividades_fisicas",
          label: "Pratica atividade fisica?",
          type: "radio",
          options: ["Frequentemente (3x ou mais por semana)", "Ocasionalmente (1 a 2x por semana)", "Raramente ou Nunca"],
          required: true,
        },
        {
          id: "q_lazer",
          label: "O que voce costuma fazer para relaxar ou nos momentos livres?",
          type: "textarea",
          placeholder: "Ex: Leitura, passear com cachorro, assistir series, cozinhar...",
          required: false,
        },
      ],
    },
    {
      id: "sec_expectativas",
      title: "5. Expectativas e Preferencias",
      description: "Alinhamento sobre formato, horarios e objetivos terapeuticos.",
      questions: [
        {
          id: "q_expectativa_processo",
          label: "O que voce mais gostaria de transformar ou compreender sobre si mesmo(a) na analise?",
          type: "textarea",
          placeholder: "Ex: Quero aprender a lidar com minhas angustias, me conhecer melhor...",
          required: true,
        },
        {
          id: "q_formato_preferido",
          label: "Qual o formato de atendimento de sua preferencia?",
          type: "radio",
          options: ["Online (Google Meet / WhatsApp Video)", "Presencial no Consultorio", "Sem preferencia / Hibrido"],
          required: true,
        },
        {
          id: "q_disponibilidade_horarios",
          label: "Qual a sua disponibilidade de horarios para as sessoes?",
          type: "checkbox",
          options: ["Manha (08h as 12h)", "Tarde (13h as 18h)", "Noite (18h as 21h)", "Sabados de manha"],
          required: true,
        },
        {
          id: "q_recado_final",
          label: "Gostaria de deixar mais alguma observacao ou duvida para a Dra. Joane?",
          type: "textarea",
          placeholder: "Espaco livre para qualquer comentario adicional...",
          required: false,
        },
      ],
    },
  ];

  const template = await prisma.anamnesisTemplate.create({
    data: {
      title: "Anamnese Psicanalitica e Clinica - Adulto (Padrao Oficial)",
      description: "Formulario completo para acolhimento inicial, investigacao de queixas e historico biopsicossocial.",
      version: 1,
      isActive: true,
      sections: JSON.stringify(standardSections),
    },
  });

  console.log("Template de Anamnese criado e ativado:", template.title);

  // CPFs dos pacientes de teste: sempre so digitos
  const patient1 = await prisma.patient.create({
    data: {
      fullName: "Mariana Albuquerque Santos",
      email: "mariana.santos@email.com",
      phone: "(11) 99123-4567",
      birthDate: "1994-05-18",
      cpf: normalizeCpf("123.456.789-01"),
      gender: "Feminino",
      occupation: "Arquiteta e Urbanista",
      maritalStatus: "Solteira",
    },
  });

  const answers1 = {
    q_motivo: "Estou passando por uma fase muito confusa no trabalho e na vida pessoal.",
    q_tempo_sintomas: "Cerca de 8 meses.",
    q_experiencia_anterior: "Sim, ja fiz psicoterapia",
    q_sintomas_lista: ["Ansiedade constante / Preocupacao excessiva", "Insonia ou dificuldade para manter o sono"],
    q_escala_impacto: "8",
    q_medicamentos: "Nao tomo nenhuma medicacao.",
    q_estado_civil: "Solteiro(a)",
    q_com_quem_mora: "Moro sozinha.",
    q_sono_qualidade: "Tenho dificuldade para pegar no sono",
    q_atividades_fisicas: "Ocasionalmente (1 a 2x por semana)",
    q_expectativa_processo: "Quero aprender a dizer nao sem culpa.",
    q_formato_preferido: "Online (Google Meet / WhatsApp Video)",
    q_disponibilidade_horarios: ["Noite (18h as 21h)", "Sabados de manha"],
  };

  const sub1 = await prisma.anamnesisSubmission.create({
    data: {
      patientId: patient1.id,
      templateId: template.id,
      templateVersion: template.version,
      templateSnapshot: JSON.stringify(standardSections),
      answers: JSON.stringify(answers1),
      status: "in_review",
      lgpdConsent: true,
      lgpdConsentAt: new Date(),
      clinicalNotes: "Paciente com forte traco de perfeccionismo. Boa abertura para psicanalise.",
      reviewedAt: new Date(),
    },
  });

  await prisma.contract.create({
    data: {
      patientId: patient1.id,
      submissionId: sub1.id,
      title: "Contrato de Prestacao de Servicos Psicanaliticos",
      therapistName:         admin.name,
      professionalDocNumber: admin.crp,
      therapistAddress:      admin.address,
      sessionPriceCents:     20000,
      frequency:             "Semanal (1 sessao por semana)",
      durationMinutes:       50,
      paymentMethod:         "PIX mensal ate o dia 05 de cada mes",
      status:                "rascunho",
      // Snapshot do paciente
      patientFullName: patient1.fullName,
      patientCpf:      patient1.cpf,
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      fullName: "Lucas Ferraz de Oliveira",
      email: "lucas.ferraz@email.com",
      phone: "(11) 98877-6655",
      birthDate: "1988-11-03",
      cpf: normalizeCpf("234.567.890-12"),
      gender: "Masculino",
      occupation: "Engenheiro de Software",
      maritalStatus: "Casado",
    },
  });

  const answers2 = {
    q_motivo: "Sensacao de esgotamento total, crises de panico repentinas.",
    q_tempo_sintomas: "3 meses com crises intensas.",
    q_experiencia_anterior: "Nunca fiz",
    q_sintomas_lista: ["Crises de panico / Taquicardia / Falta de ar", "Cansaco excessivo e falta de energia"],
    q_escala_impacto: "9",
    q_medicamentos: "Iniciei Sertralina 50mg.",
    q_estado_civil: "Casado(a) / Uniao Estavel",
    q_com_quem_mora: "Com minha esposa e filha.",
    q_sono_qualidade: "Acordo varias vezes durante a noite",
    q_atividades_fisicas: "Raramente ou Nunca",
    q_expectativa_processo: "Quero sair desse estado de alerta permanente.",
    q_formato_preferido: "Online (Google Meet / WhatsApp Video)",
    q_disponibilidade_horarios: ["Manha (08h as 12h)", "Noite (18h as 21h)"],
  };

  await prisma.anamnesisSubmission.create({
    data: {
      patientId: patient2.id,
      templateId: template.id,
      templateVersion: template.version,
      templateSnapshot: JSON.stringify(standardSections),
      answers: JSON.stringify(answers2),
      status: "pending",
      lgpdConsent: true,
      lgpdConsentAt: new Date(),
      clinicalNotes: "Quadro compativel com Sindrome de Burnout aguda.",
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      fullName: "Beatriz Nogueira Lima",
      email: "beatriz.nogueira@email.com",
      phone: "(21) 97654-3210",
      birthDate: "2001-09-22",
      cpf: normalizeCpf("345.678.901-23"),
      gender: "Feminino",
      occupation: "Estudante de Letras",
      maritalStatus: "Solteira",
    },
  });

  const answers3 = {
    q_motivo: "Busco autoconhecimento e compreender padroes repetitivos nos meus relacionamentos.",
    q_tempo_sintomas: "Desde a adolescencia.",
    q_experiencia_anterior: "Sim, ja fiz psicoterapia",
    q_sintomas_lista: ["Sensacao de solidao ou incompreensao"],
    q_escala_impacto: "6",
    q_estado_civil: "Solteiro(a)",
    q_com_quem_mora: "Com minha mae.",
    q_sono_qualidade: "Durmo muito bem (7 a 8h restauradoras)",
    q_atividades_fisicas: "Frequentemente (3x ou mais por semana)",
    q_expectativa_processo: "Construir minha autonomia emocional.",
    q_formato_preferido: "Online (Google Meet / WhatsApp Video)",
    q_disponibilidade_horarios: ["Tarde (13h as 18h)"],
  };

  await prisma.anamnesisSubmission.create({
    data: {
      patientId: patient3.id,
      templateId: template.id,
      templateVersion: template.version,
      templateSnapshot: JSON.stringify(standardSections),
      answers: JSON.stringify(answers3),
      status: "approved",
      lgpdConsent: true,
      lgpdConsentAt: new Date(),
      clinicalNotes: "Paciente iniciou processo de analise.",
      reviewedAt: new Date(),
    },
  });

  console.log("3 pacientes e submissoes de teste criados com sucesso.");
  console.log("Seed finalizado.");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
