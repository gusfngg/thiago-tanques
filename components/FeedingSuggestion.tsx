"use client";
import { useMemo, useState } from "react";
import { Tank, CheckEntry } from "@/lib/types";
import { calcFeeding, formatGrams } from "@/lib/feeding";

interface Props {
  tank: Tank;
  entries: CheckEntry[];
  onUpdateTank: (patch: Partial<Tank>) => void;
  /** Mesma assinatura do onCheck do TankCard — usado para gravar a temperatura
   *  como entry do checklist quando o usuário preenche aqui. */
  onCheck: (taskId: string, value?: string, notes?: string) => void;
}

/** Lê a temperatura mais recente registrada hoje para este tanque. */
function getTodaysTempC(entries: CheckEntry[]): number | null {
  const today = new Date().toISOString().split("T")[0];
  const tempEntries = entries
    .filter((e) => e.taskId === "temperature_check" && e.completedAt.startsWith(today) && e.value)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  if (tempEntries.length === 0) return null;
  const parsed = parseFloat(tempEntries[0].value!.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

const STATUS_STYLE: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  ideal: { bg: "bg-emerald-50",   border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  cool:  { bg: "bg-amber-50",     border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500" },
  warm:  { bg: "bg-amber-50",     border: "border-amber-200",   text: "text-amber-700",   dot: "bg-amber-500" },
  cold:  { bg: "bg-sky-50",       border: "border-sky-200",     text: "text-sky-700",     dot: "bg-sky-500" },
  hot:   { bg: "bg-rose-50",      border: "border-rose-200",    text: "text-rose-700",    dot: "bg-rose-500" },
  stop:  { bg: "bg-rose-50",      border: "border-rose-200",    text: "text-rose-700",    dot: "bg-rose-500" },
};

export default function FeedingSuggestion({ tank, entries, onUpdateTank, onCheck }: Props) {
  const tempC = useMemo(() => getTodaysTempC(entries), [entries]);

  const [editing, setEditing] = useState(false);
  const [countInput, setCountInput] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [tempInput, setTempInput] = useState("");

  const openEditor = () => {
    setCountInput((tank.fishCount ?? "").toString());
    setWeightInput((tank.avgWeightG ?? "").toString());
    setTempInput((tempC ?? "").toString());
    setEditing(true);
  };

  const result = useMemo(
    () =>
      calcFeeding({
        tempC,
        fishCount: tank.fishCount ?? null,
        avgWeightG: tank.avgWeightG ?? null,
      }),
    [tempC, tank.fishCount, tank.avgWeightG]
  );

  const style = STATUS_STYLE[result.tempBand.status] ?? STATUS_STYLE.ideal;

  const handleSave = () => {
    const fc = parseFloat(countInput.replace(",", "."));
    const w = parseFloat(weightInput.replace(",", "."));
    const t = parseFloat(tempInput.replace(",", "."));

    onUpdateTank({
      fishCount: Number.isFinite(fc) && fc > 0 ? Math.round(fc) : undefined,
      avgWeightG: Number.isFinite(w) && w > 0 ? w : undefined,
    });

    // Se o usuário preencheu uma temperatura nova/diferente, registra como
    // entry do checklist "temperature_check" (mesma ação do toque na tarefa).
    if (Number.isFinite(t) && t > 0) {
      const tStr = t.toString();
      const lastTempStr = tempC != null ? tempC.toString() : null;
      if (lastTempStr !== tStr) {
        onCheck("temperature_check", tStr);
      }
    }

    setEditing(false);
  };

  return (
    <div className={`px-4 py-3 border-b ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <div className="text-2xl flex-shrink-0">🍽️</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-sm font-bold text-slate-800">Sugestão de ração</p>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tilápia</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (editing) setEditing(false);
                else openEditor();
              }}
              className="text-xs text-cyan-600 font-bold px-2 py-1 rounded-lg hover:bg-white/60 transition-colors"
            >
              {editing ? "Fechar" : tank.fishCount && tank.avgWeightG ? "Editar" : "Configurar"}
            </button>
          </div>

          {/* Resultado pronto */}
          {!editing && result.ok && (
            <div className="mt-2 space-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl font-black text-slate-800">
                  {formatGrams(result.dailyTotalG)}
                </span>
                <span className="text-xs text-slate-500 font-semibold">por dia</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Por refeição" value={formatGrams(result.perMealG)} />
                <Stat label="Refeições" value={`${result.mealsPerDay}×/dia`} />
                <Stat label="Proteína" value={`${result.phaseInfo.proteinPct[0]}–${result.phaseInfo.proteinPct[1]}%`} />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className={`font-semibold ${style.text}`}>
                  {tempC?.toFixed(1)}°C · {result.tempBand.message}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">
                Fase <strong>{result.phaseInfo.label}</strong> · biomassa {formatGrams(result.biomassG)} ·
                ração {result.phaseInfo.granulometry}
              </p>
            </div>
          )}

          {/* Falta dado */}
          {!editing && !result.ok && (
            <div className="mt-2 space-y-1.5">
              {result.reason === "stop_feeding" && (
                <p className="text-xs font-semibold text-rose-700">
                  ⚠️ {result.tempBand.message} ({tempC?.toFixed(1)}°C). Não alimentar hoje.
                </p>
              )}
              {result.reason === "missing_temp" && (
                <p className="text-xs text-slate-600">
                  Toque em <strong>Configurar</strong> e preencha a <strong>temperatura</strong> de hoje para ver a sugestão. (Isso também marca a tarefa &ldquo;Temperatura da Água&rdquo;.)
                </p>
              )}
              {(result.reason === "missing_fish" || result.reason === "missing_weight") && (
                <p className="text-xs text-slate-600">
                  Toque em <strong>Configurar</strong> e preencha quantidade de peixes, peso médio e temperatura para calcular a ração.
                </p>
              )}
            </div>
          )}

          {/* Editor */}
          {editing && (
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                    Qtd. peixes
                  </label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    step="1"
                    placeholder="250"
                    value={countInput}
                    onChange={(e) => setCountInput(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                    Peso (g)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    placeholder="150"
                    value={weightInput}
                    onChange={(e) => setWeightInput(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-500 mb-1 block">
                    Temp. (°C)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.1"
                    placeholder="26.5"
                    value={tempInput}
                    onChange={(e) => setTempInput(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-100"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-500 leading-snug">
                Ao salvar, a temperatura também marca o checklist <strong>&ldquo;Temperatura da Água&rdquo;</strong> automaticamente.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  className="flex-1 py-2 text-sm font-bold bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
                >
                  Salvar
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-2 text-sm text-slate-500 rounded-lg hover:bg-white/60 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/70 rounded-lg py-1.5 px-1">
      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-slate-800 leading-tight">{value}</p>
    </div>
  );
}
