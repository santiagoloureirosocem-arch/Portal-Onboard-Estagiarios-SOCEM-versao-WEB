import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, User, Lock, Users, ClipboardList, TrendingUp, ArrowLeft } from "lucide-react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Credenciais inválidas");
        return;
      }
      await utils.auth.me.invalidate();
      setLocation("/dashboard");
    } catch {
      setError("Erro de ligação ao servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex-col justify-between p-14 relative overflow-hidden select-none">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />
        <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] bg-red-400/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] bg-red-500/25 rounded-full blur-3xl animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-1/2 right-12 w-[180px] h-[180px] bg-red-300/15 rounded-full blur-2xl animate-float" style={{ animationDelay: "-1.5s" }} />

        <div className="relative z-10 animate-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src="/socem-logo.png" alt="SOCEM" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Portal SOCEM</span>
          </div>
        </div>

        <div className="relative z-10 space-y-10">
          <div className="animate-in delay-3">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-red-100 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Sistema activo
            </div>
            <h2 className="text-white text-[2.6rem] font-bold leading-[1.15] tracking-tight mb-4">
              Gestão de Estágios
            </h2>
            <p className="text-red-200/80 text-base leading-relaxed max-w-sm">
              Planos de onboarding, acompanhamento de tarefas e relatórios de progresso — tudo numa só plataforma.
            </p>
          </div>

          <div className="space-y-4 animate-in delay-5">
            {[
              { icon: ClipboardList, label: "Planos de integração", desc: "Estruturados por períodos" },
              { icon: Users, label: "Tutores e estagiários", desc: "Comunicação direta" },
              { icon: TrendingUp, label: "Relatórios de progresso", desc: "Acompanhamento contínuo" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl p-3.5">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-none">{label}</p>
                  <p className="text-red-200/70 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 animate-in delay-7">
          <p className="text-white/50 text-xs tracking-wider">SOCEM © 2026</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
        <div className="lg:hidden text-center mb-10 animate-in">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-red-600 shadow-lg mb-3 overflow-hidden">
            <img src="/socem-logo.png" alt="SOCEM" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Portal SOCEM</h1>
          <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Gestão de Estágios</p>
        </div>

        <div className="w-full max-w-[360px]">
          <div className="mb-8 animate-in delay-2">
            <h2 className="text-[1.6rem] font-bold text-slate-900 dark:text-white tracking-tight">
              Bem‑vindo de volta
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Inicia sessão para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4 animate-in delay-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Utilizador</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="nome de utilizador"
                  required
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900 px-4 py-3 rounded-lg animate-in-fast">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-white font-semibold text-sm transition-all duration-300 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-200 dark:shadow-red-900/30"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A entrar...</>
              ) : "Entrar"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-in delay-6">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all text-sm"
            >
              <ArrowLeft size={14} />
              Voltar ao portal
            </button>
            <p className="text-center text-xs text-slate-400 dark:text-slate-600">
              Acesso restrito a membros autorizados da SOCEM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
