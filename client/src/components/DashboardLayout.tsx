import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, FileText, BarChart3, Settings, HelpCircle, Calendar, CheckSquare, Shield, GraduationCap, Activity, AlertTriangle, MessageCircle, Bot, Bell, User as UserIcon } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import GlobalSearch from "./GlobalSearch";
import { AIChatFloating } from "./AIChatFloating";
import { OnboardingTour } from "./OnboardingTour";

// ── Modal de confirmação de logout ──────────────────────────────────────────
function LogoutConfirmModal({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
            <LogOut className="w-7 h-7 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Terminar sessão
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tem a certeza que deseja terminar a sessão?
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={onLogout}
            >
              Sim, terminar sessão
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

type MenuRole = "estagiario" | "tutor" | "admin";

const menuItems: { icon: any; label: string; path: string; roles: MenuRole[]; tourId: string }[] = [
  { icon: LayoutDashboard, label: "Dashboard",    path: "/dashboard",   roles: ["estagiario", "tutor", "admin"], tourId: "nav-dashboard" },
  { icon: Users,           label: "Utilizadores", path: "/users",       roles: ["tutor", "admin"],               tourId: "nav-users" },
  { icon: FileText,        label: "Planos",       path: "/plans",       roles: ["estagiario", "tutor", "admin"], tourId: "nav-plans" },
  { icon: Calendar,        label: "Calendário",   path: "/calendar",    roles: ["estagiario", "tutor", "admin"], tourId: "nav-calendar" },
  { icon: CheckSquare,     label: "Tarefas",      path: "/tasks",       roles: ["estagiario", "tutor", "admin"], tourId: "nav-tasks" },
  { icon: BarChart3,       label: "Relatórios",   path: "/reports",     roles: ["tutor", "admin"],               tourId: "nav-reports" },
  { icon: Users,           label: "Equipa",       path: "/equipa",      roles: ["tutor", "admin"],               tourId: "nav-equipa" },
  { icon: Activity,        label: "Atividade",    path: "/activity-log",roles: ["tutor", "admin"],               tourId: "nav-activity-log" },
  { icon: MessageCircle,   label: "Mensagens",    path: "/mensagens",   roles: ["estagiario", "tutor", "admin"], tourId: "nav-mensagens" },
];

const footerItems: { icon: any; label: string; path: string; tourId: string }[] = [
  { icon: Settings,    label: "Definições", path: "/settings",  tourId: "nav-settings" },
  { icon: Bot,         label: "Norte",      path: "/ai-assist", tourId: "nav-ai-assist" },
  { icon: HelpCircle,  label: "Ajuda",      path: "/help",      tourId: "nav-help" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <h1 className="text-2xl font-semibold tracking-tight text-center">
              Sign in to continue
            </h1>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Access to this dashboard requires authentication. Continue to launch the login flow.
            </p>
          </div>
          <Button
            onClick={() => { window.location.href = getLoginUrl(); }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>

      {/* Tour de boas-vindas — aparece automaticamente na 1.ª visita de cada utilizador */}
      <OnboardingTour role={user.role as "estagiario" | "tutor" | "admin"} userId={user.id} />
    </SidebarProvider>
  );
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: unreadCount } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 10_000 });
  const { data: notifications } = trpc.notifications.list.useQuery({ limit: 10 }, { refetchInterval: 10_000 });
  const markAllRead = trpc.notifications.markAllAsRead.useMutation();
  const markRead = trpc.notifications.markAsRead.useMutation();
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-accent/50 transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <Bell size={18} className={`text-muted-foreground transition-all duration-300 ${(unreadCount ?? 0) > 0 ? "animate-float-rotate" : ""}`} />
        {(unreadCount ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce-in shadow-md shadow-red-300/40">
            {unreadCount! > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-popover border border-border rounded-xl shadow-xl z-50 animate-in fade-in-0 slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-sm font-bold text-foreground">Notificações</p>
            {(unreadCount ?? 0) > 0 && (
              <button
                onClick={() => { markAllRead.mutateAsync().then(() => setOpen(false)); }}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              notifications.map((n: any) => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b border-border/50 cursor-pointer hover:bg-accent/30 transition-colors ${!n.isRead ? "bg-accent/10" : ""}`}
                  onClick={() => {
                    if (!n.isRead) markRead.mutate({ id: n.id });
                    if (n.link) setLocation(n.link);
                    setOpen(false);
                  }}
                >
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <Bell size={24} className="mx-auto mb-2 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground">Sem notificações</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [presence, setPresence] = useState<"online" | "ausente" | "offline">(() => (user as any)?.presence ?? "online");
  const updatePresenceMutation = trpc.auth.updatePresence.useMutation();

  const handlePresenceChange = async (val: "online" | "ausente" | "offline") => {
    setPresence(val);
    await updatePresenceMutation.mutateAsync({ presence: val });
  };

  const PRESENCE_CONFIG = {
    online:  { label: "Online",  dot: "bg-green-500" },
    ausente: { label: "Ausente", dot: "bg-yellow-400" },
    offline: { label: "Offline", dot: "bg-slate-400" },
  };
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const userRole = (user?.role ?? "estagiario") as MenuRole;
  const visibleMenuItems = menuItems.filter(item => item.roles.includes(userRole));
  const allMenuItems = [...visibleMenuItems, ...footerItems];
  const activeMenuItem = allMenuItems.find(item => item.path === location);
  const isMobile = useIsMobile();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Aviso ao fechar/recarregar o separador com sessão ativa
  useEffect(() => {
    if (!user) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      setShowLogoutReminder(true);
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [user]);

  useEffect(() => {
    if (isCollapsed) setIsResizing(false);
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      {showLogoutConfirm && (
        <LogoutConfirmModal
          onClose={() => setShowLogoutConfirm(false)}
          onLogout={() => { setShowLogoutConfirm(false); logout(); }}
        />
      )}
      <div className="relative" ref={sidebarRef}>
        <Sidebar collapsible="icon" className="border-r-0" disableTransition={isResizing}>
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              {!isCollapsed ? (
                <>
                  <button
                    onClick={toggleSidebar}
                    className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                    aria-label="Toggle navigation"
                  >
                    <PanelLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                    <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 animate-float-rotate" style={{ borderRadius: "0.5rem" }}>
                      <img src="/socem-logo.png" alt="SOCEM" className="w-full h-full object-contain" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold tracking-tight text-foreground text-sm leading-tight block truncate">
                        Portal de Estagiários
                      </span>
                      <span className="text-xs text-muted-foreground leading-tight block">
                        SOCEM
                      </span>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {isCollapsed && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={toggleSidebar}
                    tooltip="Expandir menu"
                    className="h-10 transition-all font-normal text-muted-foreground hover:text-foreground"
                  >
                    <PanelLeft className="h-4 w-4" />
                    <span>Expandir</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {visibleMenuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-10 transition-all duration-300 font-normal relative ${isActive ? "bg-primary/10 text-primary font-semibold shadow-sm" : "hover:bg-accent/60"}`}
                      data-tour={item.tourId}
                    >
                      <item.icon className={`h-4 w-4 transition-all duration-300 ${isActive ? "text-primary scale-110" : "group-hover:scale-105"}`} />
                      <span>{item.label}</span>
                      {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full animate-in" />}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
            <div className="mt-4 pt-4 border-t">
              <SidebarMenu className="px-2 py-1">
                {footerItems.map(item => {
                  const isActive = location === item.path;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => setLocation(item.path)}
                        tooltip={item.label}
                        className={`h-10 transition-all duration-300 font-normal relative ${isActive ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-accent/60"}`}
                        data-tour={item.tourId}
                      >
                        <item.icon className={`h-4 w-4 transition-all duration-300 ${isActive ? "text-primary scale-110" : ""}`} />
                        <span>{item.label}</span>
                        {isActive && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full animate-in" />}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </div>
          </SidebarContent>

          <SidebarFooter className="p-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <div className="relative shrink-0">
                    <Avatar className="h-9 w-9 border">
                      {user?.avatar && <AvatarImage src={user.avatar} alt={user.name ?? ""} className="object-cover" />}
                      <AvatarFallback className="text-xs font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${PRESENCE_CONFIG[presence].dot}`} />
                  </div>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-medium truncate leading-none">{user?.name || "-"}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {{ admin: "Administrador", tutor: "Tutor", estagiario: "Estagiário", user: "Utilizador" }[user?.role ?? ""] ?? user?.role ?? "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                sideOffset={10}
                alignOffset={-4}
                className="w-52 rounded-xl shadow-lg border border-border/60 p-1 animate-in fade-in-0 slide-in-from-bottom-2 duration-150"
              >
                <div className="px-3 py-2 mb-1 border-b border-border/50">
                  <p className="text-sm font-medium truncate">{user?.name || "–"}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {{ admin: "Administrador", tutor: "Tutor", estagiario: "Estagiário", user: "Utilizador" }[user?.role ?? ""] ?? user?.role ?? "–"}
                  </p>
                </div>
                <div className="px-2 py-1.5 mb-1">
                  <p className="text-xs text-muted-foreground mb-1.5 font-medium">Estado</p>
                  <div className="flex flex-col gap-0.5">
                    {(["online", "ausente", "offline"] as const).map(val => (
                      <button
                        key={val}
                        onClick={() => handlePresenceChange(val)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors w-full text-left ${presence === val ? "bg-accent font-medium" : "hover:bg-accent/50"}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${PRESENCE_CONFIG[val].dot}`} />
                        {PRESENCE_CONFIG[val].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border/50 my-1" />
                <DropdownMenuItem
                  onClick={() => setLocation("/profile")}
                  className="cursor-pointer rounded-lg gap-2"
                >
                  <UserIcon className="h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setShowLogoutConfirm(true)}
                  className="cursor-pointer text-destructive focus:text-destructive rounded-lg gap-2 mt-0.5"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Terminar sessão</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }}
          style={{ zIndex: 50 }}
        />
      </div>

      <AIChatFloating />
      <SidebarInset className="overflow-hidden min-h-0">
        {/* Top bar — visible on all screen sizes */}
        <div className="flex border-b h-14 items-center bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40 gap-3">
          {isMobile && (
            <div className="flex items-center gap-2 shrink-0">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <span className="tracking-tight text-foreground text-sm font-medium">
                {activeMenuItem?.label ?? "Menu"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0 flex justify-center">
            <GlobalSearch />
          </div>
          <NotificationBell />
        </div>
        <main className="flex-1 p-4 flex flex-col overflow-hidden min-h-0">
          <div key={location} className="flex-1 flex flex-col animate-scale-in">
            {children}
          </div>
        </main>
      </SidebarInset>
    </>
  );
}
