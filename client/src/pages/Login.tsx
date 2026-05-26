import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, User, Lock, CheckCircle2, Users, ClipboardList, TrendingUp, ArrowLeft } from "lucide-react";

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

      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex-col justify-between p-14 relative overflow-hidden select-none">

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />

        {/* Glow orbs */}
        <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] bg-red-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] bg-red-500/25 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-12 w-[180px] h-[180px] bg-red-300/15 rounded-full blur-2xl" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center shadow-lg overflow-hidden">
              <img src="data:image/png;base64,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" alt="SOCEM" className="w-full h-full object-contain" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">Portal SOCEM</span>
          </div>
        </div>

        {/* Center content */}
        <div className="relative z-10 space-y-10">
          <div>
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

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: "Estagiários", desc: "Gestão de perfis" },
              { icon: ClipboardList, label: "Planos", desc: "Onboarding estruturado" },
              { icon: CheckCircle2, label: "Tarefas", desc: "Acompanhamento fácil" },
              { icon: TrendingUp, label: "Relatórios", desc: "Progresso em tempo real" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="bg-white/8 backdrop-blur-sm border border-white/10 rounded-2xl p-4 hover:bg-white/12 transition-colors">
                <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center mb-3">
                  <Icon size={16} className="text-white" />
                </div>
                <p className="text-white text-sm font-semibold leading-none mb-1">{label}</p>
                <p className="text-red-200/70 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10 flex items-center justify-end">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`rounded-full ${i === 0 ? "w-5 h-1.5 bg-white/50" : "w-1.5 h-1.5 bg-white/20"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">

        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 shadow-lg mb-3 overflow-hidden">
            <img src="data:image/png;base64,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" alt="SOCEM" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portal SOCEM</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de Gestão de Estágios</p>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="mb-8">
            <h2 className="text-[1.65rem] font-bold text-slate-900 dark:text-white tracking-tight">Bem‑vindo de volta</h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1.5">Inicie sessão para aceder ao portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Utilizador</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="nome de utilizador"
                  required
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 dark:focus:border-red-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
            </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 dark:focus:border-red-500 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 rounded-xl">
                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-red-200 dark:shadow-none hover:shadow-lg hover:shadow-red-300/40 dark:hover:shadow-none text-sm mt-1"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  A entrar...
                </>
              ) : "Entrar"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60 space-y-3">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:border-slate-300 transition-all text-sm font-medium"
            >
              <ArrowLeft size={15} />
              Voltar ao Portal de Gestão de Pessoas
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
