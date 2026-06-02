import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Eye, EyeOff, User, Lock, ArrowLeft } from "lucide-react";

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
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-red-50 animate-gradient-shift flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-12 left-[12%] w-2 h-2 bg-red-300/30 rounded-full animate-float-rotate" />
        <div className="absolute top-32 right-[18%] w-3 h-3 bg-red-400/20 rounded-full animate-float-rotate" style={{ animationDelay: "-2.5s" }} />
        <div className="absolute bottom-24 left-[22%] w-2 h-2 bg-red-300/20 rounded-full animate-float-rotate" style={{ animationDelay: "-3.5s" }} />
        <div className="absolute bottom-12 right-[20%] w-2.5 h-2.5 bg-red-400/25 rounded-full animate-float-rotate" style={{ animationDelay: "-1.5s" }} />
      </div>

      <div className="w-full max-w-[420px] relative">
        <div className="text-center mb-6 sm:mb-8 animate-scale-in">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-600 mb-3 sm:mb-4 overflow-hidden animate-float-rotate animate-glow-pulse" style={{ borderRadius: "1rem" }}>
            <img src="/socem-logo.png" alt="SOCEM" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-slate-900 text-xl sm:text-2xl font-bold tracking-tight mb-1">Portal SOCEM</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Gestão de Estágios</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-8 shadow-xl animate-card-in delay-2">
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full mb-4 sm:mb-6 w-fit mx-auto hover:bg-red-100 transition-colors">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
            Sistema activo
          </div>

          <h2 className="text-center text-slate-900 text-base sm:text-lg font-bold mb-1">Bem‑vindo de volta</h2>
          <p className="text-center text-slate-400 text-xs sm:text-sm mb-5 sm:mb-6">Inicia sessão para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-medium text-slate-500">Utilizador</label>
              <div className="relative group">
                <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-red-500" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="nome de utilizador"
                  required
                  autoComplete="username"
                  autoFocus
                  className="w-full pl-10 pr-4 py-[10px] sm:py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 focus:shadow-lg focus:shadow-red-100/50 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] sm:text-xs font-medium text-slate-500">Password</label>
              <div className="relative group">
                <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none transition-colors group-focus-within:text-red-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-[10px] sm:py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 focus:shadow-lg focus:shadow-red-100/50 transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-2"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-xs sm:text-sm text-red-600 bg-red-50 border border-red-100 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl animate-bounce-in shadow-md shadow-red-100/30">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full flex items-center justify-center gap-2 py-[11px] sm:py-3 px-4 rounded-xl text-white font-semibold text-sm transition-all duration-300 bg-red-600 hover:bg-red-500 hover:shadow-xl hover:shadow-red-300/40 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-200 min-h-[44px] active:scale-[0.98]"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A entrar...</>
              ) : "Entrar"}
            </button>
          </form>

          <div className="mt-5 sm:mt-6">
            <button
              type="button"
              onClick={() => setLocation("/")}
              className="w-full flex items-center justify-center gap-2 py-[11px] sm:py-2.5 px-4 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700 transition-all text-sm min-h-[44px] active:scale-[0.98]"
            >
              <ArrowLeft size={14} />
              Voltar ao portal
            </button>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 text-center animate-fade delay-8">
          <p className="text-[11px] sm:text-xs text-slate-400">Acesso restrito a membros autorizados da SOCEM</p>
        </div>
      </div>
    </div>
  );
}
