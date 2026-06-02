/**
 * OnboardingTour.tsx
 * Tour guiado para novos utilizadores do Portal SOCEM.
 *
 * INTEGRAÇÃO (ver INTEGRACAO.md):
 *   1. Copiar este ficheiro para: client/src/components/OnboardingTour.tsx
 *   2. Importar e usar em DashboardLayout.tsx
 *
 * Funcionalidades:
 *   - Aparece automaticamente na 1.ª visita (localStorage)
 *   - Passos diferentes por role: estagiario / tutor / admin
 *   - Highlight de elementos reais da UI com spotlight
 *   - Tooltip posicionado automaticamente (top/bottom/left/right)
 *   - Pode ser relançado a qualquer momento via prop `forceShow`
 *   - Animações suaves, acessível (ESC para fechar, teclas de seta)
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, GraduationCap, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Role = "estagiario" | "tutor" | "admin";

interface TourStep {
  /** Seletor CSS do elemento a destacar. null = modal centrado (sem spotlight). */
  target: string | null;
  title: string;
  description: string;
  /** Posição preferida do tooltip relativamente ao elemento destacado */
  placement?: "top" | "bottom" | "left" | "right" | "center";
  /** Roles que veem este passo. Omitir = todos os roles. */
  roles?: Role[];
  /** Ícone opcional ao lado do título */
  icon?: React.ReactNode;
}

interface OnboardingTourProps {
  /** Role do utilizador atual */
  role: Role;
  /** ID único do utilizador — garante que o tour aparece a cada utilizador distinto */
  userId: number | string;
  /** Se true, mostra o tour independentemente do localStorage */
  forceShow?: boolean;
  /** Callback quando o tour termina ou é ignorado */
  onComplete?: () => void;
}

// ─── Definição dos passos ─────────────────────────────────────────────────────

const TOUR_STEPS: TourStep[] = [
  // Boas-vindas — todos os roles
  {
    target: null,
    placement: "center",
    title: "Bem-vindo ao Portal SOCEM! 👋",
    description:
      "Este é o teu espaço de onboarding. Vamos fazer uma visita guiada rápida para teres tudo o que precisas à mão desde o primeiro dia.",
    icon: <Sparkles className="w-5 h-5 text-blue-500" />,
  },

  // Dashboard
  {
    target: "[data-tour='nav-dashboard']",
    placement: "right",
    title: "Dashboard",
    description:
      "A tua página inicial. Aqui vês um resumo das tuas tarefas pendentes, progresso nos planos e alertas importantes.",
    roles: ["estagiario", "tutor", "admin"],
  },

  // Planos (estagiário)
  {
    target: "[data-tour='nav-plans']",
    placement: "right",
    title: "O teu plano de integração",
    description:
      "Aqui encontras o teu plano de onboarding com todas as tarefas e etapas que tens de concluir. Podes ver o teu progresso em tempo real.",
    roles: ["estagiario"],
  },

  // Planos (tutor/admin)
  {
    target: "[data-tour='nav-plans']",
    placement: "right",
    title: "Planos de integração",
    description:
      "Cria e gere planos de onboarding. Adiciona tarefas, define prazos e acompanha o progresso dos estagiários atribuídos.",
    roles: ["tutor", "admin"],
  },

  // Tarefas
  {
    target: "[data-tour='nav-tasks']",
    placement: "right",
    title: "Tarefas",
    description:
      "Vista kanban e lista de todas as tarefas. Actualiza o estado, adiciona notas e marca tarefas como concluídas diretamente aqui.",
    roles: ["estagiario", "tutor", "admin"],
  },

  // Utilizadores (tutor/admin)
  {
    target: "[data-tour='nav-users']",
    placement: "right",
    title: "Gestão de utilizadores",
    description:
      "Cria contas para novos estagiários, edita informações e desativa contas quando necessário.",
    roles: ["tutor", "admin"],
  },

  // Calendário
  {
    target: "[data-tour='nav-calendar']",
    placement: "right",
    title: "Calendário",
    description:
      "Visualiza todos os prazos e datas importantes num único sítio. Os planos e tarefas com datas aparecem automaticamente.",
    roles: ["estagiario", "tutor", "admin"],
  },

  // Mensagens
  {
    target: "[data-tour='nav-mensagens']",
    placement: "right",
    title: "Mensagens",
    description:
      "Comunica diretamente com o teu tutor ou com os teus estagiários. Partilha ficheiros e mantém o contexto das conversas.",
    roles: ["estagiario", "tutor", "admin"],
  },

  // Relatórios (tutor/admin)
  {
    target: "[data-tour='nav-reports']",
    placement: "right",
    title: "Relatórios",
    description:
      "Analisa métricas de conclusão, tempo médio de onboarding e desempenho por departamento. Exporta dados para PDF ou Excel.",
    roles: ["tutor", "admin"],
  },

  // Perfil / definições
  {
    target: "[data-tour='nav-settings']",
    placement: "top",
    title: "Definições",
    description:
      "Personaliza o tema (claro/escuro), notificações e dados do perfil. Podes também alterar a tua password aqui.",
    roles: ["estagiario", "tutor", "admin"],
  },

  // Conclusão — todos
  {
    target: null,
    placement: "center",
    title: "Estás pronto! 🎉",
    description:
      "Já conheces o essencial. Podes rever este tour a qualquer momento em Ajuda → Rever tour. Bom trabalho!",
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
    roles: ["estagiario", "tutor", "admin"],
  },
];


