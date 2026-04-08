"use client";
import { useState } from "react";
import { Tank, Task, CheckEntry } from "@/lib/types";
import { isTaskDoneToday } from "@/lib/store";
import TaskRow from "./TaskRow";

interface Props {
  tank: Tank;
  tasks: Task[];
  entries: CheckEntry[];
  onCheck: (taskId: string, value?: string, notes?: string) => void;
  onClearHistory: () => Promise<void>;
}

export default function TankCard({ tank, tasks, entries, onCheck, onClearHistory }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [clearing, setClearing] = useState(false);

  const doneTasks = tasks.filter((t) => isTaskDoneToday(entries, tank.id, t.id));
  const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const allDone = doneTasks.length === tasks.length;

  const handleClearTankHistory = async () => {
    if (
      !confirm(
        `Limpar checklist de hoje apenas do ${tank.name}? O histórico de outros tanques e outros dias será mantido.`
      )
    ) {
      return;
    }

    setClearing(true);
    try {
      await onClearHistory();
    } finally {
      setClearing(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
        allDone ? "border-emerald-200" : "border-slate-200"
      }`}
    >
      {/* Tank header */}
      <button
        className="w-full px-4 py-3.5 flex items-center gap-3 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
            allDone ? "bg-emerald-50" : "bg-slate-50"
          }`}
        >
          {tank.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-800 text-sm">{tank.name}</p>
            {allDone && (
              <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">
                ✓ Completo
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">{tank.species} · {tank.liters}L</p>

          {/* Mini progress bar */}
          <div className="mt-1.5 flex items-center gap-1.5">
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progress}%`,
                  backgroundColor: allDone ? "#059669" : "#0891b2",
                }}
              />
            </div>
            <span className="text-xs text-slate-400">{doneTasks.length}/{tasks.length}</span>
          </div>
        </div>

        <div className={`text-slate-300 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Task list */}
      {expanded && (
        <div className="border-t border-slate-100 divide-y divide-slate-50 fade-in">
          {tasks.map((task) => {
            const entry = isTaskDoneToday(entries, tank.id, task.id);
            return (
              <TaskRow
                key={task.id}
                task={task}
                entry={entry}
                onCheck={(value, notes) => onCheck(task.id, value, notes)}
              />
            );
          })}
          <div className="px-4 py-2.5 bg-slate-50/70">
            <button
              onClick={() => void handleClearTankHistory()}
              disabled={clearing || entries.length === 0}
              className="w-full text-xs font-semibold text-rose-600 py-2 rounded-lg border border-rose-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-50 transition-colors"
            >
              {clearing ? "Limpando..." : "Limpar Checklist de Hoje deste Tanque"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
