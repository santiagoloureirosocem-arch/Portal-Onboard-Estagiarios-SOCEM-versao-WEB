import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Plans from "./pages/Plans";
import PlanDetail from "./pages/PlanDetail";
import AssignPlan from "./pages/AssignPlan";
import Profile from "./pages/Profile";
import Help from "./pages/Help";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import Tasks from "./pages/Tasks";
import ActivityLog from "./pages/ActivityLog";

function useSessionWarning(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers show their own message; this string is a fallback
      e.returnValue = "Não se esqueça de terminar sessão antes de sair!";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}

function ProtectedRoute({ component: Component, minRole }: { component: any; minRole?: "tutor" | "admin" }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useSessionWarning(!!user);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  if (minRole === "admin" && user.role !== "admin") return <NotFound />;
  if (minRole === "tutor" && user.role !== "admin" && user.role !== "tutor") return <NotFound />;

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/login"} component={Login} />
      <Route path={"/dashboard"} component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path={"/users"} component={() => <ProtectedRoute component={Users} minRole="tutor" />} />
      <Route path={"/plans"} component={() => <ProtectedRoute component={Plans} />} />
      <Route path={"/plans/:id"} component={() => <ProtectedRoute component={PlanDetail} />} />
      <Route path={"/assign-plan"} component={() => <ProtectedRoute component={AssignPlan} minRole="tutor" />} />
      <Route path={"/profile"} component={() => <ProtectedRoute component={Profile} />} />
      <Route path={"/help"} component={() => <ProtectedRoute component={Help} />} />
      <Route path={"/reports"} component={() => <ProtectedRoute component={Reports} minRole="tutor" />} />
      <Route path={"/settings"} component={() => <ProtectedRoute component={Settings} />} />
      <Route path={"/calendar"} component={() => <ProtectedRoute component={Calendar} />} />
      <Route path={"/tasks"} component={() => <ProtectedRoute component={Tasks} />} />
      <Route path={"/activity-log"} component={() => <ProtectedRoute component={ActivityLog} minRole="tutor" />} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
