"use client";

import React, { useState, useEffect } from "react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useRouter } from "next/navigation";
import {
  Settings,
  Save,
  User,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Wallet,
} from "lucide-react";

export default function AdminConfiguracoesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState({
    name: "Dra. Joane Souza Oliveira de Andrade",
    title: "Psicóloga & Psicanalista Clínica",
    crp: "",
    phone: "",
    email: "",
    notificationEmail: "",
    clinicName: "",
    address: "",
    // Dados de pagamento. Ficam vazios ate a Joane preencher: sao copiados
    // para o contrato no momento da emissao, entao contrato ja assinado nao
    // muda se ela trocar de conta depois.
    pixKey: "",
    pixKeyType: "",
    pixHolderName: "",
    bankName: "",
    bankAgency: "",
    bankAccount: "",
  });

  const crpPendente = !profile.crp || profile.crp.trim() === "";

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/profile");
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
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
  }, [router]);

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

      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

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

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#fff6f4]">
        <AdminHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-[#f0ded8] border-t-[#5d0c1d] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

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
            Configurações do Perfil Clínico
          </h1>
          <p className="text-xs sm:text-sm text-[#6f5f62] mt-1">
            Seus dados profissionais são usados na emissão dos contratos e no envio de notificações de novas anamneses.
          </p>
        </div>

        {/* AVISO DE CRP PENDENTE */}
        {crpPendente && (
          <div className="bg-[#fffbeb] border border-[#fde68a] rounded-3xl p-5 mb-6 flex items-start gap-4">
            <div className="p-2.5 rounded-full bg-[#fef3c7] text-[#92400e] shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-sm text-[#92400e]">
                Registro Profissional pendente de preenchimento
              </h4>
              <p className="text-xs text-[#78350f] leading-relaxed">
                O campo de Registro Profissional (CRP / documento de psicanálise) está vazio. Esse dado é obrigatório para a emissão de contratos válidos. Preencha com o seu número de registro real antes de gerar qualquer contrato.
              </p>
            </div>
          </div>
        )}

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
              <label htmlFor="cfg-name" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Nome Profissional Completo
              </label>
              <input
                id="cfg-name"
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="cfg-title" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Título / Especialidade
              </label>
              <input
                id="cfg-title"
                type="text"
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cfg-crp" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Registro Profissional
                {crpPendente && (
                  <span className="ml-2 text-[11px] font-bold text-[#92400e] bg-[#fef3c7] px-2 py-0.5 rounded-full border border-[#fde68a]">
                    Pendente
                  </span>
                )}
              </label>
              <input
                id="cfg-crp"
                type="text"
                placeholder="Informe seu registro profissional real (CRP, CBO ou documento de psicanálise)"
                value={profile.crp}
                onChange={(e) => setProfile({ ...profile, crp: e.target.value })}
                className={`w-full h-11 px-4 rounded-full border text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:outline-none transition ${
                  crpPendente
                    ? "border-[#fde68a] bg-[#fffbeb] focus:border-[#f59e0b]"
                    : "border-[#eae2d7] bg-[#f7efe5] focus:border-[#5d0c1d]"
                }`}
              />
              <p className="text-[11px] text-[#9c8b8e] mt-1 pl-1">
                Preencha com o número de registro fornecido pelo seu conselho / entidade profissional. Não invente nem use placeholders.
              </p>
            </div>

            <div>
              <label htmlFor="cfg-phone" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Telefone / WhatsApp Profissional
              </label>
              <input
                id="cfg-phone"
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cfg-clinic" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Nome da Clínica / Consultório
              </label>
              <input
                id="cfg-clinic"
                type="text"
                value={profile.clinicName}
                onChange={(e) => setProfile({ ...profile, clinicName: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="cfg-address" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                Endereço / Modalidade de Atendimentos
              </label>
              <input
                id="cfg-address"
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
              Informe o e-mail onde você deseja receber o aviso assim que um paciente enviar a anamnese.
            </p>

            <div className="max-w-md">
              <label htmlFor="cfg-notify" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                E-mail para Receber Novas Anamneses
              </label>
              <input
                id="cfg-notify"
                type="email"
                value={profile.notificationEmail}
                onChange={(e) => setProfile({ ...profile, notificationEmail: e.target.value })}
                className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
              />
            </div>
          </div>

          {/* DADOS DE PAGAMENTO
              Nenhum campo e obrigatorio. O que ficar em branco simplesmente
              nao aparece no contrato, em vez de virar linha pontilhada. */}
          <div className="border-t border-[#f3e4e0] pt-6 space-y-4">
            <h3 className="font-serif text-xl font-bold text-[#5d0c1d] flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#5d0c1d]" />
              <span>Dados de Pagamento</span>
            </h3>
            <p className="text-xs text-[#6f5f62]">
              Aparecem na cláusula de honorários do contrato. São copiados para o contrato
              no momento da emissão, então um contrato já assinado continua mostrando a conta
              que valia naquela data. Deixe em branco o que não quiser incluir.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="cfg-pix-tipo" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Tipo da Chave PIX
                </label>
                <select
                  id="cfg-pix-tipo"
                  value={profile.pixKeyType}
                  onChange={(e) => setProfile({ ...profile, pixKeyType: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
                >
                  <option value="">Não informado</option>
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="telefone">Telefone</option>
                  <option value="aleatoria">Chave aleatória</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="cfg-pix-chave" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Chave PIX
                </label>
                <input
                  id="cfg-pix-chave"
                  type="text"
                  value={profile.pixKey}
                  onChange={(e) => setProfile({ ...profile, pixKey: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="cfg-pix-titular" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Titular da Conta
                </label>
                <input
                  id="cfg-pix-titular"
                  type="text"
                  value={profile.pixHolderName}
                  onChange={(e) => setProfile({ ...profile, pixHolderName: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
                />
                <p className="text-[11px] text-[#9c8b8e] mt-1.5">
                  Preencha se o nome cadastrado no banco for diferente do nome profissional.
                </p>
              </div>

              <div>
                <label htmlFor="cfg-banco" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Banco
                </label>
                <input
                  id="cfg-banco"
                  type="text"
                  value={profile.bankName}
                  onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cfg-agencia" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Agência
                </label>
                <input
                  id="cfg-agencia"
                  type="text"
                  value={profile.bankAgency}
                  onChange={(e) => setProfile({ ...profile, bankAgency: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="cfg-conta" className="block text-xs font-semibold text-[#241a1c] mb-1.5">
                  Conta
                </label>
                <input
                  id="cfg-conta"
                  type="text"
                  value={profile.bankAccount}
                  onChange={(e) => setProfile({ ...profile, bankAccount: e.target.value })}
                  className="w-full h-11 px-4 rounded-full border border-[#eae2d7] bg-[#f7efe5] text-xs sm:text-sm text-[#241a1c] focus:bg-white focus:border-[#5d0c1d] focus:outline-none"
                />
              </div>
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
