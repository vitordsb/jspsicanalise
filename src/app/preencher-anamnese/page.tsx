"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { QuestionField } from "@/components/form/QuestionField";
import { formatCPF, formatPhone, formatDateInput, isValidDateBRL } from "@/lib/formatters";
import { isValidCpf } from "@/lib/cpf";
import { temSinalDeRisco } from "@/lib/risco-clinico";
import { FormSection } from "@/lib/types";
import confetti from "canvas-confetti";
import {
  User,
  CheckCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Send,
  Lock,
  MessageCircle,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export default function PreencherAnamnesePage() {
  const [loadingTemplate, setLoadingTemplate] = useState(true);
  const [template, setTemplate] = useState<{
    id: string;
    title: string;
    description: string;
    version: number;
    sections: FormSection[];
  } | null>(null);

  // Stepper: 1: Dados Pessoais, 2+: Secoes da Anamnese, Last: Revisao
  const [currentStep, setCurrentStep] = useState(1);

  // Dados Pessoais
  const [personalInfo, setPersonalInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    birthDate: "",
    cpf: "",
    gender: "",
    occupation: "",
    maritalStatus: "",
  });

  // Respostas da Anamnese
  const [answers, setAnswers] = useState<Record<string, unknown>>({});

  // Consentimento LGPD - obrigatorio antes do envio
  const [lgpdConsent, setLgpdConsent] = useState(false);

  // Estados de Envio & Validacao
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Codigo de acesso a area do paciente. So existe em claro neste momento.
  const [tokenAcesso, setTokenAcesso] = useState("");
  // Quando o servidor ja abriu a sessao, a pessoa vai direto escolher horario
  // em vez de ter que digitar CPF e codigo logo depois de recebe-lo.
  const [autenticado, setAutenticado] = useState(false);
  const [alreadySubmittedInfo, setAlreadySubmittedInfo] = useState<{
    createdAt?: string;
    status?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedId, setSubmittedId] = useState("");

  // Carrega o modelo de anamnese ativo
  useEffect(() => {
    async function loadActiveTemplate() {
      try {
        setLoadingTemplate(true);
        const res = await fetch("/api/anamnese/active");
        if (res.ok) {
          const data = await res.json();
          setTemplate(data);
        } else {
          setErrorMessage("Nao foi possivel carregar o formulario de anamnese no momento.");
        }
      } catch (err) {
        console.error("Erro ao carregar template:", err);
        setErrorMessage("Falha de conexao ao carregar formulario.");
      } finally {
        setLoadingTemplate(false);
      }
    }

    loadActiveTemplate();
  }, []);

  // Checagem proativa de CPF duplicado ao sair do campo
  const handleCpfBlur = async () => {
    const rawCpf = personalInfo.cpf.trim();
    if (rawCpf.length >= 11) {
      // CPF com digito verificador errado: avisa aqui mesmo, sem gastar uma
      // chamada ao backend. Antes esse caso caia no "senao" abaixo e o
      // formulario tratava como CPF livre, sem avisar nada — a pessoa so
      // descobria o erro de digitacao depois de preencher a ficha inteira.
      if (!isValidCpf(rawCpf)) {
        setAlreadySubmittedInfo(null);
        setErrorMessage("CPF inválido. Confira os números digitados.");
        return;
      }

      try {
        const res = await fetch("/api/anamnese/check-cpf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: rawCpf }),
        });
        const data = await res.json();
        if (data.exists) {
          // Nota: o backend nao retorna mais patientName por reducao de exposicao de PII
          setAlreadySubmittedInfo({
            createdAt: data.createdAt,
            status: data.status,
          });
        } else {
          setAlreadySubmittedInfo(null);
        }
      } catch (e) {
        console.error("Erro ao checar CPF:", e);
      }
    }
  };

  // Secoes da Anamnese
  const sections = template?.sections || [];
  const totalSteps = 1 + sections.length + 1; // 1 (Dados) + N (Secoes) + 1 (Revisao)

  const handlePersonalInfoChange = (field: string, value: string) => {
    let formatted = value;
    if (field === "cpf") formatted = formatCPF(value);
    if (field === "phone") formatted = formatPhone(value);
    if (field === "birthDate") formatted = formatDateInput(value);

    setPersonalInfo((prev) => ({ ...prev, [field]: formatted }));
    if (errorMessage) setErrorMessage("");
    if (alreadySubmittedInfo && field === "cpf") setAlreadySubmittedInfo(null);
  };

  const handleAnswerChange = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errorMessage) setErrorMessage("");
  };

  // Detecta sinalizacao de risco nas respostas atuais. Mesma funcao usada
  // na limpeza de fichas expiradas e no destaque do painel administrativo:
  // se a Joane renomear a pergunta no editor de template, os tres lugares
  // continuam detectando junto, em vez de so um deles sobreviver.
  const showRiskAlert = temSinalDeRisco(answers);

  // Validacao da Etapa 1. Espelha as regras de submitAnamnesisSchema
  // (src/lib/validate.ts) para o erro aparecer aqui, nao so depois de
  // preencher a ficha inteira e levar 400 no envio final.
  const validateStep1 = () => {
    if (personalInfo.fullName.trim().length < 3) return "Por favor, preencha seu nome completo.";
    if (!personalInfo.cpf.trim() || !isValidCpf(personalInfo.cpf)) return "Por favor, informe um CPF válido. Confira os números digitados.";
    if (!personalInfo.birthDate || !isValidDateBRL(personalInfo.birthDate)) return "Por favor, informe uma data de nascimento valida no formato DD/MM/AAAA.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personalInfo.email.trim())) return "Por favor, informe um e-mail valido.";
    if (!personalInfo.phone.trim() || personalInfo.phone.replace(/\D/g, "").length < 10) return "Por favor, informe seu telefone/WhatsApp completo com DDD.";
    return null;
  };

  // Validacao da Secao Atual
  const validateCurrentSection = (sectionIndex: number) => {
    const currentSection = sections[sectionIndex];
    if (!currentSection) return null;

    for (const q of currentSection.questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          return `Por favor, responda o campo obrigatorio: "${q.label}"`;
        }
      }
    }
    return null;
  };

  const handleNextStep = () => {
    setErrorMessage("");

    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setErrorMessage(err);
        return;
      }
      if (alreadySubmittedInfo) {
        setErrorMessage("Sua anamnese ja foi enviada anteriormente e esta em analise pela Dra. Joane Souza Oliveira de Andrade.");
        return;
      }
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const sectionIndex = currentStep - 2;
    if (sectionIndex < sections.length) {
      const err = validateCurrentSection(sectionIndex);
      if (err) {
        setErrorMessage(err);
        return;
      }
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setErrorMessage("");
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!template) return;

    if (!lgpdConsent) {
      setErrorMessage("Voce precisa marcar o consentimento LGPD para enviar a anamnese.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/anamnese/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personalInfo,
          answers,
          templateId: template.id,
          // Versao e secoes tal como carregadas ao abrir o formulario, nao
          // o que estiver no banco no instante do envio: se a Joane editar
          // o template enquanto a pessoa preenche, o registro salvo precisa
          // bater com o que ela realmente respondeu.
          templateVersion: template.version,
          templateSections: template.sections,
          lgpdConsent: true,
        }),
      });

      const data = await res.json();

      if (res.status === 409 || data.alreadySubmitted) {
        setAlreadySubmittedInfo({});
        setErrorMessage(data.error || "Sua anamnese ja foi enviada anteriormente e esta em analise pela Dra. Joane Souza Oliveira de Andrade.");
        return;
      }

      if (!res.ok) {
        setErrorMessage(data.error || "Ocorreu um erro ao enviar. Verifique os dados e tente novamente.");
        return;
      }

      // Sucesso!
      setIsSuccess(true);
      setSubmittedId(data.submissionId);
      setTokenAcesso(data.tokenAcesso || "");
      setAutenticado(Boolean(data.autenticado));

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#5d0c1d", "#f0ded8", "#8b1c31", "#c4a984"],
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erro ao submeter anamnese:", err);
      setErrorMessage("Erro de comunicacao com o servidor. Por favor, tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingTemplate) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f7f5]">
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#e5e0da] border-t-[#5d0c1d] rounded-full animate-spin mx-auto" />
            <p className="font-serif text-sm font-medium text-[#5f5456]">Carregando formulario de acolhimento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f7f5]">
      <main className="flex-1 py-8 sm:py-12 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* TELA DE SUCESSO */}
          {isSuccess ? (
            <div className="bg-white rounded-3xl border border-[#e5e0da] p-8 sm:p-12 text-center shadow-lg shadow-black/5 space-y-6">
              <div className="w-20 h-20 rounded-full bg-[#fbf5f2] border border-[#f0ded8] text-[#5d0c1d] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10 text-[#5d0c1d]" />
              </div>

              <div className="space-y-2">
                <span className="text-xs uppercase font-bold tracking-[1px] text-[#5d0c1d] bg-[#fbf5f2] border border-[#f0ded8] px-4 py-1.5 rounded-full">
                  Recebido com Sucesso
                </span>
                <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d] pt-3">
                  Obrigada, {personalInfo.fullName.split(" ")[0]}!
                </h1>
                <p className="text-[#5f5456] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
                  Sua ficha de anamnese foi enviada para a <strong>Dra. Joane Souza Oliveira de Andrade</strong>.
                  Seus dados estao protegidos com total sigilo profissional e etica.
                </p>
              </div>

              {tokenAcesso && (
                <div className="bg-[#fffbeb] border-2 border-[#fde68a] rounded-2xl p-6 max-w-md mx-auto space-y-3">
                  <p className="font-serif text-sm font-bold text-[#92400e]">
                    Guarde este código
                  </p>
                  <p className="text-3xl sm:text-4xl font-bold tracking-[0.2em] text-[#5d0c1d] select-all py-1">
                    {tokenAcesso.slice(0, 4)} {tokenAcesso.slice(4)}
                  </p>
                  <p className="text-xs text-[#78350f] leading-relaxed text-left">
                    Com ele e o seu CPF você acompanha o andamento da sua ficha e
                    recebe o contrato pela sua área. Anote agora: por segurança,
                    ele não aparece de novo. Se perder, a Dra. Joane emite um novo
                    para você.
                  </p>
                  <a
                    href={autenticado ? "/area-do-paciente" : "/area-do-paciente/entrar"}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#5d0c1d] hover:bg-[#8b1c31] text-white text-xs font-semibold transition"
                  >
                    <span>
                      {autenticado ? "Escolher meu horário agora" : "Entrar e marcar minha consulta"}
                    </span>
                  </a>
                </div>
              )}

              {!tokenAcesso && (
                <div className="bg-[#fbf3ef] border border-[#f0ded8] rounded-2xl p-6 max-w-md mx-auto space-y-3 text-left">
                  <p className="font-serif text-sm font-bold text-[#5d0c1d]">
                    Você já tem acesso à sua área
                  </p>
                  <p className="text-xs text-[#5f5456] leading-relaxed">
                    Encontramos um cadastro seu. Entre com o seu CPF e o código de
                    acesso que você já recebeu para marcar sua consulta. Se não tiver
                    o código à mão, fale com a Dra. Joane que ela emite outro.
                  </p>
                  <a
                    href="/area-do-paciente/entrar"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#5d0c1d] hover:bg-[#8b1c31] text-white text-xs font-semibold transition"
                  >
                    <span>Entrar na minha área</span>
                  </a>
                </div>
              )}

              <div className="bg-[#fbf9f7] border border-[#e5e0da] rounded-2xl p-6 text-left max-w-md mx-auto space-y-3 text-xs sm:text-sm text-[#5f5456]">
                <div className="flex items-center gap-2 text-[#5d0c1d] font-bold">
                  <Clock className="w-4 h-4 text-[#5d0c1d]" />
                  <span className="font-serif text-sm">Proximos Passos:</span>
                </div>
                <p className="text-[#92400e] font-semibold">
                  1. Marque sua consulta em até 24 horas. Sem agendamento, sua ficha
                  é removida e você precisa preencher de novo.
                </p>
                {autenticado && (
                  <a
                    href="/area-do-paciente"
                    className="inline-flex items-center gap-1.5 text-[#5d0c1d] font-bold hover:underline"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ver horários disponíveis</span>
                  </a>
                )}
                <p>2. A Dra. Joane fara a leitura detalhada das suas respostas.</p>
                <p>3. Ela entrara em contato pelo seu WhatsApp (<strong>{personalInfo.phone}</strong>) para alinhar o primeiro encontro.</p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/55${personalInfo.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Ola Dra. Joane, acabei de preencher minha ficha de anamnese no site (${personalInfo.fullName}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#5d0c1d] hover:bg-[#8b1c31] text-white text-sm font-semibold shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Avisar pelo WhatsApp</span>
                </a>

                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-white border border-[#d8d0c8] text-[#5d0c1d] text-sm font-semibold hover:bg-[#fbf9f7] transition"
                >
                  Voltar ao Inicio
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CABECALHO DO FORMULARIO COM BARRA DE PROGRESSO */}
              <div className="bg-white rounded-3xl border border-[#e5e0da] p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eee9e4] pb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-[#5d0c1d] bg-[#fbf5f2] border border-[#f0ded8] px-3.5 py-1 rounded-full mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ficha de Anamnese Clinica</span>
                    </div>
                    <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#5d0c1d]">
                      {template?.title || "Ficha de Anamnese"}
                    </h1>
                    <p className="text-xs sm:text-sm text-[#5f5456] mt-1">
                      {template?.description || "Preencha com tranquilidade para o acolhimento inicial."}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#5d0c1d] font-semibold bg-[#fbf9f7] px-3.5 py-2 rounded-full border border-[#e5e0da] shrink-0">
                    <Lock className="w-4 h-4 text-[#5d0c1d]" />
                    <span>Sigilo Etico & LGPD</span>
                  </div>
                </div>

                {/* BARRA DE PROGRESSO */}
                <div className="pt-6">
                  <div className="flex items-center justify-between text-xs font-medium text-[#5f5456] mb-2">
                    <span>
                      Etapa {currentStep} de {totalSteps}
                    </span>
                    <span className="font-semibold text-[#5d0c1d]">
                      {currentStep === 1
                        ? "1. Dados Pessoais"
                        : currentStep === totalSteps
                        ? "Revisao e Envio"
                        : `${currentStep - 1}. ${sections[currentStep - 2]?.title || "Perguntas"}`}
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#f0ded8] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#5d0c1d] to-[#8b1c31] transition-all duration-300 rounded-full"
                      style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* ALERTA DE JA SUBMETIDO / DUPLICIDADE */}
              {alreadySubmittedInfo && (
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-3xl p-6 shadow-xs flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#fef3c7] text-[#92400e] shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 text-sm text-[#78350f]">
                    <h4 className="font-serif font-bold text-base text-[#92400e]">Anamnese ja enviada anteriormente!</h4>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      Identificamos que este CPF ja possui uma ficha de anamnese preenchida e ela <strong>esta em analise</strong> pela Dra. Joane Souza Oliveira de Andrade.
                    </p>
                    <p className="text-xs font-bold pt-1">
                      Caso precise atualizar alguma informacao importante ou agendar uma sessao, entre em contato direto pelo WhatsApp.
                    </p>
                  </div>
                </div>
              )}

              {/* MENSAGEM DE ERRO COM ALTO CONTRASTE */}
              {errorMessage && !alreadySubmittedInfo && (
                <div className="bg-[#fee2e2] border border-[#fca5a5] text-[#991b1b] font-medium rounded-2xl p-4 text-xs sm:text-sm flex items-center gap-3 shadow-xs">
                  <AlertCircle className="w-5 h-5 text-[#991b1b] shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* CONTEUDO DA ETAPA ATUAL */}
              <div className="bg-white rounded-3xl border border-[#e5e0da] p-6 sm:p-8 shadow-xs">
                {/* ETAPA 1: DADOS PESSOAIS */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="border-b border-[#eee9e4] pb-4">
                      <h2 className="font-serif text-xl font-bold text-[#5d0c1d] flex items-center gap-2">
                        <User className="w-5 h-5 text-[#5d0c1d]" />
                        <span>1. Dados Pessoais do Paciente</span>
                      </h2>
                      <p className="text-xs text-[#5f5456] mt-1">
                        Suas informacoes de contato e identificacao basica para prontuario clinico.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* NOME COMPLETO */}
                      <div className="sm:col-span-2">
                        <label htmlFor="fullName" className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Nome Completo <span className="text-[#5d0c1d]" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="fullName"
                          type="text"
                          required
                          placeholder="Ex: Mariana Albuquerque Santos"
                          value={personalInfo.fullName}
                          onChange={(e) => handlePersonalInfoChange("fullName", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                      </div>

                      {/* CPF */}
                      <div>
                        <label htmlFor="cpf" className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          CPF <span className="text-[#5d0c1d]" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="cpf"
                          type="text"
                          required
                          placeholder="000.000.000-00"
                          maxLength={14}
                          value={personalInfo.cpf}
                          onChange={(e) => handlePersonalInfoChange("cpf", e.target.value)}
                          onBlur={handleCpfBlur}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                        <span className="text-[11px] text-[#8e8284] pl-1">Identificacao unica do paciente.</span>
                      </div>

                      {/* DATA DE NASCIMENTO */}
                      <div>
                        <label htmlFor="birthDate" className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Data de Nascimento <span className="text-[#5d0c1d]" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="birthDate"
                          type="text"
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          value={personalInfo.birthDate}
                          onChange={(e) => handlePersonalInfoChange("birthDate", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                        <span className="text-[11px] text-[#8e8284] pl-1">Padrao brasileiro (ex: 18/05/1994).</span>
                      </div>

                      {/* E-MAIL */}
                      <div>
                        <label htmlFor="email" className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          E-mail <span className="text-[#5d0c1d]" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          placeholder="seuemail@exemplo.com"
                          value={personalInfo.email}
                          onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                      </div>

                      {/* TELEFONE / WHATSAPP */}
                      <div>
                        <label htmlFor="phone" className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Telefone / WhatsApp <span className="text-[#5d0c1d]" aria-hidden="true">*</span>
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          value={personalInfo.phone}
                          onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                      </div>

                      {/* GENERO */}
                      <div>
                        <label htmlFor="gender" className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Genero
                        </label>
                        <select
                          id="gender"
                          value={personalInfo.gender}
                          onChange={(e) => handlePersonalInfoChange("gender", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        >
                          <option value="">Selecione seu genero...</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Nao-binario">Nao-binario</option>
                          <option value="Travesti / Mulher Trans">Travesti / Mulher Trans</option>
                          <option value="Homem Trans">Homem Trans</option>
                          <option value="Outro">Outro</option>
                          <option value="Prefiro nao informar">Prefiro nao informar</option>
                        </select>
                      </div>

                      {/* PROFISSAO */}
                      <div>
                        <label htmlFor="occupation" className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Profissao / Ocupacao
                        </label>
                        <input
                          id="occupation"
                          type="text"
                          placeholder="Ex: Arquiteta, Designer, Estudante, etc."
                          value={personalInfo.occupation}
                          onChange={(e) => handlePersonalInfoChange("occupation", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ETAPAS 2+: SECOES DA ANAMNESE */}
                {currentStep > 1 && currentStep <= sections.length + 1 && (
                  <div className="space-y-6">
                    {(() => {
                      const sectionIndex = currentStep - 2;
                      const section = sections[sectionIndex];
                      if (!section) return null;

                      return (
                        <>
                          <div className="border-b border-[#eee9e4] pb-4">
                            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#5d0c1d]">
                              {section.title}
                            </h2>
                            {section.description && (
                              <p className="text-xs sm:text-sm text-[#5f5456] mt-1">
                                {section.description}
                              </p>
                            )}
                          </div>

                          <div className="space-y-6">
                            {section.questions.map((question) => (
                              <QuestionField
                                key={question.id}
                                question={question}
                                value={answers[question.id]}
                                onChange={(val) => handleAnswerChange(question.id, val)}
                              />
                            ))}
                          </div>

                          {/* Bloco de acolhimento - aparece quando ha sinalizacao de risco
                              Nao bloqueia o formulario, apenas acolhe e informa */}
                          {showRiskAlert && (
                            <div className="mt-6 rounded-3xl border border-[#f0ded8] bg-[#fbf5f2] p-6 space-y-4">
                              <div className="flex items-start gap-3">
                                <span className="text-2xl" aria-hidden="true">&#x1F90D;</span>
                                <div>
                                  <p className="font-serif font-bold text-[#5d0c1d] text-base">
                                    Voce nao esta sozinha.
                                  </p>
                                  <p className="text-sm text-[#5f5456] mt-1 leading-relaxed">
                                    Agradeco a sua honestidade em compartilhar isso. Esse tipo de resposta
                                    aumenta a prioridade do meu retorno para que possamos conversar logo.
                                    Enquanto isso, caso precise de apoio agora, estes canais estao disponiveis
                                    24 horas, de forma gratuita e sigilosa:
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="bg-white rounded-2xl border border-[#e5e0da] p-4 text-center">
                                  <p className="font-bold text-[#5d0c1d] text-lg">188</p>
                                  <p className="font-serif font-semibold text-sm text-[#5d0c1d]">CVV</p>
                                  <p className="text-xs text-[#5f5456] mt-1">Centro de Valorizacao da Vida - ligacao gratuita, 24 horas</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-[#e5e0da] p-4 text-center">
                                  <p className="font-bold text-[#5d0c1d] text-lg">192</p>
                                  <p className="font-serif font-semibold text-sm text-[#5d0c1d]">SAMU</p>
                                  <p className="text-xs text-[#5f5456] mt-1">Servico de Atendimento Movel de Urgencia</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-[#e5e0da] p-4 text-center">
                                  <p className="font-bold text-[#5d0c1d] text-lg">CAPS</p>
                                  <p className="font-serif font-semibold text-sm text-[#5d0c1d]">Centro de Atencao Psicossocial</p>
                                  <p className="text-xs text-[#5f5456] mt-1">Busque o CAPS mais proximo da sua cidade</p>
                                </div>
                              </div>

                              <p className="text-xs text-[#5f5456] italic">
                                Voce pode continuar preenchendo o formulario normalmente.
                                Sua honestidade ja e um passo importante.
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* ETAPA FINAL: REVISAO E ENVIO */}
                {currentStep === totalSteps && (
                  <div className="space-y-6">
                    <div className="border-b border-[#eee9e4] pb-4">
                      <h2 className="font-serif text-xl font-bold text-[#5d0c1d] flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#5d0c1d]" />
                        <span>Revisao dos Dados & Envio</span>
                      </h2>
                      <p className="text-xs text-[#5f5456] mt-1">
                        Por favor, confira seus dados antes de enviar para a avaliacao da Dra. Joane Souza Oliveira de Andrade.
                      </p>
                    </div>

                    {/* Resumo Dados Pessoais */}
                    <div className="bg-[#fbf9f7] border border-[#e5e0da] rounded-2xl p-6 space-y-3">
                      <h3 className="font-serif font-bold text-base text-[#5d0c1d] border-b border-[#eee9e4] pb-2">
                        Identificacao do Paciente
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                        <p><strong className="text-[#5d0c1d]">Nome:</strong> {personalInfo.fullName}</p>
                        <p><strong className="text-[#5d0c1d]">CPF:</strong> {personalInfo.cpf}</p>
                        <p><strong className="text-[#5d0c1d]">E-mail:</strong> {personalInfo.email}</p>
                        <p><strong className="text-[#5d0c1d]">WhatsApp:</strong> {personalInfo.phone}</p>
                        <p><strong className="text-[#5d0c1d]">Nascimento:</strong> {personalInfo.birthDate}</p>
                        {personalInfo.gender && <p><strong className="text-[#5d0c1d]">Genero:</strong> {personalInfo.gender}</p>}
                        {personalInfo.occupation && <p><strong className="text-[#5d0c1d]">Profissao:</strong> {personalInfo.occupation}</p>}
                      </div>
                    </div>

                    {/* Resumo Anamnese */}
                    <div className="bg-[#fbf9f7] border border-[#e5e0da] rounded-2xl p-6 space-y-4">
                      <h3 className="font-serif font-bold text-base text-[#5d0c1d] border-b border-[#eee9e4] pb-2">
                        Resumo das Respostas
                      </h3>
                      <div className="space-y-4 text-xs sm:text-sm">
                        {sections.map((sec) => (
                          <div key={sec.id} className="space-y-2">
                            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#5d0c1d]">
                              {sec.title}
                            </h4>
                            {sec.questions.map((q) => {
                              const ans = answers[q.id];
                              if (!ans) return null;
                              return (
                                <div key={q.id} className="pl-3 border-l-2 border-[#f0ded8] py-0.5">
                                  <p className="text-[#5f5456] font-semibold text-xs">{q.label}</p>
                                  <p className="text-[#221a1b] font-normal mt-0.5">
                                    {Array.isArray(ans) ? ans.join(", ") : String(ans)}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Lembrete de risco na revisao */}
                    {showRiskAlert && (
                      <div className="rounded-2xl border border-[#f0ded8] bg-[#fbf5f2] p-4 flex items-start gap-3 text-sm text-[#5d0c1d]">
                        <span className="text-xl shrink-0" aria-hidden="true">&#x1F90D;</span>
                        <p>
                          Voce compartilhou algo importante sobre seu momento emocional.
                          Irei priorizar o retorno para voce. Se precisar antes disso: <strong>CVV 188</strong> (gratuito, 24h) ou <strong>SAMU 192</strong>.
                        </p>
                      </div>
                    )}

                    {/* CONSENTIMENTO LGPD - OBRIGATORIO */}
                    <div className="rounded-2xl border-2 border-[#5d0c1d]/20 bg-[#fbf5f2] p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <ShieldCheck className="w-5 h-5 text-[#5d0c1d] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-serif font-bold text-sm text-[#5d0c1d]">
                            Consentimento LGPD - Protecao de Dados Pessoais e de Saude
                          </p>
                          <p className="text-xs text-[#5f5456] mt-1 leading-relaxed">
                            Ao enviar este formulario, voce autoriza o armazenamento e tratamento dos seus dados pessoais e de saude pela <strong>Dra. Joane Souza Oliveira de Andrade</strong>, exclusivamente para fins de atendimento clinico e psicanalitico, em conformidade com a Lei Geral de Protecao de Dados (LGPD - Lei 13.709/2018). Seus dados serao acessados somente pela profissional responsavel e nao serao compartilhados com terceiros sem seu consentimento expresso.
                          </p>
                        </div>
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={lgpdConsent}
                          onChange={(e) => {
                            setLgpdConsent(e.target.checked);
                            if (errorMessage) setErrorMessage("");
                          }}
                          className="mt-0.5 w-5 h-5 rounded border-2 border-[#d8d0c8] text-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/20 focus:outline-none shrink-0 accent-[#5d0c1d] cursor-pointer"
                          aria-required="true"
                        />
                        <span className="text-xs font-semibold text-[#5d0c1d] leading-relaxed group-hover:text-[#8b1c31] transition select-none">
                          Li e concordo com o tratamento dos meus dados pessoais e de saude pela Dra. Joane Souza Oliveira de Andrade nos termos descritos acima, conforme a LGPD.
                          <span className="text-[#5d0c1d] ml-1">*</span>
                        </span>
                      </label>

                      {!lgpdConsent && (
                        <p className="text-[11px] text-[#aa2d47] font-medium pl-8">
                          O consentimento e obrigatorio para o envio da anamnese.
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* BOTOES DE NAVEGACAO */}
                <div className="mt-8 pt-6 border-t border-[#eee9e4] flex items-center justify-between gap-4">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={isSubmitting}
                      className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#d8d0c8] bg-white hover:bg-[#fbf9f7] text-[#5d0c1d] text-sm font-semibold transition"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Voltar</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {currentStep < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={Boolean(alreadySubmittedInfo)}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#5d0c1d] hover:bg-[#8b1c31] disabled:opacity-50 text-white text-sm font-semibold shadow-md shadow-[#5d0c1d]/20 transition"
                    >
                      <span>Avancar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || Boolean(alreadySubmittedInfo) || !lgpdConsent}
                      className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-[#5d0c1d] hover:bg-[#8b1c31] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold shadow-lg shadow-[#5d0c1d]/25 transition active:scale-98"
                      title={!lgpdConsent ? "Marque o consentimento LGPD para continuar" : undefined}
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando Analise...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Analise</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
