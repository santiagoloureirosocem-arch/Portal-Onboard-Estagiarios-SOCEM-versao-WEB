import { useState } from "react";
import { useLocation } from "wouter";
import { UserPlus, Users, ArrowRight, Shield } from "lucide-react";

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
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[520px]">
        <div className="text-center mb-8 sm:mb-10 animate-in">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-600 shadow-lg shadow-red-200 mb-3 sm:mb-4 overflow-hidden">
            <img src="/socem-logo.png" alt="SOCEM" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">Portal SOCEM</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Sistema de Gestão de Pessoas</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm animate-in delay-3">
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full mb-4 sm:mb-5 w-fit mx-auto">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            Sistema activo
          </div>

          <h2 className="text-center text-slate-900 text-lg sm:text-xl font-bold mb-1">Para onde vais?</h2>
          <p className="text-center text-slate-400 text-xs sm:text-sm mb-6 sm:mb-8">Seleciona a área que pretendes aceder</p>

          <div className="space-y-3 sm:space-y-4">
            {options.map((opt, idx) => {
              const Icon = opt.icon;
              const isHovered = hovered === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setLocation(opt.href)}
                  onMouseEnter={() => setHovered(opt.id)}
                  onMouseLeave={() => setHovered(null)}
                  className={`w-full text-left rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5 transition-all duration-300 group animate-in ${`delay-${idx * 2 + 4}`}
                    ${isHovered
                      ? "border-red-200 bg-red-50 shadow-lg shadow-red-100 scale-[1.02]"
                      : "border-slate-100 bg-white hover:border-red-100 hover:bg-red-50/30"
                    }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500
                      ${isHovered ? "bg-red-600 shadow-lg shadow-red-200" : "bg-red-50"}`}>
                      <Icon size={20} className={isHovered ? "text-white" : "text-red-600"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-bold text-sm sm:text-base mb-0.5 transition-colors ${isHovered ? "text-red-800" : "text-slate-800"}`}>
                        {opt.title}
                      </h3>
                      <p className={`text-xs sm:text-sm transition-colors ${isHovered ? "text-red-700/60" : "text-slate-500"}`}>{opt.desc}</p>
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
                        {opt.features.map(f => (
                          <span key={f} className={`text-[11px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium transition-all whitespace-nowrap
                            ${isHovered ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300
                      ${isHovered ? "bg-red-600 text-white translate-x-1 shadow-lg shadow-red-200" : "bg-slate-100 text-slate-400"}`}>
                      <ArrowRight size={13} className="sm:size-[15px]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-slate-100 text-center">
            <p className="text-[11px] sm:text-xs text-slate-400">Acesso restrito a membros autorizados da SOCEM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
