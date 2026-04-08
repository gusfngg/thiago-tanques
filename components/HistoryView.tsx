"use client";
import { AppState, CheckEntry } from "@/lib/types";

interface Props {
  state: AppState;
}

function groupByDate(entries: CheckEntry[]) {
  const groups: Record<string, CheckEntry[]> = {};
  for (const e of entries) {
    const date = e.completedAt.split("T")[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(e);
  }
  return Object.entries(groups)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 7); // Last 7 days
}

export default function HistoryView({ state }: Props) {
  const groups = groupByDate(state.entries);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center px-6">
        <div className="text-5xl mb-4">📋</div>
        <p className="text-slate-700 font-bold">Sem histórico ainda</p>
        <p className="text-slate-400 text-sm mt-1">Comece a marcar as tarefas!</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-5">
      {groups.map(([date, entries]) => {
        const dateObj = new Date(date + "T12:00:00");
        const isToday = date === new Date().toISOString().split("T")[0];
        const dateLabel = isToday
          ? "Hoje"
          : dateObj.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "short" });

        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{dateLabel}</span>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400">{entries.length} tarefa{entries.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-2">
              {entries
                .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
                .map((entry) => {
                  const tank = state.tanks.find((t) => t.id === entry.tankId);
                  const task = state.tasks.find((t) => t.id === entry.taskId);
                  const user = state.users.find((u) => u.id === entry.userId);
                  const time = new Date(entry.completedAt).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={entry.id}
                      className="bg-white rounded-xl border border-slate-100 px-3 py-2.5 flex items-start gap-3"
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">{task?.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-sm font-semibold text-slate-700">{task?.label}</span>
                          {entry.value && (
                            <span className="text-xs bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded font-medium">
                              {entry.value}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs">{tank?.emoji}</span>
                          <span className="text-xs text-slate-400">{tank?.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{user?.name}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">{time}</span>
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-slate-400 italic mt-0.5 truncate">📝 {entry.notes}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
