import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  switchable: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>("light");

  const updateTheme = trpc.auth.updateTheme.useMutation();

  // Quando o utilizador carrega, aplica o tema guardado na sua conta
  useEffect(() => {
    if (user) {
      setTheme((user as any).darkMode ? "dark" : "light");
    } else {
      // Sem sessão: usa sempre tema claro
      setTheme("light");
    }
  }, [user]);

  // Aplica/remove a classe "dark" no <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (user) {
      updateTheme.mutate({ darkMode: newTheme === "dark" });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable: true }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
