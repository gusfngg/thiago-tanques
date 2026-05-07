/**
 * Calculadora de ração para tilápia.
 *
 * Fontes:
 * - % de proteína por fase: blog.lojacocamar.com.br/melhor-racao-para-tilapia
 * - % do peso vivo/dia, multiplicador por temperatura e nº de refeições:
 *   tabelas UEPG (2021) / EMBRAPA — referência citada pelo próprio artigo.
 */

export type TilapiaPhase =
  | "alevino"
  | "juvenil"
  | "recria"
  | "engorda"
  | "acabamento";

export interface PhaseInfo {
  phase: TilapiaPhase;
  label: string;
  weightRangeG: [number, number];
  basePercent: number;        // % do peso vivo/dia em temp. ideal
  proteinPct: [number, number]; // faixa recomendada de proteína bruta
  granulometry: string;
}

const PHASES: PhaseInfo[] = [
  { phase: "alevino",   label: "Alevino",   weightRangeG: [0, 30],     basePercent: 8.0, proteinPct: [38, 45], granulometry: "farelada (pó)" },
  { phase: "juvenil",   label: "Juvenil",   weightRangeG: [30, 100],   basePercent: 5.0, proteinPct: [32, 38], granulometry: "granulada 2–4 mm" },
  { phase: "recria",    label: "Recria",    weightRangeG: [100, 300],  basePercent: 3.0, proteinPct: [28, 32], granulometry: "extrusada 4–6 mm" },
  { phase: "engorda",   label: "Engorda",   weightRangeG: [300, 700],  basePercent: 2.5, proteinPct: [28, 32], granulometry: "extrusada 6–8 mm" },
  { phase: "acabamento",label: "Acabamento",weightRangeG: [700, Infinity], basePercent: 1.8, proteinPct: [28, 32], granulometry: "extrusada 8–10 mm" },
];

export function getPhase(avgWeightG: number): PhaseInfo {
  for (const p of PHASES) {
    const [lo, hi] = p.weightRangeG;
    if (avgWeightG >= lo && avgWeightG < hi) return p;
  }
  return PHASES[PHASES.length - 1];
}

export type TempStatus = "stop" | "cold" | "cool" | "ideal" | "warm" | "hot";

export interface TempBand {
  status: TempStatus;
  rangeC: [number, number];
  multiplier: number;        // multiplica basePercent
  message: string;
}

const TEMP_BANDS: TempBand[] = [
  { status: "stop",  rangeC: [-Infinity, 18], multiplier: 0.0,  message: "Muito fria — não alimentar" },
  { status: "cold",  rangeC: [18, 22],        multiplier: 0.4,  message: "Fria — reduzir bastante" },
  { status: "cool",  rangeC: [22, 26],        multiplier: 0.75, message: "Abaixo do ideal" },
  { status: "ideal", rangeC: [26, 30],        multiplier: 1.0,  message: "Faixa ideal" },
  { status: "warm",  rangeC: [30, 32],        multiplier: 0.8,  message: "Acima do ideal" },
  { status: "hot",   rangeC: [32, Infinity],  multiplier: 0.4,  message: "Estresse térmico — reduzir" },
];

export function getTempBand(tempC: number): TempBand {
  for (const b of TEMP_BANDS) {
    const [lo, hi] = b.rangeC;
    if (tempC >= lo && tempC < hi) return b;
  }
  return TEMP_BANDS[0];
}

/** Refeições por dia em função da fase e temperatura. */
export function getMealsPerDay(phase: TilapiaPhase, tempStatus: TempStatus): number {
  if (tempStatus === "stop") return 0;
  if (tempStatus === "hot") return 2;
  if (tempStatus === "cold") return 2;
  if (phase === "alevino") return tempStatus === "ideal" ? 5 : 3;
  if (phase === "juvenil") return tempStatus === "ideal" ? 4 : 3;
  return tempStatus === "ideal" ? 3 : 2; // recria, engorda, acabamento
}

export interface FeedingInput {
  tempC: number | null;       // null = sem leitura
  fishCount: number | null;   // null = não configurado
  avgWeightG: number | null;  // null = não configurado
}

export interface FeedingResult {
  ok: boolean;
  /** Motivo de não dar resultado (quando ok=false). */
  reason?: "missing_temp" | "missing_fish" | "missing_weight" | "stop_feeding";
  biomassG: number;
  phaseInfo: PhaseInfo;
  tempBand: TempBand;
  basePercent: number;        // % peso vivo/dia base (sem multiplicador)
  effectivePercent: number;   // % efetiva após multiplicador de temperatura
  dailyTotalG: number;        // gramas totais de ração/dia
  mealsPerDay: number;
  perMealG: number;           // gramas por refeição
}

export function calcFeeding(input: FeedingInput): FeedingResult {
  const fishCount = input.fishCount ?? 0;
  const avgWeightG = input.avgWeightG ?? 0;
  const phaseInfo = getPhase(avgWeightG || 1);

  // Sem temperatura: usa banda ideal só para fins de exibição da fase, mas marca ok=false.
  const tempBand = input.tempC == null ? getTempBand(28) : getTempBand(input.tempC);

  const biomassG = fishCount * avgWeightG;
  const basePercent = phaseInfo.basePercent;
  const effectivePercent = basePercent * tempBand.multiplier;
  const dailyTotalG = (biomassG * effectivePercent) / 100;
  const mealsPerDay = getMealsPerDay(phaseInfo.phase, tempBand.status);
  const perMealG = mealsPerDay > 0 ? dailyTotalG / mealsPerDay : 0;

  if (input.fishCount == null || input.fishCount <= 0) {
    return { ok: false, reason: "missing_fish", biomassG, phaseInfo, tempBand, basePercent, effectivePercent, dailyTotalG, mealsPerDay, perMealG };
  }
  if (input.avgWeightG == null || input.avgWeightG <= 0) {
    return { ok: false, reason: "missing_weight", biomassG, phaseInfo, tempBand, basePercent, effectivePercent, dailyTotalG, mealsPerDay, perMealG };
  }
  if (input.tempC == null) {
    return { ok: false, reason: "missing_temp", biomassG, phaseInfo, tempBand, basePercent, effectivePercent, dailyTotalG, mealsPerDay, perMealG };
  }
  if (tempBand.status === "stop") {
    return { ok: false, reason: "stop_feeding", biomassG, phaseInfo, tempBand, basePercent, effectivePercent, dailyTotalG: 0, mealsPerDay: 0, perMealG: 0 };
  }

  return { ok: true, biomassG, phaseInfo, tempBand, basePercent, effectivePercent, dailyTotalG, mealsPerDay, perMealG };
}

/** Formata gramas com unidade adequada (g/kg). */
export function formatGrams(g: number): string {
  if (g >= 1000) return `${(g / 1000).toFixed(2)} kg`;
  if (g >= 100) return `${Math.round(g)} g`;
  if (g >= 10) return `${g.toFixed(1)} g`;
  return `${g.toFixed(2)} g`;
}
