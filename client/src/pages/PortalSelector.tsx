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
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-red-50 animate-gradient-shift flex items-center justify-center p-4 sm:p-6 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 left-[10%] w-2 h-2 bg-red-300/30 rounded-full animate-float-rotate" />
        <div className="absolute top-20 right-[15%] w-3 h-3 bg-red-400/20 rounded-full animate-float-rotate" style={{ animationDelay: "-2s" }} />
        <div className="absolute bottom-20 left-[20%] w-2.5 h-2.5 bg-red-300/20 rounded-full animate-float-rotate" style={{ animationDelay: "-4s" }} />
        <div className="absolute bottom-10 right-[25%] w-1.5 h-1.5 bg-red-400/25 rounded-full animate-float-rotate" style={{ animationDelay: "-1s" }} />
      </div>

      <div className="w-full max-w-[520px] relative">
        <div className="text-center mb-8 sm:mb-10 animate-scale-in">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-600 mb-3 sm:mb-4 overflow-hidden animate-float-rotate animate-glow-pulse" style={{ borderRadius: "1rem" }}>
            <img src="/socem-logo.png" alt="SOCEM" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-slate-900 text-2xl sm:text-3xl font-bold tracking-tight mb-1 sm:mb-2">Portal SOCEM</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Sistema de Gestão de Pessoas</p>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/80 p-5 sm:p-8 shadow-xl animate-card-in delay-2">
          <div className="flex items-center gap-2 bg-red-50 text-red-600 text-[11px] sm:text-xs font-medium px-3 py-1.5 rounded-full mb-4 sm:mb-5 w-fit mx-auto hover:bg-red-100 transition-colors">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />
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
                  className={`w-full text-left rounded-xl sm:rounded-2xl border-2 p-4 sm:p-5 transition-all duration-500 group animate-bounce-in ${`delay-${idx * 2 + 4}`}
                    ${isHovered
                      ? "border-red-300 bg-red-50 shadow-xl shadow-red-200/30 scale-[1.03] -translate-y-0.5"
                      : "border-slate-100 bg-white hover:border-red-200 hover:bg-red-50/40 hover:shadow-md hover:shadow-red-100/30 hover:-translate-y-0.5"
                    }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500
                      ${isHovered
                        ? "bg-red-600 shadow-xl shadow-red-300/40 scale-110"
                        : "bg-red-50 group-hover:bg-red-100 group-hover:scale-105"
                      }`}>
                      <Icon size={20} className={`transition-all duration-500 ${isHovered ? "text-white scale-110" : "text-red-600"}`} />
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
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
                      ${isHovered
                        ? "bg-red-600 text-white translate-x-1.5 shadow-lg shadow-red-300/40 scale-110"
                        : "bg-slate-100 text-slate-400 group-hover:bg-red-100 group-hover:text-red-500 group-hover:translate-x-0.5"
                      }`}>
                      <ArrowRight size={13} className="sm:size-[15px]" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-slate-100 text-center animate-fade delay-8">
            <p className="text-[11px] sm:text-xs text-slate-400">Acesso restrito a membros autorizados da SOCEM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