// ─── Hook auxiliar para relançar o tour ──────────────────────────────────────

interface Rect { top: number; left: number; width: number; height: number }
interface TooltipPos { top: number; left: number; arrowSide: "top" | "bottom" | "left" | "right" | null }

function calcTooltipPos(
  targetRect: Rect,
  tooltipW: number,
  tooltipH: number,
  placement: TourStep["placement"],
  vpW: number,
  vpH: number
): TooltipPos {
  const GAP = 16;

  if (placement === "center" || !placement) {
    return {
      top: vpH / 2 - tooltipH / 2,
      left: vpW / 2 - tooltipW / 2,
      arrowSide: null,
    };
  }

  const positions: Record<string, TooltipPos> = {
    right: {
      top: Math.max(8, Math.min(targetRect.top + targetRect.height / 2 - tooltipH / 2, vpH - tooltipH - 8)),
      left: Math.min(targetRect.left + targetRect.width + GAP, vpW - tooltipW - 8),
      arrowSide: "left",
    },
    left: {
      top: Math.max(8, Math.min(targetRect.top + targetRect.height / 2 - tooltipH / 2, vpH - tooltipH - 8)),
      left: Math.max(8, targetRect.left - tooltipW - GAP),
      arrowSide: "right",
    },
    bottom: {
      top: Math.min(targetRect.top + targetRect.height + GAP, vpH - tooltipH - 8),
      left: Math.max(8, Math.min(targetRect.left + targetRect.width / 2 - tooltipW / 2, vpW - tooltipW - 8)),
      arrowSide: "top",
    },
    top: {
      top: Math.max(8, targetRect.top - tooltipH - GAP),
      left: Math.max(8, Math.min(targetRect.left + targetRect.width / 2 - tooltipW / 2, vpW - tooltipW - 8)),
      arrowSide: "bottom",
    },
  };

  return positions[placement] ?? positions.bottom;
}

// ─── Componente principal ────────────────────────────────────────────────────

