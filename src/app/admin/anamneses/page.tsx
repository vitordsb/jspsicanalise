"use client";

import React, { useState, useEffect } from "react";
import { FormSection, QuestionItem, QuestionType } from "@/lib/types";
import { formatDate } from "@/lib/formatters";
import {
  Plus,
  Edit,
  Copy,
  Trash2,
  CheckCircle2,
  Check,
  Layers,
} from "lucide-react";
import { EsqueletoCartoes } from "@/components/ui/Carregando";

export default function AdminAnamnesesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/templates");
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error("Erro ao carregar modelos:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleSetActive = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Modelo ativado com sucesso para o link público!" });
        fetchTemplates();
      }
    } catch (e) {
      console.error("Erro ao ativar modelo:", e);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch("/api/admin/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ duplicateFromId: id }),
      });
      if (res.ok) {
        setMessage({ type: "success", text: "Nova versão duplicada com sucesso!" });
        fetchTemplates();
      }
    } catch (e) {
      console.error("Erro ao duplicar:", e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir ou desativar este modelo de anamnese?")) return;
    try {
      const res = await fetch(`/api/admin/templates/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: data.message || "Modelo excluído com sucesso!",
        });
        fetchTemplates();
      }
    } catch (e) {
      console.error("Erro ao excluir:", e);
    }
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingTemplate({
      title: "Novo Formulário de Anamnese Psicológica",
      description: "Formulário personalizado de acolhimento e investigação clínica.",
      isActive: false,
      sections: [
        {
          id: `sec_${Date.now()}`,
          title: "1. Queixa Principal & Motivo",
          description: "Descreva os motivos que o trouxeram ao atendimento.",
          questions: [
            {
              id: `q_${Date.now()}_1`,
              label: "O que motivou sua busca pela psicoterapia/psicanálise?",
              type: "textarea",
              placeholder: "Descreva detalhadamente...",
              required: true,
            },
          ],
        },
      ],
    });
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.title.trim()) {
      alert("O título do formulário é obrigatório.");
      return;
    }

    setSaving(true);
    try {
      if (editingTemplate.id) {
        const res = await fetch(`/api/admin/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingTemplate),
        });
        if (res.ok) {
          setMessage({ type: "success", text: "Modelo de anamnese atualizado com sucesso!" });
          setEditingTemplate(null);
          setIsCreating(false);
          fetchTemplates();
        }
      } else {
        const res = await fetch("/api/admin/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editingTemplate),
        });
        if (res.ok) {
          setMessage({ type: "success", text: "Novo modelo criado com sucesso!" });
          setEditingTemplate(null);
          setIsCreating(false);
          fetchTemplates();
        }
      }
    } catch (e) {
      console.error("Erro ao salvar template:", e);
    } finally {
      setSaving(false);
    }
  };

  const addSection = () => {
    if (!editingTemplate) return;
    const newSec: FormSection = {
      id: `sec_${Date.now()}`,
      title: `${editingTemplate.sections.length + 1}. Nova Seção`,
      description: "",
      questions: [
        {
          id: `q_${Date.now()}`,
          label: "Nova Pergunta",
          type: "text",
          required: false,
        },
      ],
    };
    setEditingTemplate({
      ...editingTemplate,
      sections: [...editingTemplate.sections, newSec],
    });
  };

  const removeSection = (secIndex: number) => {
    if (!editingTemplate) return;
    const updated = editingTemplate.sections.filter((_: any, i: number) => i !== secIndex);
    setEditingTemplate({ ...editingTemplate, sections: updated });
  };

  const updateSection = (secIndex: number, field: string, val: any) => {
    if (!editingTemplate) return;
    const updated = [...editingTemplate.sections];
    updated[secIndex] = { ...updated[secIndex], [field]: val };
    setEditingTemplate({ ...editingTemplate, sections: updated });
  };

  const addQuestion = (secIndex: number) => {
    if (!editingTemplate) return;
    const updated = [...editingTemplate.sections];
    const newQ: QuestionItem = {
      id: `q_${Date.now()}`,
      label: "Título da Pergunta",
      type: "text",
      required: false,
    };
    updated[secIndex].questions.push(newQ);
    setEditingTemplate({ ...editingTemplate, sections: updated });
  };

  const removeQuestion = (secIndex: number, qIndex: number) => {
    if (!editingTemplate) return;
    const updated = [...editingTemplate.sections];
    updated[secIndex].questions = updated[secIndex].questions.filter((_: any, i: number) => i !== qIndex);
    setEditingTemplate({ ...editingTemplate, sections: updated });
  };

  const updateQuestion = (secIndex: number, qIndex: number, field: string, val: any) => {
    if (!editingTemplate) return;
    const updated = [...editingTemplate.sections];
    updated[secIndex].questions[qIndex] = {
      ...updated[secIndex].questions[qIndex],
      [field]: val,
    };
    setEditingTemplate({ ...editingTemplate, sections: updated });
  };

  return (
    <div className="flex-1 flex flex-col">

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-[#5d0c1d] bg-[#f8dad2] px-3.5 py-1 rounded-full mb-2">
              <Layers className="w-3.5 h-3.5" />
              <span>Gerenciamento de Questionários</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">
              Modelos de Anamnese
            </h1>
            <p className="text-xs sm:text-sm text-[#6f5f62] mt-1">
              Crie, edite e versione os formulários de anamnese que seus pacientes preenchem online.
            </p>
          </div>

          {!editingTemplate && (
            <button
              onClick={handleStartCreate}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs sm:text-sm font-semibold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Criar Novo Modelo</span>
            </button>
          )}
        </div>

        {/* FEEDBACK MESSAGE */}
        {message && (
          <div
            className={`p-4 rounded-2xl mb-6 text-xs sm:text-sm flex items-center justify-between gap-3 ${
              message.type === "success"
                ? "bg-[#e7f4ec] border border-[#c7e6d2] text-[#245f3c]"
                : "bg-[#fff0f3] border border-[#f8dad2] text-[#5d0c1d]"
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs font-bold underline">
              Fechar
            </button>
          </div>
        )}

        {/* MODO FORM BUILDER (CRIAR / EDITAR) */}
        {editingTemplate ? (
          <div className="bg-white rounded-3xl border border-[#f0ded8] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#f3e4e0] pb-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#5d0c1d]">
                  {editingTemplate.id ? "Editar Modelo de Anamnese" : "Criar Novo Modelo de Anamnese"}
                </h2>
                <p className="text-xs text-[#6f5f62]">
                  Configure o título, seções e perguntas do questionário.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setIsCreating(false);
                  }}
                  className="px-4 py-2 rounded-full border border-[#f0ded8] text-xs font-semibold text-[#6f5f62] hover:bg-[#fbf3ef] transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs font-semibold shadow-xs transition"
                >
                  {saving ? "Salvando..." : "Salvar Modelo"}
                </button>
              </div>
            </div>

            {/* DADOS BÁSICOS DO TEMPLATE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#fbf3ef] p-6 rounded-3xl border border-[#f0ded8]">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Título do Modelo <span className="text-[#5d0c1d]">*</span>
                </label>
                <input
                  type="text"
                  value={editingTemplate.title}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, title: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-white text-xs sm:text-sm text-[#241a1c] focus:border-[#5d0c1d] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Descrição / Instruções para o Paciente
                </label>
                <input
                  type="text"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-white text-xs sm:text-sm text-[#241a1c] focus:border-[#5d0c1d] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveToggle"
                  checked={editingTemplate.isActive}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, isActive: e.target.checked })}
                  className="w-4 h-4 text-[#5d0c1d] focus:ring-[#5d0c1d] accent-[#5d0c1d]"
                />
                <label htmlFor="isActiveToggle" className="text-xs font-semibold text-[#5d0c1d] cursor-pointer">
                  Definir como modelo ativo no link público (/preencher-anamnese)
                </label>
              </div>
            </div>

            {/* SEÇÕES & PERGUNTAS BUILDER */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-[#5d0c1d]">
                  Seções do Formulário ({editingTemplate.sections?.length || 0})
                </h3>
                <button
                  onClick={addSection}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#f8dad2] text-[#5d0c1d] text-xs font-semibold hover:bg-[#f3cbc1] transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Seção</span>
                </button>
              </div>

              {editingTemplate.sections.map((section: FormSection, sIdx: number) => (
                <div
                  key={section.id || sIdx}
                  className="border border-[#f0ded8] rounded-3xl p-6 bg-white space-y-4 shadow-xs"
                >
                  {/* HEADER DA SEÇÃO */}
                  <div className="flex items-start justify-between gap-3 border-b border-[#f3e4e0] pb-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Título da Seção (ex: 1. Queixa Principal)"
                        value={section.title}
                        onChange={(e) => updateSection(sIdx, "title", e.target.value)}
                        className="px-3.5 py-2 rounded-full border border-[#eae2d7] text-xs font-bold text-[#5d0c1d] bg-[#fbf3ef]"
                      />
                      <input
                        type="text"
                        placeholder="Descrição da Seção (opcional)"
                        value={section.description || ""}
                        onChange={(e) => updateSection(sIdx, "description", e.target.value)}
                        className="px-3.5 py-2 rounded-full border border-[#eae2d7] text-xs text-[#6f5f62] bg-[#fbf3ef]"
                      />
                    </div>

                    <button
                      onClick={() => removeSection(sIdx)}
                      title="Excluir Seção"
                      className="p-2 text-[#9c8b8e] hover:text-[#aa2d47] hover:bg-[#fff0f3] rounded-full transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* PERGUNTAS DA SEÇÃO */}
                  <div className="space-y-3 pl-2">
                    <div className="text-xs font-bold text-[#5d0c1d] uppercase tracking-wider">
                      Perguntas desta Seção ({section.questions?.length || 0})
                    </div>

                    {section.questions.map((q: QuestionItem, qIdx: number) => (
                      <div
                        key={q.id || qIdx}
                        className="p-4 rounded-2xl bg-[#fbf3ef] border border-[#f0ded8] space-y-2"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                          <div className="sm:col-span-6">
                            <input
                              type="text"
                              placeholder="Texto da Pergunta"
                              value={q.label}
                              onChange={(e) => updateQuestion(sIdx, qIdx, "label", e.target.value)}
                              className="w-full h-10 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs font-semibold text-[#241a1c]"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <select
                              value={q.type}
                              onChange={(e) =>
                                updateQuestion(sIdx, qIdx, "type", e.target.value as QuestionType)
                              }
                              className="w-full h-10 px-3 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c]"
                            >
                              <option value="text">Texto Curto</option>
                              <option value="textarea">Texto Longo</option>
                              <option value="radio">Escolha Única (Radio)</option>
                              <option value="checkbox">Múltipla Escolha</option>
                              <option value="select">Seleção (Dropdown)</option>
                              <option value="scale_1_10">Escala de 1 a 10</option>
                              <option value="date">Data</option>
                              <option value="number">Número</option>
                            </select>
                          </div>

                          <div className="sm:col-span-2 flex items-center gap-1.5 pl-1">
                            <input
                              type="checkbox"
                              id={`req_${sIdx}_${qIdx}`}
                              checked={q.required || false}
                              onChange={(e) => updateQuestion(sIdx, qIdx, "required", e.target.checked)}
                              className="w-3.5 h-3.5 text-[#5d0c1d] accent-[#5d0c1d]"
                            />
                            <label
                              htmlFor={`req_${sIdx}_${qIdx}`}
                              className="text-[11px] font-semibold text-[#5d0c1d] cursor-pointer"
                            >
                              Obrigatória
                            </label>
                          </div>

                          <div className="sm:col-span-1 text-right">
                            <button
                              onClick={() => removeQuestion(sIdx, qIdx)}
                              className="p-1.5 text-[#9c8b8e] hover:text-[#aa2d47] rounded-full transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {(q.type === "radio" || q.type === "checkbox" || q.type === "select") && (
                          <div className="pt-1 text-xs">
                            <label className="block text-[11px] font-semibold text-[#6f5f62] mb-1 pl-2">
                              Opções de Resposta (separadas por vírgula):
                            </label>
                            <input
                              type="text"
                              placeholder="Ex: Sim, Não, Às vezes"
                              value={(q.options || []).join(", ")}
                              onChange={(e) =>
                                updateQuestion(
                                  sIdx,
                                  qIdx,
                                  "options",
                                  e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                                )
                              }
                              className="w-full h-9 px-3.5 rounded-full border border-[#eae2d7] bg-white text-xs text-[#241a1c]"
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      onClick={() => addQuestion(sIdx)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#5d0c1d] hover:underline pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar pergunta nesta seção</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* BOTÃO SALVAR RODAPÉ */}
            <div className="pt-4 border-t border-[#f3e4e0] flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingTemplate(null);
                  setIsCreating(false);
                }}
                className="px-5 py-2.5 rounded-full border border-[#f0ded8] text-xs font-semibold text-[#6f5f62]"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={saving}
                className="px-7 py-3 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs font-bold shadow-xs transition"
              >
                {saving ? "Salvando..." : "Salvar Modelo"}
              </button>
            </div>
          </div>
        ) : loading ? (
          /* Esqueleto no lugar da grade enquanto os modelos carregam.
             Sem isso a area ficava vazia e parecia que nao havia modelo. */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <EsqueletoCartoes itens={2} altura="h-52" />
            <EsqueletoCartoes itens={2} altura="h-52" />
          </div>
        ) : (
          /* LISTA DE MODELOS */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {templates.map((tpl) => {
              const submissionCount = tpl._count?.submissions || 0;
              const sectionsCount = tpl.sections?.length || 0;

              return (
                <div
                  key={tpl.id}
                  className={`bg-white rounded-3xl border p-7 flex flex-col justify-between shadow-xs transition ${
                    tpl.isActive ? "border-[#5d0c1d] ring-2 ring-[#5d0c1d]/15" : "border-[#f0ded8]"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="font-serif text-xl font-bold text-[#5d0c1d] leading-snug">
                          {tpl.title}
                        </h3>
                        <span className="text-[11px] text-[#9c8b8e] block">
                          Versão {tpl.version} • Criado em {formatDate(tpl.createdAt)}
                        </span>
                      </div>

                      {tpl.isActive ? (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#e7f4ec] text-[#245f3c] border border-[#c7e6d2] shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Ativa
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#f0edea] text-[#6f5f62] shrink-0">
                          Inativa
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#6f5f62] line-clamp-2">
                      {tpl.description || "Sem descrição"}
                    </p>

                    <div className="pt-2 flex items-center gap-4 text-xs text-[#5d0c1d] border-t border-[#f3e4e0] font-semibold">
                      <span><strong>{sectionsCount}</strong> seções</span>
                      <span><strong>{submissionCount}</strong> respostas recebidas</span>
                    </div>
                  </div>

                  {/* AÇÕES */}
                  <div className="pt-5 mt-4 border-t border-[#f3e4e0] flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingTemplate(tpl)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#f0ded8] text-xs font-semibold text-[#5d0c1d] hover:bg-[#fbf3ef] transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(tpl.id)}
                        className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#f0ded8] text-xs font-semibold text-[#5d0c1d] hover:bg-[#fbf3ef] transition"
                        title="Duplicar modelo para criar nova versão"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicar</span>
                      </button>

                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="p-2 text-[#9c8b8e] hover:text-[#aa2d47] rounded-full hover:bg-[#fff0f3] transition"
                        title="Excluir ou desativar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {!tpl.isActive && (
                      <button
                        onClick={() => handleSetActive(tpl.id)}
                        className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-[#f8dad2] hover:bg-[#f3cbc1] text-[#5d0c1d] text-xs font-bold transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Tornar Ativa</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
