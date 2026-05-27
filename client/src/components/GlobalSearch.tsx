import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Search, FileText, Users, CheckSquare, X, ArrowRight } from "lucide-react";

type Result = {
  id: string;
  type: "user" | "plan" | "task";
  title: string;
  subtitle?: string;
  path: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-primary/20 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

const TYPE_META = {
  user: { icon: Users, label: "Utilizador", color: "text-blue-500 bg-blue-50 dark:bg-blue-950/40" },
  plan: { icon: FileText, label: "Plano", color: "text-purple-500 bg-purple-50 dark:bg-purple-950/40" },
  task: { icon: CheckSquare, label: "Tarefa", color: "text-green-500 bg-green-50 dark:bg-green-950/40" },
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 200);

  const { data: users } = trpc.users.list.useQuery(undefined, { enabled: open });
  const { data: plans } = trpc.plans.list.useQuery(undefined, { enabled: open });
  const { data: tasks } = trpc.tasks.listAll.useQuery(undefined, { enabled: open });

  const results: Result[] = [];
  const q = debouncedQuery.toLowerCase().trim();

  if (q.length >= 1) {
    (users || []).forEach((u: any) => {
      if (u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)) {
        results.push({ id: `u-${u.id}`, type: "user", title: u.name || u.email, subtitle: u.position || u.email, path: "/users" });
      }
    });
    (plans || []).forEach((p: any) => {
      if (p.title?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q)) {
        results.push({ id: `p-${p.id}`, type: "plan", title: p.title, subtitle: p.description, path: `/plans/${p.id}` });
      }
    });
    (tasks || []).forEach((t: any) => {
      if (t.title?.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q)) {
        results.push({ id: `t-${t.id}`, type: "task", title: t.title, subtitle: t.description, path: "/tasks" });
      }
    });
  }

  const go = useCallback((r: Result) => {
    setLocation(r.path);
    setOpen(false);
    setQuery("");
  }, [setLocation]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && results[activeIdx]) go(results[activeIdx]);
      if (e.key === "Escape") { setOpen(false); setQuery(""); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, results, activeIdx, go]);

  // Reset active on new results
  useEffect(() => { setActiveIdx(0); }, [debouncedQuery]);

  // Click outside to close
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery("");
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Global Ctrl+K / Cmd+K shortcut
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-sm">
      {/* Trigger */}
      <div
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        className={`flex items-center gap-2 px-3 h-9 rounded-lg border cursor-text transition-all ${
          open
            ? "border-primary/50 bg-background shadow-md ring-2 ring-primary/20"
            : "border-border bg-muted/40 hover:border-border/80 hover:bg-muted/60"
        }`}
      >
        <Search size={14} className="text-muted-foreground shrink-0" />
        {open ? (
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Pesquisar utilizadores, planos, tarefas…"
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground text-foreground min-w-0"
            autoComplete="off"
          />
        ) : (
          <span className="text-sm text-muted-foreground flex-1 min-w-0 truncate">Pesquisar…</span>
        )}
        {open && query ? (
          <button onClick={e => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }}>
            <X size={13} className="text-muted-foreground hover:text-foreground" />
          </button>
        ) : (
          <kbd className="hidden sm:inline-flex text-[10px] font-mono text-muted-foreground bg-muted rounded px-1.5 py-0.5 border border-border/60">
            ⌘K
          </kbd>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-background border border-border rounded-xl shadow-2xl z-[9999] overflow-hidden animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {q.length < 1 ? (
            <div className="px-4 py-6 text-center">
              <Search size={24} className="text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Escreve para pesquisar utilizadores, planos ou tarefas</p>
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhum resultado para <strong>"{query}"</strong></p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto py-1.5">
              {/* Group by type */}
              {(["user", "plan", "task"] as const).map(type => {
                const group = results.filter(r => r.type === type);
                if (!group.length) return null;
                const meta = TYPE_META[type];
                const MetaIcon = meta.icon;
                return (
                  <div key={type}>
                    <div className="flex items-center gap-2 px-3 py-1.5 mt-0.5">
                      <MetaIcon size={11} className={meta.color.split(" ")[0]} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{meta.label}s</span>
                    </div>
                    {group.map((r, groupIdx) => {
                      const globalIdx = results.indexOf(r);
                      const MetaIconInner = TYPE_META[r.type].icon;
                      const isActive = globalIdx === activeIdx;
                      return (
                        <button
                          key={r.id}
                          onMouseEnter={() => setActiveIdx(globalIdx)}
                          onClick={() => go(r)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            isActive ? "bg-accent" : "hover:bg-accent/50"
                          }`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${TYPE_META[r.type].color}`}>
                            <MetaIconInner size={13} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {highlight(r.title, query)}
                            </p>
                            {r.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">
                                {highlight(r.subtitle, query)}
                              </p>
                            )}
                          </div>
                          {isActive && <ArrowRight size={12} className="text-muted-foreground shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
              <div className="border-t border-border/50 px-3 py-2 mt-1">
                <p className="text-[10px] text-muted-foreground">{results.length} resultado{results.length !== 1 ? "s" : ""} · <kbd className="font-mono">↑↓</kbd> navegar · <kbd className="font-mono">↵</kbd> abrir · <kbd className="font-mono">Esc</kbd> fechar</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
