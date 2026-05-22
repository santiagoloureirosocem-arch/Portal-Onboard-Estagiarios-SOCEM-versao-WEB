import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, ArrowLeft, Building2, Hash,
  Briefcase, Shield, Phone, Monitor, Package,
  CheckCircle2, User, Check, X,
} from "lucide-react";

function GridBg() {
  return (
    <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{
      backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
      backgroundSize: "40px 40px"
    }} />
  );
}

const PROGRAMAS = ["AutoCAD", "Adobe Creative Suite", "TopSolid", "CADMOULD", "Tebis", "Inventor", "MouldFLOW", "Outro"];

const STEPS = [
  { id: 1, label: "Identificação", icon: User },
  { id: 2, label: "Empresa & Acesso", icon: Building2 },
  { id: 3, label: "Equipamento", icon: Monitor },
];

function InputField({ id, label, value, onChange, type = "text", placeholder, icon: Icon, required, hint }: {
  id: string; label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon?: any; required?: boolean; hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input
          id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-400 transition-all text-sm`}
        />
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full flex-shrink-0 mt-0.5 transition-colors duration-200 ${checked ? "bg-red-600" : "bg-slate-200 dark:bg-slate-700"}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</p>
        {desc && <p className="text-xs text-slate-400 mt-0.5">{desc}</p>}
      </div>
    </label>
  );
}

function CheckBox({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${checked ? "bg-red-600 border-red-600" : "border-slate-300 dark:border-slate-600 group-hover:border-red-400"}`}
      >
        {checked && <Check size={12} className="text-white" />}
      </div>
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
    </label>
  );
}