export function OnboardingTour({ role, userId, forceShow = false, onComplete }: OnboardingTourProps) {
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<Rect | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0, arrowSide: null });
  const [animating, setAnimating] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Chave única por utilizador — garante que cada pessoa vê o tour na sua 1.ª visita
  const storageKey = `socem-onboarding-done-${userId}`;

  // Filtrar passos para o role atual
  const steps = TOUR_STEPS.filter((s) => !s.roles || s.roles.includes(role));

  const currentStep = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  // Mostrar tour na 1.ª visita
  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    const done = localStorage.getItem(storageKey);
    if (!done) setVisible(true);
  }, [forceShow, storageKey]);

  // Actualizar spotlight quando muda o passo
  useEffect(() => {
    if (!visible || !currentStep) return;

    const update = () => {
      if (!currentStep.target) {
        setSpotlightRect(null);
        setTooltipPos(calcTooltipPos(
          { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight },
          360, 220,
          "center",
          window.innerWidth,
          window.innerHeight,
        ));
        return;
      }

      const el = document.querySelector(currentStep.target);
      if (!el) {
        setSpotlightRect(null);
        return;
      }

      const r = el.getBoundingClientRect();
      const PAD = 8;
      const rect: Rect = {
        top: r.top - PAD,
        left: r.left - PAD,
        width: r.width + PAD * 2,
        height: r.height + PAD * 2,
      };
      setSpotlightRect(rect);

      const tw = tooltipRef.current?.offsetWidth || 320;
      const th = tooltipRef.current?.offsetHeight || 180;
      setTooltipPos(
        calcTooltipPos(rect, tw, th, currentStep.placement, window.innerWidth, window.innerHeight)
      );
    };

    // Pequeno delay para garantir que o DOM está pronto
    const t = setTimeout(update, 60);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
    };
  }, [visible, stepIndex, currentStep]);

  const finish = useCallback(() => {
    localStorage.setItem(storageKey, "true");
    setVisible(false);
    onComplete?.();
  }, [onComplete, storageKey]);

  const goTo = useCallback((idx: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setStepIndex(idx);
      setAnimating(false);
    }, 150);
  }, [animating]);

  const next = () => isLast ? finish() : goTo(stepIndex + 1);
  const prev = () => !isFirst && goTo(stepIndex - 1);

  // Teclado
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [visible, stepIndex, animating]);

  if (!visible || !currentStep) return null;

  const SPOTLIGHT_RADIUS = 12;

  return (
    <div
      className="fixed inset-0 z-[9998]"
      role="dialog"
      aria-modal="true"
      aria-label="Tour de boas-vindas"
    >
      {/* ── Overlay com buraco (spotlight) ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ transition: "all 0.3s ease" }}
      >
        <defs>
          <mask id="spotlight-mask">
            {/* Fundo branco = visível (escurecido) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Buraco negro = transparente (spotlight) */}
            {spotlightRect && (
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx={SPOTLIGHT_RADIUS}
                fill="black"
                style={{ transition: "all 0.3s ease" }}
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.6)"
          mask="url(#spotlight-mask)"
          style={{ backdropFilter: "blur(2px)" }}
        />
      </svg>

      {/* Bordo de destaque no elemento */}
      {spotlightRect && (
        <div
          className="absolute pointer-events-none rounded-xl ring-2 ring-blue-400 ring-offset-0"
          style={{
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            borderRadius: SPOTLIGHT_RADIUS,
            boxShadow: "0 0 0 3px rgba(59,130,246,0.35), 0 0 24px rgba(59,130,246,0.2)",
            transition: "all 0.3s ease",
          }}
        />
      )}

      {/* ── Tooltip ── */}
      <div
        ref={tooltipRef}
        className="absolute z-[9999] w-80 pointer-events-auto"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          transition: "top 0.3s ease, left 0.3s ease",
          opacity: animating ? 0 : 1,
          transform: animating ? "scale(0.96)" : "scale(1)",
          transitionProperty: "top, left, opacity, transform",
        }}
      >
        {/* Seta do tooltip */}
        {tooltipPos.arrowSide === "left" && (
          <div className="absolute left-[-7px] top-1/2 -translate-y-1/2 w-0 h-0
            border-t-[7px] border-t-transparent
            border-b-[7px] border-b-transparent
            border-r-[8px] border-r-white dark:border-r-slate-900" />
        )}
        {tooltipPos.arrowSide === "right" && (
          <div className="absolute right-[-7px] top-1/2 -translate-y-1/2 w-0 h-0
            border-t-[7px] border-t-transparent
            border-b-[7px] border-b-transparent
            border-l-[8px] border-l-white dark:border-l-slate-900" />
        )}
        {tooltipPos.arrowSide === "top" && (
          <div className="absolute top-[-7px] left-1/2 -translate-x-1/2 w-0 h-0
            border-l-[7px] border-l-transparent
            border-r-[7px] border-r-transparent
            border-b-[8px] border-b-white dark:border-b-slate-900" />
        )}
        {tooltipPos.arrowSide === "bottom" && (
          <div className="absolute bottom-[-7px] left-1/2 -translate-x-1/2 w-0 h-0
            border-l-[7px] border-l-transparent
            border-r-[7px] border-r-transparent
            border-t-[8px] border-t-white dark:border-t-slate-900" />
        )}

        {/* Card do tooltip */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header com progresso */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-1.5">
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === stepIndex
                      ? "w-5 h-2 bg-blue-500"
                      : i < stepIndex
                      ? "w-2 h-2 bg-blue-300 dark:bg-blue-700"
                      : "w-2 h-2 bg-slate-200 dark:bg-slate-700"
                  }`}
                  aria-label={`Ir para passo ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={finish}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Fechar tour"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Corpo */}
          <div className="px-4 pb-2">
            <div className="flex items-start gap-2 mb-2">
              {currentStep.icon && (
                <span className="mt-0.5 shrink-0">{currentStep.icon}</span>
              )}
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                {currentStep.title}
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              {currentStep.description}
            </p>
          </div>

          {/* Rodapé */}
          <div className="flex items-center justify-between px-4 py-3 mt-1 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 tabular-nums">
              {stepIndex + 1} / {steps.length}
            </span>
            <div className="flex gap-2">
              {!isFirst && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={prev}
                  className="h-7 px-2.5 text-xs gap-1"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Anterior
                </Button>
              )}
              <Button
                size="sm"
                onClick={next}
                className="h-7 px-3 text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLast ? (
                  <>
                    <GraduationCap className="w-3 h-3" />
                    Começar
                  </>
                ) : (
                  <>
                    Seguinte
                    <ChevronRight className="w-3 h-3" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Hook auxiliar para relançar o tour ──────────────────────────────────────

/**
 * Usa este hook em qualquer página para oferecer o botão "Rever tour".
 *
 * Exemplo:
 *   const { restartTour } = useOnboardingTour(user.id);
 *   <Button onClick={restartTour}>Rever tour guiado</Button>
 */
export function useOnboardingTour(userId: number | string) {
  const restartTour = useCallback(() => {
    localStorage.removeItem(`socem-onboarding-done-${userId}`);
    window.location.reload();
  }, [userId]);

  return { restartTour };
}
