import { useAuth } from "@/_core/hooks/useAuth";
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
import { LayoutDashboard, LogOut, PanelLeft, Users, FileText, BarChart3, Settings, HelpCircle, Calendar, CheckSquare, Shield, GraduationCap, Activity, AlertTriangle, MessageCircle } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

// ── Modal de lembrete de logout ──────────────────────────────────────────────
function LogoutReminderModal({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 animate-in fade-in-0 zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-amber-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Não se esqueça de terminar sessão!
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
              Ainda tem sessão iniciada. Recomendamos que termine a sessão antes de sair para proteger a sua conta.
            </p>
          </div>
          <div className="flex gap-2 w-full mt-1">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Sair mesmo assim
            </Button>
            <Button
              className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
              Terminar sessão
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

type MenuRole = "estagiario" | "tutor" | "admin";

const menuItems: { icon: any; label: string; path: string; roles: MenuRole[] }[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", roles: ["estagiario", "tutor", "admin"] },
  { icon: Users, label: "Utilizadores", path: "/users", roles: ["tutor", "admin"] },
  { icon: FileText, label: "Planos", path: "/plans", roles: ["estagiario", "tutor", "admin"] },
  { icon: Calendar, label: "Calendário", path: "/calendar", roles: ["estagiario", "tutor", "admin"] },
  { icon: CheckSquare, label: "Tarefas", path: "/tasks", roles: ["estagiario", "tutor", "admin"] },
  { icon: BarChart3, label: "Relatórios", path: "/reports", roles: ["tutor", "admin"] },
  { icon: Activity, label: "Atividade", path: "/activity-log", roles: ["tutor", "admin"] },
  { icon: MessageCircle, label: "Mensagens", path: "/mensagens", roles: ["estagiario", "tutor", "admin"] },
];

const footerItems = [
  { icon: Settings, label: "Definições", path: "/settings" },
  { icon: HelpCircle, label: "Ajuda", path: "/help" },
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
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({ children, setSidebarWidth }: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
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
  const [showLogoutReminder, setShowLogoutReminder] = useState(false);

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
      {showLogoutReminder && (
        <LogoutReminderModal
          onClose={() => setShowLogoutReminder(false)}
          onLogout={() => { setShowLogoutReminder(false); logout(); }}
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
                    <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0">
                      <img src="data:image/png;base64,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" alt="SOCEM" className="w-full h-full object-contain" />
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
                      className="h-10 transition-all font-normal"
                    >
                      <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                      <span>{item.label}</span>
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
                        className="h-10 transition-all font-normal text-muted-foreground hover:text-foreground"
                      >
                        <item.icon className={`h-4 w-4 ${isActive ? "text-primary" : ""}`} />
                        <span>{item.label}</span>
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
                  <Avatar className="h-9 w-9 border shrink-0">
                    {user?.avatar && <AvatarImage src={user.avatar} alt={user.name ?? ""} className="object-cover" />}
                    <AvatarFallback className="text-xs font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
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
                <DropdownMenuItem
                  onClick={logout}
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

      <SidebarInset className="overflow-hidden min-h-0">
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4 flex flex-col overflow-hidden min-h-0">{children}</main>
      </SidebarInset>
    </>
  );
}
