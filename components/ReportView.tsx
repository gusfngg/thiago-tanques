"use client";
import { useState } from "react";
import { AppState } from "@/lib/types";
import { generateWhatsAppReport, generateWhatsAppURL, getTodayEntries } from "@/lib/store";

interface Props {
  state: AppState;
}

export default function ReportView({ state }: Props) {
  const [copied, setCopied] = useState(false);
  const todayEntries = getTodayEntries(state.entries);
  const report = generateWhatsAppReport(state);
  const whatsappUrl = generateWhatsAppURL(report);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const totalTasks = state.tanks.length * state.tasks.length;
  const completedPercent = totalTasks > 0 ? Math.round((todayEntries.length / totalTasks) * 100) : 0;

  return (
    <div className="px-4 py-4 space-y-4">
      {/* Summary card */}
      <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl p-5 text-white">
        <p className="text-xs font-semibold text-cyan-100 uppercase tracking-wider mb-1">Resumo de Hoje</p>
        <div className="flex items-end gap-2 mb-3">
          <span className="text-4xl font-bold">{todayEntries.length}</span>
          <span className="text-cyan-200 text-sm pb-1">tarefas concluídas</span>
        </div>

        {/* Per user stats */}
        <div className="space-y-1.5 mb-3">
          {state.users.map((user) => {
            const count = todayEntries.filter((e) => e.userId === user.id).length;
            const pct = todayEntries.length > 0 ? (count / todayEntries.length) * 100 : 0;
            return (
              <div key={user.id} className="flex items-center gap-2">
                <span className="text-sm w-5">{user.emoji}</span>
                <span className="text-xs text-cyan-100 w-20 truncate">{user.name}</span>
                <div className="flex-1 h-1.5 bg-cyan-400/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white/70 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-cyan-100 w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-700"
              style={{ width: `${completedPercent}%` }}
            />
          </div>
          <span className="text-xs font-bold text-white">{completedPercent}%</span>
        </div>
      </div>

      {/* Per tank summary */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="font-bold text-slate-700 text-sm">Por Tanque</p>
        </div>
        {state.tanks.map((tank) => {
          const count = todayEntries.filter((e) => e.tankId === tank.id).length;
          const pct = state.tasks.length > 0 ? Math.round((count / state.tasks.length) * 100) : 0;
          return (
            <div key={tank.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
              <span className="text-lg w-7 text-center">{tank.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{tank.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: pct === 100 ? "#059669" : "#0891b2",
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400">{count}/{state.tasks.length}</span>
                </div>
              </div>
              {pct === 100 && <span className="text-emerald-500 text-sm">✓</span>}
            </div>
          );
        })}
      </div>

      {/* Preview */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
          <p className="font-bold text-slate-700 text-sm">📋 Pré-visualização</p>
          <span className="text-xs text-slate-400">Relatório do WhatsApp</span>
        </div>
        <div className="px-4 py-3">
          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-sans leading-relaxed max-h-48 overflow-y-auto">
            {report}
          </pre>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 pb-4">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2.5 py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl transition-colors text-base shadow-lg shadow-green-200"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Enviar no WhatsApp
        </a>

        <button
          onClick={handleCopy}
          className={`w-full flex items-center justify-center gap-2 py-3.5 font-bold rounded-2xl border-2 transition-all text-sm ${
            copied
              ? "border-emerald-300 bg-emerald-50 text-emerald-600"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          {copied ? (
            <>✓ Copiado!</>
          ) : (
            <>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copiar Relatório
            </>
          )}
        </button>
      </div>
    </div>
  );
}