export default function NovoColaborador() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [nome, setNome] = useState("");
  const [numColaborador, setNumColaborador] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [permissoes, setPermissoes] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [temComputador, setTemComputador] = useState(false);
  const [temOffice, setTemOffice] = useState(false);
  const [programas, setProgramas] = useState<string[]>([]);
  const [outroPrograma, setOutroPrograma] = useState("");

  const togglePrograma = (p: string) =>
    setProgramas(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const canNext = () => {
    if (step === 1) return nome.trim() !== "" && numColaborador.trim() !== "";
    if (step === 2) return empresa.trim() !== "" && departamento.trim() !== "" && permissoes.trim() !== "" && responsavel.trim() !== "";
    return true;
  };

  const handleSubmit = () => {
    const subject = encodeURIComponent(`Novo Colaborador: ${nome}`);
    const body = encodeURIComponent(
      `Registo de Novo Colaborador\n\n` +
      `Nome: ${nome}\n` +
      `Nº Colaborador: ${numColaborador}\n` +
      `Empresa: ${empresa}\n` +
      `Departamento: ${departamento}\n` +
      `Permissões: ${permissoes}\n` +
      `Responsável: ${responsavel}\n` +
      `Computador: ${temComputador ? "Sim" : "Não"}\n` +
      (temComputador && temOffice ? `Microsoft Office: Sim\n` : "") +
      (programas.length ? `Programas: ${[...programas.filter(p => p !== "Outro"), ...(programas.includes("Outro") && outroPrograma ? [outroPrograma] : [])].join(", ")}\n` : "")
    );
    window.location.href = `mailto:informatica@socem.pt?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  const leftPanel = (title: string, subtitle: string) => (
    <div className="hidden lg:flex lg:w-[52%] bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex-col justify-between p-14 relative overflow-hidden select-none">
      <GridBg />
      <div className="absolute top-[-80px] right-[-80px] w-[340px] h-[340px] bg-slate-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-100px] left-[-60px] w-[300px] h-[300px] bg-slate-600/25 rounded-full blur-3xl" />

      <div className="relative z-10 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/15 backdrop-blur-sm border border-white/20 rounded-xl flex items-center justify-center shadow-lg">
          <span className="text-xl">🎓</span>
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Portal SOCEM</span>
      </div>

      <div className="relative z-10 space-y-8">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/15 text-slate-200 text-xs font-medium px-3 py-1.5 rounded-full mb-5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            Novo Colaborador
          </div>
          <h2 className="text-white text-[2.4rem] font-bold leading-[1.15] tracking-tight mb-4">{title}</h2>
          <p className="text-slate-300/80 text-base leading-relaxed max-w-sm">{subtitle}</p>
        </div>

        {!submitted && (
          <div className="space-y-3">
            {STEPS.map((s) => {
              const Icon = s.icon;
              const isDone = step > s.id;
              const isCurrent = step === s.id;
              return (
                <div key={s.id} className={`flex items-center gap-3 rounded-xl p-3.5 transition-all
                  ${isCurrent ? "bg-white/15 border border-white/20" : "bg-white/5 border border-white/5"}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${isDone ? "bg-emerald-500" : isCurrent ? "bg-white" : "bg-white/15"}`}>
                    {isDone
                      ? <Check size={15} className="text-white" />
                      : <Icon size={15} className={isCurrent ? "text-slate-800" : "text-white/60"} />
                    }
                  </div>
                  <div>
                    <p className={`text-sm font-semibold leading-none ${isCurrent ? "text-white" : isDone ? "text-slate-300" : "text-white/50"}`}>{s.label}</p>
                    <p className="text-slate-400/70 text-xs mt-0.5">Passo {s.id} de {STEPS.length}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative z-10 flex items-center justify-end">
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={i} className={`rounded-full transition-all ${step === s.id ? "w-5 h-1.5 bg-white/50" : "w-1.5 h-1.5 bg-white/20"}`} />
          ))}
        </div>
      </div>
    </div>
  );

  if (submitted) {
    const summary = [
      ["Colaborador", nome], ["Nº Colaborador", numColaborador],
      ["Empresa", empresa], ["Departamento", departamento],
      ["Permissões", permissoes], ["Responsável", responsavel],
      ["Computador", temComputador ? "Sim" : "Não"],
      ...(temComputador && temOffice ? [["Microsoft Office", "Sim"]] : []),
      ...(programas.length ? [["Programas", [...programas.filter(p => p !== "Outro"), ...(programas.includes("Outro") && outroPrograma ? [outroPrograma] : [])].join(", ")]] : []),
    ] as [string, string][];

    return (
      <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
        {leftPanel("Novo Colaborador\nregistado!", "O pedido foi submetido com sucesso. A equipa de TI e RH serão notificados para processar o onboarding.")}
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950">
          <div className="w-full max-w-[400px] text-center">
            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pedido submetido!</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
              O registo de <strong className="text-slate-700 dark:text-slate-200">{nome}</strong> foi enviado com sucesso para <strong className="text-slate-700 dark:text-slate-200">informatica@socem.pt</strong>.
            </p>
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 text-left space-y-3 mb-8">
              {summary.map(([k, v]) => (
                <div key={k} className="flex justify-between items-start gap-4">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">{k}</span>
                  <span className="text-xs text-slate-700 dark:text-slate-200 text-right">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSubmitted(false); setStep(1); setNome(""); setNumColaborador(""); setEmpresa(""); setDepartamento(""); setPermissoes(""); setResponsavel(""); setTemComputador(false); setTemOffice(false); setProgramas([]); setOutroPrograma(""); }}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-all"
              >
                Novo registo
              </button>
              <button
                onClick={() => setLocation("/")}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all shadow-md shadow-red-200 dark:shadow-none"
              >
                Voltar ao início
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {leftPanel("Registo de\nColaborador", "Preenche o formulário para registar um novo colaborador e configurar os seus acessos e equipamento.")}

      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-950 min-h-screen">
        <div className="w-full max-w-[420px]">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-700 shadow-lg mb-3">
              <span className="text-3xl">👤</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Novo Colaborador</h1>
          </div>

          <button onClick={() => setLocation("/")} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm mb-6 transition-colors group">
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Voltar à seleção
          </button>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-[1.5rem] font-bold text-slate-900 dark:text-white tracking-tight">
                  {STEPS[step - 1].label}
                </h2>
                <p className="text-slate-400 dark:text-slate-500 text-sm mt-0.5">Passo {step} de {STEPS.length}</p>
              </div>
              <span className="text-sm font-bold text-slate-500">{Math.round((step / STEPS.length) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 rounded-full transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
            </div>
          </div>

          <div>
            {step === 1 && (
              <div className="space-y-4">
                <InputField id="nome" label="Nome completo" value={nome} onChange={setNome} placeholder="João Silva" icon={User} required />
                <InputField id="num" label="Número de colaborador" value={numColaborador} onChange={setNumColaborador} icon={Hash} required hint="Atribuído pelo departamento de RH" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <InputField id="empresa" label="Empresa" value={empresa} onChange={setEmpresa} icon={Building2} required />
                <InputField id="dept" label="Departamento" value={departamento} onChange={setDepartamento} icon={Briefcase} required />
                <InputField id="perm" label="Permissões" value={permissoes} onChange={setPermissoes} icon={Shield} required />
                <InputField id="resp" label="Responsável / Gestor direto" value={responsavel} onChange={setResponsavel} placeholder="Nome do responsável" icon={User} required />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4">
                  <Toggle checked={temComputador} onChange={(v) => { setTemComputador(v); if (!v) { setTemOffice(false); setProgramas([]); } }} label="Precisa de computador" desc="Será atribuído pela equipa de TI" />

                  {temComputador && (
                    <div className="ml-13 pl-3 border-l-2 border-slate-200 dark:border-slate-700 space-y-4">
                      <Toggle checked={temOffice} onChange={setTemOffice} label="Precisa de Microsoft Office" desc="Word, Excel, Outlook, PowerPoint..." />
                      <div>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Programas adicionais a instalar</p>
                        <div className="space-y-2.5">
                          {PROGRAMAS.map(p => (
                            <CheckBox key={p} checked={programas.includes(p)} onChange={() => togglePrograma(p)} label={p} />
                          ))}
                        </div>
                        {programas.includes("Outro") && (
                          <div className="mt-3">
                            <InputField id="outroPrograma" label="Especificar outro programa" value={outroPrograma} onChange={setOutroPrograma} placeholder="Nome do programa" icon={Package} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!temComputador && (
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <X size={16} className="text-slate-400 flex-shrink-0" />
                    <p className="text-sm text-slate-500 dark:text-slate-400">Sem equipamento informático atribuído</p>
                  </div>
                )}
              </div>
            )}

            <div className={`flex gap-3 mt-8 ${step > 1 ? "flex-row" : "flex-col"}`}>
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-900 transition-all flex items-center justify-center gap-2">
                  <ArrowLeft size={16} />
                  Anterior
                </button>
              )}
              {step < STEPS.length ? (
                <button type="button" onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-red-200 dark:shadow-none text-sm">
                  Continuar <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-500 transition-all shadow-md shadow-red-200 dark:shadow-none text-sm">
                  <CheckCircle2 size={16} />
                  Submeter registo
                </button>
              )}
            </div>
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
