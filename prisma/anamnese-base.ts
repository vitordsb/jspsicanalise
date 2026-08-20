/**
 * Modelo base de anamnese psicanalítica para adultos.
 *
 * Este é o ponto de partida. A Joane pode editar, duplicar ou criar outros
 * modelos pelo Form Builder em /admin/anamneses. Manter este arquivo como
 * a versão canônica facilita recriar o modelo padrão se ela quiser voltar atrás.
 *
 * Estrutura baseada em roteiros de anamnese psicológica clínica para adultos,
 * com triagem de risco na seção 8 (ver AVISO abaixo).
 *
 * AVISO CLÍNICO: a seção 8 faz triagem de ideação suicida. Como este formulário
 * é assíncrono (a Joane lê depois, não em tempo real), a interface deve:
 *   1. Mostrar canais de emergência (CVV 188, SAMU 192, CAPS) assim que o
 *      paciente sinalizar risco, ainda dentro do formulário.
 *   2. Destacar a ficha no painel administrativo para leitura prioritária.
 * Não remova a triagem sem falar com a Joane: é item de segurança, não de UX.
 */

import type { FormSection } from "../src/lib/types";

export const ANAMNESE_BASE_TITULO = "Anamnese Psicanalítica Clínica - Adulto";

export const ANAMNESE_BASE_DESCRICAO =
  "Ficha inicial de acolhimento. Suas respostas são confidenciais e servem para que a análise comece a partir da sua história, no seu tempo. Responda com o que fizer sentido para você: não existe resposta certa ou errada, e você pode deixar em branco o que preferir conversar pessoalmente.";

