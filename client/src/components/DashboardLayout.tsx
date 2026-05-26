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
