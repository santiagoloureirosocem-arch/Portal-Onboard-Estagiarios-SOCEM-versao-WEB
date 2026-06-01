import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Megaphone } from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function BroadcastPopup() {
  const { data: broadcasts, refetch } = trpc.notifications.unreadBroadcasts.useQuery();
  const markAsRead = trpc.notifications.markAsRead.useMutation();
  const [visible, setVisible] = useState<number | null>(null);

  useEffect(() => {
    if (broadcasts && broadcasts.length > 0 && visible === null) {
      setVisible(0);
    }
  }, [broadcasts, visible]);

  if (!broadcasts || broadcasts.length === 0 || visible === null || !broadcasts[visible]) {
    return null;
  }

  const current = broadcasts[visible];
  const isLast = visible >= broadcasts.length - 1;
  const hasMultiple = broadcasts.length > 1;

  const dismiss = async () => {
    await markAsRead.mutateAsync({ id: current.id });
    const next = visible + 1;
    if (next < broadcasts.length) {
      setVisible(next);
    } else {
      setVisible(null);
      refetch();
    }
  };

  const dismissAll = async () => {
    for (const b of broadcasts.slice(visible)) {
      await markAsRead.mutateAsync({ id: b.id });
    }
    setVisible(null);
    refetch();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
        <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Megaphone size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-semibold text-sm truncate">{current.title}</h2>
            <p className="text-red-100 text-xs">
              {format(new Date(current.createdAt), "d 'de' MMMM 'às' HH:mm", { locale: pt })}
              {hasMultiple && ` — ${visible + 1}/${broadcasts.length}`}
            </p>
          </div>
          <button onClick={dismissAll} className="text-white/70 hover:text-white transition-colors" title="Fechar todos">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{current.message}</p>
        </div>

        <div className="px-5 pb-4 flex gap-2">
          {hasMultiple && (
            <button
              onClick={dismissAll}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              Fechar todas
            </button>
          )}
          <button
            onClick={dismiss}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm hover:bg-red-500 transition-colors font-medium"
          >
            {isLast ? "Entendido" : "Próximo"}
          </button>
        </div>
      </div>
    </div>
  );
}
