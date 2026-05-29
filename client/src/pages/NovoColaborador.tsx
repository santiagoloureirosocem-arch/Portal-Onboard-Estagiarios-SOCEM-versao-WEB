import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowRight, ArrowLeft, Building2, Hash,
  Briefcase, Shield, Monitor, Package,
  CheckCircle2, User, Check, X,
} from "lucide-react";

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
    <div className="space-y-1">
      <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-slate-700">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />}
        <input
          id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className={`w-full ${Icon ? "pl-10" : "pl-4"} pr-4 py-[10px] sm:py-3 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-400 transition-all text-sm`}
        />
      </div>
      {hint && <p className="text-[11px] sm:text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function Toggle({ checked, onChange, label, desc }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; desc?: string;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-6 rounded-full flex-shrink-0 mt-0.5 transition-colors duration-200 ${checked ? "bg-red-600" : "bg-slate-200 group-hover:bg-slate-300"}`}
      >
        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
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
          ${checked ? "bg-red-600 border-red-600" : "border-slate-300 group-hover:border-red-400"}`}
      >
        {checked && <Check size={12} className="text-white" />}
      </div>
      <span className="text-sm text-slate-700">{label}</span>
    </label>
  );
}

export default function NovoColaborador() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

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

  const handleSubmit = async () => {
    setSending(true);
    setSendError("");
    try {
      const res = await fetch("/api/email/novo-colaborador", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome, numColaborador, empresa, departamento,
          permissoes, responsavel, temComputador, temOffice,
          programas: [
            ...programas.filter(p => p !== "Outro"),
            ...(programas.includes("Outro") && outroPrograma ? [outroPrograma] : []),
          ],
        }),
      });
      if (!res.ok) throw new Error("Erro no servidor");
      setSubmitted(true);
    } catch {
      setSendError("Não foi possível enviar o email. Tenta novamente.");
    } finally {
      setSending(false);
    }
  };

  const renderSteps = () => (
    <div className="flex items-center gap-1 mb-3 overflow-x-auto">
      {STEPS.map((s) => {
        const Icon = s.icon;
        const isDone = step > s.id;
        const isCurrent = step === s.id;
        return (
          <div key={s.id} className="flex items-center flex-shrink-0">
            {s.id > 1 && <div className={`h-0.5 w-4 sm:w-6 ${step >= s.id ? "bg-red-500" : "bg-slate-200"}`} />}
            <div className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all duration-300
              ${isDone ? "bg-red-500" : isCurrent ? "bg-red-100" : "bg-slate-100"}`}>
              {isDone
                ? <Check size={10} className="text-white" />
                : <Icon size={10} className={isCurrent ? "text-red-600" : "text-slate-400"} />
              }
            </div>
          </div>
        );
      })}
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
      <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-6 sm:mb-8 animate-in">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-600 shadow-lg shadow-red-200 mb-3 sm:mb-4 overflow-hidden">
              <img src="/socem-logo.png" alt="SOCEM" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-slate-900 text-xl sm:text-2xl font-bold tracking-tight">Portal SOCEM</h1>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm animate-in delay-3">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
              <CheckCircle2 size={28} className="text-emerald-600" />
            </div>
            <h2 className="text-center text-slate-900 text-lg sm:text-xl font-bold mb-2">Pedido submetido!</h2>
            <p className="text-center text-slate-500 text-xs sm:text-sm mb-5 sm:mb-6">
              O registo de <strong className="text-slate-700">{nome}</strong> foi enviado para <strong className="text-slate-700">informatica@socem.pt</strong>.
            </p>
            <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 text-left space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
              {summary.map(([k, v]) => (
                <div key={k} className="flex justify-between items-start gap-3 sm:gap-4">
                  <span className="text-[11px] sm:text-xs font-medium text-slate-500 flex-shrink-0">{k}</span>
                  <span className="text-[11px] sm:text-xs text-slate-700 text-right break-words max-w-[60%]">{v}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={() => { setSubmitted(false); setStep(1); setNome(""); setNumColaborador(""); setEmpresa(""); setDepartamento(""); setPermissoes(""); setResponsavel(""); setTemComputador(false); setTemOffice(false); setProgramas([]); setOutroPrograma(""); }}
                className="w-full sm:flex-1 py-[11px] sm:py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all min-h-[44px]"
              >
                Novo registo
              </button>
              <button
                onClick={() => setLocation("/")}
                className="w-full sm:flex-1 py-[11px] sm:py-3 px-4 rounded-xl text-white text-sm font-semibold bg-red-600 hover:bg-red-500 transition-all shadow-md shadow-red-200 min-h-[44px]"
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
    <div className="min-h-dvh bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-6 sm:mb-8 animate-in">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-600 shadow-lg shadow-red-200 mb-3 sm:mb-4 overflow-hidden">
            <img src="/socem-logo.png" alt="SOCEM" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-slate-900 text-xl sm:text-2xl font-bold tracking-tight mb-1">Novo Colaborador</h1>
          <p className="text-slate-400 text-xs sm:text-sm">Registo de colaborador</p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-5 sm:p-8 shadow-sm animate-in delay-3">
          <button onClick={() => setLocation("/")} className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 text-xs sm:text-sm mb-4 sm:mb-6 transition-colors group min-h-[36px]">
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            Voltar à seleção
          </button>

          <div className="mb-5 sm:mb-6">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="min-w-0">
                {renderSteps()}
                <h2 className="text-slate-900 text-base sm:text-lg font-bold">{STEPS[step - 1].label}</h2>
                <p className="text-slate-400 text-xs">Passo {step} de {STEPS.length}</p>
              </div>
              <span className="text-sm font-bold text-slate-400 flex-shrink-0 mt-0.5">{Math.round((step / STEPS.length) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
            </div>
          </div>

          <div>
            {step === 1 && (
              <div className="space-y-3 sm:space-y-4">
                <InputField id="nome" label="Nome completo" value={nome} onChange={setNome} placeholder="João Silva" icon={User} required />
                <InputField id="num" label="Número de colaborador" value={numColaborador} onChange={setNumColaborador} icon={Hash} required hint="Atribuído pelo departamento de RH" />
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3 sm:space-y-4">
                <InputField id="empresa" label="Empresa" value={empresa} onChange={setEmpresa} icon={Building2} required />
                <InputField id="dept" label="Departamento" value={departamento} onChange={setDepartamento} icon={Briefcase} required />
                <InputField id="perm" label="Permissões" value={permissoes} onChange={setPermissoes} icon={Shield} required />
                <InputField id="resp" label="Responsável" value={responsavel} onChange={setResponsavel} placeholder="Nome do responsável" icon={User} required />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4 sm:space-y-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-4">
                  <Toggle checked={temComputador} onChange={(v) => { setTemComputador(v); if (!v) { setTemOffice(false); setProgramas([]); } }} label="Precisa de computador" desc="Será atribuído pela equipa de TI" />

                  {temComputador && (
                    <div className="ml-10 sm:ml-13 pl-3 border-l-2 border-slate-200 space-y-3 sm:space-y-4">
                      <Toggle checked={temOffice} onChange={setTemOffice} label="Precisa de Microsoft Office" desc="Word, Excel, Outlook, PowerPoint..." />
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-slate-700 mb-2 sm:mb-3">Programas adicionais a instalar</p>
                        <div className="space-y-2 sm:space-y-2.5">
                          {PROGRAMAS.map(p => (
                            <CheckBox key={p} checked={programas.includes(p)} onChange={() => togglePrograma(p)} label={p} />
                          ))}
                        </div>
                        {programas.includes("Outro") && (
                          <div className="mt-2 sm:mt-3">
                            <InputField id="outroPrograma" label="Especificar outro programa" value={outroPrograma} onChange={setOutroPrograma} placeholder="Nome do programa" icon={Package} />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!temComputador && (
                  <div className="flex items-center gap-2.5 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <X size={14} className="text-slate-400 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-slate-500">Sem equipamento informático atribuído</p>
                  </div>
                )}
              </div>
            )}

            <div className={`flex gap-2 sm:gap-3 mt-5 sm:mt-6 ${step > 1 ? "flex-row" : "flex-col"}`}>
              {step > 1 && (
                <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 py-[11px] sm:py-3 px-4 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all flex items-center justify-center gap-2 min-h-[44px]">
                  <ArrowLeft size={15} />
                  Anterior
                </button>
              )}
              {step < STEPS.length ? (
                <button type="button" onClick={() => canNext() && setStep(s => s + 1)} disabled={!canNext()} className="flex-1 flex items-center justify-center gap-2 py-[11px] sm:py-3 px-4 rounded-xl text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-red-200 text-sm bg-red-600 hover:bg-red-500 min-h-[44px]">
                  Continuar <ArrowRight size={15} />
                </button>
              ) : (
                <div className="flex-1 flex flex-col gap-2">
                  {sendError && (
                    <p className="text-xs sm:text-sm text-red-500 text-center">{sendError}</p>
                  )}
                  <button type="button" onClick={handleSubmit} disabled={sending} className="w-full flex items-center justify-center gap-2 py-[11px] sm:py-3 px-4 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-red-200 text-sm bg-red-600 hover:bg-red-500 min-h-[44px]">
                    {sending ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A enviar...</>
                    ) : (
                      <><CheckCircle2 size={15} /> Submeter registo</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-5 sm:mt-6 text-center">
          <p className="text-[11px] sm:text-xs text-slate-400">Acesso restrito a membros autorizados da SOCEM</p>
        </div>
      </div>
    </div>
  );
}
