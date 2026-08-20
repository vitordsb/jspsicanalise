import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // 1. Limpa dados anteriores se existirem
  await prisma.contract.deleteMany();
  await prisma.anamnesisSubmission.deleteMany();
  await prisma.anamnesisTemplate.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  // 2. Cria Usuário Admin da Joane
  const admin = await prisma.user.create({
    data: {
      name: "Dra. Joane Silva",
      email: "joane@psicanalise.com.br",
      password: "admin", // Em produção pode ter hash bcrypt
      role: "admin",
      title: "Psicanalista Clínica & Especialista em Saúde Mental",
      crp: "Reg. CBO 2515-50 / Psicanálise Clínica",
      phone: "(11) 98765-4321",
      notificationEmail: "joane@psicanalise.com.br",
      clinicName: "JS Psicanálise & Desenvolvimento Humano",
      address: "Atendimento Clínico Online e Presencial - São Paulo/SP",
    },
  });

  console.log("✓ Administrador Joane criado:", admin.email);

  // 3. Cria Template de Anamnese Padrão Completo
  const standardSections = [
    {
      id: "sec_queixa",
      title: "1. Queixa Principal & Motivo da Busca",
      description: "Conte um pouco sobre o que te trouxe até a análise e seus sentimentos atuais.",
      questions: [
        {
          id: "q_motivo",
          label: "O que motivou você a procurar psicanálise/terapia neste momento?",
          type: "textarea",
          placeholder: "Ex: Tenho me sentido muito sobrecarregado(a), com crises de ansiedade recorrentes e dificuldades no relacionamento...",
          required: true,
        },
        {
          id: "q_tempo_sintomas",
          label: "Há quanto tempo você percebe esses incômodos ou sentimentos?",
          type: "text",
          placeholder: "Ex: Há cerca de 6 meses, após mudança de emprego",
          required: true,
        },
        {
          id: "q_experiencia_anterior",
          label: "Já fez terapia ou acompanhamento psiquiátrico anteriormente?",
          type: "radio",
          options: ["Nunca fiz", "Sim, já fiz psicoterapia", "Sim, já passei por psiquiatra", "Sim, ambos"],
          required: true,
        },
        {
          id: "q_detalhe_anterior",
          label: "Se já fez, como foi sua experiência?",
          type: "textarea",
          placeholder: "Ex: Fiz por 1 ano, me ajudou bastante mas precisei interromper por tempo...",
          required: false,
        },
      ],
    },
    {
      id: "sec_sintomas",
      title: "2. Sintomas & Saúde Emocional",
      description: "Identificação dos sintomas físicos, emocionais e psicológicos que você vivencia.",
      questions: [
        {
          id: "q_sintomas_lista",
          label: "Quais dos sintomas abaixo você tem vivenciado com frequência nas últimas semanas?",
          type: "checkbox",
          options: [
            "Ansiedade constante / Preocupação excessiva",
            "Crises de pânico / Taquicardia / Falta de ar",
            "Tristeza profunda / Vontade de chorar sem motivo aparente",
            "Insônia ou dificuldade para manter o sono",
            "Cansaço excessivo e falta de energia",
            "Pensamentos repetitivos ou obsessivos",
            "Dificuldade de concentração e foco",
            "Irritabilidade ou oscilações de humor",
            "Sensação de solidão ou incompreensão",
            "Dificuldade em impor limites / Dizer 'não'",
          ],
          required: true,
        },
        {
          id: "q_escala_impacto",
          label: "Em uma escala de 1 a 10, qual o impacto desses sintomas na sua rotina diária?",
          type: "scale_1_10",
          helpText: "1 = impacto mínimo, 10 = impacto severo/incapacitante",
          required: true,
        },
        {
          id: "q_medicamentos",
          label: "Faz uso contínuo de alguma medicação (antidepressivo, ansiolítico, etc.)?",
          type: "text",
          placeholder: "Ex: Não uso / Sim, Escitalopram 10mg receitado pelo Dr. Carlos",
          required: false,
        },
      ],
    },
    {
      id: "sec_familia",
      title: "3. Histórico Pessoal & Relações Familiares",
      description: "Compreensão da sua rede de apoio, histórico afetivo e dinâmica familiar.",
      questions: [
        {
          id: "q_estado_civil",
          label: "Estado civil / Situação amorosa atual:",
          type: "radio",
          options: ["Solteiro(a)", "Casado(a) / União Estável", "Namorando", "Divorciado(a) / Separado(a)", "Viúvo(a)"],
          required: true,
        },
        {
          id: "q_filhos",
          label: "Tem filhos? Se sim, quantos e idades:",
          type: "text",
          placeholder: "Ex: Não tenho / Sim, 2 filhos (5 e 8 anos)",
          required: false,
        },
        {
          id: "q_com_quem_mora",
          label: "Com quem você reside atualmente?",
          type: "text",
          placeholder: "Ex: Moro sozinho(a) / Moro com meu cônjuge e filho",
          required: true,
        },
        {
          id: "q_relacao_familia",
          label: "Como é o seu relacionamento com seus pais e familiares mais próximos?",
          type: "textarea",
          placeholder: "Conte brevemente sobre a relação com pai, mãe ou figuras de referência...",
          required: false,
        },
        {
          id: "q_trabalho",
          label: "Profissão / Ocupação atual e grau de satisfação no trabalho:",
          type: "textarea",
          placeholder: "Ex: Sou designer, trabalho em home office. Me sinto estressado com prazos...",
          required: false,
        },
      ],
    },
    {
      id: "sec_rotina",
      title: "4. Rotina, Sono & Estilo de Vida",
      description: "Hábitos que influenciam sua energia, corpo e mente.",
      questions: [
        {
          id: "q_sono_qualidade",
          label: "Como você avalia a qualidade do seu sono?",
          type: "radio",
          options: [
            "Durmo muito bem (7 a 8h restauradoras)",
            "Tenho dificuldade para pegar no sono",
            "Acordo várias vezes durante a noite",
            "Acordo cansado(a) mesmo após dormir",
          ],
          required: true,
        },
        {
          id: "q_atividades_fisicas",
          label: "Pratica atividade física?",
          type: "radio",
          options: ["Frequentemente (3x ou mais por semana)", "Ocasionalmente (1 a 2x por semana)", "Raramente ou Nunca"],
          required: true,
        },
        {
          id: "q_lazer",
          label: "O que você costuma fazer para relaxar ou nos momentos livres?",
          type: "textarea",
          placeholder: "Ex: Leitura, passear com cachorro, assistir séries, cozinhar...",
          required: false,
        },
      ],
    },
    {
      id: "sec_expectativas",
      title: "5. Expectativas & Preferências",
      description: "Alinhamento sobre formato, horários e objetivos terapêuticos.",
      questions: [
        {
          id: "q_expectativa_processo",
          label: "O que você mais gostaria de transformar ou compreender sobre si mesmo(a) na análise?",
          type: "textarea",
          placeholder: "Ex: Quero aprender a lidar com minhas angústias, me conhecer melhor e ter relações mais saudáveis...",
          required: true,
        },
        {
          id: "q_formato_preferido",
          label: "Qual o formato de atendimento de sua preferência?",
          type: "radio",
          options: ["Online (Google Meet / WhatsApp Vídeo)", "Presencial no Consultório", "Sem preferência / Híbrido"],
          required: true,
        },
        {
          id: "q_disponibilidade_horarios",
          label: "Qual a sua disponibilidade de horários para as sessões?",
          type: "checkbox",
          options: ["Manhã (08h às 12h)", "Tarde (13h às 18h)", "Noite (18h às 21h)", "Sábados de manhã"],
          required: true,
        },
        {
          id: "q_recado_final",
          label: "Gostaria de deixar mais alguma observação ou dúvida para a Dra. Joane?",
          type: "textarea",
          placeholder: "Espaço livre para qualquer comentário adicional...",
          required: false,
        },
      ],
    },
  ];

  const template = await prisma.anamnesisTemplate.create({
    data: {
      title: "Anamnese Psicanalítica e Clínica - Adulto (Padrão Oficial)",
      description: "Formulário completo para acolhimento inicial, investigação de queixas e histórico biopsicossocial.",
      version: 1,
      isActive: true,
      sections: JSON.stringify(standardSections),
    },
  });

  console.log("✓ Template de Anamnese criado e ativado:", template.title);

  // 4. Cria Pacientes e Submissões de Teste para o Painel WhatsApp Web
  const patient1 = await prisma.patient.create({
    data: {
      fullName: "Mariana Albuquerque Santos",
      email: "mariana.santos@email.com",
      phone: "(11) 99123-4567",
      birthDate: "1994-05-18",
      cpf: "123.456.789-01",
      gender: "Feminino",
      occupation: "Arquiteta e Urbanista",
      maritalStatus: "Solteira",
      notes: "Paciente procurou por recomendação médica. Relata episódios de angústia aos domingos à noite.",
    },
  });

  const answers1 = {
    q_motivo: "Estou passando por uma fase muito confusa no trabalho e na vida pessoal. Sinto uma angústia constante, um aperto no peito e muito medo do futuro. Quero me entender melhor.",
    q_tempo_sintomas: "Cerca de 8 meses, piorou bastante no último trimestre.",
    q_experiencia_anterior: "Sim, já fiz psicoterapia",
    q_detalhe_anterior: "Fiz psicoterapia TCC há 2 anos, mas sinto que preciso de uma abordagem mais profunda que olhe para minha história.",
    q_sintomas_lista: [
      "Ansiedade constante / Preocupação excessiva",
      "Insônia ou dificuldade para manter o sono",
      "Pensamentos repetitivos ou obsessivos",
      "Dificuldade em impor limites / Dizer 'não'",
    ],
    q_escala_impacto: "8",
    q_medicamentos: "Não tomo nenhuma medicação atualmente.",
    q_estado_civil: "Solteiro(a)",
    q_filhos: "Não tenho",
    q_com_quem_mora: "Moro sozinha com 2 gatos em Pinheiros.",
    q_relacao_familia: "Relação um pouco distante com meu pai e muito cobrança por parte da minha mãe para casar e ter sucesso.",
    q_trabalho: "Arquiteta autônoma. Trabalho muito, cerca de 10h a 12h por dia, o que me deixa esgotada.",
    q_sono_qualidade: "Tenho dificuldade para pegar no sono",
    q_atividades_fisicas: "Ocasionalmente (1 a 2x por semana)",
    q_lazer: "Pintura em aquarela, leitura de romances e cinema.",
    q_expectativa_processo: "Quero aprender a dizer não sem culpa, diminuir a autocobrança e ter mais leveza na vida.",
    q_formato_preferido: "Online (Google Meet / WhatsApp Vídeo)",
    q_disponibilidade_horarios: ["Noite (18h às 21h)", "Sábados de manhã"],
    q_recado_final: "Estou ansiosa para começarmos, obrigada pelo acolhimento!",
  };

  const sub1 = await prisma.anamnesisSubmission.create({
    data: {
      patientId: patient1.id,
      templateId: template.id,
      templateVersion: template.version,
      templateSnapshot: JSON.stringify(standardSections),
      answers: JSON.stringify(answers1),
      status: "in_review",
      clinicalNotes: "Paciente com forte traço de perfeccionismo e angústia ligada a expectativas parentais. Boa abertura para psicanálise.",
      reviewedAt: new Date(),
    },
  });

  // Cria contrato de teste para Mariana
  await prisma.contract.create({
    data: {
      patientId: patient1.id,
      submissionId: sub1.id,
      title: "Contrato de Prestação de Serviços Psicanalíticos",
      therapistName: admin.name,
      therapistDoc: admin.crp,
      therapistAddress: admin.address,
      sessionPrice: 200.0,
      frequency: "Semanal (1 sessão por semana)",
      durationMinutes: 50,
      paymentMethod: "PIX mensal até o dia 05 de cada mês",
      status: "draft",
    },
  });

  const patient2 = await prisma.patient.create({
    data: {
      fullName: "Lucas Ferraz de Oliveira",
      email: "lucas.ferraz@email.com",
      phone: "(11) 98877-6655",
      birthDate: "1988-11-03",
      cpf: "234.567.890-12",
      gender: "Masculino",
      occupation: "Engenheiro de Software",
      maritalStatus: "Casado",
      notes: "Sintomas de Burnout e dificuldade de desconexão.",
    },
  });

  const answers2 = {
    q_motivo: "Sensação de esgotamento total, crises de pânico repentinas quando abro o notebook pela manhã. Preciso de ajuda urgente para reorganizar minha mente.",
    q_tempo_sintomas: "3 meses com crises intensas.",
    q_experiencia_anterior: "Nunca fiz",
    q_detalhe_anterior: "",
    q_sintomas_lista: [
      "Crises de pânico / Taquicardia / Falta de ar",
      "Cansaço excessivo e falta de energia",
      "Irritabilidade ou oscilações de humor",
    ],
    q_escala_impacto: "9",
    q_medicamentos: "Passei no psiquiatra semana passada e iniciei Sertralina 50mg.",
    q_estado_civil: "Casado(a) / União Estável",
    q_filhos: "1 filha de 2 anos",
    q_com_quem_mora: "Com minha esposa e filha.",
    q_relacao_familia: "Família acolhedora, esposa muito parceira, mas me sinto culpado por estar sempre irritado com elas.",
    q_trabalho: "Engenheiro sênior em multinacional. Muita pressão por entregas.",
    q_sono_qualidade: "Acordo várias vezes durante a noite",
    q_atividades_fisicas: "Raramente ou Nunca",
    q_lazer: "Jogos eletrônicos quando dá tempo.",
    q_expectativa_processo: "Quero sair desse estado de alerta permanente e voltar a ter paz.",
    q_formato_preferido: "Online (Google Meet / WhatsApp Vídeo)",
    q_disponibilidade_horarios: ["Manhã (08h às 12h)", "Noite (18h às 21h)"],
    q_recado_final: "Gostaria de agendar a primeira sessão o quanto antes.",
  };

  await prisma.anamnesisSubmission.create({
    data: {
      patientId: patient2.id,
      templateId: template.id,
      templateVersion: template.version,
      templateSnapshot: JSON.stringify(standardSections),
      answers: JSON.stringify(answers2),
      status: "pending",
      clinicalNotes: "Quadro compatível com Síndrome de Burnout aguda associada a ataques de pânico. Priorizar acolhimento e escuta da urgência subjetiva.",
    },
  });

  const patient3 = await prisma.patient.create({
    data: {
      fullName: "Beatriz Nogueira Lima",
      email: "beatriz.nogueira@email.com",
      phone: "(21) 97654-3210",
      birthDate: "2001-09-22",
      cpf: "345.678.901-23",
      gender: "Feminino",
      occupation: "Estudante de Letras",
      maritalStatus: "Solteira",
      notes: "Encaminhada por amiga de faculdade.",
    },
  });

  const answers3 = {
    q_motivo: "Busco autoconhecimento e compreender padrões repetitivos nos meus relacionamentos afetivos e com amigos.",
    q_tempo_sintomas: "Desde a adolescência.",
    q_experiencia_anterior: "Sim, já fiz psicoterapia",
    q_detalhe_anterior: "Fiz quando tinha 16 anos por 6 meses.",
    q_sintomas_lista: [
      "Sensação de solidão ou incompreensão",
      "Tristeza profunda / Vontade de chorar sem motivo aparente",
    ],
    q_escala_impacto: "6",
    q_medicamentos: "Nenhum",
    q_estado_civil: "Solteiro(a)",
    q_filhos: "Não tenho",
    q_com_quem_mora: "Com minha mãe.",
    q_relacao_familia: "Relacionamento com a mãe tem muitos conflitos de convivência.",
    q_trabalho: "Estagiária em editora.",
    q_sono_qualidade: "Durmo muito bem (7 a 8h restauradoras)",
    q_atividades_fisicas: "Frequentemente (3x ou mais por semana)",
    q_lazer: "Escrever poesia, ir a museus e saraus.",
    q_expectativa_processo: "Construir minha autonomia emocional e subjetiva.",
    q_formato_preferido: "Online (Google Meet / WhatsApp Vídeo)",
    q_disponibilidade_horarios: ["Tarde (13h às 18h)"],
    q_recado_final: "",
  };

  await prisma.anamnesisSubmission.create({
    data: {
      patientId: patient3.id,
      templateId: template.id,
      templateVersion: template.version,
      templateSnapshot: JSON.stringify(standardSections),
      answers: JSON.stringify(answers3),
      status: "approved",
      clinicalNotes: "Paciente iniciou processo de análise. Sessões semanais às quartas 15h.",
      reviewedAt: new Date(),
    },
  });

  console.log("✓ 3 Pacientes e Submissões de teste criados com sucesso!");
  console.log("Seed finalizado com sucesso! 🎉");
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
