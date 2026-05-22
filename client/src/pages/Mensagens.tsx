import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import {
  MessageCircle, Send, Paperclip, File, Download, Search,
  Users, X, Check, CheckCheck, Image as ImageIcon, FileText,
  Info, ArrowLeft
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────
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
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return <ImageIcon size={18} className="text-blue-500" />;
  if (["pdf"].includes(ext)) return <FileText size={18} className="text-red-500" />;
  return <File size={18} className="text-slate-500" />;
}

function isImage(fileType?: string, fileName?: string) {
  const ext = fileName?.split(".").pop()?.toLowerCase() ?? fileType ?? "";
  return ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext);
}

function roleLabel(role: string) {
  if (role === "admin") return "Administrador";
  if (role === "tutor") return "Tutor";
  return "Estagiário";
}

function roleBadgeColor(role: string) {
  if (role === "admin") return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
  if (role === "tutor") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300";
}

function initials(name: string) {
  return (name ?? "?").split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function avatarColor(id: number) {
  const colors = ["bg-red-500","bg-blue-500","bg-emerald-500","bg-amber-500","bg-violet-500","bg-pink-500","bg-cyan-500","bg-orange-500"];
  return colors[(id ?? 0) % colors.length];
}

function UserAvatar({ name, id, size = "md" }: { name: string; id: number; size?: "sm"|"md"|"lg" }) {
  const sz = size === "sm" ? "w-8 h-8 text-xs" : size === "lg" ? "w-12 h-12 text-base" : "w-10 h-10 text-sm";
  return (
    <div className={`${sz} ${avatarColor(id)} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}>
      {initials(name)}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Mensagens() {
  const { user } = useAuth();
  const currentUserId = (user as any)?.id ?? 0;
  const currentUserName = (user as any)?.name ?? user?.openId ?? "Eu";

  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Queries ──
  const contactsQuery = trpc.users.listForMessaging.useQuery(undefined, { refetchInterval: 30000 });
  const messagesQuery = trpc.messages.getConversation.useQuery(
    { otherUserId: selectedUserId! },
    { enabled: !!selectedUserId, refetchInterval: 3000 }
  );
  const unreadQuery = trpc.messages.unreadCounts.useQuery(undefined, { refetchInterval: 5000 });

  // ── Mutations ──
  const sendMutation = trpc.messages.send.useMutation({
    onSuccess: () => messagesQuery.refetch(),
  });

  const utils = trpc.useUtils();

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesQuery.data]);

  // Refetch unread when conversation opens
  useEffect(() => {
    if (selectedUserId) {
      setTimeout(() => unreadQuery.refetch(), 500);
    }
  }, [selectedUserId]);

  const allContacts = (contactsQuery.data ?? []) as any[];
  const unreadCounts = (unreadQuery.data ?? {}) as Record<number, number>;

  const filteredContacts = allContacts.filter(c =>
    !search || (c.name ?? c.openId ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // Sort: contacts with messages first, then by last message time
  const messages = (messagesQuery.data ?? []) as any[];

  // Build sorted contact list
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const aUnread = unreadCounts[a.id] ?? 0;
    const bUnread = unreadCounts[b.id] ?? 0;
    if (aUnread !== bUnread) return bUnread - aUnread;
    return (a.name ?? "").localeCompare(b.name ?? "");
  });

  const selectedContact = allContacts.find(c => c.id === selectedUserId);

  const handleSend = useCallback(() => {
    if ((!text.trim()) || !selectedUserId) return;
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
      const fileUrl = reader.result as string;
      const fileType = file.name.split(".").pop()?.toLowerCase() ?? "";
      sendMutation.mutate({
        receiverId: selectedUserId,
        text: "",
        fileUrl,
        fileName: file.name,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        fileType,
      }, { onSettled: () => setFileUploading(false) });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // Group messages by date
  const groupedMessages: { date: string; msgs: any[] }[] = [];
  messages.forEach((m: any) => {
    const date = formatDateGroup(m.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === date) last.msgs.push(m);
    else groupedMessages.push({ date, msgs: [m] });
  });

  const isSending = sendMutation.isPending;

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-slate-50 dark:bg-slate-950 -m-4 md:-m-6">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <div className={`w-full md:w-80 lg:w-96 flex-shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col ${selectedUserId ? "hidden md:flex" : "flex"}`}>

          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle size={20} className="text-red-600" />
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">Mensagens</h1>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Procurar contacto..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-400 transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {contactsQuery.isLoading && (
              <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin mr-2" />
                A carregar...
              </div>
            )}

            {!contactsQuery.isLoading && sortedContacts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <Users size={40} className="text-slate-200 dark:text-slate-700 mb-3" />
                <p className="text-slate-500 text-sm font-medium">Sem contactos disponíveis</p>
              </div>
            )}

            {sortedContacts.map((contact: any) => {
              const unread = unreadCounts[contact.id] ?? 0;
              return (
                <button
                  key={contact.id}
                  onClick={() => setSelectedUserId(contact.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left
                    ${selectedUserId === contact.id ? "bg-red-50 dark:bg-red-950/20 border-r-2 border-red-500" : ""}`}
                >
                  <UserAvatar name={contact.name ?? contact.openId} id={contact.id} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">{contact.name ?? contact.openId}</span>
                      {unread > 0 && (
                        <span className="ml-2 flex-shrink-0 min-w-[20px] h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                          {unread}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleBadgeColor(contact.role ?? "")}`}>
                      {roleLabel(contact.role ?? "")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Chat Area ──────────────────────────────────────── */}
        {!selectedUserId ? (
          <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle size={36} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-slate-700 dark:text-slate-300 font-semibold text-lg mb-1">Seleciona uma conversa</h3>
              <p className="text-slate-400 text-sm">Escolhe um contacto para começar a conversar</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat Header */}
            <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUserId(null)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
                  <ArrowLeft size={18} />
                </button>
                <UserAvatar name={selectedContact?.name ?? selectedContact?.openId ?? ""} id={selectedContact?.id ?? 0} />
                <div>
                  <p className="font-semibold text-sm text-slate-900 dark:text-white">{selectedContact?.name ?? selectedContact?.openId}</p>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${roleBadgeColor(selectedContact?.role ?? "")}`}>
                    {roleLabel(selectedContact?.role ?? "")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowInfo(v => !v)}
                className={`p-2 rounded-xl transition-colors ${showInfo ? "bg-red-50 text-red-600 dark:bg-red-950/30" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
              >
                <Info size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {messagesQuery.isLoading && (
                <div className="flex items-center justify-center py-10 text-slate-400 text-sm">
                  <div className="w-5 h-5 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin mr-2" />
                  A carregar mensagens...
                </div>
              )}

              {!messagesQuery.isLoading && messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <MessageCircle size={28} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-slate-500 text-sm font-medium">Nenhuma mensagem ainda</p>
                  <p className="text-slate-400 text-xs mt-1">Envia uma mensagem para iniciar a conversa</p>
                </div>
              )}

              {groupedMessages.map(group => (
                <div key={group.date}>
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                    <span className="text-xs text-slate-400 font-medium px-2">{group.date}</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  </div>

                  {group.msgs.map((msg: any, idx: number) => {
                    const isMine = msg.senderId === currentUserId;
                    const isFirst = idx === 0 || group.msgs[idx - 1].senderId !== msg.senderId;
                    const isLast = idx === group.msgs.length - 1 || group.msgs[idx + 1].senderId !== msg.senderId;

                    return (
                      <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} ${isFirst ? "mt-3" : "mt-0.5"}`}>
                        {!isMine && isFirst && (
                          <div className="mr-2 mt-auto mb-0.5">
                            <UserAvatar name={msg.senderName} id={msg.senderId} size="sm" />
                          </div>
                        )}
                        {!isMine && !isFirst && <div className="w-8 mr-2 flex-shrink-0" />}

                        <div className={`max-w-[72%] flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                          {!isMine && isFirst && (
                            <span className="text-xs text-slate-400 font-medium ml-1 mb-1">{msg.senderName}</span>
                          )}

                          <div className={`rounded-2xl px-3.5 py-2.5 shadow-sm
                            ${isMine
                              ? `bg-red-600 text-white ${isFirst ? "rounded-tr-sm" : ""}`
                              : `bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100 dark:border-slate-700 ${isFirst ? "rounded-tl-sm" : ""}`
                            }`}
                          >
                            {/* File attachment */}
                            {msg.fileName && (
                              <div className={`flex items-center gap-2.5 p-2.5 rounded-xl mb-2 ${isMine ? "bg-red-700/40" : "bg-slate-50 dark:bg-slate-700"}`}>
                                {isImage(msg.fileType, msg.fileName) && msg.fileUrl ? (
                                  <div className="flex flex-col gap-1">
                                    <img src={msg.fileUrl} alt={msg.fileName} className="max-w-[200px] max-h-[160px] rounded-lg object-cover" />
                                    <div className="flex items-center gap-1.5">
                                      {getFileIcon(msg.fileType, msg.fileName)}
                                      <span className={`text-xs font-medium truncate max-w-[150px] ${isMine ? "text-red-100" : "text-slate-600 dark:text-slate-300"}`}>{msg.fileName}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <>
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${isMine ? "bg-red-700/50" : "bg-slate-200 dark:bg-slate-600"}`}>
                                      {getFileIcon(msg.fileType, msg.fileName)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-semibold truncate ${isMine ? "text-white" : "text-slate-700 dark:text-slate-200"}`}>{msg.fileName}</p>
                                      {msg.fileSize && <p className={`text-[11px] mt-0.5 ${isMine ? "text-red-200" : "text-slate-400"}`}>{msg.fileSize}</p>}
                                    </div>
                                    {msg.fileUrl && (
                                      <a href={msg.fileUrl} download={msg.fileName} className={`p-1.5 rounded-lg flex-shrink-0 ${isMine ? "hover:bg-red-700/50 text-red-100" : "hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500"}`} title="Descarregar">
                                        <Download size={14} />
                                      </a>
                                    )}
                                  </>
                                )}
                              </div>
                            )}

                            {msg.text && <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{msg.text}</p>}
                          </div>

                          {isLast && (
                            <div className={`flex items-center gap-1 mt-0.5 px-1 ${isMine ? "justify-end" : "justify-start"}`}>
                              <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)}</span>
                              {isMine && (msg.isRead
                                ? <CheckCheck size={12} className="text-blue-400" />
                                : <Check size={12} className="text-slate-400" />
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

            {/* Input */}
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
              <div className="flex items-end gap-2 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-3 py-2.5 focus-within:border-red-400 focus-within:ring-2 focus-within:ring-red-500/20 transition-all">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={fileUploading || isSending}
                  className="flex-shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Anexar ficheiro"
                >
                  {fileUploading
                    ? <div className="w-4 h-4 border-2 border-slate-300 border-t-red-500 rounded-full animate-spin" />
                    : <Paperclip size={18} />
                  }
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="*/*" />

                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreve uma mensagem... (Enter para enviar)"
                  rows={1}
                  className="flex-1 bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none resize-none max-h-32 leading-relaxed"
                  style={{ minHeight: "24px" }}
                />

                <button
                  onClick={handleSend}
                  disabled={!text.trim() || isSending}
                  className="flex-shrink-0 w-9 h-9 bg-red-600 text-white rounded-xl flex items-center justify-center hover:bg-red-500 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm shadow-red-200 dark:shadow-none"
                >
                  {isSending
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send size={15} />
                  }
                </button>
              </div>
              <p className="text-[11px] text-slate-400 text-center mt-1.5">
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </div>
        )}

        {/* ── Info Panel ─────────────────────────────────────── */}
        {selectedUserId && showInfo && selectedContact && (
          <div className="hidden lg:flex w-72 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-semibold text-sm text-slate-900 dark:text-white">Informação</span>
              <button onClick={() => setShowInfo(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><X size={16} /></button>
            </div>
            <div className="p-6 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800">
              <UserAvatar name={selectedContact.name ?? selectedContact.openId} id={selectedContact.id} size="lg" />
              <h3 className="mt-3 font-bold text-slate-900 dark:text-white">{selectedContact.name ?? selectedContact.openId}</h3>
              <span className={`mt-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${roleBadgeColor(selectedContact.role ?? "")}`}>
                {roleLabel(selectedContact.role ?? "")}
              </span>
              {selectedContact.email && <p className="mt-2 text-xs text-slate-400">{selectedContact.email}</p>}
              {selectedContact.department && <p className="text-xs text-slate-400">{selectedContact.department}</p>}
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Ficheiros partilhados</p>
              {messages.filter((m: any) => m.fileName).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">Nenhum ficheiro partilhado ainda</p>
              ) : (
                <div className="space-y-2">
                  {messages.filter((m: any) => m.fileName).map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 group">
                      <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
                        {getFileIcon(m.fileType, m.fileName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{m.fileName}</p>
                        <p className="text-[11px] text-slate-400">{m.fileSize} · {formatTime(m.createdAt)}</p>
                      </div>
                      {m.fileUrl && (
                        <a href={m.fileUrl} download={m.fileName} className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-slate-600 transition-all">
                          <Download size={13} />
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
    </DashboardLayout>
  );
}
