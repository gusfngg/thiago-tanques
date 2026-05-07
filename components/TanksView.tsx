"use client";
import { AppState, CheckEntry, Tank, UserId } from "@/lib/types";
import TankCard from "./TankCard";
import { getTodayEntries } from "@/lib/store";

interface Props {
  state: AppState;
  activeUserId: UserId;
  onCheck: (tankId: string, taskId: string, value?: string, notes?: string) => void;
  onUpdateTank: (tankId: string, patch: Partial<Tank>) => void;
}

export default function TanksView({ state, activeUserId, onCheck, onUpdateTank }: Props) {
  const todayEntries = getTodayEntries(state.entries);

  // Filter entries for current user + tank
  const getEntriesForTank = (tankId: string): CheckEntry[] =>
    todayEntries.filter((e) => e.tankId === tankId);

  // All-done tanks count
  const completedTanks = state.tanks.filter((tank) => {
    const tankEntries = getEntriesForTank(tank.id);
    return state.tasks.every((task) =>
      tankEntries.some((e) => e.taskId === task.id)
    );
  }).length;

  return (
    <div className="px-4 pt-3 pb-24 space-y-3">
      {/* Quick status pill */}
      {completedTanks > 0 && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 fade-in">
          <span className="text-emerald-500">✓</span>
          <p className="text-sm text-emerald-700 font-semibold">
            {completedTanks === state.tanks.length
              ? "Todos os tanques completos hoje! 🎉"
              : `${completedTanks} de ${state.tanks.length} tanques completos`}
          </p>
        </div>
      )}

      {/* Tank cards */}
      {state.tanks.map((tank) => (
        <TankCard
          key={tank.id}
          tank={tank}
          tasks={state.tasks}
          entries={getEntriesForTank(tank.id)}
          activeUserId={activeUserId}
          onCheck={(taskId, value, notes) => onCheck(tank.id, taskId, value, notes)}
          onUpdateTank={(patch) => onUpdateTank(tank.id, patch)}
        />
      ))}

      {/* Tip */}
      <p className="text-center text-xs text-slate-300 pt-2">
        Toque em um tanque para ver e marcar as tarefas
      </p>
    </div>
  );
}
