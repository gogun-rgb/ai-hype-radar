import type { DataSourceStatus, ScoreBreakdownItem } from "@/types/analysis";

export interface WeightedSignal {
  label: string;
  value: number;
  weight: number;
  available: boolean;
  status?: DataSourceStatus;
  explanation: string;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function normalizeAvailableWeights(signals: WeightedSignal[]): ScoreBreakdownItem[] {
  const availableWeight = signals.filter((signal) => signal.available).reduce((sum, signal) => sum + safeWeight(signal.weight), 0);

  return signals.map((signal) => {
    const originalWeight = safeWeight(signal.weight);
    const effectiveWeight = signal.available && availableWeight > 0 ? originalWeight / availableWeight : 0;

    return {
      label: signal.label,
      value: clampScore(signal.value),
      weight: effectiveWeight,
      originalWeight,
      available: signal.available,
      status: signal.status,
      explanation: signal.explanation
    };
  });
}

export function calculateWeightedScore(signals: WeightedSignal[]): {
  value: number;
  breakdown: ScoreBreakdownItem[];
  availableWeight: number;
  missingSignals: string[];
  dataLimited: boolean;
} {
  const breakdown = normalizeAvailableWeights(signals);
  const availableWeight = breakdown.filter((item) => item.available).reduce((sum, item) => sum + item.originalWeight, 0);
  const missingSignals = breakdown.filter((item) => !item.available).map((item) => item.label);

  if (availableWeight <= 0) {
    return {
      value: 0,
      breakdown,
      availableWeight: 0,
      missingSignals,
      dataLimited: true
    };
  }

  const value = breakdown.reduce((sum, item) => sum + (item.available ? item.value * item.weight : 0), 0);

  return {
    value: clampScore(value),
    breakdown,
    availableWeight,
    missingSignals,
    dataLimited: missingSignals.length > 0
  };
}

export function normalize(value: number, max: number): number {
  if (max <= 0) {
    return 0;
  }

  return clampScore((value / max) * 100);
}

export function daysBetween(start: string | Date, end: string | Date = new Date()): number {
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return 0;
  }

  return Math.max(0, (endMs - startMs) / 86_400_000);
}

export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

function safeWeight(weight: number): number {
  return Number.isFinite(weight) && weight > 0 ? weight : 0;
}
