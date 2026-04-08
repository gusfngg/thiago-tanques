"use client";
import { useState } from "react";
import { Task, CheckEntry } from "@/lib/types";

interface Props {
  task: Task;
  entry: CheckEntry | undefined;
  onCheck: (value?: string, notes?: string) => void;
}

const VALUE_TASKS = ["temperature_check", "water_test"];

export default function TaskRow({ task, entry, onCheck }: Props) {
  const [showInput, setShowInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [notes, setNotes] = useState("");
  const [animating, setAnimating] = useState(false);

  const isDone = !!entry;
  const needsValue = VALUE_TASKS.includes(task.id);

  const handleTap = () => {
    if (isDone) return;
    if (needsValue && !showInput) {
      setShowInput(true);
      return;
    }
    triggerCheck();
  };

  const triggerCheck = (val?: string, n?: string) => {
    setAnimating(true);
    setShowInput(false);
    setTimeout(() => setAnimating(false), 300);
    onCheck(val || inputVal || undefined, n || notes || undefined);
    setInputVal("");
    setNotes("");
  };

  const time = entry
    ? new Date(entry.completedAt).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className={`px-4 py-3 ${isDone ? "opacity-75" : ""}`}>
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={handleTap}
          disabled={isDone}
          className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            animating ? "check-pop" : ""
          } ${
            isDone
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-slate-200 hover:border-cyan-400 bg-white"
          }`}
        >
          {isDone && (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </button>

        {/* Task info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{task.emoji}</span>
            <span
              className={`text-sm font-semibold ${
                isDone ? "line-through text-slate-400" : "text-slate-700"
              }`}
            >
              {task.label}
            </span>
          </div>

          {isDone && entry && (
            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              {entry.value && (
                <span className="text-xs bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded-md font-medium">
                  {entry.value}
                </span>
              )}
              <span className="text-xs text-slate-400">
                {time}
              </span>
              {entry.notes && (
                <span className="text-xs text-slate-400 italic truncate">· {entry.notes}</span>
              )}
            </div>
          )}
        </div>

        {/* Frequency badge */}
        {!isDone && (
          <span className={`text-xs px-1.5 py-0.5 rounded-md flex-shrink-0 ${
            task.frequency === "daily"
              ? "bg-cyan-50 text-cyan-600"
              : task.frequency === "weekly"
              ? "bg-amber-50 text-amber-600"
              : "bg-rose-50 text-rose-600"
          }`}>
            {task.frequency === "daily" ? "Diária" : task.frequency === "weekly" ? "Semanal" : "Quando necessário"}
          </span>
        )}
      </div>

      {/* Value input */}
      {showInput && !isDone && (
        <div className="mt-3 pl-10 fade-in">
          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">
                {task.id === "temperature_check" ? "Temperatura (°C)" : "Valor (pH)"}
              </label>
              <input
                type="number"
                step="0.1"
                placeholder={task.id === "temperature_check" ? "ex: 26.5" : "ex: 7.2"}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 mb-1 block">Observação (opcional)</label>
              <input
                type="text"
                placeholder="Adicionar nota..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => triggerCheck()}
                className="flex-1 py-2 text-sm font-bold bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
              >
                Confirmar ✓
              </button>
              <button
                onClick={() => setShowInput(false)}
                className="px-3 py-2 text-sm text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
