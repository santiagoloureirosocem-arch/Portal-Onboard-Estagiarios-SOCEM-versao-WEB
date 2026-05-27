import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Send, Paperclip, File, Download, Search,
  X, Check, CheckCheck, Image as ImageIcon, FileText,
  Info, ArrowLeft
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(iso: string | Date) {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

function formatDateGroup(iso: string | Date) {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = today.getTime() - msgDay.getTime();
  if (diff === 0) return "Hoje";
  if (diff === 86400000) return "Ontem";
  return d.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long" });
}

function getFileIcon(fileType?: string, fileName?: string) {
  const ext = fileName?.split(".").pop()?.toLowerCase() ?? fileType ?? "";
  if (["jpg","jpeg","png","gif","webp","svg"].includes(ext)) return <ImageIcon size={16} className="text-blue-400" />;
  if (["pdf"].includes(ext)) return <FileText size={16} className="text-red-400" />;
  return <File size={16} className="text-slate-400" />;
}

function isImage(fileType?: string, fileName?: string) {
  const ext = fileName?.split(".").pop()?.toLowerCase() ?? fileType ?? "";
  return ["jpg","jpeg","png","gif","webp","svg"].includes(ext);
}

function roleLabel(role: string) {
  if (role === "admin") return "Administrador";
  if (role === "tutor") return "Tutor";
  return "Estagiário";
}

function roleDot(role: string) {
  if (role === "admin") return "bg-purple-500";
  if (role === "tutor") return "bg-blue-500";
  return "bg-emerald-500";
}

function initials(name: string) {
  return (name ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarGradient(id: number) {
  const gradients = [
    "from-red-400 to-rose-600",
    "from-blue-400 to-indigo-600",
    "from-emerald-400 to-teal-600",
    "from-amber-400 to-orange-600",
    "from-violet-400 to-purple-600",
    "from-pink-400 to-rose-600",
    "from-cyan-400 to-blue-600",
    "from-orange-400 to-red-600",
  ];
  return gradients[(id ?? 0) % gradients.length];
}

const PRESENCE_DOT: Record<string, string> = {
  online: "bg-green-500",
  ausente: "bg-yellow-400",
  offline: "bg-slate-400",
};

function UserAvatar({ name, id, size = "md", avatar, online = false, presence }: {
  name: string; id: number; size?: "xs"|"sm"|"md"|"lg"; avatar?: string | null; online?: boolean; presence?: string | null;
}) {
  const sz = size === "xs" ? "w-6 h-6 text-[10px]" : size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  const dotSz = size === "lg" ? "w-3.5 h-3.5 border-2" : "w-2.5 h-2.5 border-2";
  const dotColor = presence ? (PRESENCE_DOT[presence] ?? "bg-slate-400") : "bg-green-500";
  return (
    <div className="relative flex-shrink-0">
      {avatar
        ? <img src={avatar} alt={name} className={`${sz} rounded-full object-cover ring-2 ring-white dark:ring-slate-900`} />
        : <div className={`${sz} rounded-full bg-gradient-to-br ${avatarGradient(id)} flex items-center justify-center text-white font-bold ring-2 ring-white dark:ring-slate-900`}>{initials(name)}</div>
      }
      {(online || presence) && <span className={`absolute bottom-0 right-0 ${dotSz} ${dotColor} rounded-full border-white dark:border-slate-900`} />}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function Mensagens() {
  const { user } = useAuth();
  const currentUserId = (user as any)?.id ?? 0;

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const contactsQuery = trpc.users.listForMessaging.useQuery(undefined, { refetchInterval: 30000 });
  const messagesQuery = trpc.messages.getConversation.useQuery(
    { otherUserId: selectedUserId! },
    { enabled: !!selectedUserId, refetchInterval: 3000 }
  );
  const unreadQuery = trpc.messages.unreadCounts.useQuery(undefined, { refetchInterval: 5000 });
  const sendMutation = trpc.messages.send.useMutation({ onSuccess: () => messagesQuery.refetch() });

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messagesQuery.data]);
  useEffect(() => { if (selectedUserId) setTimeout(() => unreadQuery.refetch(), 500); }, [selectedUserId]);

  const allContacts = (contactsQuery.data ?? []) as any[];
  const unreadCounts = (unreadQuery.data ?? {}) as Record<number, number>;
  const messages = (messagesQuery.data ?? []) as any[];

  const filteredContacts = allContacts.filter(c =>
    !search || (c.name ?? c.openId ?? "").toLowerCase().includes(search.toLowerCase())
  );
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const aU = unreadCounts[a.id] ?? 0, bU = unreadCounts[b.id] ?? 0;
    if (aU !== bU) return bU - aU;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });
  const selectedContact = allContacts.find(c => c.id === selectedUserId);

  const groupedMessages: { date: string; msgs: any[] }[] = [];
  messages.forEach((m: any) => {
    const date = formatDateGroup(m.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(m);
    else groupedMessages.push({ date, msgs: [m] });
  });

  const handleSend = useCallback(() => {
    if (!text.trim() || !selectedUserId) return;
    sendMutation.mutate({ receiverId: selectedUserId, text: text.trim() });
    setText("");
    textareaRef.current?.focus();
  }, [text, selectedUserId, sendMutation]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedUserId) return;
    setFileUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      sendMutation.mutate({
        receiverId: selectedUserId,
        text: "",
        fileUrl: reader.result as string,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        fileType: file.name.split(".").pop()?.toLowerCase() ?? "",
      }, { onSettled: () => setFileUploading(false) });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const isSending = sendMutation.isPending;
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <DashboardLayout>
      <div className="flex-1 flex overflow-hidden -m-4 md:-m-6 bg-[#f0f2f5] dark:bg-[#0b0d10]">

        {/* ══ SIDEBAR ══════════════════════════════════════════════════════════ */}
        <div className={`w-full md:w-[320px] flex-shrink-0 flex flex-col bg-white dark:bg-[#111318] border-r border-slate-200/80 dark:border-slate-800/80 ${selectedUserId ? "hidden md:flex" : "flex"}`}>

          {/* Sidebar Header */}
          <div className="px-5 pt-5 pb-3">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Mensagens</h1>
                {totalUnread > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{totalUnread} não {totalUnread === 1 ? "lida" : "lidas"}</p>
                )}
              </div>
            </div>
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Pesquisar..."
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl text-sm bg-slate-100 dark:bg-slate-800/80 border-0 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-all"
              />
            </div>
          </div>

          {/* Contact List */}
          <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
            {contactsQuery.isLoading && (
              <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
                <div className="w-4 h-4 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin" />
                A carregar...
              </div>
            )}
            {!contactsQuery.isLoading && sortedContacts.length === 0 && (
              <div className="text-center py-16 px-6">
                <p className="text-slate-400 text-sm">Sem contactos</p>
              </div>
            )}
            {sortedContacts.map((contact: any) => {
              const unread = unreadCounts[contact.id] ?? 0;
              const isActive = selectedUserId === contact.id;
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedUserId(contact.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left group
                    ${isActive
                      ? "bg-red-50 dark:bg-red-950/30"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    }`}
                >
                  <UserAvatar name={contact.name ?? contact.openId} id={contact.id} avatar={contact.avatar} presence={(contact as any).presence} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-semibold truncate ${isActive ? "text-red-700 dark:text-red-400" : "text-slate-800 dark:text-slate-100"}`}>
                        {contact.name ?? contact.openId}
                      </span>
                      {unread > 0 && (
                        <span className="flex-shrink-0 min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1.5">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${roleDot(contact.role ?? "")}`} />
                      <span className="text-xs text-slate-400 truncate">{roleLabel(contact.role ?? "")}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ══ CHAT AREA ════════════════════════════════════════════════════════ */}
        {!selectedUserId ? (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] dark:bg-[#0b0d10] gap-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center shadow-2xl shadow-red-200 dark:shadow-red-900/40">
              <Send size={36} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Seleciona uma conversa</h3>
              <p className="text-sm text-slate-400 mt-1">Escolhe um contacto para começar</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex min-w-0">
            <div className="flex-1 flex flex-col min-w-0">

              {/* ── Chat Header ── */}
              <div className="h-[65px] px-5 bg-white dark:bg-[#111318] border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button onClick={() => setSelectedUserId(null)} className="md:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors">
                    <ArrowLeft size={18} />
                  </button>
                  <UserAvatar name={selectedContact?.name ?? selectedContact?.openId ?? ""} id={selectedContact?.id ?? 0} avatar={selectedContact?.avatar} presence={(selectedContact as any)?.presence} />
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white leading-tight">{selectedContact?.name ?? selectedContact?.openId}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${roleDot(selectedContact?.role ?? "")}`} />
                      <span className="text-xs text-slate-400">{roleLabel(selectedContact?.role ?? "")}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowInfo(v => !v)}
                    className={`p-2 rounded-xl transition-colors ${showInfo ? "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                  >
                    <Info size={17} />
                  </button>
                </div>
              </div>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-5 py-4">
                <div className="flex flex-col justify-end min-h-full space-y-0.5">
                {messagesQuery.isLoading && (
                  <div className="flex items-center justify-center py-10 gap-2 text-slate-400 text-sm">
                    <div className="w-4 h-4 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin" />
                    A carregar...
                  </div>
                )}

                {!messagesQuery.isLoading && messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                    <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Send size={24} className="text-slate-300 dark:text-slate-600" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Nenhuma mensagem</p>
                      <p className="text-slate-400 text-xs mt-0.5">Envia a primeira mensagem!</p>
                    </div>
                  </div>
                )}

                {groupedMessages.map(group => (
                  <div key={group.date}>
                    {/* Date separator */}
                    <div className="flex items-center gap-3 my-6">
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold bg-white dark:bg-[#111318] px-3 py-1 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                        {group.date}
                      </span>
                      <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {group.msgs.map((msg: any, idx: number) => {
                      const isMine = msg.senderId === currentUserId;
                      const isFirst = idx === 0 || group.msgs[idx - 1].senderId !== msg.senderId;
                      const isLast = idx === group.msgs.length - 1 || group.msgs[idx + 1].senderId !== msg.senderId;

                      return (
                        <div key={msg.id} className={`flex items-end gap-2 ${isMine ? "flex-row-reverse" : "flex-row"} ${isFirst ? "mt-4" : "mt-0.5"}`}>

                          {/* Avatar - only on last message of a group */}
                          <div className="flex-shrink-0 w-8">
                            {!isMine && isLast && (
                              <UserAvatar name={msg.senderName} id={msg.senderId} size="sm" avatar={selectedContact?.avatar} />
                            )}
                          </div>

                          {/* Bubble */}
                          <div className={`flex flex-col max-w-[65%] ${isMine ? "items-end" : "items-start"}`}>
                            {!isMine && isFirst && (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 ml-1">
                                {msg.senderName}
                              </span>
                            )}

                            <div className={`relative px-4 py-2.5 shadow-sm
                              ${isMine
                                ? `bg-gradient-to-br from-red-500 to-red-700 text-white
                                   ${isFirst ? "rounded-t-2xl" : "rounded-2xl"} rounded-bl-2xl
                                   ${isLast ? "rounded-br-sm" : "rounded-br-2xl"}`
                                : `bg-white dark:bg-[#1e2028] text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700/60
                                   ${isFirst ? "rounded-t-2xl" : "rounded-2xl"} rounded-br-2xl
                                   ${isLast ? "rounded-bl-sm" : "rounded-bl-2xl"}`
                              }`}
                            >
                              {/* File */}
                              {msg.fileName && (
                                <div className={`rounded-xl overflow-hidden mb-2 ${isMine ? "bg-red-800/30" : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"}`}>
                                  {isImage(msg.fileType, msg.fileName) && msg.fileUrl ? (
                                    <img src={msg.fileUrl} alt={msg.fileName} className="max-w-[240px] max-h-[180px] object-cover block" />
                                  ) : (
                                    <div className="flex items-center gap-3 p-3">
                                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isMine ? "bg-red-800/40" : "bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600"}`}>
                                        {getFileIcon(msg.fileType, msg.fileName)}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold truncate ${isMine ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{msg.fileName}</p>
                                        {msg.fileSize && <p className={`text-[11px] mt-0.5 ${isMine ? "text-red-200" : "text-slate-400"}`}>{msg.fileSize}</p>}
                                      </div>
                                      {msg.fileUrl && (
                                        <a href={msg.fileUrl} download={msg.fileName}
                                          className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${isMine ? "hover:bg-red-800/40 text-red-100" : "hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500"}`}>
                                          <Download size={14} />
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                              {msg.text && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}
                            </div>

                            {isLast && (
                              <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? "justify-end" : "justify-start"}`}>
                                <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                                {isMine && (msg.isRead
                                  ? <CheckCheck size={11} className="text-blue-400" />
                                  : <Check size={11} className="text-slate-400" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* ── Input ── */}
              <div className="px-4 py-3 bg-white dark:bg-[#111318] border-t border-slate-200/80 dark:border-slate-800/80 flex-shrink-0">
                <div className="flex items-end gap-2 bg-slate-50 dark:bg-[#1a1d24] rounded-2xl border border-slate-200 dark:border-slate-700/60 px-3 py-2 focus-within:border-red-400/60 focus-within:ring-2 focus-within:ring-red-500/10 transition-all">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={fileUploading || isSending}
                    className="flex-shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
                    title="Anexar"
                  >
                    {fileUploading
                      ? <div className="w-4 h-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin" />
                      : <Paperclip size={17} />
                    }
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="*/*" />

                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Escreve uma mensagem..."
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none max-h-28 leading-relaxed py-1"
                    style={{ minHeight: "22px" }}
                  />

                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || isSending}
                    className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-red-500 to-red-700 text-white rounded-xl flex items-center justify-center hover:from-red-400 hover:to-red-600 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-red-300 dark:shadow-red-900/50"
                  >
                    {isSending
                      ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Send size={14} strokeWidth={2.5} />
                    }
                  </button>
                </div>
                <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center mt-1.5 select-none">
                  Enter para enviar · Shift+Enter para nova linha
                </p>
              </div>
            </div>

            {/* ══ INFO PANEL ══════════════════════════════════════════════════ */}
            {showInfo && selectedContact && (
              <div className="hidden lg:flex w-[260px] flex-shrink-0 flex-col bg-white dark:bg-[#111318] border-l border-slate-200/80 dark:border-slate-800/80">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">Perfil</span>
                  <button onClick={() => setShowInfo(false)} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"><X size={15} /></button>
                </div>
                <div className="p-5 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800">
                  <UserAvatar name={selectedContact.name ?? selectedContact.openId} id={selectedContact.id} size="lg" avatar={selectedContact.avatar} presence={(selectedContact as any).presence} />
                  <h3 className="mt-3 font-bold text-slate-900 dark:text-white text-sm">{selectedContact.name ?? selectedContact.openId}</h3>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${roleDot(selectedContact.role ?? "")}`} />
                    <span className="text-xs text-slate-500">{roleLabel(selectedContact.role ?? "")}</span>
                  </div>
                  {selectedContact.email && <p className="mt-2 text-xs text-slate-400 break-all">{selectedContact.email}</p>}
                  {selectedContact.department && <p className="text-xs text-slate-400 mt-0.5">{selectedContact.department}</p>}
                </div>
                <div className="p-4 flex-1 overflow-y-auto">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Ficheiros</p>
                  {messages.filter((m: any) => m.fileName).length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">Sem ficheiros partilhados</p>
                  ) : (
                    <div className="space-y-1.5">
                      {messages.filter((m: any) => m.fileName).map((m: any) => (
                        <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 group transition-colors">
                          <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center flex-shrink-0">
                            {getFileIcon(m.fileType, m.fileName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{m.fileName}</p>
                            <p className="text-[10px] text-slate-400">{m.fileSize}</p>
                          </div>
                          {m.fileUrl && (
                            <a href={m.fileUrl} download={m.fileName} className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all">
                              <Download size={12} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
