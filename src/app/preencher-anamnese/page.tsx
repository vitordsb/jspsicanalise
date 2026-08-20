"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { QuestionField } from "@/components/form/QuestionField";
import { formatCPF, formatPhone, formatDateInput, isValidDateBRL } from "@/lib/formatters";
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

  // Stepper: 1: Dados Pessoais, 2+: Seções da Anamnese, Last: Revisão
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
  const [answers, setAnswers] = useState<Record<string, any>>({});

  // Estados de Envio & Validação
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alreadySubmittedInfo, setAlreadySubmittedInfo] = useState<{
    patientName: string;
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
          setErrorMessage("Não foi possível carregar o formulário de anamnese no momento.");
        }
      } catch (err) {
        console.error("Erro ao carregar template:", err);
        setErrorMessage("Falha de conexão ao carregar formulário.");
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
      try {
        const res = await fetch("/api/anamnese/check-cpf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cpf: rawCpf }),
        });
        const data = await res.json();
        if (data.exists) {
          setAlreadySubmittedInfo({
            patientName: data.patientName,
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

  // Seções da Anamnese
  const sections = template?.sections || [];
  const totalSteps = 1 + sections.length + 1; // 1 (Dados) + N (Seções) + 1 (Revisão)

  const handlePersonalInfoChange = (field: string, value: string) => {
    let formatted = value;
    if (field === "cpf") formatted = formatCPF(value);
    if (field === "phone") formatted = formatPhone(value);
    if (field === "birthDate") formatted = formatDateInput(value);

    setPersonalInfo((prev) => ({ ...prev, [field]: formatted }));
    if (errorMessage) setErrorMessage("");
    if (alreadySubmittedInfo && field === "cpf") setAlreadySubmittedInfo(null);
  };

  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (errorMessage) setErrorMessage("");
  };

  // Validação da Etapa 1
  const validateStep1 = () => {
    if (!personalInfo.fullName.trim()) return "Por favor, preencha seu nome completo.";
    if (!personalInfo.cpf.trim() || personalInfo.cpf.replace(/\D/g, "").length !== 11) return "Por favor, informe um CPF válido com 11 dígitos.";
    if (!personalInfo.birthDate || !isValidDateBRL(personalInfo.birthDate)) return "Por favor, informe uma data de nascimento válida no formato DD/MM/AAAA.";
    if (!personalInfo.email.trim() || !personalInfo.email.includes("@")) return "Por favor, informe um e-mail válido.";
    if (!personalInfo.phone.trim() || personalInfo.phone.replace(/\D/g, "").length < 10) return "Por favor, informe seu telefone/WhatsApp completo com DDD.";
    return null;
  };

  // Validação da Seção Atual
  const validateCurrentSection = (sectionIndex: number) => {
    const currentSection = sections[sectionIndex];
    if (!currentSection) return null;

    for (const q of currentSection.questions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          return `Por favor, responda o campo obrigatório: "${q.label}"`;
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
        setErrorMessage("Sua anamnese já foi enviada anteriormente e está em análise pela Dra. Joane.");
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
        }),
      });

      const data = await res.json();

      if (res.status === 409 || data.alreadySubmitted) {
        setAlreadySubmittedInfo({
          patientName: data.patientName || personalInfo.fullName,
        });
        setErrorMessage(data.error || "Sua anamnese já foi enviada anteriormente e está em análise pela Dra. Joane Silva.");
        return;
      }

      if (!res.ok) {
        setErrorMessage(data.error || "Ocorreu um erro ao enviar. Verifique os dados e tente novamente.");
        return;
      }

      // Sucesso!
      setIsSuccess(true);
      setSubmittedId(data.submissionId);

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#5d0c1d", "#f0ded8", "#8b1c31", "#c4a984"],
      });

      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Erro ao submeter anamnese:", err);
      setErrorMessage("Erro de comunicação com o servidor. Por favor, tente novamente.");
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
            <p className="font-serif text-sm font-medium text-[#5f5456]">Carregando formulário de acolhimento...</p>
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
                  Sua ficha de anamnese foi enviada para a <strong>Dra. Joane Silva</strong>. 
                  Seus dados estão protegidos com total sigilo profissional e ética.
                </p>
              </div>

              <div className="bg-[#fbf9f7] border border-[#e5e0da] rounded-2xl p-6 text-left max-w-md mx-auto space-y-3 text-xs sm:text-sm text-[#5f5456]">
                <div className="flex items-center gap-2 text-[#5d0c1d] font-bold">
                  <Clock className="w-4 h-4 text-[#5d0c1d]" />
                  <span className="font-serif text-sm">Próximos Passos:</span>
                </div>
                <p>1. A Dra. Joane fará a leitura detalhada das suas respostas.</p>
                <p>2. Ela entrará em contato pelo seu WhatsApp (<strong>{personalInfo.phone}</strong>) para alinhar o primeiro encontro.</p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={`https://wa.me/55${personalInfo.phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Olá Dra. Joane, acabei de preencher minha ficha de anamnese no site (${personalInfo.fullName}).`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#5d0c1d] hover:bg-[#8b1c31] text-white text-sm font-semibold shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Avisar Joane pelo WhatsApp</span>
                </a>

                <Link
                  href="/"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full bg-white border border-[#d8d0c8] text-[#5d0c1d] text-sm font-semibold hover:bg-[#fbf9f7] transition"
                >
                  Voltar ao Início
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* CABEÇALHO DO FORMULÁRIO COM BARRA DE PROGRESSO */}
              <div className="bg-white rounded-3xl border border-[#e5e0da] p-6 sm:p-8 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#eee9e4] pb-6">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-[#5d0c1d] bg-[#fbf5f2] border border-[#f0ded8] px-3.5 py-1 rounded-full mb-2">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Ficha de Anamnese Clínica</span>
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
                    <span>Sigilo Ético & LGPD</span>
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
                        ? "Revisão e Envio"
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

              {/* ALERTA DE JÁ SUBMETIDO / DUPLICIDADE */}
              {alreadySubmittedInfo && (
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-3xl p-6 shadow-xs flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#fef3c7] text-[#92400e] shrink-0">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 text-sm text-[#78350f]">
                    <h4 className="font-serif font-bold text-base text-[#92400e]">Anamnese já enviada anteriormente!</h4>
                    <p className="text-xs sm:text-sm leading-relaxed">
                      Olá <strong>{alreadySubmittedInfo.patientName}</strong>, identificamos que você já possui uma ficha de anamnese preenchida e ela <strong>está em análise</strong> pela Dra. Joane Silva.
                    </p>
                    <p className="text-xs font-bold pt-1">
                      Caso precise atualizar alguma informação importante ou agendar uma sessão, entre em contato direto pelo WhatsApp.
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

              {/* CONTEÚDO DA ETAPA ATUAL */}
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
                        Suas informações de contato e identificação básica para prontuário clínico.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* NOME COMPLETO */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Nome Completo <span className="text-[#5d0c1d]">*</span>
                        </label>
                        <input
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
                        <label className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          CPF <span className="text-[#5d0c1d]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="000.000.000-00"
                          maxLength={14}
                          value={personalInfo.cpf}
                          onChange={(e) => handlePersonalInfoChange("cpf", e.target.value)}
                          onBlur={handleCpfBlur}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                        <span className="text-[11px] text-[#8e8284] pl-1">Identificação única do paciente.</span>
                      </div>

                      {/* DATA DE NASCIMENTO (FORMATO BRL DD/MM/AAAA) */}
                      <div>
                        <label className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Data de Nascimento <span className="text-[#5d0c1d]">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="DD/MM/AAAA"
                          maxLength={10}
                          value={personalInfo.birthDate}
                          onChange={(e) => handlePersonalInfoChange("birthDate", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                        <span className="text-[11px] text-[#8e8284] pl-1">Padrão brasileiro (ex: 18/05/1994).</span>
                      </div>

                      {/* E-MAIL */}
                      <div>
                        <label className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          E-mail <span className="text-[#5d0c1d]">*</span>
                        </label>
                        <input
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
                        <label className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Telefone / WhatsApp <span className="text-[#5d0c1d]">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          placeholder="(11) 99999-9999"
                          maxLength={15}
                          value={personalInfo.phone}
                          onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] placeholder-[#9c9092] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        />
                      </div>

                      {/* GÊNERO (SELECT DROPDOWN) */}
                      <div>
                        <label className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Gênero
                        </label>
                        <select
                          value={personalInfo.gender}
                          onChange={(e) => handlePersonalInfoChange("gender", e.target.value)}
                          className="w-full h-12 px-4 rounded-xl border border-[#d8d0c8] bg-white text-[#221a1b] text-sm focus:outline-none focus:border-[#5d0c1d] focus:ring-2 focus:ring-[#5d0c1d]/10 transition shadow-2xs"
                        >
                          <option value="">Selecione seu gênero...</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Não-binário">Não-binário</option>
                          <option value="Travesti / Mulher Trans">Travesti / Mulher Trans</option>
                          <option value="Homem Trans">Homem Trans</option>
                          <option value="Outro">Outro</option>
                          <option value="Prefiro não informar">Prefiro não informar</option>
                        </select>
                      </div>

                      {/* PROFISSÃO */}
                      <div>
                        <label className="block text-xs font-semibold text-[#221a1b] mb-1.5">
                          Profissão / Ocupação
                        </label>
                        <input
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

                {/* ETAPAS 2+: SEÇÕES DA ANAMNESE */}
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
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* ETAPA FINAL: REVISÃO E ENVIO */}
                {currentStep === totalSteps && (
                  <div className="space-y-6">
                    <div className="border-b border-[#eee9e4] pb-4">
                      <h2 className="font-serif text-xl font-bold text-[#5d0c1d] flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-[#5d0c1d]" />
                        <span>Revisão dos Dados & Envio</span>
                      </h2>
                      <p className="text-xs text-[#5f5456] mt-1">
                        Por favor, confira seus dados antes de enviar para a avaliação da Dra. Joane.
                      </p>
                    </div>

                    {/* Resumo Dados Pessoais */}
                    <div className="bg-[#fbf9f7] border border-[#e5e0da] rounded-2xl p-6 space-y-3">
                      <h3 className="font-serif font-bold text-base text-[#5d0c1d] border-b border-[#eee9e4] pb-2">
                        Identificação do Paciente
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs sm:text-sm">
                        <p><strong className="text-[#5d0c1d]">Nome:</strong> {personalInfo.fullName}</p>
                        <p><strong className="text-[#5d0c1d]">CPF:</strong> {personalInfo.cpf}</p>
                        <p><strong className="text-[#5d0c1d]">E-mail:</strong> {personalInfo.email}</p>
                        <p><strong className="text-[#5d0c1d]">WhatsApp:</strong> {personalInfo.phone}</p>
                        <p><strong className="text-[#5d0c1d]">Nascimento:</strong> {personalInfo.birthDate}</p>
                        {personalInfo.gender && <p><strong className="text-[#5d0c1d]">Gênero:</strong> {personalInfo.gender}</p>}
                        {personalInfo.occupation && <p><strong className="text-[#5d0c1d]">Profissão:</strong> {personalInfo.occupation}</p>}
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

                    {/* Termo de Consentimento */}
                    <div className="p-5 rounded-2xl bg-[#fbf5f2] border border-[#f0ded8] text-xs text-[#5f5456] flex items-start gap-3.5">
                      <Lock className="w-5 h-5 text-[#5d0c1d] shrink-0 mt-0.5" />
                      <div>
                        <p className="font-serif font-bold text-sm text-[#5d0c1d]">Consentimento & Sigilo Ético</p>
                        <p className="mt-0.5 leading-relaxed">
                          Ao clicar em <strong>"Enviar Análise"</strong>, você autoriza o envio seguro e confidencial das suas respostas para avaliação clínica da Dra. Joane Silva.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* BOTÕES DE NAVEGAÇÃO */}
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
                      <span>Avançar</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting || Boolean(alreadySubmittedInfo)}
                      className="inline-flex items-center gap-2 px-9 py-4 rounded-full bg-[#5d0c1d] hover:bg-[#8b1c31] disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-[#5d0c1d]/25 transition active:scale-98"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Enviando Análise...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Enviar Análise</span>
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
