import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Shield, Plus, Pencil, Trash2, X, Check, Lock, Building2, Briefcase, LogOut } from "lucide-react";

const API = (path: string, token: string, init?: RequestInit) =>
  fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", "x-admin-pass": token, ...init?.headers },
  });

export default function AdminConfig() {
  const [, setLocation] = useLocation();
  const [pass, setPass] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"empresas" | "departamentos">("empresas");
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState("");
  const [newNome, setNewNome] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authed) return;
    Promise.all([
      API("/api/empresas", pass).then(r => r.json()).then(setEmpresas),
      API("/api/departamentos", pass).then(r => r.json()).then(setDepartamentos),
    ]);
  }, [authed, pass]);

  const handleLogin = () => {
    if (pass === "socem2026") {
      setAuthed(true);
      setError("");
    } else {
      setError("Password incorreta");
    }
  };

  const addItem = async () => {
    if (!newNome.trim()) return;
    const ep = tab === "empresas" ? "/api/empresas" : "/api/departamentos";
    const res = await API(ep, pass, { method: "POST", body: JSON.stringify({ nome: newNome.trim() }) });
    if (res.ok) {
      const item = await res.json();
      if (tab === "empresas") setEmpresas(prev => [...prev, item]);
      else setDepartamentos(prev => [...prev, item]);
      setNewNome("");
    }
  };

  const saveEdit = async (id: number) => {
    if (!editNome.trim()) return;
    const ep = tab === "empresas" ? `/api/empresas/${id}` : `/api/departamentos/${id}`;
    const res = await API(ep, pass, { method: "PUT", body: JSON.stringify({ nome: editNome.trim() }) });
    if (res.ok) {
      const setter = tab === "empresas" ? setEmpresas : setDepartamentos;
      setter((prev: any[]) => prev.map((e: any) => e.id === id ? { ...e, nome: editNome.trim() } : e));
      setEditId(null);
    }
  };

  const deleteItem = async (id: number) => {
    const ep = tab === "empresas" ? `/api/empresas/${id}` : `/api/departamentos/${id}`;
    const res = await API(ep, pass, { method: "DELETE" });
    if (res.ok) {
      const setter = tab === "empresas" ? setEmpresas : setDepartamentos;
      setter((prev: any[]) => prev.filter((e: any) => e.id !== id));
    }
  };

  const items = tab === "empresas" ? empresas : departamentos;
  const icons = { empresas: Building2, departamentos: Briefcase };

  if (!authed) {
    return (
      <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-red-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 p-6 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-red-600 flex items-center justify-center mx-auto mb-3 overflow-hidden">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900">Administração</h1>
            <p className="text-xs text-slate-400 mt-1">Introduz a password de administrador</p>
          </div>
          <div className="space-y-3">
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password" value={pass} onChange={e => setPass(e.target.value)}
                placeholder="Password" onKeyDown={e => e.key === "Enter" && handleLogin()}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400"
              />
            </div>
            {error && <p className="text-xs text-red-500 text-center">{error}</p>}
            <button onClick={handleLogin} className="w-full py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all shadow-md">
              Entrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const Icon = icons[tab];

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 via-white to-red-50 p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-end mb-6">
          <button onClick={() => { setAuthed(false); setPass(""); setLocation("/"); }} className="flex items-center gap-1.5 text-slate-400 hover:text-red-600 text-sm transition-all">
            <LogOut size={15} />
            Sair
          </button>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-xl overflow-hidden">
          <div className="flex border-b border-slate-200">
            <button onClick={() => setTab("empresas")}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${tab === "empresas" ? "text-red-600 border-b-2 border-red-600" : "text-slate-400 hover:text-slate-600"}`}>
              Empresas
            </button>
            <button onClick={() => setTab("departamentos")}
              className={`flex-1 py-3 text-sm font-semibold transition-all ${tab === "departamentos" ? "text-red-600 border-b-2 border-red-600" : "text-slate-400 hover:text-slate-600"}`}>
              Departamentos
            </button>
          </div>

          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <input value={newNome} onChange={e => setNewNome(e.target.value)}
                placeholder={`Nov${tab === "empresas" ? "a" : "o"} ${tab === "empresas" ? "empresa" : "departamento"}`}
                onKeyDown={e => e.key === "Enter" && addItem()}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400"
              />
              <button onClick={addItem} className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 transition-all flex items-center gap-1.5 shadow-md">
                <Plus size={16} /> Adicionar
              </button>
            </div>

            <div className="space-y-2">
              {items.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-8">Nenhum{tab === "empresas" ? "a" : ""} {tab === "empresas" ? "empresa" : "departamento"} encontrado{tab === "empresas" ? "a" : ""}</p>
              )}
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2.5 group hover:bg-slate-100 transition-all">
                  <Icon size={16} className="text-slate-400 flex-shrink-0" />
                  {editId === item.id ? (
                    <>
                      <input value={editNome} onChange={e => setEditNome(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                        onKeyDown={e => { if (e.key === "Enter") saveEdit(item.id); if (e.key === "Escape") setEditId(null); }}
                        autoFocus
                      />
                      <button onClick={() => saveEdit(item.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-all"><Check size={16} /></button>
                      <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-200 transition-all"><X size={16} /></button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-700">{item.nome}</span>
                      <button onClick={() => { setEditId(item.id); setEditNome(item.nome); }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => deleteItem(item.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