export const ANAMNESE_BASE_SECOES: FormSection[] = [
  {
    id: "sec_motivo",
    title: "1. O que traz você até aqui",
    description:
      "Vamos começar pelo presente: o que está acontecendo agora na sua vida.",
    questions: [
      {
        id: "q_motivo",
        label: "O que motivou você a procurar análise neste momento?",
        type: "textarea",
        required: true,
        placeholder: "Escreva com suas palavras, sem se preocupar com a forma.",
        helpText:
          "Pode ser um acontecimento específico, um incômodo antigo ou apenas uma sensação difícil de nomear.",
      },
      {
        id: "q_tempo_queixa",
        label: "Há quanto tempo você percebe esse incômodo?",
        type: "select",
        required: false,
        options: [
          "Menos de um mês",
          "Alguns meses",
          "Cerca de um ano",
          "Alguns anos",
          "Desde que me lembro",
        ],
      },
      {
        id: "q_impacto",
        label:
          "Em uma escala de 1 a 10, o quanto isso afeta o seu dia a dia hoje?",
        type: "scale_1_10",
        required: false,
        helpText: "1 significa quase nada, 10 significa que atrapalha tudo.",
      },
      {
        id: "q_gatilho",
        label:
          "Aconteceu algo recente que fez você decidir buscar ajuda agora, e não antes?",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "sec_historia_queixa",
    title: "2. Como isso foi se formando",
    description: "A história do incômodo costuma dizer tanto quanto ele mesmo.",
    questions: [
      {
        id: "q_inicio",
        label:
          "Você consegue lembrar quando isso começou ou o que estava acontecendo na sua vida na época?",
        type: "textarea",
        required: false,
      },
      {
        id: "q_evolucao",
        label: "De lá para cá, isso mudou de alguma forma?",
        type: "radio",
        required: false,
        options: [
          "Vem piorando",
          "Está estável",
          "Melhora e piora em ciclos",
          "Vem melhorando",
          "Não sei dizer",
        ],
      },
      {
        id: "q_tentativas",
        label: "O que você já tentou para lidar com isso?",
        type: "textarea",
        required: false,
        helpText:
          "Terapia, medicação, religião, exercício, conversar com alguém, evitar o assunto. Tudo conta.",
      },
    ],
  },
  {
    id: "sec_saude_mental",
    title: "3. Histórico de acompanhamento",
    description: "Para eu entender por onde você já passou.",
    questions: [
      {
        id: "q_terapia_antes",
        label: "Você já fez terapia ou análise antes?",
        type: "radio",
        required: false,
        options: ["Nunca fiz", "Fiz e concluí", "Fiz e interrompi", "Faço atualmente"],
      },
      {
        id: "q_terapia_experiencia",
        label: "Se já fez, como foi essa experiência para você?",
        type: "textarea",
        required: false,
        helpText: "O que ajudou, o que não funcionou, por que terminou.",
      },
      {
        id: "q_psiquiatra",
        label: "Você tem ou já teve acompanhamento psiquiátrico?",
        type: "radio",
        required: false,
        options: ["Nunca", "Já tive", "Tenho atualmente"],
      },
      {
        id: "q_diagnostico",
        label: "Você já recebeu algum diagnóstico em saúde mental?",
        type: "textarea",
        required: false,
        helpText: "Se preferir conversar sobre isso pessoalmente, pode deixar em branco.",
      },
      {
        id: "q_medicacao",
        label: "Faz uso contínuo de alguma medicação?",
        type: "textarea",
        required: false,
        helpText:
          "Inclua o nome e, se souber, a dosagem. Vale também medicação não psiquiátrica.",
      },
      {
        id: "q_internacao",
        label: "Já passou por internação relacionada à saúde mental?",
        type: "radio",
        required: false,
        options: ["Não", "Sim", "Prefiro conversar pessoalmente"],
      },
    ],
  },
  {
    id: "sec_corpo",
    title: "4. Corpo, sono e hábitos",
    description: "O corpo costuma falar o que ainda não virou palavra.",
    questions: [
      {
        id: "q_sintomas",
        label:
          "Quais destes você tem sentido com frequência nas últimas semanas?",
        type: "checkbox",
        required: false,
        options: [
          "Ansiedade ou angústia",
          "Tristeza persistente",
          "Irritabilidade",
          "Cansaço constante",
          "Dificuldade de concentração",
          "Crises de choro",
          "Falta de vontade de fazer coisas",
          "Medo ou pânico",
          "Pensamentos repetitivos",
          "Isolamento das pessoas",
          "Dores no corpo sem causa clara",
          "Nenhum destes",
        ],
      },
      {
        id: "q_sono",
        label: "Como está o seu sono?",
        type: "radio",
        required: false,
        options: [
          "Durmo bem",
          "Demoro muito para dormir",
          "Acordo várias vezes",
          "Acordo cedo demais e não volto a dormir",
          "Durmo demais",
        ],
      },
      {
        id: "q_alimentacao",
        label: "E a sua relação com a comida ultimamente?",
        type: "radio",
        required: false,
        options: [
          "Sem alterações",
          "Perdi o apetite",
          "Estou comendo mais que o habitual",
          "Oscila bastante",
          "Tenho uma relação difícil com a comida",
        ],
      },
      {
        id: "q_substancias",
        label: "Você faz uso de álcool ou outras substâncias?",
        type: "textarea",
        required: false,
        helpText:
          "Frequência e contexto ajudam mais que quantidade exata. Este espaço não é de julgamento.",
      },
      {
        id: "q_saude_fisica",
        label: "Tem alguma condição de saúde física que eu deva saber?",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "sec_historia",
    title: "5. Sua história",
    description:
      "A psicanálise trabalha com o que veio antes. Responda no nível de profundidade que você se sentir à vontade.",
    questions: [
      {
        id: "q_infancia",
        label: "Como você descreveria a sua infância?",
        type: "textarea",
        required: false,
      },
      {
        id: "q_marcos",
        label:
          "Houve algum acontecimento que você considera marcante na sua vida?",
        type: "textarea",
        required: false,
        helpText:
          "Perdas, mudanças, separações, adoecimentos, conquistas. O que vier à cabeça.",
      },
      {
        id: "q_lutos",
        label: "Você viveu alguma perda importante?",
        type: "textarea",
        required: false,
      },
    ],
  },
  {
    id: "sec_familia",
    title: "6. Família e vínculos",
    questions: [
      {
        id: "q_residencia",
        label: "Com quem você mora atualmente?",
        type: "text",
        required: false,
      },
      {
        id: "q_familia_relacao",
        label:
          "Como é a sua relação com as pessoas da sua família de origem?",
        type: "textarea",
        required: false,
      },
      {
        id: "q_familia_saude_mental",
        label:
          "Existe histórico de sofrimento psíquico na sua família?",
        type: "textarea",
        required: false,
        helpText:
          "Depressão, ansiedade, dependência química, suicídio, internações. Se souber, indique o parentesco.",
      },
      {
        id: "q_filhos",
        label: "Você tem filhos?",
        type: "text",
        required: false,
        placeholder: "Se sim, quantos e as idades",
      },
    ],
  },
  {
    id: "sec_vida",
    title: "7. Trabalho, estudos e vida afetiva",
    questions: [
      {
        id: "q_ocupacao",
        label: "Qual a sua ocupação atual?",
        type: "text",
        required: false,
      },
      {
        id: "q_satisfacao_trabalho",
        label: "De 1 a 10, o quanto você se sente satisfeito com ela?",
        type: "scale_1_10",
        required: false,
      },
      {
        id: "q_relacionamento",
        label: "Como está a sua vida afetiva hoje?",
        type: "textarea",
        required: false,
        helpText:
          "Relacionamentos, solidão, sexualidade. Fale apenas do que quiser falar.",
      },
    ],
  },
  {
    id: "sec_seguranca",
    title: "8. Cuidado e segurança",
    description:
      "Estas perguntas são delicadas e existem para que eu possa cuidar de você da forma certa. Se você estiver em sofrimento intenso agora, ligue 188 (CVV, gratuito, 24 horas) ou procure o CAPS mais próximo. Em emergência, 192 (SAMU).",
    questions: [
      {
        id: "q_ideacao",
        label:
          "Nas últimas semanas, você teve pensamentos de que não valeria a pena continuar vivendo?",
        type: "radio",
        required: false,
        options: [
          "Não",
          "Passou pela minha cabeça, mas sem intenção",
          "Sim, com alguma frequência",
          "Sim, e isso me assusta",
          "Prefiro não responder aqui",
        ],
        helpText:
          "Responder sim não muda como você será acolhida ou acolhido. Muda apenas a prioridade do meu retorno.",
      },
      {
        id: "q_autolesao",
        label: "Você já se machucou de propósito em algum momento da vida?",
        type: "radio",
        required: false,
        options: ["Não", "Já, no passado", "Sim, recentemente", "Prefiro não responder aqui"],
      },
      {
        id: "q_rede_apoio",
        label: "Com quem você pode contar quando as coisas apertam?",
        type: "textarea",
        required: false,
      },
      {
        id: "q_contato_emergencia",
        label: "Contato de emergência (nome, parentesco e telefone)",
        type: "text",
        required: false,
        placeholder: "Ex: Maria, irmã, (11) 90000-0000",
        helpText:
          "Só será usado em situação de risco à sua vida, conforme prevê o código de ética.",
      },
    ],
  },
  {
    id: "sec_expectativas",
    title: "9. Expectativas e combinados",
    questions: [
      {
        id: "q_expectativa",
        label:
          "O que você gostaria que fosse diferente na sua vida ao longo da análise?",
        type: "textarea",
        required: false,
      },
      {
        id: "q_modalidade",
        label: "Qual formato de atendimento você prefere?",
        type: "radio",
        required: false,
        options: ["Presencial", "Online", "Tanto faz"],
      },
      {
        id: "q_disponibilidade",
        label: "Quais dias e horários funcionam melhor para você?",
        type: "textarea",
        required: false,
      },
      {
        id: "q_observacoes",
        label: "Quer deixar mais alguma coisa registrada antes da nossa conversa?",
        type: "textarea",
        required: false,
      },
    ],
  },
];
