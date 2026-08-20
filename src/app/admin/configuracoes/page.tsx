"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  Settings,
  Save,
  User,
  Mail,
  CheckCircle2,
} from "lucide-react";

export default function AdminConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState({
    name: "Dra. Joane Silva",
    title: "Psicóloga & Psicanalista Clínica",
    crp: "CRP 06/123456 • Reg. Psicanálise",
    phone: "(11) 98765-4321",
    email: "joane@psicanalise.com.br",
    notificationEmail: "joane@psicanalise.com.br",
    clinicName: "JS Psicanálise & Acolhimento Humano",
    address: "Atendimento Clínico Online e Presencial - São Paulo/SP",
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (e) {
        console.error("Erro ao carregar perfil:", e);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg("");

    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setSuccessMsg("Configurações atualizadas com sucesso!");
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (e) {
      console.error("Erro ao salvar perfil:", e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fff6f4]">
      <AdminHeader />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[1px] text-[#5d0c1d] bg-[#f8dad2] px-3.5 py-1 rounded-full mb-2">
            <Settings className="w-3.5 h-3.5" />
            <span>Perfil & Configurações da Clínica</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-4xl font-bold text-[#5d0c1d]">
            Configurações da Joane
          </h1>
          <p className="text-xs sm:text-sm text-[#6f5f62] mt-1">
            Seus dados profissionais são usados na emissão dos contratos e no envio de notificações de novas anamneses.
          </p>
        </div>

        {successMsg && (
          <div className="bg-[#e7f4ec] border border-[#c7e6d2] text-[#245f3c] p-4 rounded-3xl mb-6 text-xs sm:text-sm flex items-center gap-2 shadow-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-[#245f3c] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="bg-white rounded-3xl border border-[#f0ded8] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#f3e4e0] pb-4">
            <h2 className="font-serif text-xl font-bold text-[#5d0c1d] flex items-center gap-2">
              <User className="w-5 h-5 text-[#5d0c1d]" />
              <span>Identificação Profissional</span>
            </h2>
            <p className="text-xs text-[#6f5f62] mt-0.5">
              Dados que aparecerão no cabeçalho e rodapé dos contratos de serviços e comunicados.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Nome Profissional Completo
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Título / Especialidade
              </label>
              <input
                type="text"
                required
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Registro Profissional (CRP / CBO / Psicanálise)
              </label>
              <input
                type="text"
                required
                value={profile.crp}
                onChange={(e) => setProfile({ ...profile, crp: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Telefone / WhatsApp Profissional
              </label>
              <input
                type="text"
                required
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Nome da Clínica / Consultório
              </label>
              <input
                type="text"
                value={profile.clinicName}
                onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Endereço / Modalidade de Atendimentos
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-[#f3e4e0] pt-6 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#5d0c1d] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#5d0c1d]" />
              <span>Notificações por E-mail</span>
            </h3>
            <p className="text-xs text-[#6f5f62]">
              Informe o e-mail onde você deseja receber o aviso instantâneo assim que um paciente enviar a anamnese.
            </p>

            <div className="max-w-md">
              <label className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                E-mail para Receber Novas Anamneses
              </label>
              <input
                type="email"
                required
                value={profile.notificationEmail}
                onChange={(e) => setProfile({ ...profile, notificationEmail: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-[#f3e4e0] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#5d0c1d] hover:bg-[#aa2d47] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#5d0c1d]/25 transition"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
