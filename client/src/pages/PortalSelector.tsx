import { useState } from "react";
import { useLocation } from "wouter";
import { UserPlus, Users, ArrowRight, Shield } from "lucide-react";

function GridBg() {
  return (
    <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
      backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
      backgroundSize: "40px 40px"
    }} />
  );
}

export default function PortalSelector() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const options = [
    {
      id: "colaboradores",
      icon: UserPlus,
      title: "Novos Colaboradores",
      desc: "Registo e onboarding de novos membros da equipa",
      features: ["Dados pessoais", "Permissões & Acessos", "Equipamento IT"],
      href: "/colaboradores/novo",
    },
    {
      id: "estagios",
      icon: Users,
      title: "Gestão de Estágios",
      desc: "Planos de onboarding e acompanhamento de estagiários",
      features: ["Planos de integração", "Tarefas & Progresso", "Relatórios"],
      href: "/login",
    },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left decorative panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-red-600 via-red-700 to-red-900 flex-col justify-between p-14 relative overflow-hidden select-none">
        <GridBg />
        <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] bg-red-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] bg-red-500/25 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl">🎓</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">Portal SOCEM</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-red-100 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Sistema activo
            </div>
            <h2 className="text-white text-[2.6rem] font-bold leading-[1.15] tracking-tight mb-4">
              Portal de<br />Gestão de Pessoas
            </h2>
            <p className="text-red-200/80 text-base leading-relaxed max-w-sm">
              Seleciona a área a que pretendes aceder para gerir colaboradores ou acompanhar estágios.
            </p>
          </div>

          <div className="space-y-3">
            {[
              { icon: UserPlus, label: "Onboarding de colaboradores", desc: "Registo completo" },
              { icon: Users, label: "Gestão de estagiários", desc: "Planos e progresso" },
              { icon: Shield, label: "Controlo de acessos", desc: "Permissões por perfil" },
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

        <div className="relative z-10 flex items-center justify-end">
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div key={i} className={`rounded-full ${i === 0 ? "w-5 h-1.5 bg-white/50" : "w-1.5 h-1.5 bg-white/20"}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Right selector panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
        <div className="lg:hidden text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-red-600 shadow-lg mb-3">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Portal SOCEM</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de Gestão de Pessoas</p>
        </div>

        <div className="w-full max-w-[440px]">
          <div className="mb-8">
            <h2 className="text-[1.65rem] font-bold text-slate-900 dark:text-white tracking-tight">
              Para onde vais?
            </h2>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1.5">
              Seleciona a área que pretendes aceder
            </p>
          </div>

          <div className="space-y-4">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isHovered = hovered === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setLocation(opt.href)}
                  onMouseEnter={() => setHovered(opt.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 group
                    ${isHovered
                      ? "border-red-500 bg-red-50 dark:bg-red-950/30 shadow-lg shadow-red-100 dark:shadow-red-900/20 scale-[1.01]"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 hover:border-red-300"
                    }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all
                        ${isHovered ? "bg-red-600 shadow-md shadow-red-200" : "bg-slate-100 dark:bg-slate-800"}`}>
                        <Icon size={22} className={isHovered ? "text-white" : "text-slate-500 dark:text-slate-400"} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-base mb-1 transition-colors
                          ${isHovered ? "text-red-700 dark:text-red-400" : "text-slate-900 dark:text-white"}`}>
                          {opt.title}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{opt.desc}</p>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {opt.features.map(f => (
                            <span key={f} className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors
                              ${isHovered
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                              }`}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1 transition-all
                      ${isHovered ? "bg-red-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                      <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

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
