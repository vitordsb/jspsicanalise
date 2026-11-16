"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HeartHandshake,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin/clientes";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciais inválidas.");
        return;
      }

      // Redireciona para o painel
      router.push(from);
      router.refresh();
    } catch (err) {
      console.error("Erro no login:", err);
      setError("Erro de comunicação ao realizar login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 bg-surface relative overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-gradient-to-tr from-primary-container/80 via-primary-container-low/50 to-info-container/40 rounded-full blur-3xl opacity-70 -z-10 pointer-events-none" />

      <div className="w-full max-w-md space-y-6">
        {/* LOGO & APRESENTAÇÃO */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white mx-auto shadow-lg shadow-primary/25">
            <HeartHandshake className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs uppercase font-semibold tracking-widest text-primary block">
              Acesso Restrito & Sigiloso
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-primary">
              Dra. Joane Souza Oliveira de Andrade
            </h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Painel de Gestão Clínica e Anamneses
            </p>
          </div>
        </div>

        {/* CARD DE LOGIN */}
        <div className="bg-white rounded-3xl border border-outline-variant p-7 sm:p-8 shadow-xl shadow-primary/5 space-y-5">
          {error && (
            <div className="bg-secondary-container border border-primary-container text-primary p-3.5 rounded-2xl text-xs flex items-center gap-2.5 font-serif italic">
              <AlertCircle className="w-4 h-4 text-secondary shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5 pl-2">
                E-mail Administrativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-subtle" />
                <input
                  type="email"
                  required
                  placeholder="seuemail@psicanalise.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 rounded-lg border border-outline bg-surface-container text-sm text-on-surface placeholder-on-surface-subtle focus:bg-white focus:border-primary focus:outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface mb-1.5 pl-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-subtle" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 pl-11 pr-11 rounded-lg border border-outline bg-surface-container text-sm text-on-surface placeholder-on-surface-subtle focus:bg-white focus:border-primary focus:outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-subtle hover:text-primary p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-full bg-primary hover:bg-secondary disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-primary/25 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* FOOTER SIGILO */}
        <div className="text-center text-[12px] text-on-surface-subtle flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span>Ambiente seguro e confidencial • LGPD & Sigilo Profissional</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-xs">Carregando...</div>}>
      <LoginForm />
    </Suspense>
  );
}
