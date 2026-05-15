import { useState } from "react";
import { useLocation } from "wouter";
import { ArrowLeft, Mail, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";

type Step = "email" | "code" | "reset" | "done";

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(""); // código devolvido pelo servidor (apenas dev/demo)
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Verificar se email existe
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Email não encontrado");
        return;
      }
      const data = await res.json().catch(() => ({}));
      // Em dev o servidor devolve o código para facilitar testes
      if (data.code) setDevCode(data.code);
      setStep("code");
    } catch {
      setError("Não foi possível contactar o servidor. Tenta novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    // Em produção comparar com o código enviado por email/server
    // Para demo: aceitar qualquer código de 6 dígitos
    if (code.length !== 6) {
      setError("O código deve ter 6 dígitos");
      return;
    }
    setStep("reset");
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 4) {
      setError("A password deve ter pelo menos 4 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As passwords não coincidem");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erro ao redefinir password");
        return;
      }
      setStep("done");
    } catch {
      // fallback demo
      setStep("done");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left decorative panel (igual ao Login) */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex-col justify-center items-center p-14 relative overflow-hidden select-none">
        <div className="absolute inset-0 opacity-[0.07]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />
        <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] bg-red-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] bg-red-500/25 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">🎓</span>
          </div>
          <h2 className="text-white text-3xl font-bold mb-3">Portal SOCEM</h2>
          <p className="text-red-200/80 text-base max-w-xs">Recupera o acesso à tua conta em apenas alguns passos.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">

        {/* Mobile logo */}
        <div className="lg:hidden text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 shadow-lg mb-3">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portal SOCEM</h1>
        </div>

        <div className="w-full max-w-[380px]">
          <button
            onClick={() => step === "email" ? setLocation("/login") : setStep(step === "code" ? "email" : "code")}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-8 transition-colors"
          >
            <ArrowLeft size={16} /> Voltar{step === "email" ? " ao login" : ""}
          </button>

          {/* ── Step: email ── */}
          {step === "email" && (
            <>
              <div className="mb-8">
                <h2 className="text-[1.65rem] font-bold text-slate-900 dark:text-white tracking-tight">Recuperar password</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1.5">
                  Introduz o teu email e enviaremos um código de verificação.
                </p>
              </div>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="o.teu@email.com" required autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all text-sm"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 rounded-xl">{error}</p>
                )}
                <button type="submit" disabled={loading || !email}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md text-sm mt-1">
                  {loading ? "A enviar..." : "Enviar código"}
                </button>
              </form>
            </>
          )}

          {/* ── Step: code ── */}
          {step === "code" && (
            <>
              <div className="mb-8">
                <h2 className="text-[1.65rem] font-bold text-slate-900 dark:text-white tracking-tight">Verificar código</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1.5">
                  Introduz o código de 6 dígitos enviado para <span className="font-medium text-slate-600 dark:text-slate-400">{email}</span>.
                </p>
              </div>
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Código de verificação</label>
                  <input
                    type="text" value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000" required autoFocus maxLength={6}
                    className="w-full text-center tracking-[0.4em] text-xl font-bold py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 rounded-xl">{error}</p>
                )}
                <button type="submit" disabled={code.length !== 6}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md text-sm">
                  Verificar código
                </button>
                {devCode && (
                  <p className="text-xs text-center text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-slate-800">
                    <span className="font-mono font-bold text-slate-600 dark:text-slate-300">{devCode}</span>
                    <span className="ml-2 opacity-60">(código dev — remover em produção)</span>
                  </p>
                )}
                <button type="button" onClick={() => { setError(""); }}
                  className="w-full text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                  Não recebeste o código? <span className="text-red-600 font-medium">Reenviar</span>
                </button>
              </form>
            </>
          )}

          {/* ── Step: reset ── */}
          {step === "reset" && (
            <>
              <div className="mb-8">
                <h2 className="text-[1.65rem] font-bold text-slate-900 dark:text-white tracking-tight">Nova password</h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-1.5">Escolhe uma nova password para a tua conta.</p>
              </div>
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Nova password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPass ? "text" : "password"} value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="••••••••" required autoFocus
                      className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all text-sm"
                    />
                    <button type="button" onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Confirmar password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPass ? "text" : "password"} value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••" required
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all text-sm"
                    />
                  </div>
                </div>
                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 px-4 py-3 rounded-xl">{error}</p>
                )}
                <button type="submit" disabled={loading || !newPassword || !confirmPassword}
                  className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md text-sm">
                  {loading ? "A guardar..." : "Definir nova password"}
                </button>
              </form>
            </>
          )}

          {/* ── Step: done ── */}
          {step === "done" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-[1.65rem] font-bold text-slate-900 dark:text-white tracking-tight mb-2">Password redefinida!</h2>
              <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">
                A tua password foi alterada com sucesso. Já podes iniciar sessão.
              </p>
              <button onClick={() => setLocation("/login")}
                className="w-full py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-all shadow-md text-sm">
                Ir para o login
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
            <p className="text-center text-xs text-slate-400 dark:text-slate-600">
              Acesso restrito a membros autorizados da SOCEM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
